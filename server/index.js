/* Charge dotenv seulement en local, pas sur Vercel */
if (!process.env.VERCEL) {
  require("dotenv").config();
}

const express   = require("express");
const session   = require("express-session");
const axios     = require("axios");
const path      = require("path");
const { Redis } = require("@upstash/redis");

const app  = express();
const PORT = process.env.PORT || 3000;

/* ══════════════════════════════════
   ADMINS
══════════════════════════════════ */
const ADMIN_IDS = [
  "777325892322066472",
  "DISCORD_USER_ID_2"
];

function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

/* ══════════════════════════════════
   TRUST PROXY
══════════════════════════════════ */
app.set("trust proxy", 1);

/* ══════════════════════════════════
   UPSTASH REDIS
══════════════════════════════════ */
const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/* ══════════════════════════════════
   SESSION STORE CUSTOM UPSTASH
══════════════════════════════════ */
class UpstashSessionStore extends session.Store {
  async get(sid, cb) {
    try {
      const data = await redis.get(`sess:${sid}`);
      console.log(`📦 Session GET ${sid}:`, data ? "trouvée" : "vide");
      cb(null, data || null);
    } catch (err) {
      console.error("❌ Session GET error:", err);
      cb(err);
    }
  }

  async set(sid, sessionData, cb) {
    try {
      const ttl = sessionData.cookie?.maxAge
        ? Math.floor(sessionData.cookie.maxAge / 1000)
        : 86400;
      await redis.set(`sess:${sid}`, sessionData, { ex: ttl });
      console.log(`💾 Session SET ${sid} (ttl: ${ttl}s)`);
      cb(null);
    } catch (err) {
      console.error("❌ Session SET error:", err);
      cb(err);
    }
  }

  async destroy(sid, cb) {
    try {
      await redis.del(`sess:${sid}`);
      console.log(`🗑️  Session DESTROY ${sid}`);
      cb(null);
    } catch (err) {
      console.error("❌ Session DESTROY error:", err);
      cb(err);
    }
  }
}

/* ══════════════════════════════════
   HELPERS DB (Redis)
══════════════════════════════════ */
async function getUser(userId) {
  return await redis.get(`user:${userId}`);
}

async function saveUser(userId, userData) {
  await redis.set(`user:${userId}`, userData);
}

async function getAllUsers() {
  const keys = await redis.keys("user:*");
  if (!keys.length) return [];
  const users = await Promise.all(keys.map(k => redis.get(k)));
  return users.filter(Boolean);
}

/* ══════════════════════════════════
   MIDDLEWARE
══════════════════════════════════ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── CORS (nécessaire si front et back ne sont pas sur le même domaine) ── */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(session({
  store:             new UpstashSessionStore(),
  secret:            process.env.SESSION_SECRET || "dev_secret_change_en_prod",
  resave:            false,
  saveUninitialized: false,
  name:              "sid",
  cookie: {
    secure:   process.env.NODE_ENV === "production",  // ← true seulement en prod
    httpOnly: true,
    maxAge:   7 * 24 * 60 * 60 * 1000,               // 7 jours
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
}));

if (!process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, "..")));
}

/* ══════════════════════════════════
   AUTH ROUTES
══════════════════════════════════ */
app.get("/auth/login", (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.DISCORD_CLIENT_ID,
    redirect_uri:  process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope:         "identify guilds"
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/?error=no_code");

  try {
    /* ── Échange du code contre un token ── */
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id:     process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type:    "authorization_code",
        code,
        redirect_uri:  process.env.DISCORD_REDIRECT_URI
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenRes.data;
    if (!access_token) throw new Error("Pas de access_token dans la réponse Discord");
    console.log("✅ Token Discord OK");

    /* ── Récupération du profil Discord ── */
    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const discordUser = userRes.data;
    console.log("✅ User Discord OK:", discordUser.username);

    /* ── Upsert dans Redis ── */
    let user = await getUser(discordUser.id);
    console.log("✅ User Redis:", user ? "trouvé" : "nouveau");

    if (!user) {
      user = {
        id:        discordUser.id,
        username:  discordUser.username,
        email:     discordUser.email || null,
        avatar:    discordUser.avatar,
        purchases: [],
        adminNote: "",
        createdAt: new Date().toISOString()
      };
    } else {
      user.username = discordUser.username;
      user.avatar   = discordUser.avatar;
      if (discordUser.email) user.email = discordUser.email;
    }

    await saveUser(discordUser.id, user);
    console.log("✅ User sauvegardé Redis");

    /* ── Régénération de session pour éviter la fixation ── */
    req.session.regenerate((err) => {
      if (err) {
        console.error("❌ Session regenerate error:", err);
        return res.redirect("/?error=session_failed");
      }

      req.session.userId      = discordUser.id;
      req.session.accessToken = access_token;
      console.log("✅ Session définie, userId:", req.session.userId);

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("❌ Session save error:", saveErr);
          return res.redirect("/?error=session_failed");
        }
        console.log("✅ Session sauvegardée → redirect dashboard");
        res.redirect("/dashboard.html");
      });
    });

  } catch (err) {
    console.error("❌ Auth error:", err.response?.data || err.message);
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
  console.log(`🔐 requireAuth — userId: ${req.session?.userId ?? "undefined"}`);
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  next();
}

function requireAdmin(req, res, next) {
  console.log(`🛡️  requireAdmin — userId: ${req.session?.userId ?? "undefined"}`);
  if (!req.session?.userId || !isAdmin(req.session.userId)) {
    return res.status(403).json({ error: "Accès refusé" });
  }
  next();
}

