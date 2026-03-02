/* ═══════════════════════════════════════
   DASHBOARD.JS — ToolsHub
═══════════════════════════════════════ */

const TOOLS_CATALOG = {
  "vocal-rank-tracker": { name: "Vocal Rank Tracker", icon: "🎙️", desc: "Classement de l'activité vocale en temps réel.",              category: "Analytics"  },
  "stats-dashboard":    { name: "Stats Dashboard",     icon: "📊", desc: "Tableau de bord analytics complet pour votre serveur.",       category: "Analytics"  },
  "dmall":              { name: "DMall",               icon: "📨", desc: "Envoi automatique de messages privés à tous les membres.",    category: "Tools"      },
  "ai-analyze":         { name: "AI-Analyze",          icon: "🤖", desc: "Analyse et modération intelligente par IA.",                 category: "Support"    },
  "roleguard":          { name: "RoleGuard",           icon: "🛡️", desc: "Sécurité et protection des rôles de votre serveur.",         category: "Engagement" },
  "blacklistguard":     { name: "BlacklistGuard",      icon: "🚫", desc: "Blacklist centralisée pour bannir les membres indésirables.", category: "Engagement" },
};

const TOOLS_BOT_CONFIG = {
  "vocal-rank-tracker": { botClientId: "REPLACE_BOT_CLIENT_ID_1", configurable: false },
  "dmall":              { botClientId: "REPLACE_BOT_CLIENT_ID_3", configurable: true },
  "ai-analyze":         { botClientId: "REPLACE_BOT_CLIENT_ID_4", configurable: true },
  "stats-dashboard":    { botClientId: "REPLACE_BOT_CLIENT_ID_5", configurable: true },
  "roleguard":          { botClientId: "REPLACE_BOT_CLIENT_ID_6", configurable: true },
  "blacklistguard":     { botClientId: "REPLACE_BOT_CLIENT_ID_7", configurable: true },
};

/* ══════════════════════════════════
   STATE GLOBAL
══════════════════════════════════ */
let currentServer        = null;
let currentUserPurchases = [];
let currentAdminUser     = null;
let serversLoaded        = false;
let serversCache         = [];

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
async function init() {
  const user = await fetchUser();
  if (!user) { window.location.href = "/"; return; }

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

  document.getElementById("dashAvatar").src              = avatarUrl;
  document.getElementById("dashUsername").textContent    = user.username;
  document.getElementById("settingsAvatar").src          = avatarUrl;
  document.getElementById("settingsUsername").textContent = user.username;
  document.getElementById("settingsEmail").textContent   = user.email || "Email non disponible";
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
            <button class="btn-tool primary">⚙️ Configurer</button>
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
    <button class="dash-side-btn admin-btn" onclick="showTab('admin')">
      📊 Vue d'ensemble
    </button>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin-users')">
      👥 Utilisateurs
    </button>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin-licenses')">
      🧰 Licences
    </button>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin-tools')">
      🧩 Articles
    </button>
    <button class="dash-side-btn admin-btn" onclick="showTab('admin-security')">
      🔒 Sécurité
    </button>
  `;
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
  } catch {
    console.error("Erreur chargement stats admin");
  }
}

async function loadAdminRecentUsers() {
  const list = document.getElementById("adminRecentList");
  if (!list) return;

  try {
    const res   = await fetch("/api/admin/users", { credentials: "include" });
    const data  = await res.json();
    const users = (data.users || []).slice(0, 5);

    if (!users.length) {
      list.innerHTML = `<div class="admin-loading">Aucun utilisateur.</div>`;
      return;
    }

    list.innerHTML = users.map(u => {
      const avatarUrl = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      const joinDate  = new Date(u.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric", month: "short", year: "numeric"
      });
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
          <button class="btn-tool primary" onclick="openAdminUserModal('${u.id}')">
            ✏️ Gérer
          </button>
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

    if (!users.length) {
      list.innerHTML = `<div class="admin-loading">Aucun utilisateur enregistré.</div>`;
      return;
    }

    list.innerHTML = users.map(u => {
      const avatarUrl = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      const toolCount  = u.purchases?.length || 0;
      const joinDate   = new Date(u.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric", month: "short", year: "numeric"
      });
      const totalSpent = (u.purchases || []).reduce((s, p) => s + (p.price || 0), 0);

      return `
        <div class="admin-user-row"
          data-username="${u.username.toLowerCase()}"
          data-id="${u.id}">
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
            <div class="admin-user-spent">
              ${totalSpent === 0 ? "Gratuit" : `${totalSpent.toFixed(2)}€`}
            </div>
          </div>
          <button class="btn-tool primary" onclick="openAdminUserModal('${u.id}')">
            ✏️ Gérer
          </button>
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
    users.forEach(u => {
      (u.purchases || []).forEach(p => {
        allLicenses.push({ user: u, purchase: p });
      });
    });

    if (!allLicenses.length) {
      list.innerHTML = `<div class="admin-loading">Aucune licence active.</div>`;
      return;
    }

    list.innerHTML = allLicenses.map(({ user: u, purchase: p }) => {
      const avatarUrl = u.avatar
        ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
      const tool  = TOOLS_CATALOG[p.toolId] || { name: p.toolName, icon: "🔧" };
      const date  = new Date(p.purchasedAt).toLocaleDateString("fr-FR", {
        day: "numeric", month: "short", year: "numeric"
      });
      const price = p.price === 0 ? "Gratuit" : `${p.price}€/mois`;

      return `
        <div class="admin-user-row">
          <img class="admin-user-avatar" src="${avatarUrl}" alt="${u.username}"/>
          <div class="admin-user-info">
            <div class="admin-user-name">${tool.icon} ${tool.name}</div>
            <div class="admin-user-meta">
              ${u.username} · ID : ${u.id} · Depuis le ${date}
            </div>
          </div>
          <div class="admin-user-right">
            <div class="admin-user-spent">${price}</div>
            <span class="billing-badge">Actif</span>
          </div>
          <button class="btn-tool"
            style="color:#f87171;border-color:rgba(248,113,113,0.4)"
            onclick="adminRevokeLicenseFromList('${u.id}', '${p.toolId}')">
            🚫 Révoquer
          </button>
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
    const res = await fetch(`/api/admin/users/${userId}/purchase/${toolId}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (!res.ok) throw new Error();
    showAdminToast(`✅ Licence "${toolName}" révoquée.`);
    await loadAdminLicenses();
    await loadAdminStats();
  } catch {
    showAdminToast("Erreur lors de la révocation.", "error");
  }
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

    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    document.getElementById("adminModalAvatar").src            = avatarUrl;
    document.getElementById("adminModalUsername").textContent  = user.username;
    document.getElementById("adminModalId").textContent        = `ID : ${user.id}`;
    document.getElementById("adminModalEmail").textContent     = user.email || "Non renseigné";
    document.getElementById("adminModalCreatedAt").textContent = new Date(user.createdAt)
      .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    document.getElementById("adminModalNote").value            = user.adminNote || "";

    renderAdminModalTools(user);

    document.getElementById("adminUserModal").classList.add("visible");
    document.body.style.overflow = "hidden";

  } catch {
    showAdminToast("Erreur lors du chargement de l'utilisateur.", "error");
  }
}

