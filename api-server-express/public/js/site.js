// Global site JS: showMessage and small helpers
(function () {
  function ensureMessagesContainer() {
    let c = document.getElementById("messages");
    if (!c) {
      c = document.createElement("div");
      c.id = "messages";
      c.className = "messages";
      document.body.appendChild(c);
    }
    return c;
  }
  const messagesContainer = ensureMessagesContainer();
  window.showMessage = function (text, type) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;
    messagesContainer.appendChild(messageEl);
    setTimeout(() => messageEl.remove(), 4000);
  };

  // Cart counter helper (exposed globally)
  window.initCartCounter = async function (cartCountSelector) {
    const cartCountEl = document.querySelector(cartCountSelector || "#cartCount");
    if (!cartCountEl) return;
    try {
      const cartId = localStorage.getItem("cartId");
      if (!cartId) {
        cartCountEl.textContent = "0";
        return;
      }
      const res = await fetch(`/api/carts/${cartId}`);
      const raw = await res.json();
      const cart = raw && raw.cart ? raw.cart : raw;
      if (!cart || !cart.products) {
        cartCountEl.textContent = "0";
        return;
      }
      const total = cart.products.reduce((s, p) => s + (p.quantity || 0), 0);
      cartCountEl.textContent = total;
    } catch (e) {
      cartCountEl.textContent = "0";
    }
  };
})();
