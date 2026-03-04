/* ═══════════════════════════════════════
   UI.JS — Rendu des composants
═══════════════════════════════════════ */

function buildBadges(badges) {
  const map = {
    new:     '<span class="badge badge-new">✨ Nouveau</span>',
    hot:     '<span class="badge badge-hot">🔥 Trending</span>',
    popular: '<span class="badge badge-popular">⭐ Populaire</span>',
    pro:     '<span class="badge badge-pro">💎 Pro</span>',
  };
  return (badges || []).map(b => map[b] || "").join("");
}

function buildCard(tool, isSelected) {
  const priceStr = tool.price === 0
    ? `<span class="price-free">Gratuit</span>`
    : `${tool.price.toFixed(2)}€ <span class="per">/ ${tool.period}</span>`;

  return `
    <div class="tool-card ${isSelected ? "selected" : ""}" data-id="${tool.id}"
      onclick="openToolModal('${tool.id}')">
      <div class="card-top">
        <div class="card-icon">${tool.icon}</div>
        <div class="card-badges">${buildBadges(tool.badges)}</div>
      </div>
      <div>
        <div class="card-name">${tool.name}</div>
        <div class="card-desc">${tool.desc}</div>
      </div>
      <div class="card-features">
        ${(tool.features || []).map(f => `<span class="feature-tag">${f}</span>`).join("")}
      </div>
      <div class="card-footer">
        <div class="card-price">${priceStr}</div>
        <button
          class="btn-select ${isSelected ? "btn-select-remove" : "btn-select-add"}"
          onclick="event.stopPropagation(); Cart.toggle('${tool.id}')">
          ${isSelected ? "✕ Retirer" : "+ Ajouter"}
        </button>
      </div>
    </div>`;
}

function renderGrid(filter, selectedIds) {
  const grid  = document.getElementById("toolsGrid");
  if (!grid) return;
  const tools = filter === "all"
    ? TOOLS_DATA
    : TOOLS_DATA.filter(t => t.category === filter);

  grid.innerHTML = tools.map((t, i) => {
    const card = buildCard(t, selectedIds.has(t.id));
    return card.replace(
      'class="tool-card',
      `class="tool-card fade-in-up" style="animation-delay:${i * 0.06}s`
    );
  }).join("");
}

function renderFilters(activeFilter, onSelect) {
  const container = document.getElementById("filterTabs");
  if (!container) return;
  container.innerHTML = CATEGORIES.map(c => `
    <button class="tab ${c.id === activeFilter ? "active" : ""}" data-cat="${c.id}">
      ${c.label}
    </button>`).join("");

  container.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => onSelect(btn.dataset.cat));
  });
}

function renderCart(items) {
  const container = document.getElementById("cartItems");
  const totalEl   = document.getElementById("cartTotal");
  const countEl   = document.getElementById("cartCount");
  if (!container || !totalEl || !countEl) return;

  container.innerHTML = items.length === 0
    ? `<div class="cart-empty">🛒<br><br>Votre panier est vide.<br>Ajoutez des outils pour commencer !</div>`
    : items.map(t => `
        <div class="cart-item">
          <span class="cart-item-icon">${t.icon}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${t.name}</div>
            <div class="cart-item-price">
              ${t.price === 0 ? "Gratuit" : t.price.toFixed(2) + "€/mois"}
            </div>
          </div>
          <button class="cart-item-remove" onclick="Cart.toggle('${t.id}')">✕</button>
        </div>`).join("");

  const total = items.reduce((s, t) => s + t.price, 0);
  totalEl.textContent = total === 0 ? "0€" : `${total.toFixed(2)}€`;
  countEl.textContent = items.length;
}

/* ══════════════════════════════════
   TOOL MODAL
══════════════════════════════════ */
function openToolModal(id) {
  const tool = TOOLS_DATA.find(t => String(t.id) === String(id));
  if (!tool) return;

  const overlay    = document.getElementById("toolModalOverlay");
  const content    = document.getElementById("toolModalContent");
  const isSelected = Cart.isSelected(id);

  const priceStr = tool.price === 0
    ? `<span class="price-free">Gratuit</span>`
    : `${tool.price.toFixed(2)}€ <span class="per">/ ${tool.period}</span>`;

  const stars = "★".repeat(Math.floor(tool.rating)) + "☆".repeat(5 - Math.floor(tool.rating));

  content.innerHTML = `
    <div class="tool-modal-header">
      <div class="tool-modal-icon">${tool.icon}</div>
      <div class="tool-modal-title-group">
        <div class="tool-modal-name">${tool.name}</div>
        <div class="tool-modal-badges">${buildBadges(tool.badges)}</div>
        <div class="tool-modal-rating">
          <span class="modal-stars">${stars}</span>
          <span class="modal-rating-val">${tool.rating} / 5</span>
          <span class="modal-users">· ${tool.users.toLocaleString("fr-FR")} utilisateurs</span>
        </div>
      </div>
      <button class="tool-modal-close" onclick="closeToolModal()">✕</button>
    </div>

    <div class="tool-modal-body">
      <div class="tool-modal-section">
        <div class="tool-modal-section-title">📄 Description</div>
        <p class="tool-modal-desc">${tool.longDesc}</p>
      </div>
      <div class="tool-modal-section">
        <div class="tool-modal-section-title">✅ Fonctionnalités</div>
        <div class="tool-modal-features">
          ${(tool.fullFeatures || []).map(f => `
            <div class="modal-feature-item">
              <span class="modal-feature-check">✓</span>
              <span>${f}</span>
            </div>`).join("")}
        </div>
      </div>
    </div>

    <div class="tool-modal-footer">
      <div class="tool-modal-price">${priceStr}</div>
      <button
        class="btn-select ${isSelected ? "btn-select-remove" : "btn-select-add"} btn-modal-add"
        id="modalCartBtn"
        onclick="modalToggleCart('${tool.id}')">
        ${isSelected ? "✕ Retirer du panier" : "🛒 Ajouter au panier"}
      </button>
    </div>`;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function modalToggleCart(id) {
  Cart.toggle(id);
  const isSelected = Cart.isSelected(id);
  const btn        = document.getElementById("modalCartBtn");
  if (!btn) return;
  btn.className   = `btn-select ${isSelected ? "btn-select-remove" : "btn-select-add"} btn-modal-add`;
  btn.textContent = isSelected ? "✕ Retirer du panier" : "🛒 Ajouter au panier";
}

function closeToolModal() {
  const overlay = document.getElementById("toolModalOverlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function handleToolOverlayClick(e) {
  if (e.target === document.getElementById("toolModalOverlay")) {
    closeToolModal();
  }
}

/* ══════════════════════════════════
   EXPOSITION GLOBALE
   Nécessaire pour les onclick="" HTML
══════════════════════════════════ */
window.openToolModal          = openToolModal;
window.closeToolModal         = closeToolModal;
window.modalToggleCart        = modalToggleCart;
window.handleToolOverlayClick = handleToolOverlayClick;
window.buildBadges            = buildBadges;
window.renderGrid             = renderGrid;
window.renderFilters          = renderFilters;
window.renderCart             = renderCart;