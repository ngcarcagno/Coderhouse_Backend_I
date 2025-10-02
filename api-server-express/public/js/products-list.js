// JS migrated from products.hbs (modularized)
document.addEventListener("DOMContentLoaded", () => {
  window.initCartCounter("#cartCount");
  const cartCountEl = document.getElementById("cartCount");
  const cartModal = document.getElementById("cartModal");
  const cartContent = document.getElementById("cartContent");

  async function fetchCart() {
    const cartId = localStorage.getItem("cartId");
    if (!cartId) return null;
    try {
      const res = await fetch(`/api/carts/${cartId}`);
      if (!res.ok) return null;
      if (res.status === 204) return { products: [] };
      const text = await res.text();
      if (!text) return { products: [] };
      try {
        const json = JSON.parse(text);
        return json && json.cart ? json.cart : json;
      } catch (e) {
        return null;
      }
    } catch (e) {
      console.error("fetchCart error:", e);
      return null;
    }
  }

  async function initCart() {
    const cart = await fetchCart();
    const clearBtn = document.getElementById("clearCartBtn");
    if (!cart || !Array.isArray(cart.products) || cart.products.length === 0) {
      cartCountEl.textContent = "0";
      if (clearBtn) clearBtn.disabled = true;
      return;
    }
    const total = cart.products.reduce((s, p) => s + (p.quantity || 0), 0);
    cartCountEl.textContent = total;
    if (clearBtn) clearBtn.disabled = !(Array.isArray(cart.products) && cart.products.length > 0);
  }
  initCart();

  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const pid = e.currentTarget.dataset.id;
      const input = document.querySelector(`.qty[data-id='${pid}']`);
      const qty = parseInt(input?.value || "1");

      let cartId = localStorage.getItem("cartId");
      if (!cartId) {
        const res = await fetch("/api/carts", { method: "POST" });
        const data = await res.json();
        cartId = (data && (data._id || data.id)) || (data && data.cart && (data.cart._id || data.cart.id));
        if (!cartId) {
          showMessage("Error creando carrito", "error");
          return;
        }
        localStorage.setItem("cartId", cartId);
      }

      const res = await fetch(`/api/carts/${cartId}/product/${pid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const respJson = await res.json();
      const cart = respJson && respJson.cart ? respJson.cart : await fetchCart();
      if (cart && cart.products) {
        const total = cart.products.reduce((s, p) => s + (p.quantity || 0), 0);
        cartCountEl.textContent = total;
      } else {
        await initCart();
      }
      await initCart();
      showMessage("Agregado al carrito", "success");
    });
  });

  async function openProductModal(pid) {
    try {
      const res = await fetch(`/api/products/${pid}`);
      if (!res.ok) throw new Error("Producto no encontrado");
      const data = await res.json();
      const product = data && data.payload ? data.payload : data && data.product ? data.product : data;
      if (!product) throw new Error("Producto inválido");
      document.getElementById("modalTitle").textContent = `${product.brand || ""} ${product.model || ""}`;
      document.getElementById("modalPrice").textContent = product.price ? `$ ${product.price}` : "";
      document.getElementById("modalMeta").textContent = `${product.size || ""} • ${product.category || ""} • ${
        product.stock ? "En stock: " + product.stock : "Sin stock"
      }`;
      document.getElementById("modalDesc").textContent = product.description || "";
      const img = document.getElementById("modalImage");
      img.src =
        product.thumbnails && product.thumbnails.length
          ? product.thumbnails[0]
          : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHHD14b-4jc2n7NeWejZ_smA8OQ4xPR6P80w&s";
      img.alt = `${product.brand || ""} ${product.model || ""}`;
      document.getElementById("modalAddToCart").dataset.id = product._id || product.id || pid;
      document.getElementById("productOverlay").style.display = "block";
      document.getElementById("productModal").style.display = "block";
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("product", pid);
        history.pushState(
          { productModal: pid },
          "",
          url.pathname + (url.searchParams.toString() ? "?" + url.searchParams.toString() : "")
        );
      } catch (e) {}
    } catch (err) {
      showMessage("Error al cargar producto", "error");
    }
  }

  document.querySelectorAll(".open-product").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const pid = e.currentTarget.dataset.id;
      if (!pid) return;
      openProductModal(pid);
    })
  );

  const modalCloseEl = document.getElementById("modalCloseIcon");
  const productOverlay = document.getElementById("productOverlay");
  const productModal = document.getElementById("productModal");
  if (modalCloseEl && productModal && productOverlay)
    modalCloseEl.addEventListener("click", () => {
      productModal.style.display = "none";
      productOverlay.style.display = "none";
    });
  if (productOverlay && productModal)
    productOverlay.addEventListener("click", () => {
      productModal.style.display = "none";
      productOverlay.style.display = "none";
    });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && productModal && productOverlay) {
      productModal.style.display = "none";
      productOverlay.style.display = "none";
    }
  });

  window.addEventListener("popstate", (ev) => {
    if (ev.state && ev.state.productModal) openProductModal(ev.state.productModal);
    else if (productModal && productOverlay) {
      productModal.style.display = "none";
      productOverlay.style.display = "none";
    }
  });

  const modalAddBtn = document.getElementById("modalAddToCart");
  if (modalAddBtn)
    modalAddBtn.addEventListener("click", async (e) => {
      const pid = e.currentTarget.dataset.id;
      const qty = Number(document.getElementById("modalQty")?.value || "1");
      if (!pid) return showMessage("Producto inválido", "error");
      let cartId = localStorage.getItem("cartId");
      if (!cartId) {
        const res = await fetch("/api/carts", { method: "POST" });
        const data = await res.json();
        cartId = (data && (data._id || data.id)) || (data && data.cart && (data.cart._id || data.cart.id));
        if (!cartId) return showMessage("Error creando carrito", "error");
        localStorage.setItem("cartId", cartId);
      }
      const res = await fetch(`/api/carts/${cartId}/product/${pid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: qty }),
      });
      const respJson = await res.json();
      const cart = respJson && respJson.cart ? respJson.cart : await fetchCart();
      if (cart && cart.products) {
        const total = cart.products.reduce((s, p) => s + (p.quantity || 0), 0);
        cartCountEl.textContent = total;
      }
      await initCart();
      showMessage("Agregado al carrito", "success");
      if (typeof closeProductModal === "function") closeProductModal();
    });

  document.getElementById("cartIcon").addEventListener("click", async () => {
    const cartId = localStorage.getItem("cartId");
    if (!cartId) return showMessage("No hay carrito creado", "error");
    const res = await fetch(`/api/carts/${cartId}`);
    const raw = await res.json();
    const json = raw && raw.cart ? raw.cart : raw;
    const clearBtn = document.getElementById("clearCartBtn");
    if (!json || !Array.isArray(json.products) || json.products.length === 0) {
      cartContent.innerHTML = "No hay productos en el carrito";
      if (clearBtn) clearBtn.disabled = true;
      cartModal.style.display = "block";
      return;
    }
    cartContent.innerHTML = json.products
      .map((item) => {
        const p = item.product || {};
        const pid = p._id || p.id || item.product || "";
        const title = `${p.brand || ""} ${p.model || ""}`.trim() || "Producto";
        const meta = `${p.size || ""}`.trim();
        return `<div class="cart-row"><div class="cart-info">${title}<br><small>${meta}</small></div><div class="cart-controls"><input type="number" min="1" value="${item.quantity}" data-pid="${pid}" class="cart-qty" /><button class="remove-item" data-pid="${pid}" title="Eliminar" aria-label="Eliminar"> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18 6 L6 18 M6 6 L18 18" stroke="#e05a5a" stroke-width="2" stroke-linecap="round"/></svg></button></div></div>`;
      })
      .join("");

    const debounce = (fn, wait = 500) => {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    };
    const onQtyChange = debounce(async (pid, value, inputEl) => {
      const cartId = localStorage.getItem("cartId");
      if (!cartId) return;
      try {
        const res = await fetch(`/api/carts/${cartId}/products/${pid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: Number(value) }),
        });
        const resp = await res.json();
        const cart = resp && resp.cart ? resp.cart : await fetchCart();
        if (cart && cart.products) {
          const total = cart.products.reduce((s, p) => s + (p.quantity || 0), 0);
          cartCountEl.textContent = total;
        } else {
          await initCart();
        }
        showMessage("Cantidad actualizada", "success");
      } catch (err) {
        showMessage("Error actualizando cantidad", "error");
      }
    }, 450);

    const handleRemoveClick = async (e) => {
      const pid = e.currentTarget.dataset.pid;
      const cartId = localStorage.getItem("cartId");
      if (!cartId) return showMessage("No hay carrito creado", "error");
      try {
        const rowEl = e.currentTarget.closest(".cart-row");
        let removedQty = 0;
        try {
          removedQty = Number(rowEl?.querySelector(".cart-qty")?.value || "1");
        } catch (qerr) {
          removedQty = 1;
        }
        try {
          cartCountEl.textContent = Math.max(0, Number(cartCountEl.textContent || "0") - removedQty);
        } catch (e) {}
        try {
          rowEl?.remove();
        } catch (e) {}
        try {
          if (cartContent.querySelectorAll && cartContent.querySelectorAll(".cart-row").length === 0) {
            cartContent.innerHTML = "Vacío";
          }
        } catch (e) {}

        const res = await fetch(`/api/carts/${cartId}/products/${pid}`, { method: "DELETE" });

        try {
          const cloned = res.clone();
          const text = await cloned.text().catch(() => "");
          console.groupCollapsed("DELETE /api/carts response");
          console.log("status", res.status, "ok", res.ok);
          try {
            console.log("content-type", res.headers.get("content-type"));
          } catch (e) {}
          console.log("bodyText:", text);
          console.groupEnd();
        } catch (logErr) {
          console.warn("Could not log response body", logErr);
        }

        if (!res.ok) {
          let body = {};
          try {
            body = await res.json();
          } catch (e) {
            try {
              body.message = await res.text();
            } catch (e2) {
              body = { message: "Error eliminando item" };
            }
          }
          console.error("Server returned non-ok on DELETE:", res.status, body);
          return showMessage(
            body && (body.message || body.error) ? body.message || body.error : "Error eliminando item",
            "error"
          );
        }

        let cart = null;
        try {
          cart = await fetchCart();
        } catch (e) {
          console.error("fetchCart failed after delete:", e);
          cart = null;
        }

        if (cart && Array.isArray(cart.products) && cart.products.length > 0) {
          const total = cart.products.reduce((s, p) => s + (p.quantity || 0), 0);
          cartCountEl.textContent = total;

          cartContent.innerHTML = cart.products
            .map((item) => {
              const p = item.product || {};
              const pid = p._id || p.id || item.product || "";
              const title = `${p.brand || ""} ${p.model || ""}`.trim() || "Producto";
              const meta = `${p.size || ""}`.trim();
              return `<div class="cart-row"><div class="cart-info">${title}<br><small>${meta}</small></div><div class="cart-controls"><input type="number" min="1" value="${item.quantity}" data-pid="${pid}" class="cart-qty" /><button class="remove-item" data-pid="${pid}" title="Eliminar" aria-label="Eliminar"> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18 6 L6 18 M6 6 L18 18" stroke="#e05a5a" stroke-width="2" stroke-linecap="round"/></svg></button></div></div>`;
            })
            .join("");

          cartContent.querySelectorAll(".cart-qty").forEach((inp) => {
            inp.addEventListener("input", (ev) => {
              const pid = ev.currentTarget.dataset.pid;
              const val = ev.currentTarget.value || "1";
              if (Number(val) < 1) {
                ev.currentTarget.value = "1";
              }
              onQtyChange(pid, ev.currentTarget.value, ev.currentTarget);
            });
          });
          cartContent
            .querySelectorAll(".remove-item")
            .forEach((btn) => btn.addEventListener("click", handleRemoveClick));
        } else {
          try {
            e.currentTarget.closest(".cart-row")?.remove();
          } catch (uiErr) {
            /* ignore */
          }
          try {
            cartContent.innerHTML = "No hay productos en el carrito";
          } catch (e) {}
          await initCart();
          const clearBtn2 = document.getElementById("clearCartBtn");
          if (clearBtn2) clearBtn2.disabled = true;
        }

        showMessage("Eliminado", "success");
      } catch (err) {
        console.error("Error eliminando item (cliente):", err);
        try {
          if (err && err.response) console.error("Response object:", err.response);
        } catch (e) {}
        showMessage("Error eliminando item", "error");
      }
    };

    cartContent.querySelectorAll(".cart-qty").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const pid = e.currentTarget.dataset.pid;
        const val = e.currentTarget.value || "1";
        if (Number(val) < 1) {
          e.currentTarget.value = "1";
        }
        onQtyChange(pid, e.currentTarget.value, e.currentTarget);
      });
    });
    cartContent.querySelectorAll(".remove-item").forEach((b) => b.addEventListener("click", handleRemoveClick));
    cartModal.style.display = "block";
  });

  document.getElementById("closeCart").addEventListener("click", () => (cartModal.style.display = "none"));
  document.getElementById("clearCartBtn").addEventListener("click", async () => {
    const cartId = localStorage.getItem("cartId");
    if (!cartId) return;
    const res = await fetch(`/api/carts/${cartId}`, { method: "DELETE" });
    if (!res.ok) {
      showMessage("Error vaciando carrito", "error");
      return;
    }
    await initCart();
    cartContent.innerHTML = "No hay productos en el carrito";
    const clearBtn3 = document.getElementById("clearCartBtn");
    if (clearBtn3) clearBtn3.disabled = true;
    showMessage("Carrito vaciado", "success");
  });

  const limitSelect = document.getElementById("limitSelect");
  const initialLimit = document.getElementById("productsList")?.dataset?.limit || "10";
  if (initialLimit && limitSelect) limitSelect.value = initialLimit;
  if (limitSelect) {
    limitSelect.addEventListener("change", () => {
      const params = new URLSearchParams(window.location.search);
      params.set("limit", limitSelect.value);
      params.set("page", "1");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.location.href = newUrl;
    });
  }

  const sortSelect = document.getElementById("sortSelect");
  const filterCategory = document.getElementById("filterCategory");
  const filterBrand = document.getElementById("filterBrand");
  const filterAvailable = document.getElementById("filterAvailable");

  function getQueryParams() {
    return new URLSearchParams(window.location.search);
  }

  (function initFiltersFromUrl() {
    const params = getQueryParams();
    if (sortSelect && params.get("sort")) sortSelect.value = params.get("sort");
    const brandCsv = params.get("brand");
    if (brandCsv) {
      const brands = brandCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      brands.forEach((b) => {
        const el = document.querySelector(`#brandFilters input[value="${b}"]`);
        if (el) el.checked = true;
      });
    }
    const catCsv = params.get("category");
    if (catCsv) {
      const cats = catCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      cats.forEach((c) => {
        const el = document.querySelector(`#categoryFilters input[value="${c}"]`);
        if (el) el.checked = true;
      });
    }
    if (filterAvailable && params.get("available") === "true") filterAvailable.checked = true;
  })();

  function collectMulti(name) {
    const boxes = document.querySelectorAll(`input[data-filter-type="${name}"]:checked`);
    return Array.from(boxes).map((b) => b.value);
  }

  const debouncedNavigate = (function () {
    let t;
    return (fn, wait = 350) => {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  })();

  function applyFilters() {
    const params = getQueryParams();
    if (sortSelect) params.set("sort", sortSelect.value || "");
    const brands = collectMulti("brand");
    const cats = collectMulti("category");
    if (brands.length) params.set("brand", brands.join(","));
    else params.delete("brand");
    if (cats.length) params.set("category", cats.join(","));
    else params.delete("category");
    if (filterAvailable) {
      if (filterAvailable.checked) params.set("available", "true");
      else params.delete("available");
    }
    params.set("page", "1");
    const qs = Array.from(params.entries())
      .filter(([k, v]) => v !== "" && v != null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    const url = `${window.location.pathname}${qs ? "?" + qs : ""}`;
    debouncedNavigate(() => (window.location.href = url), 250);
  }

  if (sortSelect) sortSelect.addEventListener("change", applyFilters);
  if (filterAvailable) filterAvailable.addEventListener("change", applyFilters);
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (
      el &&
      el.getAttribute &&
      (el.getAttribute("data-filter-type") === "brand" || el.getAttribute("data-filter-type") === "category")
    ) {
      applyFilters();
    }
  });

  try {
    const mainCatalog = document.querySelector(".catalog");
    if (mainCatalog) {
      mainCatalog.style.marginTop = "18px";
    }
  } catch (e) {}

  try {
    if (window.populateFilterCheckboxes) delete window.populateFilterCheckboxes;
  } catch (e) {}
});
