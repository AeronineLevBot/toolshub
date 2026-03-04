/* ═══════════════════════════════════════
   DASHBOARD.JS — ToolsHub
═══════════════════════════════════════ */

const TOOLS_CATALOG = {
  "vocal-rank-tracker": { name: "Vocal Rank Tracker", icon: "🎙️", desc: "Classement de l'activité vocale en temps réel. Customisable & modifiable", category: "Analytics"  },
  "stats-dashboard":    { name: "Stats Dashboard",     icon: "📊", desc: "Tableau de bord analytics complet pour votre serveur.",                    category: "Analytics"  },
  "dmall":              { name: "DMall",               icon: "📨", desc: "Envoi automatique de messages privés à tous les membres.",                 category: "Tools"      },
  "ai-analyze":         { name: "AI-Analyze",          icon: "🤖", desc: "Analyse et modération intelligente par IA.",                              category: "Support"    },
  "roleguard":          { name: "RoleGuard",           icon: "🛡️", desc: "Sécurité et protection des rôles de votre serveur.",                      category: "Engagement" },
  "blacklistguard":     { name: "BlacklistGuard",      icon: "🚫", desc: "Blacklist centralisée pour bannir les membres indésirables.",              category: "Engagement" },
};

const TOOLS_BOT_CONFIG = {
  "vocal-rank-tracker": { botClientId: "REPLACE_BOT_CLIENT_ID_1", configurable: false },
  "dmall":              { botClientId: "REPLACE_BOT_CLIENT_ID_3", configurable: true  },
  "ai-analyze":         { botClientId: "REPLACE_BOT_CLIENT_ID_4", configurable: true  },
  "stats-dashboard":    { botClientId: "REPLACE_BOT_CLIENT_ID_5", configurable: true  },
  "roleguard":          { botClientId: "REPLACE_BOT_CLIENT_ID_6", configurable: true  },
  "blacklistguard":     { botClientId: "REPLACE_BOT_CLIENT_ID_7", configurable: true  },
};

/* Webhook Discord pour le formulaire VRT */
const VRT_WEBHOOK_URL = "https://discord.com/api/webhooks/1478634335321063435/Qy1Ng8lVFyEzBVe8ER86sRE0PybAKaHcGi5PIeEzcCaMdDxpB7W2PgWjSRnNa8us8J6o";

/* Thèmes de serveur Discord disponibles (choix multiples) */
const VRT_SERVER_THEMES = [
  { id: "vocal",       label: "🎙️ Vocal actifs"        },
  { id: "giveaways",   label: "🎁 Giveaways"            },
  { id: "community",   label: "🌍 Communautaire"        },
  { id: "gaming",      label: "🎮 Gaming"               },
  { id: "esport",      label: "🏆 eSport"               },
  { id: "anime",       label: "🌸 Animé / Manga"        },
  { id: "music",       label: "🎵 Musique"              },
  { id: "art",         label: "🎨 Art / Créatif"        },
  { id: "education",   label: "📚 Éducation"            },
  { id: "roleplay",    label: "🎭 Roleplay"             },
  { id: "crypto",      label: "💰 Crypto / NFT"        },
  { id: "programming", label: "💻 Programmation"        },
  { id: "memes",       label: "😂 Mèmes / Humour"      },
  { id: "support",     label: "🛠️ Support / Entraide"  },
  { id: "dating",      label: "💘 Rencontres"           },
  { id: "other",       label: "✨ Autre"                },
];

/* ══════════════════════════════════
   STATE GLOBAL
══════════════════════════════════ */
let currentServer        = null;
let currentUserPurchases = [];
let currentAdminUser     = null;
let serversLoaded        = false;
let serversCache         = [];
let currentUserData      = null;

/* ══════════════════════════════════
   DMALL — STATE
══════════════════════════════════ */
let dmallWs              = null;
let dmallMode            = "friends";
let dmallRunning         = false;
let dmallStartTime       = null;
let dmallElapsedInterval = null;
let dmallReconnectTimer  = null;

/* ══════════════════════════════════
   VRT — STATE
══════════════════════════════════ */
let vrtSelectedThemes = new Set(); /* choix multiples */

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
async function init() {
  const user = await fetchUser();
  if (!user) { window.location.href = "/"; return; }

  currentUserData      = user;
  currentUserPurchases = user.purchases || [];
  renderUser(user);
  renderPurchases(currentUserPurchases);
  renderBilling(currentUserPurchases);
  renderSettings(user);

  if (user.isAdmin) injectAdminSidebar();
}

/* ══════════════════════════════════
   FETCH USER
══════════════════════════════════ */
async function fetchUser() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/* ══════════════════════════════════
   RENDER USER
══════════════════════════════════ */
function renderUser(user) {
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  document.getElementById("dashAvatar").src               = avatarUrl;
  document.getElementById("dashUsername").textContent     = user.username;
  document.getElementById("settingsAvatar").src           = avatarUrl;
  document.getElementById("settingsUsername").textContent = user.username;
}

/* ══════════════════════════════════
   RENDER PURCHASES
══════════════════════════════════ */
function renderPurchases(purchases) {
  const grid  = document.getElementById("purchasedTools");
  const empty = document.getElementById("emptyPurchases");

  if (!purchases.length) {
    empty.classList.add("visible");
    return;
  }

  empty.classList.remove("visible");
  grid.innerHTML = purchases.map(p => {
    const tool = TOOLS_CATALOG[p.toolId] || { name: p.toolName, icon: "🔧", desc: "Outil ToolsHub" };
    const date = new Date(p.purchasedAt).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    });

    let configBtnHtml;
    if (p.toolId === "dmall") {
      configBtnHtml = `<button class="btn-tool primary" onclick="openDmallPage()">⚙️ Lancer</button>`;
    } else if (p.toolId === "vocal-rank-tracker") {
      configBtnHtml = `<button class="btn-tool primary" onclick="openVrtPage()">🎙️ Ouvrir</button>`;
    } else {
      configBtnHtml = `<button class="btn-tool primary">⚙️ Configurer</button>`;
    }

    return `
      <div class="dash-tool-card">
        <div class="dash-tool-top">
          <div class="dash-tool-icon">${tool.icon}</div>
          <div class="dash-tool-status">Actif</div>
        </div>
        <div>
          <div class="dash-tool-name">${tool.name}</div>
          <div class="dash-tool-desc">${tool.desc}</div>
        </div>
        <div class="dash-tool-footer">
          <div class="dash-tool-price">Depuis le <strong>${date}</strong></div>
          <div class="dash-tool-actions">
            <a href="docs.html#${p.toolId}" class="btn-tool">📖 Docs</a>
            ${configBtnHtml}
          </div>
        </div>
      </div>`;
  }).join("");
}

