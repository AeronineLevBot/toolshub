/* Charge dotenv seulement en local, pas sur Vercel */
if (!process.env.VERCEL) {
  require("dotenv").config({ path: require("path").join(__dirname, ".env") });
}

const express             = require("express");
const session             = require("express-session");
const axios               = require("axios");
const path                = require("path");
const http                = require("http");
const { WebSocketServer } = require("ws");
const { createHash }      = require("crypto");
const { createClient }    = require("@supabase/supabase-js");
const cookieLib           = require("cookie");
const cookieSig           = require("cookie-signature");
const {
  existsSync, mkdirSync, writeFileSync,
  readFileSync, appendFileSync, unlinkSync
} = require("fs");

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server, path: "/ws/dmall" });
const PORT   = process.env.PORT || 3000;

/* ══════════════════════════════════
   SUPABASE
══════════════════════════════════ */
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn("⚠️ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.");
}

const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

/* ══════════════════════════════════
   ADMINS
══════════════════════════════════ */
const ADMIN_IDS = [
  "777325892322066472",
  "DISCORD_USER_ID_2"
];

async function isAdmin(userId) {
  if (!userId) return false;
  if (!supabase) return ADMIN_IDS.includes(userId);
  try {
    const { data, error } = await supabase
      .from("admins").select("user_id").eq("user_id", userId).maybeSingle();
    if (error) return ADMIN_IDS.includes(userId);
    if (data)  return true;
    return ADMIN_IDS.includes(userId);
  } catch { return ADMIN_IDS.includes(userId); }
}

/* ══════════════════════════════════
   TRUST PROXY
══════════════════════════════════ */
app.set("trust proxy", 1);

/* ══════════════════════════════════
   SESSION STORE SUPABASE
══════════════════════════════════ */
class SupabaseSessionStore extends session.Store {
  async get(sid, cb) {
    if (!supabase) return cb(null, null);
    try {
      const { data, error } = await supabase
        .from("sessions").select("sess, expires").eq("id", sid).maybeSingle();
      if (error) return cb(error);
      if (!data)  return cb(null, null);
      if (data.expires && new Date(data.expires) < new Date()) {
        await supabase.from("sessions").delete().eq("id", sid);
        return cb(null, null);
      }
      cb(null, data.sess || null);
    } catch (err) { cb(err); }
  }

  async set(sid, sessionData, cb) {
    if (!supabase) return cb(null);
    try {
      const ttlSeconds = sessionData.cookie?.maxAge
        ? Math.floor(sessionData.cookie.maxAge / 1000) : 86400;
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      const { error } = await supabase.from("sessions").upsert({
        id: sid, sess: sessionData, expires: expiresAt,
      });
      if (error) return cb(error);
      cb(null);
    } catch (err) { cb(err); }
  }

  async destroy(sid, cb) {
    if (!supabase) return cb(null);
    try {
      const { error } = await supabase.from("sessions").delete().eq("id", sid);
      if (error) return cb(error);
      cb(null);
    } catch (err) { cb(err); }
  }
}

/* ══════════════════════════════════
   HELPERS DB
══════════════════════════════════ */
async function getUser(userId) {
  if (!supabase) throw new Error("Supabase non configuré");
  try {
    const { data: user, error } = await supabase
      .from("users").select("*").eq("id", userId).maybeSingle();
    if (error || !user) return null;
    const { data: purchases, error: pErr } = await supabase
      .from("purchases").select("*").eq("user_id", userId)
      .order("purchased_at", { ascending: true });
    if (pErr) console.error("❌ getUser purchases:", pErr);
    return {
      id:        user.id,
      username:  user.username,
      email:     user.email,
      avatar:    user.avatar,
      purchases: (purchases || []).map(p => ({
        toolId:      p.tool_id,
        toolName:    p.tool_name,
        price:       typeof p.price === "number" ? p.price : 0,
        purchasedAt: p.purchased_at,
      })),
      adminNote: user.admin_note || "",
      createdAt: user.created_at,
    };
  } catch (err) { console.error("❌ getUser:", err); return null; }
}

async function saveUser(userId, userData) {
  if (!supabase) throw new Error("Supabase non configuré");
  const { purchases = [], adminNote, createdAt, username, email, avatar } = userData;
  const { error: userErr } = await supabase.from("users").upsert({
    id:         userId,
    username:   username  ?? null,
    email:      email     ?? null,
    avatar:     avatar    ?? null,
    admin_note: adminNote ?? "",
    created_at: createdAt || new Date().toISOString(),
  });
  if (userErr) throw userErr;
  const { error: delErr } = await supabase.from("purchases").delete().eq("user_id", userId);
  if (delErr) throw delErr;
  if (purchases.length) {
    const { error: insErr } = await supabase.from("purchases").insert(
      purchases.map(p => ({
        user_id:      userId,
        tool_id:      p.toolId,
        tool_name:    p.toolName,
        price:        typeof p.price === "number" ? p.price : 0,
        purchased_at: p.purchasedAt || new Date().toISOString(),
      }))
    );
    if (insErr) throw insErr;
  }
}

