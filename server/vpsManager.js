/* ═══════════════════════════════════════
   vpsManager.js — Gestion SSH des bots RoleGuard
═══════════════════════════════════════ */

const { NodeSSH } = require("node-ssh");
const crypto      = require("crypto");
const path        = require("path");

/* ══════════════════════════════════
   CONFIG VPS
══════════════════════════════════ */
const VPS_CONFIG = {
  host:     process.env.VPS_HOST,
  port:     parseInt(process.env.VPS_SSH_PORT) || 22,
  username: process.env.VPS_SSH_USER || "ubuntu",
  ...(process.env.VPS_SSH_KEY
    ? { privateKey: process.env.VPS_SSH_KEY }
    : { password:   process.env.VPS_SSH_PASS }),
};

const BOT_TEMPLATE_DIR = process.env.VPS_BOT_TEMPLATE_DIR || "/opt/toolshub-bots/roleguard/template";
const BOT_INSTANCES_DIR = process.env.VPS_BOT_INSTANCES_DIR || "/opt/toolshub-bots/roleguard/instances";
const API_URL           = process.env.API_URL    || "https://votre-api.vercel.app";
const API_SECRET        = process.env.RG_API_SECRET || "changez_ce_secret_32chars!!!!!";

/* ══════════════════════════════════
   CHIFFREMENT DES TOKENS
══════════════════════════════════ */
const ENCRYPT_KEY = (process.env.TOKEN_ENCRYPT_KEY || "changez_cette_cle_32_caracteres!").slice(0, 32);

function encryptToken(token) {
  const iv      = crypto.randomBytes(16);
  const cipher  = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPT_KEY), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptToken(encrypted) {
  const [ivHex, dataHex] = encrypted.split(":");
  const iv       = Buffer.from(ivHex,  "hex");
  const data     = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPT_KEY), iv);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/* ══════════════════════════════════
   HELPERS
══════════════════════════════════ */
function generatePm2Name(userId) {
  const hash = crypto
    .createHash("sha256")
    .update(userId + Date.now().toString())
    .digest("hex")
    .slice(0, 10);
  return `rg-${hash}`;
}

async function sshConnect() {
  if (!VPS_CONFIG.host) throw new Error("VPS_HOST non configuré.");
  const ssh = new NodeSSH();
  await ssh.connect(VPS_CONFIG);
  return ssh;
}

async function sshRun(ssh, cmd) {
  const result = await ssh.execCommand(cmd);
  if (result.stderr && result.stderr.toLowerCase().includes("error")) {
    console.warn(`[ssh] stderr: ${result.stderr}`);
  }
  return result;
}

/* ══════════════════════════════════
   VÉRIFICATION DU VPS
   Vérifie que Node, PM2 et le template
   sont bien présents
══════════════════════════════════ */
async function checkVpsReady() {
  const ssh = await sshConnect();
  try {
    const checks = await Promise.all([
      sshRun(ssh, "node --version"),
      sshRun(ssh, "pm2 --version"),
      sshRun(ssh, `test -f ${BOT_TEMPLATE_DIR}/bot.js && echo "ok" || echo "missing"`),
    ]);

    return {
      node:     checks[0].stdout.trim() || null,
      pm2:      checks[1].stdout.trim() || null,
      template: checks[2].stdout.trim() === "ok",
    };
  } finally {
    ssh.dispose();
  }
}

/* ══════════════════════════════════
   UPLOAD DU TEMPLATE
   Envoie bot.js + package.json
   vers le VPS (depuis le projet local)
══════════════════════════════════ */
async function uploadTemplate() {
  const ssh = await sshConnect();
  try {
    await sshRun(ssh, `mkdir -p ${BOT_TEMPLATE_DIR}`);

    await ssh.putFile(
      path.join(__dirname, "..", "tools", "vps-bots", "roleguard", "bot.js"),
      `${BOT_TEMPLATE_DIR}/bot.js`
    );

    await ssh.putFile(
      path.join(__dirname, "..", "tools", "vps-bots", "roleguard", "package.json"),
      `${BOT_TEMPLATE_DIR}/package.json`
    );

    /* npm install dans le template (shared node_modules) */
    await sshRun(ssh,
      `cd ${BOT_TEMPLATE_DIR} && npm install --production 2>&1`
    );

    return { success: true };
  } finally {
    ssh.dispose();
  }
}