function closeAdminUserModal() {
  document.getElementById("adminUserModal").classList.remove("visible");
  document.body.style.overflow = "";
  currentAdminUser = null;
}

function renderAdminModalTools(user) {
  const container = document.getElementById("adminModalTools");
  const purchases = user.purchases || [];

  document.getElementById("adminModalToolCount").textContent =
    `${purchases.length} outil(s)`;
  const totalSpent = purchases.reduce((s, p) => s + (p.price || 0), 0);
  document.getElementById("adminModalTotalSpent").textContent =
    totalSpent === 0 ? "Gratuit" : `${totalSpent.toFixed(2)}€`;

  if (!purchases.length) {
    container.innerHTML = `<div class="modal-tools-empty"><p>Aucune licence active.</p></div>`;
    return;
  }

  container.innerHTML = purchases.map(p => {
    const tool  = TOOLS_CATALOG[p.toolId] || { name: p.toolName, icon: "🔧" };
    const date  = new Date(p.purchasedAt).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric"
    });
    const price = p.price === 0 ? "Gratuit" : `${p.price}€/mois`;

    return `
      <div class="modal-tool-row" id="admin-tool-row-${p.toolId}">
        <div class="modal-tool-left">
          <span class="modal-tool-icon">${tool.icon}</span>
          <div>
            <div class="modal-tool-name">${tool.name}</div>
            <div style="font-size:0.72rem;color:var(--muted)">
              Depuis le ${date} · ${price}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="billing-badge">Actif</span>
          <button class="btn-tool"
            style="color:#f87171;border-color:rgba(248,113,113,0.4)"
            onclick="adminRevokeLicense('${p.toolId}')">
            🚫 Révoquer
          </button>
        </div>
      </div>`;
  }).join("");
}

/* ══════════════════════════════════
   ADMIN — ACTIONS UTILISATEUR
══════════════════════════════════ */
async function adminRevokeLicense(toolId) {
  if (!currentAdminUser) return;
  const toolName = TOOLS_CATALOG[toolId]?.name || toolId;
  if (!confirm(`Révoquer "${toolName}" pour ${currentAdminUser.username} ?`)) return;

  try {
    const res = await fetch(
      `/api/admin/users/${currentAdminUser.id}/purchase/${toolId}`,
      { method: "DELETE", credentials: "include" }
    );
    if (!res.ok) throw new Error();

    currentAdminUser.purchases = currentAdminUser.purchases.filter(p => p.toolId !== toolId);
    renderAdminModalTools(currentAdminUser);
    await loadAdminStats();
    showAdminToast(`✅ Licence "${toolName}" révoquée.`);

  } catch {
    showAdminToast("Erreur lors de la révocation.", "error");
  }
}