/* ══════════════════════════════════
   RENDER BILLING
══════════════════════════════════ */
function renderBilling(purchases) {
  const list  = document.getElementById("billingList");
  const empty = document.getElementById("emptyBilling");

  if (!purchases.length) {
    empty.classList.add("visible");
    return;
  }

  empty.classList.remove("visible");
  list.innerHTML = purchases.map(p => {
    const tool  = TOOLS_CATALOG[p.toolId];
    const date  = new Date(p.purchasedAt).toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric"
    });
    const price = p.price === 0 ? "Gratuit" : `${p.price}€`;

    return `
      <div class="billing-row">
        <div class="billing-info">
          <span class="billing-name">${tool ? tool.icon : "🔧"} ${p.toolName}</span>
          <span class="billing-date">Souscrit le ${date}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span class="billing-badge">Actif</span>
          <span class="billing-price">${price} / mois</span>
        </div>
      </div>`;
  }).join("");
}

/* ══════════════════════════════════
   RENDER SETTINGS
══════════════════════════════════ */
function renderSettings(user) { /* géré dans renderUser */ }

/* ══════════════════════════════════
   ADMIN — SIDEBAR INJECTION
══════════════════════════════════ */
function injectAdminSidebar() {
  const slot = document.getElementById("adminSidebarSlot");
  if (!slot) return;
  slot.innerHTML = `
    <div class="dash-side-sep"></div>
    <div class="admin-side-label">Administration</div>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin')">📊 Vue d'ensemble</button>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin-users')">👥 Utilisateurs</button>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin-licenses')">🧰 Licences</button>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin-tools')">🧩 Articles</button>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin-security')">🔒 Sécurité</button>
  `;
}

/* ══════════════════════════════════════════════════════
   VRT — PAGE INTÉGRÉE (iframe pleine page)
══════════════════════════════════════════════════════ */

function openVrtPage() {
  document.getElementById("dashMainContent").style.display = "none";

  let page = document.getElementById("vrtInlinePage");
  if (!page) {
    page    = document.createElement("div");
    page.id = "vrtInlinePage";
    page.innerHTML = buildVrtPageHTML();
    document.getElementById("dashContent").appendChild(page);
  } else {
    page.style.display = "";
  }
}

