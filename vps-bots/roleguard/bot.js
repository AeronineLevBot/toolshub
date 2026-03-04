// /vps-bots/roleguard/bot.js
// Lancé par PM2 avec les env vars : BOT_TOKEN, GUILD_ID, API_URL, INSTANCE_ID, API_SECRET

require("dotenv").config();
const { Client, GatewayIntentBits, PermissionFlagsBits } = require("discord.js");
const axios = require("axios");

const BOT_TOKEN   = process.env.BOT_TOKEN;
const GUILD_ID    = process.env.GUILD_ID;
const API_URL     = process.env.API_URL;     // URL de votre API Node.js
const INSTANCE_ID = process.env.INSTANCE_ID;
const API_SECRET  = process.env.API_SECRET;  // Secret partagé pour les callbacks

if (!BOT_TOKEN || !GUILD_ID) {
  console.error("❌ BOT_TOKEN et GUILD_ID sont requis.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/* ── Chargement de la config depuis l'API ── */
let config = {
  protectedRoles:  [],  // IDs de rôles à protéger
  trustedRoles:    [],  // Rôles autorisés à modifier
  logChannelId:    null,
  alertOnViolation: true,
  autoRestore:     true,
};

async function loadConfig() {
  try {
    const res = await axios.get(`${API_URL}/api/roleguard/${INSTANCE_ID}/config`, {
      headers: { "x-api-secret": API_SECRET },
    });
    config = { ...config, ...res.data };
    console.log("✅ Config chargée.");
  } catch (err) {
    console.warn("⚠️ Impossible de charger la config:", err.message);
  }
}

/* ── Rapport de statut vers l'API ── */
async function reportStatus(status, extra = {}) {
  try {
    await axios.patch(`${API_URL}/api/roleguard/${INSTANCE_ID}/status`, {
      status, ...extra,
    }, {
      headers: { "x-api-secret": API_SECRET },
    });
  } catch {}
}

/* ── Log vers l'API ── */
async function remoteLog(level, message) {
  console.log(`[${level.toUpperCase()}] ${message}`);
  try {
    await axios.post(`${API_URL}/api/roleguard/${INSTANCE_ID}/log`, {
      level, message,
    }, {
      headers: { "x-api-secret": API_SECRET },
    });
  } catch {}
}

/* ══════════════════════════════════
   LOGIQUE ROLEGUARD
══════════════════════════════════ */

// Snapshot des rôles d'un membre
const memberRolesSnapshot = new Map();

function snapshotMember(member) {
  memberRolesSnapshot.set(member.id, new Set(member.roles.cache.keys()));
}

/* ── Événement : mise à jour d'un membre ── */
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (oldMember.guild.id !== GUILD_ID) return;

  const oldRoles = new Set(oldMember.roles.cache.keys());
  const newRoles = new Set(newMember.roles.cache.keys());

  const added   = [...newRoles].filter(r => !oldRoles.has(r));
  const removed = [...oldRoles].filter(r => !newRoles.has(r));

  for (const roleId of [...added, ...removed]) {
    if (!config.protectedRoles.includes(roleId)) continue;

    // Vérifier si l'action vient d'un rôle de confiance (via audit log)
    let violator = null;
    try {
      await new Promise(r => setTimeout(r, 500));
      const auditLogs = await newMember.guild.fetchAuditLogs({
        limit: 1,
        type:  "MEMBER_ROLE_UPDATE",
      });
      const entry = auditLogs.entries.first();
      if (entry && entry.executor) {
        const executor       = entry.executor;
        const executorMember = await newMember.guild.members.fetch(executor.id).catch(() => null);
        const hasTrusted     = executorMember?.roles.cache.some(r =>
          config.trustedRoles.includes(r.id)
        );
        if (!hasTrusted && executor.id !== client.user.id) {
          violator = executor;
        }
      }
    } catch {}

    if (!violator) continue;

    const action   = added.includes(roleId) ? "ajouté" : "retiré";
    const roleName = newMember.guild.roles.cache.get(roleId)?.name ?? roleId;

    await remoteLog("warn",
      `⚠️ Rôle protégé "${roleName}" ${action} sur ${newMember.user.tag} par ${violator.tag}`
    );

    // Auto-restauration
    if (config.autoRestore) {
      try {
        if (added.includes(roleId)) {
          await newMember.roles.remove(roleId,
            `[RoleGuard] Restauration automatique — action non autorisée`);
        } else {
          await newMember.roles.add(roleId,
            `[RoleGuard] Restauration automatique — action non autorisée`);
        }
        await remoteLog("info", `✅ Rôle "${roleName}" restauré pour ${newMember.user.tag}`);
      } catch (e) {
        await remoteLog("error", `❌ Impossible de restaurer le rôle: ${e.message}`);
      }
    }

    // Alerte dans le salon de log
    if (config.alertOnViolation && config.logChannelId) {
      try {
        const logChannel = await client.channels.fetch(config.logChannelId);
        await logChannel.send({
          embeds: [{
            title:       "🛡️ RoleGuard — Violation détectée",
            color:       0xf87171,
            description: `Le rôle **${roleName}** a été **${action}** par un utilisateur non autorisé.`,
            fields: [
              { name: "👤 Membre ciblé",  value: `${newMember.user.tag} (\`${newMember.id}\`)`, inline: true  },
              { name: "⚠️ Auteur",        value: `${violator.tag} (\`${violator.id}\`)`,        inline: true  },
              { name: "🔄 Restauration", value: config.autoRestore ? "✅ Effectuée" : "❌ Désactivée", inline: true },
            ],
            timestamp: new Date().toISOString(),
            footer:    { text: "ToolsHub — RoleGuard" },
          }],
        });
      } catch {}
    }
  }
});

/* ── Prêt ── */
client.on("ready", async () => {
  await loadConfig();
  await reportStatus("running", { botTag: client.user.tag });
  await remoteLog("info", `🟢 RoleGuard actif sur "${client.guilds.cache.get(GUILD_ID)?.name}"`);

  // Snapshot initial de tous les membres
  const guild = client.guilds.cache.get(GUILD_ID);
  if (guild) {
    const members = await guild.members.fetch().catch(() => null);
    if (members) members.forEach(m => snapshotMember(m));
  }

  // Reload de config toutes les 5 minutes
  setInterval(loadConfig, 5 * 60 * 1000);
});

client.on("error", async err => {
  await reportStatus("error", { error: err.message });
  await remoteLog("error", `❌ Erreur client: ${err.message}`);
});

process.on("SIGTERM", async () => {
  await reportStatus("stopped");
  client.destroy();
  process.exit(0);
});

client.login(BOT_TOKEN);