async function getAllUsers() {
  if (!supabase) throw new Error("Supabase non configuré");
  try {
    const { data: users,     error: uErr } = await supabase.from("users").select("*");
    const { data: purchases, error: pErr } = await supabase.from("purchases").select("*");
    if (uErr) return [];
    if (pErr) console.error("❌ getAllUsers purchases:", pErr);
    const byUser = {};
    (purchases || []).forEach(p => {
      if (!byUser[p.user_id]) byUser[p.user_id] = [];
      byUser[p.user_id].push({
        toolId:      p.tool_id,
        toolName:    p.tool_name,
        price:       typeof p.price === "number" ? p.price : 0,
        purchasedAt: p.purchased_at,
      });
    });
    return (users || []).filter(Boolean).map(u => ({
      id:        u.id,
      username:  u.username,
      email:     u.email,
      avatar:    u.avatar,
      adminNote: u.admin_note || "",
      createdAt: u.created_at,
      purchases: byUser[u.id] || [],
    }));
  } catch { return []; }
}

/* ══════════════════════════════════
   MIDDLEWARE
══════════════════════════════════ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── CORS ── */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,x-api-secret");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const SESSION_SECRET = process.env.SESSION_SECRET || "dev_secret_change_en_prod";

const sessionStore = supabase
  ? new SupabaseSessionStore()
  : new session.MemoryStore();

app.use(session({
  store:             sessionStore,
  secret:            SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  name:              "sid",
  cookie: {
    secure:   process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge:   7 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
}));

/* ── Fichiers statiques (local uniquement) ── */
if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, "..")));
}

/* ══════════════════════════════════
   ROUTE DE DIAGNOSTIC
══════════════════════════════════ */
app.get("/api/ping", (req, res) => {
  res.json({
    ok:          true,
    vercel:      !!process.env.VERCEL,
    redirectUri: process.env.DISCORD_REDIRECT_URI  ?? "❌ NON DÉFINI",
    clientId:    process.env.DISCORD_CLIENT_ID
      ? process.env.DISCORD_CLIENT_ID.slice(0, 6) + "..."
      : "❌ NON DÉFINI",
    supabase:    !!process.env.SUPABASE_URL,
    nodeEnv:     process.env.NODE_ENV ?? "non défini",
    session:     !!req.session,
  });
});

/* ══════════════════════════════════
   TOOLS API
══════════════════════════════════ */
app.get("/api/tools", async (_req, res) => {
  if (!supabase) return res.status(500).json({ error: "Supabase non configuré" });
  try {
    const { data, error } = await supabase.from("tools").select("*").order("id");
    if (error) return res.status(500).json({ error: "Erreur serveur" });
    res.json({
      tools: (data || []).map(row => ({
        id:           row.id,
        name:         row.name,
        icon:         row.icon,
        category:     row.category,
        desc:         row.desc,
        longDesc:     row.long_desc,
        price:        row.price,
        period:       row.period,
        badges:       row.badges        || [],
        features:     row.features      || [],
        fullFeatures: row.full_features || [],
        rating:       row.rating,
        users:        row.users,
        uptime:       row.uptime,
        version:      row.version,
        support:      row.support,
        screenshots:  row.screenshots   || [],
        reviews:      row.reviews       || [],
      })),
    });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

/* ══════════════════════════════════
   AUTH ROUTES
══════════════════════════════════ */
app.get("/auth/login", (req, res) => {
  const clientId    = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error("❌ DISCORD_CLIENT_ID ou DISCORD_REDIRECT_URI manquant.");
    return res.status(500).send("Configuration OAuth manquante. Vérifiez les variables d'environnement.");
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "identify guilds",
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get("/auth/callback", async (req, res) => {
  const { code, error: oauthError } = req.query;

  if (oauthError) {
    console.error("❌ OAuth error from Discord:", oauthError);
    return res.redirect("/?error=oauth_denied");
  }

  if (!code) return res.redirect("/?error=no_code");

  try {
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type:    "authorization_code",
        code,
        redirect_uri:  process.env.DISCORD_REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenRes.data;
    if (!access_token) throw new Error("Pas de access_token dans la réponse Discord");

    const userRes     = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const discordUser = userRes.data;

    let user = await getUser(discordUser.id);
    if (!user) {
      user = {
        id:        discordUser.id,
        username:  discordUser.username,
        email:     discordUser.email || null,
        avatar:    discordUser.avatar,
        purchases: [],
        adminNote: "",
        createdAt: new Date().toISOString(),
      };
    } else {
      user.username = discordUser.username;
      user.avatar   = discordUser.avatar;
      if (discordUser.email) user.email = discordUser.email;
    }

    await saveUser(discordUser.id, user);

    req.session.regenerate(err => {
      if (err) {
        console.error("❌ session.regenerate:", err);
        return res.redirect("/?error=session_failed");
      }
      req.session.userId      = discordUser.id;
      req.session.accessToken = access_token;
      req.session.save(saveErr => {
        if (saveErr) {
          console.error("❌ session.save:", saveErr);
          return res.redirect("/?error=session_failed");
        }
        res.redirect(process.env.VERCEL ? "/dashboard" : "/dashboard.html");
      });
    });

  } catch (err) {
    console.error("❌ Auth callback error:", err.response?.data ?? err.message);
    res.redirect("/?error=auth_failed");
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.redirect("/");
  });
});

/* ══════════════════════════════════
   MIDDLEWARE AUTH
══════════════════════════════════ */
function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: "Non authentifié" });
  next();
}

async function requireAdmin(req, res, next) {
  try {
    if (!req.session?.userId)               return res.status(403).json({ error: "Accès refusé" });
    if (!await isAdmin(req.session.userId)) return res.status(403).json({ error: "Accès refusé" });
    next();
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
}

/* ══════════════════════════════════
   API ROUTES
══════════════════════════════════ */
app.get("/api/auth/status", async (req, res) => {
  if (req.session?.userId) {
    const user = await getUser(req.session.userId);
    if (!user) return res.json({ logged: false });
    res.json({ logged: true, user });
  } else {
    res.json({ logged: false });
  }
});

app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ ...user, isAdmin: await isAdmin(req.session.userId) });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