function closeVrtPage() {
  const page = document.getElementById("vrtInlinePage");
  if (page) page.style.display = "none";
  document.getElementById("dashMainContent").style.display = "";

  document.querySelectorAll(".dash-side-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(".dash-side-btn[onclick=\"showTab('purchases')\"]")
    ?.classList.add("active");

  document.querySelectorAll(".dash-tab").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-purchases")?.classList.add("active");
}

function buildVrtPageHTML() {
  /* Génère les boutons de thème (choix multiples) */
  const themeButtons = VRT_SERVER_THEMES.map(t => `
    <button
      class="vrt-theme-btn"
      data-theme="${t.id}"
      onclick="vrtToggleTheme('${t.id}', this)"
      type="button">
      ${t.label}
    </button>`).join("");

  return `
    <div class="vrt-page">

      <!-- En-tête -->
      <div class="vrt-page-header">
        <div class="vrt-page-title">
          <span class="vrt-page-icon">🎙️</span>
          <div>
            <h2>Vocal Rank Tracker</h2>
            <p>Classement de l'activité vocale en temps réel</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn-tool vrt-config-btn" onclick="openVrtConfigModal()">⚙️ Configurer mon serveur</button>
          <button class="btn-tool vrt-back-btn"   onclick="closeVrtPage()">← Retour</button>
        </div>
      </div>

      <!-- iFrame -->
      <div class="vrt-iframe-wrap">
        <iframe
          id="vrtIframe"
          src="https://lbvc.duckdns.org"
          title="Vocal Rank Tracker"
          allowfullscreen
          loading="lazy">
        </iframe>
      </div>

      <!-- Modal configuration -->
      <div id="vrtConfigModal" class="vrt-modal-overlay">
        <div class="vrt-modal">

          <div class="vrt-modal-header">
            <div class="vrt-modal-header-title">
              <span>⚙️</span>
              <div>
                <h3>Configurer mon serveur</h3>
                <p>Ces informations nous aident à personnaliser votre expérience VRT</p>
              </div>
            </div>
            <button class="vrt-modal-close" onclick="closeVrtConfigModal()">✕</button>
          </div>

          <div class="vrt-modal-body">

            <!-- Pseudo Discord -->
            <div class="vrt-field">
              <label class="vrt-label">
                👤 Pseudo Discord
                <span class="vrt-label-hint">Prérempli depuis votre compte</span>
              </label>
              <input class="vrt-input" type="text" id="vrtUsername"
                placeholder="Votre pseudo Discord"/>
            </div>

            <!-- Lien serveur -->
            <div class="vrt-field">
              <label class="vrt-label">
                🏠 Lien d'invitation ou ID du serveur
              </label>
              <input class="vrt-input" type="text" id="vrtServerLink"
                placeholder="https://discord.gg/monserveur  ou  123456789012345678"/>
            </div>

            <!-- Type de serveur (choix multiples) -->
            <div class="vrt-field">
              <label class="vrt-label">
                🏷️ Type de serveur
                <span class="vrt-label-hint">Sélectionnez tout ce qui correspond</span>
              </label>
              <div class="vrt-theme-grid" id="vrtThemeGrid">
                ${themeButtons}
              </div>
              <div id="vrtThemeCount" class="vrt-theme-count">Aucun thème sélectionné</div>
            </div>

            <!-- Message optionnel -->
            <div class="vrt-field">
              <label class="vrt-label">
                💬 Message complémentaire
                <span class="vrt-label-hint">Optionnel</span>
              </label>
              <textarea class="vrt-input vrt-textarea" id="vrtMessage" rows="3"
                placeholder="Des précisions sur votre serveur, vos attentes…"></textarea>
            </div>

            <div id="vrtFormAlert" class="vrt-alert"></div>

          </div>

          <div class="vrt-modal-footer">
            <button class="btn-tool" onclick="closeVrtConfigModal()">Annuler</button>
            <button class="btn-primary" id="vrtSubmitBtn" onclick="vrtSubmitConfig()">
              📨 Envoyer la configuration
            </button>
          </div>

        </div>
      </div>

    </div>`;
}

/* ── VRT — Toggle thème (choix multiples) ── */
function vrtToggleTheme(themeId, btn) {
  if (vrtSelectedThemes.has(themeId)) {
    vrtSelectedThemes.delete(themeId);
    btn.classList.remove("active");
  } else {
    vrtSelectedThemes.add(themeId);
    btn.classList.add("active");
  }
  _vrtUpdateThemeCount();
}

function _vrtUpdateThemeCount() {
  const countEl = document.getElementById("vrtThemeCount");
  if (!countEl) return;
  const n = vrtSelectedThemes.size;
  if (n === 0) {
    countEl.textContent = "Aucun thème sélectionné";
    countEl.classList.remove("has-selection");
  } else {
    const labels = [...vrtSelectedThemes]
      .map(id => VRT_SERVER_THEMES.find(t => t.id === id)?.label ?? id)
      .join(", ");
    countEl.textContent = `${n} sélectionné${n > 1 ? "s" : ""} : ${labels}`;
    countEl.classList.add("has-selection");
  }
}

/* ── VRT — Ouvrir modal ── */
function openVrtConfigModal() {
  /* Préremplir le pseudo Discord */
  const usernameEl = document.getElementById("vrtUsername");
  if (usernameEl && currentUserData?.username) {
    usernameEl.value = currentUserData.username;
  }

  /* Reset sélection thèmes */
  vrtSelectedThemes.clear();
  document.querySelectorAll(".vrt-theme-btn").forEach(b => b.classList.remove("active"));
  _vrtUpdateThemeCount();

  /* Reset autres champs */
  const serverLinkEl = document.getElementById("vrtServerLink");
  if (serverLinkEl) serverLinkEl.value = "";

  const msgEl = document.getElementById("vrtMessage");
  if (msgEl) msgEl.value = "";

  /* Reset alerte */
  const alertEl = document.getElementById("vrtFormAlert");
  if (alertEl) { alertEl.textContent = ""; alertEl.classList.remove("visible"); }

  /* Reset bouton */
  const btn = document.getElementById("vrtSubmitBtn");
  if (btn) { btn.textContent = "📨 Envoyer la configuration"; btn.disabled = false; }

  document.getElementById("vrtConfigModal").classList.add("visible");
  document.body.style.overflow = "hidden";
}

function closeVrtConfigModal() {
  const modal = document.getElementById("vrtConfigModal");
  if (modal) modal.classList.remove("visible");
  document.body.style.overflow = "";
}

/* ── VRT — Soumettre ── */
async function vrtSubmitConfig() {
  const username   = (document.getElementById("vrtUsername")?.value   || "").trim();
  const serverLink = (document.getElementById("vrtServerLink")?.value || "").trim();
  const message    = (document.getElementById("vrtMessage")?.value    || "").trim();
  const themes     = [...vrtSelectedThemes];

  /* Validation */
  if (!username)        { vrtShowAlert("Le pseudo Discord est requis.");          return; }
  if (!serverLink)      { vrtShowAlert("Le lien ou l'ID du serveur est requis."); return; }
  if (!themes.length)   { vrtShowAlert("Sélectionnez au moins un type de serveur."); return; }

  const btn = document.getElementById("vrtSubmitBtn");
  if (btn) { btn.textContent = "⏳ Envoi…"; btn.disabled = true; }

  try {
    /* Labels lisibles des thèmes choisis */
    const themeLabels = themes
      .map(id => VRT_SERVER_THEMES.find(t => t.id === id)?.label ?? id)
      .join("\n");

    const payload = {
      username:   "Vocal Rank Tracker — Config",
      avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
      embeds: [{
        title:       "🎙️ Nouvelle configuration serveur",
        color:       0x5865F2,
        fields: [
          {
            name:   "👤 Pseudo Discord",
            value:  username,
            inline: true,
          },
          {
            name:   "🆔 User ID",
            value:  currentUserData?.id ?? "Inconnu",
            inline: true,
          },
          {
            name:   "🏠 Serveur",
            value:  serverLink,
            inline: false,
          },
          {
            name:   `🏷️ Type${themes.length > 1 ? "s" : ""} de serveur (${themes.length})`,
            value:  themeLabels,
            inline: false,
          },
          ...(message ? [{
            name:   "💬 Message",
            value:  message.slice(0, 1024),
            inline: false,
          }] : []),
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "ToolsHub — Vocal Rank Tracker" },
      }]
    };

    const res = await fetch(VRT_WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Webhook ${res.status}`);

    if (btn) btn.textContent = "✅ Envoyé !";
    setTimeout(() => {
      closeVrtConfigModal();
    }, 1500);

  } catch (err) {
    console.error("[vrt webhook]", err);
    vrtShowAlert("Erreur lors de l'envoi. Vérifiez l'URL du webhook.");
    if (btn) { btn.textContent = "📨 Envoyer la configuration"; btn.disabled = false; }
  }
}

function vrtShowAlert(message) {
  const alertEl = document.getElementById("vrtFormAlert");
  if (!alertEl) return;
  alertEl.textContent = message;
  alertEl.classList.add("visible");
}

/* ══════════════════════════════════════════════════════
   DMALL — PAGE INTÉGRÉE
══════════════════════════════════════════════════════ */

function openDmallPage() {
  document.getElementById("dashMainContent").style.display = "none";

  let page = document.getElementById("dmallInlinePage");
  if (!page) {
    page    = document.createElement("div");
    page.id = "dmallInlinePage";
    page.innerHTML = buildDmallPageHTML();
    document.getElementById("dashContent").appendChild(page);
  } else {
    page.style.display = "";
  }

  dmallResetUiState();
  setTimeout(() => dmallConnectWs(), 0);
}

function closeDmallPage() {
  if (dmallReconnectTimer) {
    clearTimeout(dmallReconnectTimer);
    dmallReconnectTimer = null;
  }

  if (dmallWs && !dmallRunning) {
    dmallWs.onclose = null;
    dmallWs.close();
    dmallWs = null;
  }

  const page = document.getElementById("dmallInlinePage");
  if (page) page.style.display = "none";

  document.getElementById("dashMainContent").style.display = "";

  document.querySelectorAll(".dash-side-btn").forEach(b => b.classList.remove("active"));
  document.querySelector(".dash-side-btn[onclick=\"showTab('purchases')\"]")
    ?.classList.add("active");

  document.querySelectorAll(".dash-tab").forEach(t => t.classList.remove("active"));
  document.getElementById("tab-purchases")?.classList.add("active");
}

function buildDmallPageHTML() {
  return `
    <div class="dmall-page">

      <div class="dmall-page-header">
        <div class="dmall-page-title">
          <span class="dmall-page-icon">📨</span>
          <div>
            <h2>DMall</h2>
            <p>Envoi automatique de messages privés</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span class="dmall-dot" id="dmallDot" title="Statut WebSocket"></span>
          <button class="btn-tool dmall-back-btn" onclick="closeDmallPage()">← Retour à mes outils</button>
        </div>
      </div>

      <div id="dmallAlert" class="dmall-alert"></div>

      <div id="dmallCpBanner" class="dmall-cp-banner">
        <span class="dmall-cp-text">💾 Une session précédente a été trouvée.</span>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn-tool primary" onclick="dmallResume()">▶ Reprendre</button>
          <button class="btn-tool"         onclick="dmallDiscardCp()">✕ Ignorer</button>
        </div>
      </div>

      <div id="dmallFormSection" class="dmall-form-section">

        <div class="dmall-block dmall-block-full">
          <label class="dmall-label">Mode d'envoi</label>
          <div class="dmall-mode-row">
            <button class="dmall-mode-btn active" data-mode="friends" onclick="dmallSetMode('friends')">👥 Amis</button>
            <button class="dmall-mode-btn"        data-mode="guild"   onclick="dmallSetMode('guild')">🏠 Serveur</button>
            <button class="dmall-mode-btn"        data-mode="bot"     onclick="dmallSetMode('bot')">🤖 Bot</button>
          </div>
        </div>

        <div id="dmallGuildRow" class="dmall-block dmall-block-full hidden">
          <label class="dmall-label">ID du serveur</label>
          <input class="dmall-input" type="text" id="dmallGuildId" placeholder="Ex : 123456789012345678"/>
        </div>

        <div class="dmall-block">
          <label class="dmall-label">Tokens Discord <span class="dmall-hint">— un par ligne</span></label>
          <textarea class="dmall-textarea" id="dmallTokens" rows="7"
            placeholder="Token1&#10;Token2&#10;..."></textarea>
        </div>

        <div class="dmall-block">
          <label class="dmall-label">Message <span class="dmall-hint">— {username} et {server} disponibles</span></label>
          <textarea class="dmall-textarea" id="dmallTemplate" rows="7"
            placeholder="Bonjour {username}, ..."></textarea>
        </div>

        <div class="dmall-block">
          <label class="dmall-label">Blacklist <span class="dmall-hint">— IDs à ignorer, un par ligne</span></label>
          <textarea class="dmall-textarea" id="dmallBlacklist" rows="4"
            placeholder="123456789012345678&#10;..."></textarea>
        </div>

        <div class="dmall-block">
          <label class="dmall-label">Délai entre envois <span class="dmall-hint">— ms (min 500)</span></label>
          <input class="dmall-input dmall-input-sm" type="number" id="dmallDelay"
            value="1500" min="500" step="100"/>
        </div>

        <div class="dmall-block-full dmall-actions">
          <button class="btn-primary" onclick="dmallStart()">🚀 Lancer l'envoi</button>
        </div>
      </div>

      <div id="dmallProgSection" class="dmall-prog-section">
        <div class="dmall-stats-row">
          <div class="dmall-stat">
            <span class="dmall-stat-label">Envoyés</span>
            <span class="dmall-stat-value" id="dmallSentCnt">0</span>
          </div>
          <div class="dmall-stat">
            <span class="dmall-stat-label">Échecs</span>
            <span class="dmall-stat-value dmall-stat-fail" id="dmallFailCnt">0</span>
          </div>
          <div class="dmall-stat">
            <span class="dmall-stat-label">Progression</span>
            <span class="dmall-stat-value" id="dmallProgLabel">0 / 0</span>
          </div>
          <div class="dmall-stat">
            <span class="dmall-stat-label">Pourcentage</span>
            <span class="dmall-stat-value" id="dmallProgPct">0%</span>
          </div>
        </div>

        <div class="dmall-bar-wrap">
          <div class="dmall-bar" id="dmallBar"></div>
        </div>

        <div class="dmall-time-row">
          <span id="dmallEta">ETA : —</span>
          <span id="dmallElapsed">0s écoulé</span>
        </div>

        <div id="dmallConsole" class="dmall-console"></div>

        <div class="dmall-actions" style="margin-top:8px">
          <button class="btn-tool" onclick="dmallStop()">⏹ Stop</button>
          <button class="btn-tool" onclick="dmallReset()">🔄 Reset</button>
        </div>
      </div>

      <div id="dmallDoneSection" class="dmall-done-section">
        <div class="dmall-done-icon">✅</div>
        <p class="dmall-done-text">Envoi terminé avec succès !</p>
        <div style="display:flex;gap:20px;justify-content:center;margin:4px 0 16px">
          <div class="dmall-stat" style="min-width:100px;text-align:center">
            <span class="dmall-stat-label">Envoyés</span>
            <span class="dmall-stat-value" id="dmallDoneSent">0</span>
          </div>
          <div class="dmall-stat" style="min-width:100px;text-align:center">
            <span class="dmall-stat-label">Échecs</span>
            <span class="dmall-stat-value dmall-stat-fail" id="dmallDoneFailed">0</span>
          </div>
        </div>
        <button class="btn-primary" onclick="dmallReset()">🔄 Nouvel envoi</button>
      </div>

    </div>`;
}

/* ══════════════════════════════════
   DMALL — WEBSOCKET
══════════════════════════════════ */
function dmallConnectWs() {
  if (dmallWs && (
    dmallWs.readyState === WebSocket.OPEN ||
    dmallWs.readyState === WebSocket.CONNECTING
  )) return;

  const proto = location.protocol === "https:" ? "wss" : "ws";
  dmallWs     = new WebSocket(`${proto}://${location.host}/ws/dmall`);

  dmallWs.onopen = () => {
    dmallSetDot(true);
    dmallLog("🔌 Connexion WebSocket établie.", "info");
    if (dmallReconnectTimer) {
      clearTimeout(dmallReconnectTimer);
      dmallReconnectTimer = null;
    }
  };

  dmallWs.onclose = (event) => {
    dmallSetDot(false);
    dmallRunning = false;
    dmallStopElapsed();
    dmallLog(`🔌 WebSocket déconnecté (code: ${event.code}).`, "info");
    dmallWs = null;

    const page = document.getElementById("dmallInlinePage");
    if (page && page.style.display !== "none" && event.code !== 4001 && event.code !== 4003) {
      dmallLog("🔄 Reconnexion dans 3s…", "info");
      dmallReconnectTimer = setTimeout(() => {
        dmallReconnectTimer = null;
        const pageStillOpen = document.getElementById("dmallInlinePage");
        if (pageStillOpen && pageStillOpen.style.display !== "none") dmallConnectWs();
      }, 3000);
    }

    if (event.code === 4001) dmallShowError("Session expirée — reconnectez-vous.");
    if (event.code === 4003) dmallShowError("Licence DMall requise pour utiliser cette fonctionnalité.");
  };

  dmallWs.onerror = () => dmallLog("⚠️ Erreur WebSocket.", "error");

  dmallWs.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    dmallHandleMessage(msg);
  };
}

function dmallWsSend(data) {
  if (dmallWs && dmallWs.readyState === WebSocket.OPEN) {
    dmallWs.send(JSON.stringify(data)); return;
  }
  if (dmallWs && dmallWs.readyState === WebSocket.CONNECTING) {
    dmallLog("⏳ Connexion en cours, attente…", "info");
    _dmallWaitAndSend(data, 0); return;
  }
  dmallLog("🔄 Reconnexion au WebSocket…", "info");
  dmallConnectWs();
  _dmallWaitAndSend(data, 0);
}

function _dmallWaitAndSend(data, tries) {
  if (tries >= 50) { dmallShowError("Impossible de se connecter au serveur DMall."); return; }
  setTimeout(() => {
    if (dmallWs && dmallWs.readyState === WebSocket.OPEN) dmallWs.send(JSON.stringify(data));
    else _dmallWaitAndSend(data, tries + 1);
  }, 100);
}

/* ══════════════════════════════════
   DMALL — HANDLER MESSAGES
══════════════════════════════════ */
function dmallHandleMessage(msg) {
  switch (msg.type) {

    case "auth":
      if (!msg.valid) dmallShowError("Accès refusé — licence DMall requise ou session expirée.");
      break;

    case "checkpoint_available": {
      const banner = document.getElementById("dmallCpBanner");
      const text   = banner?.querySelector(".dmall-cp-text");
      if (text)   text.textContent = `💾 Session précédente trouvée — ${msg.processed}/${msg.total} traités.`;
      if (banner) banner.classList.add("visible");
      break;
    }

    case "checkpoint_cleared":
      document.getElementById("dmallCpBanner")?.classList.remove("visible");
      break;

    case "connected":
      dmallLog(`🔌 Compte connecté : ${msg.user}`, "info");
      break;

    case "status":
      dmallLog(`ℹ️ ${msg.text}`, "info");
      break;

    case "targets":
      dmallLog(`🎯 ${msg.count} cible(s) à traiter sur ${msg.total} au total.`, "info");
      document.getElementById("dmallFormSection")?.classList.add("hidden");
      document.getElementById("dmallProgSection")?.classList.add("visible");
      { const el = document.getElementById("dmallProgLabel"); if (el) el.textContent = `0 / ${msg.total}`; }
      dmallStartTime = Date.now();
      dmallStartElapsed();
      break;

    case "progress": {
      const { current, total, tag, status, reason, tokenIdx } = msg;
      const pct = total > 0 ? Math.round((current / total) * 100) : 0;
      const elLabel = document.getElementById("dmallProgLabel");
      const elPct   = document.getElementById("dmallProgPct");
      const elBar   = document.getElementById("dmallBar");
      if (elLabel) elLabel.textContent = `${current} / ${total}`;
      if (elPct)   elPct.textContent   = `${pct}%`;
      if (elBar)   elBar.style.width   = `${pct}%`;
      if (dmallStartTime && current > 0) {
        const elapsed = (Date.now() - dmallStartTime) / 1000;
        const rate    = current / elapsed;
        const eta     = rate > 0 ? Math.ceil((total - current) / rate) : 0;
        const etaEl   = document.getElementById("dmallEta");
        if (etaEl) etaEl.textContent = `ETA : ${dmallFmtTime(eta)}`;
      }
      if (status === "sent") {
        const cnt = document.getElementById("dmallSentCnt");
        if (cnt) cnt.textContent = String(parseInt(cnt.textContent || "0") + 1);
        dmallLog(`✅ [Token ${(tokenIdx ?? 0) + 1}] ${tag}`, "success");
      } else {
        const cnt = document.getElementById("dmallFailCnt");
        if (cnt) cnt.textContent = String(parseInt(cnt.textContent || "0") + 1);
        dmallLog(`❌ ${tag} — ${reason ?? "Erreur inconnue"}`, "error");
      }
      break;
    }

    case "stopped":
      dmallRunning = false;
      dmallStopElapsed();
      dmallLog("⏹ Envoi arrêté. Checkpoint sauvegardé.", "info");
      break;

    case "done":
      dmallRunning = false;
      dmallStopElapsed();
      document.getElementById("dmallProgSection")?.classList.remove("visible");
      {
        const doneSection = document.getElementById("dmallDoneSection");
        if (doneSection) {
          const s = document.getElementById("dmallDoneSent");
          const f = document.getElementById("dmallDoneFailed");
          if (s) s.textContent = String(msg.sent   ?? 0);
          if (f) f.textContent = String(msg.failed ?? 0);
          doneSection.classList.add("visible");
        }
      }
      dmallLog(`✅ Terminé — ${msg.sent} envoyés, ${msg.failed} échecs.`, "success");
      break;

    case "error":
      dmallShowError(msg.text ?? "Erreur inconnue.");
      dmallRunning = false;
      dmallStopElapsed();
      break;
  }
}

/* ══════════════════════════════════
   DMALL — ACTIONS
══════════════════════════════════ */
function dmallStart() {
  const tokensRaw = (document.getElementById("dmallTokens")?.value   || "").trim();
  const template  = (document.getElementById("dmallTemplate")?.value || "").trim();
  const delayVal  = Number(document.getElementById("dmallDelay")?.value) || 1500;
  const guildId   = (document.getElementById("dmallGuildId")?.value  || "").trim();
  const blackRaw  = (document.getElementById("dmallBlacklist")?.value || "").trim();

  if (!tokensRaw)     { dmallShowError("Ajoutez au moins un token.");        return; }
  if (!template)      { dmallShowError("Le message ne peut pas être vide."); return; }
  if (delayVal < 500) { dmallShowError("Le délai minimum est 500 ms.");      return; }
  if ((dmallMode === "guild" || dmallMode === "bot") && !guildId)
    { dmallShowError("Entrez l'ID du serveur."); return; }

  const tokens    = tokensRaw.split("\n").map(t => t.trim()).filter(Boolean);
  const blacklist = blackRaw  ? blackRaw.split("\n").map(t => t.trim()).filter(Boolean) : [];

  if (!tokens.length) { dmallShowError("Aucun token valide trouvé."); return; }

  const alertEl = document.getElementById("dmallAlert");
  if (alertEl) { alertEl.textContent = ""; alertEl.classList.remove("visible"); }

  if (dmallRunning) { dmallShowError("Un envoi est déjà en cours."); return; }

  dmallRunning = true;
  dmallWsSend({ action: "start", mode: dmallMode, guildId: guildId || null,
    tokens, blacklist, template, delayMs: delayVal });
}

function dmallStop()  { if (!dmallRunning) return; dmallWsSend({ action: "stop" }); dmallLog("⏹ Arrêt demandé…", "info"); }
function dmallReset() { dmallRunning = false; dmallStopElapsed(); dmallResetUiState(); }

function dmallResume() {
  if (dmallRunning) return;
  dmallRunning = true;
  dmallWsSend({ action: "resume" });
  document.getElementById("dmallCpBanner")?.classList.remove("visible");
  document.getElementById("dmallFormSection")?.classList.add("hidden");
  document.getElementById("dmallProgSection")?.classList.add("visible");
  dmallStartTime = Date.now();
  dmallStartElapsed();
}

function dmallDiscardCp() {
  dmallWsSend({ action: "clear_checkpoint" });
  document.getElementById("dmallCpBanner")?.classList.remove("visible");
}

/* ══════════════════════════════════
   DMALL — HELPERS UI
══════════════════════════════════ */
function dmallResetUiState() {
  const alertEl = document.getElementById("dmallAlert");
  if (alertEl) { alertEl.textContent = ""; alertEl.classList.remove("visible"); }

  document.getElementById("dmallCpBanner")?.classList.remove("visible");
  document.getElementById("dmallFormSection")?.classList.remove("hidden");
  document.getElementById("dmallProgSection")?.classList.remove("visible");
  document.getElementById("dmallDoneSection")?.classList.remove("visible");

  const consoleEl = document.getElementById("dmallConsole");
  if (consoleEl) consoleEl.innerHTML = "";

  const resetMap = {
    dmallSentCnt: "0", dmallFailCnt: "0", dmallProgLabel: "0 / 0",
    dmallProgPct: "0%", dmallEta: "ETA : —", dmallElapsed: "0s écoulé",
  };
  Object.entries(resetMap).forEach(([id, val]) => {
    const el = document.getElementById(id); if (el) el.textContent = val;
  });

  const bar = document.getElementById("dmallBar");
  if (bar) bar.style.width = "0%";

  dmallMode = "friends";
  document.querySelectorAll(".dmall-mode-btn").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.mode === "friends"));
  document.getElementById("dmallGuildRow")?.classList.add("hidden");
}