/* ══════════════════════════════════
   DEPLOY
   Crée le dossier d'instance,
   crée le .env, démarre PM2
══════════════════════════════════ */
async function deployInstance({ instanceId, pm2Name, botToken, guildId }) {
  const ssh         = await sshConnect();
  const instanceDir = `${BOT_INSTANCES_DIR}/${pm2Name}`;

  try {
    /* 1 — Créer le dossier de l'instance */
    await sshRun(ssh, `mkdir -p ${instanceDir}`);

    /* 2 — Copier bot.js depuis le template */
    await sshRun(ssh, `cp ${BOT_TEMPLATE_DIR}/bot.js ${instanceDir}/bot.js`);

    /* 3 — Symlink node_modules (évite de réinstaller pour chaque instance) */
    await sshRun(ssh,
      `ln -sfn ${BOT_TEMPLATE_DIR}/node_modules ${instanceDir}/node_modules`
    );

    /* 4 — Créer le .env avec les variables propres à cette instance */
    const envLines = [
      `BOT_TOKEN=${botToken}`,
      `GUILD_ID=${guildId}`,
      `API_URL=${API_URL}`,
      `INSTANCE_ID=${instanceId}`,
      `API_SECRET=${API_SECRET}`,
    ].join("\n");

    /* Écriture sécurisée du .env via heredoc */
    await sshRun(ssh,
      `printf '%s' ${JSON.stringify(envLines)} > ${instanceDir}/.env`
    );

    /* 5 — Démarrer avec PM2 */
    const { stdout, stderr } = await sshRun(ssh,
      `pm2 start ${instanceDir}/bot.js \
        --name "${pm2Name}" \
        --interpreter node \
        --restart-delay 5000 \
        --max-restarts 10 \
        && pm2 save`
    );

    if (stderr && stderr.includes("Error")) throw new Error(stderr);

    return { success: true, pm2Name, stdout };
  } catch (err) {
    /* Nettoyage si le déploiement échoue */
    await sshRun(ssh, `rm -rf ${instanceDir}`).catch(() => {});
    throw err;
  } finally {
    ssh.dispose();
  }
}

/* ══════════════════════════════════
   START / STOP / RESTART
══════════════════════════════════ */
async function startInstance(pm2Name) {
  const ssh = await sshConnect();
  try {
    await sshRun(ssh, `pm2 start "${pm2Name}" && pm2 save`);
    return { success: true };
  } finally {
    ssh.dispose();
  }
}

async function stopInstance(pm2Name) {
  const ssh = await sshConnect();
  try {
    await sshRun(ssh, `pm2 stop "${pm2Name}" && pm2 save`);
    return { success: true };
  } finally {
    ssh.dispose();
  }
}

async function restartInstance(pm2Name) {
  const ssh = await sshConnect();
  try {
    await sshRun(ssh, `pm2 restart "${pm2Name}" && pm2 save`);
    return { success: true };
  } finally {
    ssh.dispose();
  }
}

/* ══════════════════════════════════
   DELETE
   Arrête PM2 + supprime le dossier
══════════════════════════════════ */
async function deleteInstance(pm2Name) {
  const ssh         = await sshConnect();
  const instanceDir = `${BOT_INSTANCES_DIR}/${pm2Name}`;
  try {
    await sshRun(ssh, `pm2 delete "${pm2Name}" 2>/dev/null; pm2 save`);
    await sshRun(ssh, `rm -rf ${instanceDir}`);
    return { success: true };
  } finally {
    ssh.dispose();
  }
}

/* ══════════════════════════════════
   LOGS
   Récupère les N dernières lignes
   de logs PM2 d'une instance
══════════════════════════════════ */
async function getInstanceLogs(pm2Name, lines = 50) {
  const ssh = await sshConnect();
  try {
    const { stdout } = await sshRun(ssh,
      `pm2 logs "${pm2Name}" --lines ${lines} --nostream 2>&1`
    );
    return stdout || "";
  } finally {
    ssh.dispose();
  }
}

/* ══════════════════════════════════
   STATUS PM2
   Retourne le statut réel PM2
══════════════════════════════════ */
async function getInstanceStatus(pm2Name) {
  const ssh = await sshConnect();
  try {
    const { stdout } = await sshRun(ssh,
      `pm2 jlist 2>/dev/null`
    );
    const list = JSON.parse(stdout || "[]");
    const proc = list.find(p => p.name === pm2Name);
    if (!proc) return "stopped";
    const map = {
      online:   "running",
      stopped:  "stopped",
      errored:  "error",
      stopping: "stopped",
      launching:"deploying",
    };
    return map[proc.pm2_env?.status] ?? proc.pm2_env?.status ?? "unknown";
  } catch {
    return "unknown";
  } finally {
    ssh.dispose();
  }
}

/* ══════════════════════════════════
   RELOAD CONFIG
   Force le bot à recharger sa config
   en envoyant un signal USR2 via PM2
══════════════════════════════════ */
async function reloadInstanceConfig(pm2Name) {
  const ssh = await sshConnect();
  try {
    await sshRun(ssh, `pm2 sendSignal SIGUSR2 "${pm2Name}"`);
    return { success: true };
  } finally {
    ssh.dispose();
  }
}

/* ══════════════════════════════════
   EXPORTS
══════════════════════════════════ */
module.exports = {
  encryptToken,
  decryptToken,
  generatePm2Name,
  checkVpsReady,
  uploadTemplate,
  deployInstance,
  startInstance,
  stopInstance,
  restartInstance,
  deleteInstance,
  getInstanceLogs,
  getInstanceStatus,
  reloadInstanceConfig,
};