async function adminRevokeAllLicenses() {
  if (!currentAdminUser) return;
  if (!currentAdminUser.purchases.length) {
    showAdminToast("Cet utilisateur n'a aucune licence.", "error");
    return;
  }
  if (!confirm(`Révoquer TOUTES les licences de ${currentAdminUser.username} ?`)) return;

  try {
    await Promise.all(
      currentAdminUser.purchases.map(p =>
        fetch(`/api/admin/users/${currentAdminUser.id}/purchase/${p.toolId}`, {
          method: "DELETE",
          credentials: "include"
        })
      )
    );
    currentAdminUser.purchases = [];
    renderAdminModalTools(currentAdminUser);
    await loadAdminStats();
    showAdminToast(`✅ Toutes les licences de ${currentAdminUser.username} révoquées.`);

  } catch {
    showAdminToast("Erreur lors de la révocation.", "error");
  }
}

async function adminAddTool() {
  if (!currentAdminUser) return;

  const select = document.getElementById("adminAddToolSelect");
  const value  = select.value;
  if (!value) { showAdminToast("Sélectionnez un outil.", "error"); return; }

  const [toolId, toolName, priceStr] = value.split("|");
  const price = parseFloat(priceStr);

  if (currentAdminUser.purchases.find(p => p.toolId === toolId)) {
    showAdminToast(`${toolName} est déjà actif pour cet utilisateur.`, "error");
    return;
  }

  try {
    const res = await fetch(`/api/admin/users/${currentAdminUser.id}/purchase`, {
      method:      "POST",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ toolId, toolName, price })
    });
    if (!res.ok) throw new Error();

    currentAdminUser.purchases.push({
      toolId, toolName, price,
      purchasedAt: new Date().toISOString()
    });

    renderAdminModalTools(currentAdminUser);
    select.value = "";
    await loadAdminStats();
    showAdminToast(`✅ Licence "${toolName}" ajoutée à ${currentAdminUser.username}.`);

  } catch {
    showAdminToast("Erreur lors de l'ajout.", "error");
  }
}

async function adminDeleteUser() {
  if (!currentAdminUser) return;
  if (!confirm(
    `⚠️ Supprimer définitivement le compte de ${currentAdminUser.username} ?\nCette action est irréversible.`
  )) return;

  try {
    const res = await fetch(`/api/admin/users/${currentAdminUser.id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) {
      const err = await res.json();
      showAdminToast(err.error || "Erreur lors de la suppression.", "error");
      return;
    }

    const username = currentAdminUser.username;
    closeAdminUserModal();
    showAdminToast(`🗑️ Utilisateur "${username}" supprimé.`);
    await loadAdminData();
    await loadAdminUsers();

  } catch {
    showAdminToast("Erreur lors de la suppression.", "error");
  }
}

async function adminSaveNote() {
  if (!currentAdminUser) return;
  const note = document.getElementById("adminModalNote").value.trim();

  try {
    const res = await fetch(`/api/admin/users/${currentAdminUser.id}/note`, {
      method:      "PATCH",
      credentials: "include",
      headers:     { "Content-Type": "application/json" },
      body:        JSON.stringify({ note })
    });
    if (!res.ok) throw new Error();

    currentAdminUser.adminNote = note;

    const row  = document.querySelector(`.admin-user-row[data-id="${currentAdminUser.id}"]`);
    const name = row?.querySelector(".admin-user-name");
    if (name) {
      const existing = name.querySelector(".admin-note-badge");
      if (note && !existing) {
        name.insertAdjacentHTML("beforeend",
          `<span class="admin-note-badge" title="${note}">📝</span>`);
      } else if (!note && existing) {
        existing.remove();
      } else if (note && existing) {
        existing.title = note;
      }
    }

    showAdminToast("📝 Note sauvegardée.");

  } catch {
    showAdminToast("Erreur lors de la sauvegarde.", "error");
  }
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

  const toast = document.createElement("div");
  toast.id        = "adminToast";
  toast.className = `admin-toast${type === "error" ? " admin-toast-error" : ""}`;
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
        <button class="btn-tool primary" onclick="openServerModal('${s.id}')">
          ⚙️ Configurer
        </button>
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

  const btn          = document.querySelector("#serverModal .modal-footer .btn-primary");
  const originalText = btn.textContent;
  btn.textContent         = "✅ Sauvegardé !";
  btn.style.pointerEvents = "none";
  setTimeout(() => {
    btn.textContent         = originalText;
    btn.style.pointerEvents = "";
  }, 1500);
}

/* ══════════════════════════════════
   TABS
══════════════════════════════════ */
function showTab(tabName) {
  document.querySelectorAll(".dash-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".dash-side-btn").forEach(b => b.classList.remove("active"));

  document.getElementById(`tab-${tabName}`)?.classList.add("active");

  document.querySelectorAll(".dash-side-btn").forEach(btn => {
    if (btn.getAttribute("onclick") === `showTab('${tabName}')`) {
      btn.classList.add("active");
    }
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
  }
});

/* ══════════════════════════════════
   START
══════════════════════════════════ */
init();