function dmallSetMode(mode) {
  dmallMode = mode;
  document.querySelectorAll(".dmall-mode-btn").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.mode === mode));
  document.getElementById("dmallGuildRow")
    ?.classList.toggle("hidden", mode !== "guild" && mode !== "bot");
}

function dmallShowError(message) {
  const alertEl = document.getElementById("dmallAlert");
  if (!alertEl) { window.alert(message); return; }
  alertEl.textContent = message;
  alertEl.classList.add("visible");
}

function dmallSetDot(connected) {
  document.getElementById("dmallDot")?.classList.toggle("connected", connected);
}

function dmallLog(text, type = "info") {
  const con = document.getElementById("dmallConsole");
  if (!con) return;
  const line = document.createElement("div");
  line.className   = `dmall-log-${type}`;
  line.textContent = `[${new Date().toLocaleTimeString("fr-FR")}] ${text}`;
  con.appendChild(line);
  con.scrollTop = con.scrollHeight;
}

function dmallFmtTime(seconds) {
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function dmallStartElapsed() {
  dmallStopElapsed();
  dmallElapsedInterval = setInterval(() => {
    if (!dmallStartTime) return;
    const secs = Math.floor((Date.now() - dmallStartTime) / 1000);
    const el   = document.getElementById("dmallElapsed");
    if (el) el.textContent = `${dmallFmtTime(secs)} écoulé`;
  }, 1000);
}

function dmallStopElapsed() {
  if (dmallElapsedInterval) { clearInterval(dmallElapsedInterval); dmallElapsedInterval = null; }
  dmallStartTime = null;
}

/* ══════════════════════════════════
   ADMIN — LOAD DATA
══════════════════════════════════ */
async function loadAdminData() {
  await Promise.all([loadAdminStats(), loadAdminRecentUsers()]);
}

async function loadAdminStats() {
  try {
    const res  = await fetch("/api/admin/stats", { credentials: "include" });
    const data = await res.json();
    document.getElementById("statUsers").textContent     = data.totalUsers     ?? "—";
    document.getElementById("statPurchases").textContent = data.totalPurchases ?? "—";
    document.getElementById("statRevenue").textContent   = data.revenue ? `${data.revenue}€` : "—";
  } catch { console.error("Erreur chargement stats admin"); }
}

async function loadAdminRecentUsers() {
  const list = document.getElementById("adminRecentList");
  if (!list) return;
  try {
    const res   = await fetch("/api/admin/users", { credentials: "include" });
    const data  = await res.json();
    const users = (data.users || []).slice(0, 5);
    if (!users.length) { list.innerHTML = `<div class="admin-loading">Aucun utilisateur.</div>`; return; }
    list.innerHTML = users.map(u => {
      const avatarUrl = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      const joinDate  = new Date(u.createdAt).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
      const toolCount = u.purchases?.length || 0;
      return `
        <div class="admin-user-row">
          <img class="admin-user-avatar" src="${avatarUrl}" alt="${u.username}"/>
          <div class="admin-user-info">
            <div class="admin-user-name">${u.username}</div>
            <div class="admin-user-meta">ID : ${u.id} · Inscrit le ${joinDate}</div>
          </div>
          <div class="admin-user-right">
            <div class="admin-user-tools">🧰 ${toolCount} outil${toolCount > 1 ? "s" : ""}</div>
          </div>
          <button class="btn-tool primary" onclick="openAdminUserModal('${u.id}')">✏️ Gérer</button>
        </div>`;
    }).join("");
  } catch {
    list.innerHTML = `<div class="admin-loading" style="color:#f87171">Erreur de chargement.</div>`;
  }
}

async function loadAdminUsers() {
  const list = document.getElementById("adminUsersList");
  if (!list) return;
  list.innerHTML = `<div class="admin-loading">⏳ Chargement des utilisateurs…</div>`;
  try {
    const res   = await fetch("/api/admin/users", { credentials: "include" });
    const data  = await res.json();
    const users = data.users || [];
    if (!users.length) { list.innerHTML = `<div class="admin-loading">Aucun utilisateur enregistré.</div>`; return; }
    list.innerHTML = users.map(u => {
      const avatarUrl  = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      const toolCount  = u.purchases?.length || 0;
      const joinDate   = new Date(u.createdAt).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
      const totalSpent = (u.purchases || []).reduce((s, p) => s + (p.price || 0), 0);
      return `
        <div class="admin-user-row" data-username="${u.username.toLowerCase()}" data-id="${u.id}">
          <img class="admin-user-avatar" src="${avatarUrl}" alt="${u.username}"/>
          <div class="admin-user-info">
            <div class="admin-user-name">
              ${u.username}
              ${u.adminNote ? `<span class="admin-note-badge" title="${u.adminNote}">📝</span>` : ""}
            </div>
            <div class="admin-user-meta">ID : ${u.id} · Inscrit le ${joinDate}</div>
          </div>
          <div class="admin-user-right">
            <div class="admin-user-tools">🧰 ${toolCount} outil${toolCount > 1 ? "s" : ""}</div>
            <div class="admin-user-spent">${totalSpent === 0 ? "Gratuit" : `${totalSpent.toFixed(2)}€`}</div>
          </div>
          <button class="btn-tool primary" onclick="openAdminUserModal('${u.id}')">✏️ Gérer</button>
        </div>`;
    }).join("");
  } catch {
    list.innerHTML = `<div class="admin-loading" style="color:#f87171">Erreur lors du chargement.</div>`;
  }
}

async function loadAdminLicenses() {
  const list = document.getElementById("adminLicensesList");
  if (!list) return;
  list.innerHTML = `<div class="admin-loading">⏳ Chargement des licences…</div>`;
  try {
    const res   = await fetch("/api/admin/users", { credentials: "include" });
    const data  = await res.json();
    const users = data.users || [];
    const allLicenses = [];
    users.forEach(u => (u.purchases || []).forEach(p => allLicenses.push({ user: u, purchase: p })));
    if (!allLicenses.length) { list.innerHTML = `<div class="admin-loading">Aucune licence active.</div>`; return; }
    list.innerHTML = allLicenses.map(({ user: u, purchase: p }) => {
      const avatarUrl = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      const tool  = TOOLS_CATALOG[p.toolId] || { name: p.toolName, icon: "🔧" };
      const date  = new Date(p.purchasedAt).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
      const price = p.price === 0 ? "Gratuit" : `${p.price}€/mois`;
      return `
        <div class="admin-user-row">
          <img class="admin-user-avatar" src="${avatarUrl}" alt="${u.username}"/>
          <div class="admin-user-info">
            <div class="admin-user-name">${tool.icon} ${tool.name}</div>
            <div class="admin-user-meta">${u.username} · ID : ${u.id} · Depuis le ${date}</div>
          </div>
          <div class="admin-user-right">
            <div class="admin-user-spent">${price}</div>
            <span class="billing-badge">Actif</span>
          </div>
          <button class="btn-tool" style="color:#f87171;border-color:rgba(248,113,113,0.4)"
            onclick="adminRevokeLicenseFromList('${u.id}', '${p.toolId}')">🚫 Révoquer</button>
        </div>`;
    }).join("");
  } catch {
    list.innerHTML = `<div class="admin-loading" style="color:#f87171">Erreur lors du chargement.</div>`;
  }
}

async function adminRevokeLicenseFromList(userId, toolId) {
  const toolName = TOOLS_CATALOG[toolId]?.name || toolId;
  if (!confirm(`Révoquer "${toolName}" ?`)) return;
  try {
    const res = await fetch(`/api/admin/users/${userId}/purchase/${toolId}`,
      { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error();
    showAdminToast(`✅ Licence "${toolName}" révoquée.`);
    await loadAdminLicenses();
    await loadAdminStats();
  } catch { showAdminToast("Erreur lors de la révocation.", "error"); }
}

/* ══════════════════════════════════
   ADMIN — MODAL UTILISATEUR
══════════════════════════════════ */
async function openAdminUserModal(userId) {
  try {
    const res  = await fetch("/api/admin/users", { credentials: "include" });
    const data = await res.json();
    const user = (data.users || []).find(u => u.id === userId);
    if (!user) return;
    currentAdminUser = user;
    const avatarUrl  = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;
    document.getElementById("adminModalAvatar").src            = avatarUrl;
    document.getElementById("adminModalUsername").textContent  = user.username;
    document.getElementById("adminModalId").textContent        = `ID : ${user.id}`;
    document.getElementById("adminModalEmail").textContent     = user.email || "Non renseigné";
    document.getElementById("adminModalCreatedAt").textContent = new Date(user.createdAt)
      .toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
    document.getElementById("adminModalNote").value            = user.adminNote || "";
    renderAdminModalTools(user);
    document.getElementById("adminUserModal").classList.add("visible");
    document.body.style.overflow = "hidden";
  } catch { showAdminToast("Erreur lors du chargement de l'utilisateur.", "error"); }
}

function closeAdminUserModal() {
  document.getElementById("adminUserModal").classList.remove("visible");
  document.body.style.overflow = "";
  currentAdminUser = null;
}

function renderAdminModalTools(user) {
  const container  = document.getElementById("adminModalTools");
  const purchases  = user.purchases || [];
  document.getElementById("adminModalToolCount").textContent  = `${purchases.length} outil(s)`;
  const totalSpent = purchases.reduce((s, p) => s + (p.price || 0), 0);
  document.getElementById("adminModalTotalSpent").textContent =
    totalSpent === 0 ? "Gratuit" : `${totalSpent.toFixed(2)}€`;
  if (!purchases.length) {
    container.innerHTML = `<div class="modal-tools-empty"><p>Aucune licence active.</p></div>`; return;
  }
  container.innerHTML = purchases.map(p => {
    const tool  = TOOLS_CATALOG[p.toolId] || { name: p.toolName, icon: "🔧" };
    const date  = new Date(p.purchasedAt).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" });
    const price = p.price === 0 ? "Gratuit" : `${p.price}€/mois`;
    return `
      <div class="modal-tool-row" id="admin-tool-row-${p.toolId}">
        <div class="modal-tool-left">
          <span class="modal-tool-icon">${tool.icon}</span>
          <div>
            <div class="modal-tool-name">${tool.name}</div>
            <div style="font-size:0.72rem;color:var(--muted)">Depuis le ${date} · ${price}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="billing-badge">Actif</span>
          <button class="btn-tool" style="color:#f87171;border-color:rgba(248,113,113,0.4)"
            onclick="adminRevokeLicense('${p.toolId}')">🚫 Révoquer</button>
        </div>
      </div>`;
  }).join("");
}

/* ══════════════════════════════════
   ADMIN — ACTIONS
══════════════════════════════════ */
async function adminRevokeLicense(toolId) {
  if (!currentAdminUser) return;
  const toolName = TOOLS_CATALOG[toolId]?.name || toolId;
  if (!confirm(`Révoquer "${toolName}" pour ${currentAdminUser.username} ?`)) return;
  try {
    const res = await fetch(`/api/admin/users/${currentAdminUser.id}/purchase/${toolId}`,
      { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error();
    currentAdminUser.purchases = currentAdminUser.purchases.filter(p => p.toolId !== toolId);
    renderAdminModalTools(currentAdminUser);
    await loadAdminStats();
    showAdminToast(`✅ Licence "${toolName}" révoquée.`);
  } catch { showAdminToast("Erreur lors de la révocation.", "error"); }
}

async function adminRevokeAllLicenses() {
  if (!currentAdminUser) return;
  if (!currentAdminUser.purchases.length) { showAdminToast("Cet utilisateur n'a aucune licence.", "error"); return; }
  if (!confirm(`Révoquer TOUTES les licences de ${currentAdminUser.username} ?`)) return;
  try {
    await Promise.all(currentAdminUser.purchases.map(p =>
      fetch(`/api/admin/users/${currentAdminUser.id}/purchase/${p.toolId}`,
        { method: "DELETE", credentials: "include" })
    ));
    currentAdminUser.purchases = [];
    renderAdminModalTools(currentAdminUser);
    await loadAdminStats();
    showAdminToast(`✅ Toutes les licences de ${currentAdminUser.username} révoquées.`);
  } catch { showAdminToast("Erreur lors de la révocation.", "error"); }
}

async function adminAddTool() {
  if (!currentAdminUser) return;
  const select = document.getElementById("adminAddToolSelect");
  const value  = select.value;
  if (!value) { showAdminToast("Sélectionnez un outil.", "error"); return; }
  const [toolId, toolName, priceStr] = value.split("|");
  const price = parseFloat(priceStr);
  if (currentAdminUser.purchases.find(p => p.toolId === toolId)) {
    showAdminToast(`${toolName} est déjà actif pour cet utilisateur.`, "error"); return;
  }
  try {
    const res = await fetch(`/api/admin/users/${currentAdminUser.id}/purchase`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId, toolName, price })
    });
    if (!res.ok) throw new Error();
    currentAdminUser.purchases.push({ toolId, toolName, price, purchasedAt: new Date().toISOString() });
    renderAdminModalTools(currentAdminUser);
    select.value = "";
    await loadAdminStats();
    showAdminToast(`✅ Licence "${toolName}" ajoutée à ${currentAdminUser.username}.`);
  } catch { showAdminToast("Erreur lors de l'ajout.", "error"); }
}

async function adminDeleteUser() {
  if (!currentAdminUser) return;
  if (!confirm(`⚠️ Supprimer définitivement le compte de ${currentAdminUser.username} ?\nCette action est irréversible.`)) return;
  try {
    const res = await fetch(`/api/admin/users/${currentAdminUser.id}`,
      { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const err = await res.json();
      showAdminToast(err.error || "Erreur lors de la suppression.", "error"); return;
    }
    const username = currentAdminUser.username;
    closeAdminUserModal();
    showAdminToast(`🗑️ Utilisateur "${username}" supprimé.`);
    await loadAdminData();
    await loadAdminUsers();
  } catch { showAdminToast("Erreur lors de la suppression.", "error"); }
}

async function adminSaveNote() {
  if (!currentAdminUser) return;
  const note = document.getElementById("adminModalNote").value.trim();
  try {
    const res = await fetch(`/api/admin/users/${currentAdminUser.id}/note`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note })
    });
    if (!res.ok) throw new Error();
    currentAdminUser.adminNote = note;
    const row  = document.querySelector(`.admin-user-row[data-id="${currentAdminUser.id}"]`);
    const name = row?.querySelector(".admin-user-name");
    if (name) {
      const existing = name.querySelector(".admin-note-badge");
      if (note && !existing)
        name.insertAdjacentHTML("beforeend", `<span class="admin-note-badge" title="${note}">📝</span>`);
      else if (!note && existing) existing.remove();
      else if (note && existing)  existing.title = note;
    }
    showAdminToast("📝 Note sauvegardée.");
  } catch { showAdminToast("Erreur lors de la sauvegarde.", "error"); }
}

