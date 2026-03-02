document.addEventListener("DOMContentLoaded", () => {

  Cart.setFilter("all");
  renderCart([]);

  // Stats counter
  document.querySelectorAll(".stat-number").forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || "+";
    let current  = 0;
    const step   = Math.ceil(target / 60);
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString("fr-FR") + suffix;
      if (current >= target) clearInterval(timer);
    }, 20);
  });

  // Active users flicker
  setInterval(() => {
    const base  = 1247;
    const delta = Math.floor(Math.random() * 40) - 20;
    document.getElementById("activeCount").textContent =
      (base + delta).toLocaleString("fr-FR");
  }, 3000);

  // Cart events
  document.getElementById("cartBtn").addEventListener("click", Cart.openCart);
  document.getElementById("cartClose").addEventListener("click", Cart.closeCart);
  document.getElementById("cartOverlay").addEventListener("click", Cart.closeCart);
  document.getElementById("btnCheckout").addEventListener("click", Cart.openCheckout);
  document.getElementById("modalClose").addEventListener("click", () => {
    document.getElementById("modalOverlay").classList.remove("open");
  });

  // Burger
  document.getElementById("burger").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
  });

  // Card formatting
  document.addEventListener("input", e => {
    if (e.target.id === "cardNumber") {
      let v = e.target.value.replace(/\D/g, "").slice(0, 16);
      e.target.value = v.replace(/(\d{4})(?=\d)/g, "$1 ");
    }
    if (e.target.id === "cardExp") {
      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
      e.target.value = v;
    }
  });
});

// Fermer le tool modal en cliquant sur l'overlay
function handleToolOverlayClick(e) {
  if (e.target === document.getElementById("toolModalOverlay")) {
    closeToolModal();
  }
}