app.get("/api/servers", requireAuth, async (req, res) => {
  if (!req.session.accessToken)
    return res.status(401).json({ error: "Token Discord manquant" });
  try {
    const guildsRes = await axios.get("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${req.session.accessToken}` },
    });
    res.json(
      guildsRes.data
        .filter(g => (parseInt(g.permissions) & 0x8) === 0x8)
        .map(g => ({
          id:   g.id,
          name: g.name,
          icon: g.icon
            ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
            : null,
        }))
    );
  } catch (err) {
    if (err.response?.status === 401) return res.status(401).json({ error: "Token expiré" });
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/purchases", requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ purchases: user.purchases || [] });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

app.post("/api/purchase", requireAuth, async (req, res) => {
  const { toolId, toolName, price } = req.body;
  if (!toolId || !toolName) return res.status(400).json({ error: "Données manquantes" });
  try {
    const user = await getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    if (user.purchases.find(p => p.toolId === toolId))
      return res.json({ ok: true, message: "Déjà possédé" });
    user.purchases.push({
      toolId, toolName,
      price:       typeof price === "number" ? price : 0,
      purchasedAt: new Date().toISOString(),
    });
    await saveUser(user.id, user);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete("/api/purchase/:toolId", requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    const before = user.purchases.length;
    user.purchases = user.purchases.filter(p => p.toolId !== req.params.toolId);
    if (user.purchases.length === before)
      return res.status(404).json({ error: "Outil non trouvé" });
    await saveUser(user.id, user);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

/* ── Admin routes ── */
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try { res.json({ users: await getAllUsers() }); }
  catch { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
  try {
    if (req.params.userId === req.session.userId)
      return res.status(400).json({ error: "Impossible de se supprimer soi-même" });
    if (!supabase) return res.status(500).json({ error: "Supabase non configuré" });
    await supabase.from("purchases").delete().eq("user_id", req.params.userId);
    await supabase.from("users").delete().eq("id", req.params.userId);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

app.patch("/api/admin/users/:userId/note", requireAdmin, async (req, res) => {
  try {
    const user = await getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    user.adminNote = req.body.note || "";
    await saveUser(user.id, user);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

app.post("/api/admin/users/:userId/purchase", requireAdmin, async (req, res) => {
  try {
    const { toolId, toolName, price } = req.body;
    const user = await getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    if (user.purchases.find(p => p.toolId === toolId))
      return res.json({ ok: true, message: "Déjà possédé" });
    user.purchases.push({
      toolId, toolName,
      price:       typeof price === "number" ? price : 0,
      purchasedAt: new Date().toISOString(),
    });
    await saveUser(user.id, user);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

app.delete("/api/admin/users/:userId/purchase/:toolId", requireAdmin, async (req, res) => {
  try {
    const user = await getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    const before = user.purchases.length;
    user.purchases = user.purchases.filter(p => p.toolId !== req.params.toolId);
    if (user.purchases.length === before)
      return res.status(404).json({ error: "Licence introuvable" });
    await saveUser(user.id, user);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({
      totalUsers:     users.length,
      totalPurchases: users.reduce((a, u) => a + (u.purchases?.length || 0), 0),
      revenue:        users.reduce((a, u) =>
        a + (u.purchases || []).reduce((s, p) => s + (p.price || 0), 0), 0
      ).toFixed(2),
    });
  } catch { res.status(500).json({ error: "Erreur serveur" }); }
});

/* ══════════════════════════════════
   DMALL — HELPERS FICHIERS
══════════════════════════════════ */
const DMALL_DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "dmall")
  : path.join(__dirname, "data", "dmall");

function dmallKeyHash(userId) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

function dmallUserDir(hash) {
  const dir = path.join(DMALL_DATA_DIR, hash);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function dmallCpPath(hash)  { return path.join(dmallUserDir(hash), "checkpoint.json"); }
function dmallIdsPath(hash) { return path.join(dmallUserDir(hash), "ids.log"); }

function dmallLoadCp(hash) {
  const cpPath  = dmallCpPath(hash);
  const idsPath = dmallIdsPath(hash);
  if (!existsSync(cpPath)) return null;
  try {
    const config = JSON.parse(readFileSync(cpPath, "utf8"));
    config.processedIds = existsSync(idsPath)
      ? readFileSync(idsPath, "utf8").split("\n").filter(Boolean)
      : [];
    return config;
  } catch { return null; }
}

function dmallSaveCp(hash, data) {
  try {
    const { processedIds: _ignored, ...config } = data;
    writeFileSync(dmallCpPath(hash), JSON.stringify(config, null, 2));
  } catch {}
}

function dmallAppendId(hash, id) {
  try { appendFileSync(dmallIdsPath(hash), id + "\n"); } catch {}
}

function dmallClearCp(hash) {
  try { if (existsSync(dmallCpPath(hash)))  unlinkSync(dmallCpPath(hash));  } catch {}
  try { if (existsSync(dmallIdsPath(hash))) unlinkSync(dmallIdsPath(hash)); } catch {}
}

async function userHasDmall(userId) {
  if (!supabase) return true;
  const { data } = await supabase
    .from("purchases")
    .select("tool_id")
    .eq("user_id", userId)
    .eq("tool_id", "dmall")
    .maybeSingle();
  return !!data;
}

/* ══════════════════════════════════
   DMALL — LECTURE SESSION WS
══════════════════════════════════ */
function wsGetSessionId(req) {
  try {
    const cookies = cookieLib.parse(req.headers.cookie || "");
    let sid = cookies["sid"] || null;
    if (!sid) return null;
    sid = decodeURIComponent(sid);
    if (sid.startsWith("s:")) {
      const unsigned = cookieSig.unsign(sid.slice(2), SESSION_SECRET);
      if (unsigned === false) {
        console.warn("[ws] Signature du cookie invalide.");
        return null;
      }
      return unsigned;
    }
    return sid;
  } catch (err) {
    console.error("[ws] Erreur décodage cookie:", err.message);
    return null;
  }
}

/* ══════════════════════════════════
   DMALL — CLIENTS DISCORD
══════════════════════════════════ */
let SelfClient = null;
try {
  SelfClient = require("discord.js-selfbot-v13").Client;
  console.log("✅ discord.js-selfbot-v13 chargé.");
} catch (err) {
  console.warn("⚠️ discord.js-selfbot-v13 non disponible:", err.message);
}

let DjsClient     = null;
let DjsIntentBits = null;
try {
  const djs     = require("discord.js");
  DjsClient     = djs.Client;
  DjsIntentBits = djs.GatewayIntentBits ?? null;
  console.log("✅ discord.js chargé.");
} catch (err) {
  console.warn("⚠️ discord.js non disponible:", err.message);
}

function dmallCreateClient(mode) {
  if (mode === "bot") {
    if (!DjsClient) throw new Error("discord.js non installé — requis pour le mode Bot.");
    const intents = DjsIntentBits
      ? [DjsIntentBits.Guilds, DjsIntentBits.GuildMembers]
      : ["GUILDS", "GUILD_MEMBERS"];
    return new DjsClient({ intents });
  }
  if (!SelfClient) throw new Error("discord.js-selfbot-v13 non installé — requis pour les modes Amis et Serveur.");
  return new SelfClient({ checkUpdate: false });
}

function dmallClientTag(client) {
  return client.user?.tag ?? client.user?.username ?? "inconnu";
}

const dmallSleep = ms => new Promise(r => setTimeout(r, ms));

function dmallWsSend(ws, data) {
  try { if (ws.readyState === 1) ws.send(JSON.stringify(data)); } catch {}
}

async function dmallFetchFriends(clients, blacklist, ws) {
  const seen = new Set(), targets = [];
  for (const client of clients) {
    let friends = client.relationships?.friendCache;
    if (!friends || friends.size === 0) {
      dmallWsSend(ws, { type: "status", text: "Chargement des amis…" });
      try {
        await client.relationships.fetch();
        friends = client.relationships.friendCache;
      } catch {}
    }
    if (!friends) continue;
    for (const [id, user] of friends) {
      if (!user || seen.has(id) || blacklist.includes(id) || user.bot) continue;
      seen.add(id);
      targets.push({ userId: id, tag: user.tag ?? user.username });
    }
  }
  return targets;
}

async function dmallFetchGuildMembers(client, guildId, blacklist, ws) {
  const guild = client.guilds.cache.get(guildId) ?? await client.guilds.fetch(guildId);
  dmallWsSend(ws, { type: "status", text: `Serveur : ${guild.name} — chargement des membres…` });
  const all = [];
  try {
    let after;
    while (true) {
      const batch = await guild.members.list({
        limit: 1000, cache: false, ...(after ? { after } : {}),
      });
      if (!batch || batch.size === 0) break;
      for (const [id, member] of batch) {
        if (!member.user.bot && !blacklist.includes(id))
          all.push({ userId: id, tag: member.user.tag ?? member.user.username });
      }
      if (batch.size < 1000) break;
      after = [...batch.keys()].at(-1);
    }
  } catch {
    dmallWsSend(ws, { type: "status", text: "list() échoué — fallback gateway…" });
    try {
      const fetched = await guild.members.fetch();
      for (const [id, member] of fetched) {
        if (!member.user.bot && !blacklist.includes(id))
          all.push({ userId: id, tag: member.user.tag ?? member.user.username });
      }
    } catch (e) {
      dmallWsSend(ws, { type: "status", text: `⚠ Impossible de charger les membres : ${e.message}` });
    }
  }
  return all;
}

/* ══════════════════════════════════
   DMALL — BOUCLE PRINCIPALE
══════════════════════════════════ */
async function dmallRun(ws, config) {
  const { mode, guildId, tokens, blacklist, template, delayMs, resumeFrom } = config;
  const hash    = ws._dmallHash;
  const stop    = { stop: false };
  ws._dmallStop = stop;
  const clients = [];

  try {
    const isBotMode = mode === "bot";
    dmallWsSend(ws, {
      type: "status",
      text: `Connexion de ${tokens.length} compte(s) [mode: ${mode}]…`,
    });

    for (let i = 0; i < tokens.length; i++) {
      const token  = tokens[i].trim();
      let   client;
      try { client = dmallCreateClient(mode); }
      catch (err) { throw new Error(err.message); }

      await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`Token ${i + 1} : timeout de connexion (30s)`)),
          30_000
        );
        client.once("ready", () => { clearTimeout(timer); resolve(); });
        client.once("error", err => {
          clearTimeout(timer);
          reject(new Error(`Token ${i + 1} — ${err.message}`));
        });
        client.login(isBotMode ? `Bot ${token}` : token).catch(err => {
          clearTimeout(timer);
          const msg = err.message?.includes("INVALID_INTENTS")
            ? `Token ${i + 1} : intents invalides — vérifiez les intents dans le portail Discord.`
            : err.message?.includes("TOKEN_INVALID") || err.message?.includes("401")
            ? `Token ${i + 1} : token invalide ou révoqué.`
            : `Token ${i + 1} — ${err.message}`;
          reject(new Error(msg));
        });
      });

      clients.push(client);
      dmallWsSend(ws, { type: "connected", user: dmallClientTag(client) });
    }

    dmallWsSend(ws, { type: "status", text: "Récupération des cibles…" });

    let allTargets = [];
    if (mode === "friends") {
      allTargets = await dmallFetchFriends(clients, blacklist, ws);
    } else if (mode === "guild" || mode === "bot") {
      allTargets = await dmallFetchGuildMembers(clients[0], guildId, blacklist, ws);
    }

    const processedIds = new Set(resumeFrom?.processedIds ?? []);
    const total        = resumeFrom?.total ?? allTargets.length;
    const targets      = allTargets.filter(t => !processedIds.has(t.userId));

    dmallWsSend(ws, { type: "targets", count: targets.length, total });

    if (!targets.length) {
      dmallClearCp(hash);
      dmallWsSend(ws, { type: "done", sent: 0, failed: 0 });
      return;
    }

    const startedAt      = resumeFrom?.startedAt ?? new Date().toISOString();
    let sent = 0, failed = 0, current = processedIds.size;
    const FATAL_CODES    = new Set([40001, 40002, 40007, 50014]);
    const deadTokens     = new Set();
    const tokenCooldowns = new Map();

    dmallSaveCp(hash, {
      mode, guildId, tokens, blacklist, template, delayMs,
      startedAt, total, processed: current,
    });

    for (let i = 0; i < targets.length; i++) {
      if (stop.stop) break;

      const target = targets[i];
      current++;
      let success = false, firstReason = null, usedIdx = 0;

      if (deadTokens.size >= clients.length) {
        dmallWsSend(ws, { type: "error", text: "Tous les tokens sont invalides — arrêt." });
        break;
      }

      const available = [];
      for (let ti = 0; ti < clients.length; ti++) {
        if (deadTokens.has(ti)) continue;
        if (Date.now() >= (tokenCooldowns.get(ti) ?? 0)) available.push(ti);
      }

      if (!available.length && deadTokens.size < clients.length) {
        let minWait = Infinity;
        for (const [ti, end] of tokenCooldowns) {
          if (!deadTokens.has(ti)) minWait = Math.min(minWait, end - Date.now());
        }
        if (minWait > 0 && minWait < Infinity) {
          dmallWsSend(ws, {
            type: "status",
            text: `Rate limit — pause ${Math.ceil(minWait / 1000)}s…`,
          });
          await dmallSleep(minWait);
        }
        for (let ti = 0; ti < clients.length; ti++) {
          if (!deadTokens.has(ti) && Date.now() >= (tokenCooldowns.get(ti) ?? 0)
              && !available.includes(ti)) available.push(ti);
        }
      }

      for (const ti of available) {
        try {
          const user      = await clients[ti].users.fetch(target.userId);
          const dmChannel = await user.createDM();
          await dmChannel.send(template);
          success = true;
          usedIdx = ti;
          break;
        } catch (err) {
          const code   = err.code ?? err.httpStatus ?? 0;
          const reason = code === 50007 ? "DMs fermés"
                       : code === 50013 ? "Permissions manquantes"
                       : code === 429   ? "Rate limit"
                       : err.message    ?? "Erreur inconnue";
          if (!firstReason) firstReason = reason;

          if (FATAL_CODES.has(code) || err.httpStatus === 401) {
            deadTokens.add(ti);
            dmallWsSend(ws, { type: "status", text: `⚠ Token ${ti + 1} désactivé (${reason})` });
            if (deadTokens.size >= clients.length) break;
            continue;
          }
          if (code === 429) {
            tokenCooldowns.set(ti, Date.now() + ((err.retry_after ?? err.retryAfter ?? 5) * 1000));
            continue;
          }
          break;
        }
      }

      dmallAppendId(hash, target.userId);

      if (success) {
        sent++;
        dmallWsSend(ws, {
          type: "progress", current, total,
          tag: target.tag, status: "sent", tokenIdx: usedIdx,
        });
      } else {
        failed++;
        dmallWsSend(ws, {
          type: "progress", current, total,
          tag: target.tag, status: "failed",
          reason: firstReason ?? "Erreur inconnue",
        });
      }

      if (current % 10 === 0)
        dmallSaveCp(hash, {
          mode, guildId, tokens, blacklist, template, delayMs,
          startedAt, total, processed: current,
        });

      if (i < targets.length - 1 && !stop.stop) await dmallSleep(delayMs);
    }

    if (stop.stop) {
      dmallSaveCp(hash, {
        mode, guildId, tokens, blacklist, template, delayMs,
        startedAt, total, processed: current,
      });
      dmallWsSend(ws, { type: "stopped" });
    } else {
      dmallClearCp(hash);
      dmallWsSend(ws, { type: "done", sent, failed });
    }

  } catch (err) {
    console.error("[dmall]", err);
    dmallWsSend(ws, { type: "error", text: err.message ?? "Erreur inconnue" });
  } finally {
    for (const c of clients) try { c.destroy(); } catch {}
    ws._dmallStop = null;
  }
}

/* ══════════════════════════════════
   DMALL — WEBSOCKET HANDLER
══════════════════════════════════ */
wss.on("connection", async (ws, req) => {
  ws._dmallStop    = null;
  ws._dmallRunning = false;
  ws._dmallHash    = null;
  ws._dmallUserId  = null;

  const sid = wsGetSessionId(req);
  if (!sid) {
    console.warn("[ws] Cookie manquant ou invalide.");
    dmallWsSend(ws, { type: "auth", valid: false, reason: "no_session" });
    ws.close(4001, "Non authentifié");
    return;
  }

  sessionStore.get(sid, async (err, sess) => {
    if (err) {
      console.error("[ws] Erreur store:", err);
      dmallWsSend(ws, { type: "auth", valid: false, reason: "store_error" });
      ws.close(4001, "Erreur session");
      return;
    }

    if (!sess?.userId) {
      console.warn("[ws] Session introuvable. sid:", sid);
      dmallWsSend(ws, { type: "auth", valid: false, reason: "session_expired" });
      ws.close(4001, "Session expirée");
      return;
    }

    const userId = sess.userId;

    try {
      const hasDmall = await userHasDmall(userId);
      if (!hasDmall) {
        dmallWsSend(ws, { type: "auth", valid: false, reason: "no_license" });
        ws.close(4003, "Licence DMall requise");
        return;
      }
    } catch (e) {
      console.error("[ws] Erreur licence:", e);
      dmallWsSend(ws, { type: "auth", valid: false, reason: "license_error" });
      ws.close(4001, "Erreur serveur");
      return;
    }

    ws._dmallUserId = userId;
    ws._dmallHash   = dmallKeyHash(userId);

    const cp = dmallLoadCp(ws._dmallHash);
    if (cp) {
      dmallWsSend(ws, {
        type:      "checkpoint_available",
        startedAt: cp.startedAt,
        processed: cp.processed ?? 0,
        total:     cp.total     ?? 0,
      });
    }

    dmallWsSend(ws, { type: "auth", valid: true });

    ws.on("message", async raw => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.action === "start") {
        if (ws._dmallRunning)
          return dmallWsSend(ws, { type: "error", text: "Un envoi est déjà en cours." });
        ws._dmallRunning = true;
        try {
          await dmallRun(ws, {
            mode:       msg.mode      ?? "friends",
            guildId:    msg.guildId   ?? null,
            tokens:     msg.tokens    ?? [],
            blacklist:  msg.blacklist ?? [],
            template:   msg.template  ?? "",
            delayMs:    msg.delayMs   ?? 1500,
            resumeFrom: null,
          });
        } finally { ws._dmallRunning = false; }
      }

      if (msg.action === "resume") {
        if (ws._dmallRunning)
          return dmallWsSend(ws, { type: "error", text: "Un envoi est déjà en cours." });
        const saved = dmallLoadCp(ws._dmallHash);
        if (!saved)
          return dmallWsSend(ws, { type: "error", text: "Aucun checkpoint trouvé." });
        ws._dmallRunning = true;
        try {
          await dmallRun(ws, {
            mode:       saved.mode,
            guildId:    saved.guildId   ?? null,
            tokens:     saved.tokens    ?? [],
            blacklist:  saved.blacklist ?? [],
            template:   saved.template  ?? "",
            delayMs:    saved.delayMs   ?? 1500,
            resumeFrom: saved,
          });
        } finally { ws._dmallRunning = false; }
      }

      if (msg.action === "stop") {
        if (ws._dmallStop) ws._dmallStop.stop = true;
      }

      if (msg.action === "clear_checkpoint") {
        dmallClearCp(ws._dmallHash);
        dmallWsSend(ws, { type: "checkpoint_cleared" });
      }
    });

    ws.on("close", () => {
      if (ws._dmallStop) ws._dmallStop.stop = true;
    });

    ws.on("error", err => {
      console.error("[ws] Erreur socket:", err.message);
    });
  });
});

/* ═══════════════════════════════════════
   ROLEGUARD — ROUTES
═══════════════════════════════════════ */
let vps = null;
try {
  vps = require("./vpsManager");
  console.log("✅ vpsManager chargé.");
} catch (err) {
  console.warn("⚠️ vpsManager non disponible:", err.message);
}

/* ── Secret interne bot → API ── */
function requireApiSecret(req, res, next) {
  const secret = req.headers["x-api-secret"];
  if (!secret || secret !== process.env.RG_API_SECRET)
    return res.status(403).json({ error: "Accès refusé" });
  next();
}

/* ── Vérifie la licence RoleGuard ── */
async function userHasRoleguard(userId) {
  if (!supabase) return true;
  const { data } = await supabase
    .from("purchases")
    .select("tool_id")
    .eq("user_id", userId)
    .eq("tool_id", "roleguard")
    .maybeSingle();
  return !!data;
}

/* ── Helpers Supabase RoleGuard ── */
async function getRgInstance(instanceId) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("roleguard_instances")
    .select("*")
    .eq("id", instanceId)
    .maybeSingle();
  return data || null;
}

async function getRgInstancesByUser(userId) {
  if (!supabase) return [];
  const { data } = await supabase
    .from("roleguard_instances")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

async function getRgInstanceByUserAndGuild(userId, guildId) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("roleguard_instances")
    .select("*")
    .eq("user_id", userId)
    .eq("guild_id", guildId)
    .maybeSingle();
  return data || null;
}

/* ══════════════════════════════════
   GET /api/roleguard/instances
   Liste les instances de l'utilisateur
══════════════════════════════════ */
app.get("/api/roleguard/instances", requireAuth, async (req, res) => {
  try {
    if (!await userHasRoleguard(req.session.userId))
      return res.status(403).json({ error: "Licence RoleGuard requise" });

    const instances = await getRgInstancesByUser(req.session.userId);
    res.json({
      instances: instances.map(i => ({
        id:        i.id,
        guildId:   i.guild_id,
        guildName: i.guild_name,
        pm2Name:   i.pm2_name,
        status:    i.status,
        config:    i.config || {},
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      })),
    });
  } catch (err) {
    console.error("[rg] GET instances:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   POST /api/roleguard/deploy
   Déploie une nouvelle instance
══════════════════════════════════ */
app.post("/api/roleguard/deploy", requireAuth, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  if (!supabase) return res.status(503).json({ error: "Supabase non configuré" });

  const { botToken, guildId, guildName, config = {} } = req.body;
  if (!botToken) return res.status(400).json({ error: "botToken requis" });
  if (!guildId)  return res.status(400).json({ error: "guildId requis" });

  try {
    if (!await userHasRoleguard(req.session.userId))
      return res.status(403).json({ error: "Licence RoleGuard requise" });

    /* Vérifie doublon */
    const existing = await getRgInstanceByUserAndGuild(req.session.userId, guildId);
    if (existing) return res.status(409).json({
      error:      "Une instance existe déjà pour ce serveur",
      instanceId: existing.id,
    });

    const pm2Name        = vps.generatePm2Name(req.session.userId);
    const encryptedToken = vps.encryptToken(botToken);

    /* Crée l'entrée en DB avec statut deploying */
    const { data: instance, error: dbErr } = await supabase
      .from("roleguard_instances")
      .insert({
        user_id:    req.session.userId,
        guild_id:   guildId,
        guild_name: guildName || guildId,
        bot_token:  encryptedToken,
        pm2_name:   pm2Name,
        status:     "deploying",
        config:     config,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    /* Déploiement SSH en arrière-plan */
    vps.deployInstance({
      instanceId: instance.id,
      pm2Name,
      botToken,   /* token en clair uniquement pour SSH, jamais retourné au client */
      guildId,
    }).then(async () => {
      await supabase
        .from("roleguard_instances")
        .update({ status: "running", updated_at: new Date().toISOString() })
        .eq("id", instance.id);
      console.log(`✅ [rg] Instance déployée : ${pm2Name}`);
    }).catch(async (err) => {
      console.error(`❌ [rg] Déploiement échoué : ${pm2Name}`, err.message);
      await supabase
        .from("roleguard_instances")
        .update({ status: "error", updated_at: new Date().toISOString() })
        .eq("id", instance.id);
    });

    /* Réponse immédiate */
    res.json({
      ok:         true,
      instanceId: instance.id,
      pm2Name,
      status:     "deploying",
    });
  } catch (err) {
    console.error("[rg] POST deploy:", err);
    res.status(500).json({ error: "Erreur lors du déploiement" });
  }
});

/* ══════════════════════════════════
   PATCH /api/roleguard/:id/config
   Met à jour la config d'une instance
══════════════════════════════════ */
app.patch("/api/roleguard/:id/config", requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase non configuré" });
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    if (instance.user_id !== req.session.userId)
      return res.status(403).json({ error: "Accès refusé" });

    const newConfig = { ...(instance.config || {}), ...req.body.config };

    const { error } = await supabase
      .from("roleguard_instances")
      .update({ config: newConfig, updated_at: new Date().toISOString() })
      .eq("id", req.params.id);

    if (error) throw error;

    /* Signal au bot de recharger sa config si VPS disponible */
    if (vps) {
      vps.reloadInstanceConfig(instance.pm2_name).catch(() => {});
    }

    res.json({ ok: true, config: newConfig });
  } catch (err) {
    console.error("[rg] PATCH config:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   POST /api/roleguard/:id/start
   Démarre une instance arrêtée
══════════════════════════════════ */
app.post("/api/roleguard/:id/start", requireAuth, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    if (instance.user_id !== req.session.userId)
      return res.status(403).json({ error: "Accès refusé" });

    await vps.startInstance(instance.pm2_name);
    await supabase
      .from("roleguard_instances")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", req.params.id);

    res.json({ ok: true, status: "running" });
  } catch (err) {
    console.error("[rg] POST start:", err);
    res.status(500).json({ error: "Erreur lors du démarrage" });
  }
});

/* ══════════════════════════════════
   POST /api/roleguard/:id/stop
   Arrête une instance
══════════════════════════════════ */
app.post("/api/roleguard/:id/stop", requireAuth, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    if (instance.user_id !== req.session.userId)
      return res.status(403).json({ error: "Accès refusé" });

    await vps.stopInstance(instance.pm2_name);
    await supabase
      .from("roleguard_instances")
      .update({ status: "stopped", updated_at: new Date().toISOString() })
      .eq("id", req.params.id);

    res.json({ ok: true, status: "stopped" });
  } catch (err) {
    console.error("[rg] POST stop:", err);
    res.status(500).json({ error: "Erreur lors de l'arrêt" });
  }
});

/* ══════════════════════════════════
   POST /api/roleguard/:id/restart
   Redémarre une instance
══════════════════════════════════ */
app.post("/api/roleguard/:id/restart", requireAuth, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    if (instance.user_id !== req.session.userId)
      return res.status(403).json({ error: "Accès refusé" });

    await vps.restartInstance(instance.pm2_name);
    await supabase
      .from("roleguard_instances")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", req.params.id);

    res.json({ ok: true, status: "running" });
  } catch (err) {
    console.error("[rg] POST restart:", err);
    res.status(500).json({ error: "Erreur lors du redémarrage" });
  }
});

/* ══════════════════════════════════
   DELETE /api/roleguard/:id
   Supprime une instance
══════════════════════════════════ */
app.delete("/api/roleguard/:id", requireAuth, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  if (!supabase) return res.status(503).json({ error: "Supabase non configuré" });
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    if (instance.user_id !== req.session.userId)
      return res.status(403).json({ error: "Accès refusé" });

    /* Supprime sur le VPS */
    await vps.deleteInstance(instance.pm2_name).catch(err =>
      console.warn("[rg] delete VPS warning:", err.message)
    );

    /* Supprime en DB */
    await supabase.from("roleguard_instances").delete().eq("id", req.params.id);

    res.json({ ok: true });
  } catch (err) {
    console.error("[rg] DELETE instance:", err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

/* ══════════════════════════════════
   GET /api/roleguard/:id/logs
   Récupère les logs PM2 d'une instance
══════════════════════════════════ */
app.get("/api/roleguard/:id/logs", requireAuth, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    if (instance.user_id !== req.session.userId)
      return res.status(403).json({ error: "Accès refusé" });

    const lines = Math.min(parseInt(req.query.lines) || 50, 200);
    const logs  = await vps.getInstanceLogs(instance.pm2_name, lines);
    res.json({ ok: true, logs });
  } catch (err) {
    console.error("[rg] GET logs:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des logs" });
  }
});

/* ══════════════════════════════════
   GET /api/roleguard/:id/status
   Vérifie le statut réel PM2
══════════════════════════════════ */
app.get("/api/roleguard/:id/status", requireAuth, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    if (instance.user_id !== req.session.userId)
      return res.status(403).json({ error: "Accès refusé" });

    const status = await vps.getInstanceStatus(instance.pm2_name);

    /* Sync la DB si le statut a changé */
    if (status !== instance.status) {
      await supabase
        .from("roleguard_instances")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", req.params.id);
    }

    res.json({ ok: true, status });
  } catch (err) {
    console.error("[rg] GET status:", err);
    res.status(500).json({ error: "Erreur lors de la vérification du statut" });
  }
});

/* ══════════════════════════════════
   PATCH /api/roleguard/:id/status
   Callback interne : bot → API
   Met à jour le statut depuis le bot
══════════════════════════════════ */
app.patch("/api/roleguard/:id/status", requireApiSecret, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase non configuré" });
  try {
    const { status, botTag, error: botError } = req.body;
    const updates = { status, updated_at: new Date().toISOString() };
    if (botTag)   updates.bot_tag   = botTag;
    if (botError) updates.bot_error = botError;

    await supabase
      .from("roleguard_instances")
      .update(updates)
      .eq("id", req.params.id);

    res.json({ ok: true });
  } catch (err) {
    console.error("[rg] PATCH status (internal):", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   GET /api/roleguard/:id/config
   Callback interne : bot → API
   Le bot charge sa config au démarrage
══════════════════════════════════ */
app.get("/api/roleguard/:id/config", requireApiSecret, async (req, res) => {
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    res.json(instance.config || {});
  } catch (err) {
    console.error("[rg] GET config (internal):", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   POST /api/roleguard/:id/log
   Callback interne : bot → API
   Le bot envoie ses logs
══════════════════════════════════ */
app.post("/api/roleguard/:id/log", requireApiSecret, async (req, res) => {
  if (!supabase) return res.json({ ok: true });
  try {
    const { level = "info", message } = req.body;
    if (!message) return res.json({ ok: true });

    await supabase.from("roleguard_logs").insert({
      instance_id: req.params.id,
      level,
      message:     message.slice(0, 2000),
    });

    /* Nettoyage : garde seulement les 500 derniers logs par instance */
    supabase.rpc("cleanup_roleguard_logs", { p_instance_id: req.params.id })
      .catch(() => {});

    res.json({ ok: true });
  } catch (err) {
    console.error("[rg] POST log (internal):", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   GET /api/roleguard/:id/db-logs
   Récupère les logs stockés en DB
══════════════════════════════════ */
app.get("/api/roleguard/:id/db-logs", requireAuth, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: "Supabase non configuré" });
  try {
    const instance = await getRgInstance(req.params.id);
    if (!instance) return res.status(404).json({ error: "Instance introuvable" });
    if (instance.user_id !== req.session.userId)
      return res.status(403).json({ error: "Accès refusé" });

    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const { data: logs } = await supabase
      .from("roleguard_logs")
      .select("*")
      .eq("instance_id", req.params.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    res.json({ ok: true, logs: (logs || []).reverse() });
  } catch (err) {
    console.error("[rg] GET db-logs:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   POST /api/roleguard/vps/check
   Admin : vérifie l'état du VPS
══════════════════════════════════ */
app.post("/api/roleguard/vps/check", requireAdmin, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  try {
    const result = await vps.checkVpsReady();
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════
   POST /api/roleguard/vps/upload-template
   Admin : upload le template bot sur VPS
══════════════════════════════════ */
app.post("/api/roleguard/vps/upload-template", requireAdmin, async (req, res) => {
  if (!vps) return res.status(503).json({ error: "VPS manager non disponible" });
  try {
    await vps.uploadTemplate();
    res.json({ ok: true, message: "Template uploadé avec succès." });
  } catch (err) {
    console.error("[rg] upload-template:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════
   404 FALLBACK
══════════════════════════════════ */
app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée", path: req.path });
});

/* ══════════════════════════════════
   DÉMARRAGE LOCAL
══════════════════════════════════ */
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;