/* ══════════════════════════════════
   ADMIN — RECHERCHE
══════════════════════════════════ */
function filterAdminUsers() {
  const query = document.getElementById("adminSearchInput").value.toLowerCase().trim();
  document.querySelectorAll(".admin-user-row").forEach(row => {
    const name = row.dataset.username || "";
    const id   = row.dataset.id       || "";
    row.style.display = (name.includes(query) || id.includes(query)) ? "" : "none";
  });
}

/* ══════════════════════════════════
   ADMIN — TOAST
══════════════════════════════════ */
function showAdminToast(message, type = "success") {
  const existing = document.getElementById("adminToast");
  if (existing) existing.remove();
  const toast       = document.createElement("div");
  toast.id          = "adminToast";
  toast.className   = `admin-toast${type === "error" ? " admin-toast-error" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("admin-toast-visible"));
  setTimeout(() => {
    toast.classList.remove("admin-toast-visible");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ══════════════════════════════════
   SERVERS
══════════════════════════════════ */
async function loadServers() {
  if (serversLoaded) return;
  const container = document.getElementById("serversList");
  const empty     = document.getElementById("emptyServers");
  const loading   = document.getElementById("serversLoading");
  if (loading) loading.style.display = "flex";
  if (empty)   empty.classList.remove("visible");
  try {
    const res = await fetch("/api/servers", { credentials: "include" });
    if (res.status === 401) {
      if (loading) loading.style.display = "none";
      container.innerHTML = `
        <div class="dash-error-card">
          <p>Votre session Discord a expiré.</p>
          <a href="/auth/login" class="btn-primary">🔄 Se reconnecter</a>
        </div>`;
      return;
    }
    if (!res.ok) throw new Error("Erreur serveur");
    const servers = await res.json();
    serversCache  = servers;
    if (loading) loading.style.display = "none";
    if (!servers.length) {
      empty.classList.add("visible");
      container.style.display = "none";
      return;
    }
    container.style.display = "";
    container.innerHTML = servers.map(s => `
      <div class="server-card">
        <img class="server-icon"
          src="${s.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=5865F2&color=fff&size=128`}"
          alt="${s.name}"/>
        <div class="server-info">
          <h3 class="server-name">${s.name}</h3>
          <span class="server-id">ID : ${s.id}</span>
        </div>
        <button class="btn-tool primary" onclick="openServerModal('${s.id}')">⚙️ Configurer</button>
      </div>`).join("");
    serversLoaded = true;
  } catch (err) {
    console.error("Erreur chargement serveurs:", err);
    if (loading) loading.style.display = "none";
    container.innerHTML = `<p class="dash-error">Impossible de charger vos serveurs.</p>`;
  }
}

/* ══════════════════════════════════
   MODAL SERVEUR
══════════════════════════════════ */
function openServerModal(serverId) {
  const server = serversCache.find(s => s.id === serverId);
  if (!server) return;
  currentServer = server;
  document.getElementById("modalServerIcon").src         =
    server.icon || `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&background=5865F2&color=fff&size=128`;
  document.getElementById("modalServerName").textContent = server.name;
  document.getElementById("modalServerId").textContent   = `ID : ${server.id}`;
  const botClientId = Object.values(TOOLS_BOT_CONFIG)[0]?.botClientId || "REPLACE_BOT_CLIENT_ID";
  document.getElementById("modalInviteLink").href =
    `https://discord.com/oauth2/authorize?client_id=${botClientId}&permissions=8&scope=bot%20applications.commands&guild_id=${server.id}`;
  renderModalTools();
  document.getElementById("serverModal").classList.add("visible");
  document.body.style.overflow = "hidden";
}

