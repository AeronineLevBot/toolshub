/* ═══════════════════════════════════════
   CART.JS — ToolsHub
═══════════════════════════════════════ */

const Cart = (() => {
  let selectedIds   = new Set();
  let currentFilter = "all";

  /* ── GETTERS ── */
  function getItems() {
    return TOOLS_DATA.filter(t => selectedIds.has(t.id));
  }

  function isSelected(id) {
    return selectedIds.has(id);
  }

  /* ── TOGGLE OUTIL ── */
  function toggle(id) {
    selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
    renderGrid(currentFilter, selectedIds);
    renderCart(getItems());
  }

  /* ── FILTRE ── */
  function setFilter(filter) {
    currentFilter = filter;
    renderFilters(filter, setFilter);
    renderGrid(filter, selectedIds);
  }

  /* ── PANIER SIDEBAR ── */
  function openCart() {
    document.getElementById("cartSidebar").classList.add("open");
    document.getElementById("cartOverlay").classList.add("open");
  }

  function closeCart() {
    document.getElementById("cartSidebar").classList.remove("open");
    document.getElementById("cartOverlay").classList.remove("open");
  }

  /* ── CHECKOUT ── */
  async function openCheckout() {
    const items = getItems();
    if (items.length === 0) return;

    /* Vérifier si l'utilisateur est connecté */
    const { logged } = await fetch("/api/auth/status", { credentials: "include" })
      .then(r => r.json())
      .catch(() => ({ logged: false }));

    if (!logged) {
      /* Afficher modal de connexion requise */
      document.getElementById("modalContent").innerHTML = renderLoginRequired();
      document.getElementById("modalOverlay").classList.add("open");
      closeCart();
      return;
    }

    /* User connecté → afficher checkout */
    document.getElementById("modalContent").innerHTML = renderCheckout(items);
    document.getElementById("modalOverlay").classList.add("open");
    closeCart();

    document.getElementById("btnPay").addEventListener("click", () => handlePayment(items));
  }

  /* ── PAIEMENT ── */
  async function handlePayment(items) {
    const btnPay = document.getElementById("btnPay");
    if (!btnPay) return;

    /* State loading */
    btnPay.disabled     = true;
    btnPay.textContent  = "Traitement en cours...";

    try {
      /* Enregistrer chaque outil acheté en DB */
      const results = await Promise.all(
        items.map(item =>
          fetch("/api/purchase", {
            method:      "POST",
            credentials: "include",
            headers:     { "Content-Type": "application/json" },
            body: JSON.stringify({
              toolId:   item.id,
              toolName: item.name,
              price:    item.price || 0
            })
          }).then(r => r.json())
        )
      );

      const allOk = results.every(r => r.ok);

      if (allOk) {
        /* Succès */
        document.getElementById("modalContent").innerHTML = renderSuccess();
        selectedIds.clear();
        renderCart([]);
        renderGrid(currentFilter, selectedIds);

        /* Redirection dashboard après 2.5s */
        setTimeout(() => {
          document.getElementById("modalOverlay").classList.remove("open");
          window.location.href = "/dashboard.html";
        }, 2500);
      } else {
        throw new Error("Erreur lors de l'enregistrement");
      }

    } catch (err) {
      console.error("Payment error:", err);
      btnPay.disabled    = false;
      btnPay.textContent = "💳 Réessayer";
      showPaymentError();
    }
  }

  /* ── RENDERS HTML ── */
  function renderLoginRequired() {
    return `
      <div style="text-align:center; padding: 40px 20px;">
        <div style="font-size:3rem; margin-bottom:16px;">🔐</div>
        <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:10px;">
          Connexion requise
        </h2>
        <p style="color:var(--muted); font-size:0.88rem; margin-bottom:28px; line-height:1.6;">
          Vous devez être connecté avec votre compte Discord<br/>
          pour finaliser votre achat.
        </p>
        <a href="/auth/login" class="btn-login-discord" style="display:inline-flex; margin:0 auto;">
          <svg width="18" height="18" viewBox="0 0 71 55" fill="none">
            <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a40.8 40.8 0 0 0-1.8 3.7
              a54 54 0 0 0-16.3 0A39.7 39.7 0 0 0 25.6.4 58.4 58.4 0 0 0 11 4.9
              C1.6 19-1 32.7.3 46.2a58.8 58.8 0 0 0 17.9 9 44.2 44.2 0 0 0
              3.8-6.2 38.3 38.3 0 0 1-6-2.9l1.4-1.1a41.8 41.8 0 0 0 36.2 0
              l1.5 1.1a38.4 38.4 0 0 1-6 2.9 44 44 0 0 0 3.8 6.2
              A58.6 58.6 0 0 0 70.7 46.2C72 30.5 68.5 16.9 60.1 4.9Z
              M23.7 38.1c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2
              s6.5 3.3 6.4 7.2c0 4-2.8 7.2-6.4 7.2Z
              m23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2
              s6.5 3.3 6.4 7.2c0 4-2.9 7.2-6.4 7.2Z"
              fill="currentColor"/>
          </svg>
          Se connecter avec Discord
        </a>
        <p style="margin-top:16px; font-size:0.78rem; color:var(--muted);">
          Vous serez redirigé vers votre panier après la connexion.
        </p>
      </div>`;
  }

  function renderCheckout(items) {
    const total = items.reduce((s, t) => s + (t.price || 0), 0);
    return `
      <h2 style="font-size:1.2rem; font-weight:800; margin-bottom:20px;">
        💳 Récapitulatif de commande
      </h2>
      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:24px;">
        ${items.map(t => `
          <div style="display:flex; justify-content:space-between; align-items:center;
            padding:12px 16px; background:var(--card); border:1px solid var(--border);
            border-radius:10px; font-size:0.88rem;">
            <span>${t.icon || "🔧"} ${t.name}</span>
            <span style="font-weight:700; color:var(--accent);">
              ${t.price === 0 ? "Gratuit" : `${t.price}€/mois`}
            </span>
          </div>`).join("")}
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;
        padding:14px 16px; background:rgba(99,120,255,0.07);
        border:1px solid var(--accent); border-radius:10px;
        margin-bottom:24px;">
        <span style="font-weight:700;">Total mensuel</span>
        <span style="font-size:1.2rem; font-weight:800; color:var(--accent);">
          ${total === 0 ? "Gratuit" : `${total}€ / mois`}
        </span>
      </div>
      <div id="paymentError" style="display:none; color:#f87171; font-size:0.83rem;
        margin-bottom:12px; text-align:center;">
        ❌ Une erreur est survenue. Veuillez réessayer.
      </div>
      <button class="btn-primary btn-full" id="btnPay">
        ${total === 0 ? "✅ Activer gratuitement" : "💳 Confirmer le paiement"}
      </button>
      <p style="text-align:center; font-size:0.75rem; color:var(--muted); margin-top:12px;">
        🔒 Paiement sécurisé — Sans engagement — Résiliable à tout moment
      </p>`;
  }

  function renderSuccess() {
    return `
      <div style="text-align:center; padding:40px 20px;">
        <div style="font-size:3.5rem; margin-bottom:16px;">🎉</div>
        <h2 style="font-size:1.3rem; font-weight:800; margin-bottom:10px;">
          Paiement confirmé !
        </h2>
        <p style="color:var(--muted); font-size:0.88rem; line-height:1.6;">
          Vos outils sont maintenant actifs.<br/>
          Redirection vers votre dashboard...
        </p>
        <div style="margin-top:20px; width:40px; height:40px; border:3px solid
          rgba(255,255,255,0.1); border-top-color:var(--accent); border-radius:50%;
          animation:spin 0.8s linear infinite; margin:20px auto 0;">
        </div>
      </div>`;
  }

  function showPaymentError() {
    const el = document.getElementById("paymentError");
    if (el) el.style.display = "block";
  }

  return { toggle, isSelected, setFilter, openCart, closeCart, openCheckout };
})();