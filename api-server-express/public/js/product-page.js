// JS migrated from product.hbs
document.addEventListener("DOMContentLoaded", () => {
  window.initCartCounter("#cartCount");
  const addBtn = document.getElementById("addBtn");
  const qtyInput = document.getElementById("qtyInput");
  const viewCartBtn = document.getElementById("viewCartBtn");
  const messagesContainer =
    document.getElementById("messages") ||
    (() => {
      const d = document.createElement("div");
      d.id = "messages";
      d.className = "messages";
      document.body.appendChild(d);
      return d;
    })();
  // expose showMessage if not present
  if (!window.showMessage)
    window.showMessage = function (text, type) {
      const messageEl = document.createElement("div");
      messageEl.className = `message ${type}`;
      messageEl.textContent = text;
      messagesContainer.appendChild(messageEl);
      setTimeout(() => messageEl.remove(), 4000);
    };

  const cid = localStorage.getItem("cartId");
  if (cid) viewCartBtn.href = `/carts/${cid}`;
  else viewCartBtn.href = "#";

  addBtn.addEventListener("click", async () => {
    const pid = addBtn.dataset.id;
    const qty = Number(qtyInput.value || 1);
    let cartId = localStorage.getItem("cartId");
    if (!cartId) {
      const res = await fetch("/api/carts", { method: "POST" });
      const data = await res.json();
      cartId = (data && (data._id || data.id)) || (data && data.cart && (data.cart._id || data.cart.id));
      if (cartId) localStorage.setItem("cartId", cartId);
    }
    if (!cartId) return showMessage("No se pudo crear carrito", "error");
    await fetch(`/api/carts/${cartId}/product/${pid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: qty }),
    });
    document.querySelectorAll("#cartCount").forEach((el) => (el.textContent = Number(el.textContent || 0) + qty));
    viewCartBtn.href = `/carts/${cartId}`;
    showMessage("Producto agregado", "success");
  });
});