function closeServerModal() {
  document.getElementById("serverModal").classList.remove("visible");
  document.body.style.overflow = "";
  currentServer = null;
}

function renderModalTools() {
  const container = document.getElementById("modalToolsList");
  if (!currentUserPurchases.length) {
    container.innerHTML = `
      <div class="modal-tools-empty">
        <p>Aucun outil souscrit. <a href="index.html">Voir le catalogue</a></p>
      </div>`;
    return;
  }
  container.innerHTML = currentUserPurchases.map(p => {
    const tool = TOOLS_CATALOG[p.toolId] || { name: p.toolName, icon: "🔧" };
    return `
      <div class="modal-tool-row">
        <div class="modal-tool-left">
          <span class="modal-tool-icon">${tool.icon}</span>
          <span class="modal-tool-name">${tool.name}</span>
        </div>
        <div class="modal-tool-right">
          <label class="modal-toggle">
            <input type="checkbox" checked data-tool-id="${p.toolId}"/>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>`;
  }).join("");
}

function saveServerConfig() {
  if (!currentServer) return;
  const config = {
    serverId:   currentServer.id,
    serverName: currentServer.name,
    prefix:     document.getElementById("settingPrefix").value,
    lang:       document.getElementById("settingLang").value,
    logChannel: document.getElementById("settingLogChannel").value,
    silent:     document.getElementById("settingSilent").checked,
    dmNotifs:   document.getElementById("settingDM").checked,
    tools:      {}
  };
  document.querySelectorAll("#modalToolsList input[data-tool-id]").forEach(input => {
    config.tools[input.dataset.toolId] = input.checked;
  });
  const btn  = document.querySelector("#serverModal .modal-footer .btn-primary");
  const orig = btn.textContent;
  btn.textContent         = "✅ Sauvegardé !";
  btn.style.pointerEvents = "none";
  setTimeout(() => { btn.textContent = orig; btn.style.pointerEvents = ""; }, 1500);
}

/* ══════════════════════════════════
   TABS
══════════════════════════════════ */
function showTab(tabName) {
  document.querySelectorAll(".dash-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".dash-side-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(`tab-${tabName}`)?.classList.add("active");
  document.querySelectorAll(".dash-side-btn").forEach(btn => {
    if (btn.getAttribute("onclick") === `showTab('${tabName}')`) btn.classList.add("active");
  });
  if (tabName === "servers")        loadServers();
  if (tabName === "admin")          loadAdminData();
  if (tabName === "admin-users")    loadAdminUsers();
  if (tabName === "admin-licenses") loadAdminLicenses();
}

/* ══════════════════════════════════
   EVENTS GLOBAUX
══════════════════════════════════ */
document.getElementById("serverModal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeServerModal();
});

document.getElementById("adminUserModal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeAdminUserModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeServerModal();
    closeAdminUserModal();
    closeVrtConfigModal();
  }
});

/* ══════════════════════════════════
   START
══════════════════════════════════ */
init();