/* ══════════════════════════════════
   API — AUTH STATUS
══════════════════════════════════ */
app.get("/api/auth/status", async (req, res) => {
  console.log("🔍 auth/status - session userId:", req.session?.userId ?? "undefined");
  if (req.session?.userId) {
    const user = await getUser(req.session.userId);
    if (!user) return res.json({ logged: false });
    res.json({ logged: true, user });
  } else {
    res.json({ logged: false });
  }
});

/* ══════════════════════════════════
   API — ME
══════════════════════════════════ */
app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({
      ...user,
      isAdmin: isAdmin(req.session.userId)
    });
  } catch (err) {
    console.error("❌ /api/me error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   API — SERVEURS DISCORD
══════════════════════════════════ */
app.get("/api/servers", requireAuth, async (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: "Token Discord manquant, reconnectez-vous" });
  }

  try {
    const guildsRes = await axios.get("https://discord.com/api/v10/users/@me/guilds", {
      headers: { Authorization: `Bearer ${req.session.accessToken}` }
    });

    const adminGuilds = guildsRes.data.filter(
      g => (parseInt(g.permissions) & 0x8) === 0x8
    );

    res.json(adminGuilds.map(g => ({
      id:   g.id,
      name: g.name,
      icon: g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`
        : null,
    })));

  } catch (err) {
    console.error("❌ Erreur fetch guilds:", err.response?.data || err.message);
    if (err.response?.status === 401) {
      return res.status(401).json({ error: "Token expiré, reconnectez-vous" });
    }
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   API — ACHATS (utilisateur)
══════════════════════════════════ */
app.get("/api/purchases", requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ purchases: user.purchases || [] });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/purchase", requireAuth, async (req, res) => {
  const { toolId, toolName, price } = req.body;
  if (!toolId || !toolName) {
    return res.status(400).json({ error: "Données manquantes" });
  }

  try {
    const user = await getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    if (user.purchases.find(p => p.toolId === toolId)) {
      return res.json({ ok: true, message: "Déjà possédé" });
    }

    user.purchases.push({
      toolId,
      toolName,
      price:       typeof price === "number" ? price : 0,
      purchasedAt: new Date().toISOString()
    });

    await saveUser(user.id, user);
    console.log(`✅ Achat enregistré : ${toolName} pour ${user.username}`);
    res.json({ ok: true, message: "Outil ajouté avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/purchase/:toolId", requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.session.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const before = user.purchases.length;
    user.purchases = user.purchases.filter(p => p.toolId !== req.params.toolId);

    if (user.purchases.length === before) {
      return res.status(404).json({ error: "Outil non trouvé dans vos achats" });
    }

    await saveUser(user.id, user);
    console.log(`🗑️  Outil supprimé : ${req.params.toolId} pour ${user.username}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   ADMIN — UTILISATEURS
══════════════════════════════════ */
app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ users });
  } catch (err) {
    console.error("❌ Admin users error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
  try {
    if (req.params.userId === req.session.userId) {
      return res.status(400).json({ error: "Impossible de se supprimer soi-même" });
    }
    await redis.del(`user:${req.params.userId}`);
    console.log(`🛡️  Admin suppression user ${req.params.userId}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ── Note interne ── */
app.patch("/api/admin/users/:userId/note", requireAdmin, async (req, res) => {
  try {
    const { note } = req.body;
    const user = await getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    user.adminNote = note || "";
    await saveUser(user.id, user);
    console.log(`📝 Note mise à jour pour user ${req.params.userId}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   ADMIN — LICENCES
══════════════════════════════════ */
app.post("/api/admin/users/:userId/purchase", requireAdmin, async (req, res) => {
  try {
    const { toolId, toolName, price } = req.body;
    const user = await getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    if (user.purchases.find(p => p.toolId === toolId)) {
      return res.json({ ok: true, message: "Déjà possédé" });
    }

    user.purchases.push({
      toolId, toolName,
      price:       typeof price === "number" ? price : 0,
      purchasedAt: new Date().toISOString()
    });

    await saveUser(user.id, user);
    console.log(`🛡️  Admin ajout outil ${toolName} pour user ${req.params.userId}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.delete("/api/admin/users/:userId/purchase/:toolId", requireAdmin, async (req, res) => {
  try {
    const user = await getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const before = user.purchases.length;
    user.purchases = user.purchases.filter(p => p.toolId !== req.params.toolId);

    if (user.purchases.length === before) {
      return res.status(404).json({ error: "Licence introuvable" });
    }

    await saveUser(user.id, user);
    console.log(`🛡️  Admin suppression outil ${req.params.toolId} pour user ${req.params.userId}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   ADMIN — STATS
══════════════════════════════════ */
app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  try {
    const users          = await getAllUsers();
    const totalUsers     = users.length;
    const totalPurchases = users.reduce((acc, u) => acc + (u.purchases?.length || 0), 0);
    const revenue        = users.reduce((acc, u) =>
      acc + (u.purchases || []).reduce((s, p) => s + (p.price || 0), 0), 0
    );

    res.json({
      totalUsers,
      totalPurchases,
      revenue: revenue.toFixed(2)
    });
  } catch (err) {
    console.error("❌ Admin stats error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* ══════════════════════════════════
   404 FALLBACK
══════════════════════════════════ */
app.use((req, res) => {
  if (!process.env.VERCEL) {
    res.status(404).sendFile(path.join(__dirname, "..", "index.html"));
  } else {
    res.status(404).send("Page non trouvée");
  }
});

module.exports = app;