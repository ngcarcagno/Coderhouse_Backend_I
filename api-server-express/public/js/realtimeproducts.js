// JS migrated from realtimeproducts.hbs
const socket = io();
(function () {
  window.addEventListener("load", () => {
    // initialize cart count
    window.initCartCounter("#cartCount");
  });

  let isConnected = false;
  const statusIndicator = document.getElementById("connectionStatus");
  const statusText = document.getElementById("statusText");
  const addProductForm = document.getElementById("addProductForm");
  const productsContainer = document.getElementById("productsContainer");

  socket.on("connect", () => {
    isConnected = true;
    if (statusIndicator) statusIndicator.className = "connected";
    if (statusText) statusText.textContent = "Connected";
    showMessage("🟢 Connected to server", "success");
    socket.emit("requestProducts");
  });

  socket.on("disconnect", () => {
    isConnected = false;
    if (statusIndicator) statusIndicator.className = "disconnected";
    if (statusText) statusText.textContent = "Disconnected";
    showMessage("🔴 Connection lost", "error");
  });

  socket.on("updateProducts", (products) => {
    updateProductsDisplay(products);
  });

  socket.on("productAdded", (response) => {
    if (response.success) {
      showMessage("✅ Product added successfully!", "success");
      addProductForm && addProductForm.reset();
    } else {
      showMessage("❌ Error adding product: " + response.error, "error");
    }
  });

  socket.on("productDeleted", (response) => {
    if (response.success) showMessage("🗑️ Product deleted successfully!", "success");
    else showMessage("❌ Error deleting product: " + response.error, "error");
  });

  addProductForm &&
    addProductForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!isConnected) {
        showMessage("❌ Not connected to server", "error");
        return;
      }
      const productData = {
        brand: document.getElementById("brand")?.value,
        model: document.getElementById("model")?.value,
        code: document.getElementById("code")?.value,
        size: document.getElementById("size")?.value,
        description: document.getElementById("description")?.value,
        price: parseFloat(document.getElementById("price")?.value || 0),
        stock: parseInt(document.getElementById("stock")?.value || 0),
        category: document.getElementById("category")?.value,
        status: true,
        thumbnails: [],
      };
      socket.emit("addProduct", productData);
    });

  window.deleteProduct = function (productId) {
    if (!isConnected) {
      showMessage("❌ Not connected to server", "error");
      return;
    }
    if (confirm("Are you sure you want to delete this product?")) socket.emit("deleteProduct", productId);
  };

  function updateProductsDisplay(products) {
    const isEmpty = !products || products.length === 0;
    if (isEmpty) {
      productsContainer.innerHTML = `<div class="empty-state"><p>🔍 No products found. Add your first product above!</p></div>`;
    } else {
      const productsHTML = products
        .map((product) => {
          const id = product._id || product.id || "";
          const brand = product.brand || "";
          const model = product.model || "";
          const size = product.size || "";
          return `
          <div class="product-card new" data-id="${id}">
            <div class="product-header">
              <h3>${brand} ${model}</h3>
              <button class="delete-btn" onclick="deleteProduct('${id}')" title="Delete Product">🗑️</button>
            </div>
            <p class="product-description">${product.description || ""}</p>
            <div class="product-details">
              <span class="price">$${product.price || ""}</span>
              <span class="size">Size: ${size}</span>
              <span class="stock">Stock: ${product.stock || 0}</span>
              <span class="category">${product.category || ""}</span>
            </div>
            <div class="product-meta"><small>Code: ${product.code || ""} | Status: ${
            product.status ? "✅ Active" : "❌ Inactive"
          }</small></div>
          </div>`;
        })
        .join("");
      productsContainer.innerHTML = `<div class="products-section"><h2>📦 Products List (${products.length} items)</h2><div class="products-grid">${productsHTML}</div></div>`;
    }
    setTimeout(() => {
      document.querySelectorAll(".product-card.new").forEach((card) => card.classList.remove("new"));
    }, 500);
  }
})();
