const Cart = require("../models/cart.model");
const mongoose = require("mongoose");

class CartsDaoDB {
  async create(cartData = { products: [] }) {
    try {
      const cart = new Cart(cartData);
      await cart.save();
      return cart;
    } catch (error) {
      console.error("Error creando carrito:", error);
      throw new Error("Error al crear carrito");
    }
  }

  async getById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const cart = await Cart.findById(id).populate("products.product").lean();
      return cart;
    } catch (error) {
      console.error("Error obteniendo carrito:", error);
      return null;
    }
  }

  async addProduct(cid, pid, quantity = 1) {
    try {
      if (!mongoose.Types.ObjectId.isValid(cid) || !mongoose.Types.ObjectId.isValid(pid))
        throw new Error("ID no válido");

      const cart = await Cart.findById(cid);
      if (!cart) throw new Error("Carrito no encontrado");

      const existing = cart.products.find((p) => p.product.toString() === pid.toString());
      if (existing) {
        existing.quantity += Number(quantity);
      } else {
        cart.products.push({ product: pid, quantity: Number(quantity) });
      }

      await cart.save();
      try {
        return await Cart.findById(cid).populate("products.product").lean();
      } catch (popErr) {
        // If populate fails for any reason, return the saved cart as a plain object
        try {
          return cart.toObject ? cart.toObject() : cart;
        } catch (e) {
          return cart;
        }
      }
    } catch (error) {
      console.error("Error agregando producto al carrito:", error);
      throw error;
    }
  }

  async removeProduct(cid, pid) {
    try {
      if (!mongoose.Types.ObjectId.isValid(cid)) throw new Error("ID carrito no válido");

      const cart = await Cart.findById(cid);
      if (!cart) throw new Error("Carrito no encontrado");

      // pid may be an ObjectId, a string, or (rarely) a populated object. Normalize to string for comparison.
      const pidStr = pid && pid.toString ? pid.toString() : String(pid);

      cart.products = cart.products.filter((p) => {
        // p.product may be ObjectId or populated doc
        try {
          const prod =
            p.product && p.product._id
              ? p.product._id.toString()
              : p.product && p.product.toString
              ? p.product.toString()
              : String(p.product);
          return prod !== pidStr;
        } catch (e) {
          return true; // keep if we can't compare
        }
      });
      await cart.save();
      try {
        return await Cart.findById(cid).populate("products.product").lean();
      } catch (popErr) {
        // If populate fails for any reason, return the saved cart as a plain object
        try {
          return cart.toObject ? cart.toObject() : cart;
        } catch (e) {
          return cart;
        }
      }
    } catch (error) {
      console.error("Error removiendo producto del carrito:", error);
      throw error;
    }
  }

  async updateCartProducts(cid, productsArray = []) {
    try {
      if (!mongoose.Types.ObjectId.isValid(cid)) throw new Error("ID carrito inválido");
      const cart = await Cart.findById(cid);
      if (!cart) throw new Error("Carrito no encontrado");

      // productsArray expected: [{ product: pid, quantity: N }, ...]
      cart.products = productsArray.map((p) => ({ product: p.product, quantity: Number(p.quantity) }));
      await cart.save();
      return await Cart.findById(cid).populate("products.product").lean();
    } catch (error) {
      console.error("Error actualizando productos del carrito:", error);
      throw error;
    }
  }

  async updateProductQuantity(cid, pid, quantity) {
    try {
      if (!mongoose.Types.ObjectId.isValid(cid)) throw new Error("ID carrito no válido");
      const cart = await Cart.findById(cid);
      if (!cart) throw new Error("Carrito no encontrado");

      const pidStr = pid && pid.toString ? pid.toString() : String(pid);
      const existing = cart.products.find((p) => {
        try {
          const prod =
            p.product && p.product._id
              ? p.product._id.toString()
              : p.product && p.product.toString
              ? p.product.toString()
              : String(p.product);
          return prod === pidStr;
        } catch (e) {
          return false;
        }
      });
      if (!existing) throw new Error("Producto no encontrado en el carrito");

      existing.quantity = Number(quantity);
      await cart.save();
      try {
        return await Cart.findById(cid).populate("products.product").lean();
      } catch (popErr) {
        try {
          return cart.toObject ? cart.toObject() : cart;
        } catch (e) {
          return cart;
        }
      }
    } catch (error) {
      console.error("Error actualizando cantidad:", error);
      throw error;
    }
  }

  async clearCart(cid) {
    try {
      if (!mongoose.Types.ObjectId.isValid(cid)) throw new Error("ID carrito inválido");
      const cart = await Cart.findById(cid);
      if (!cart) throw new Error("Carrito no encontrado");
      cart.products = [];
      await cart.save();
      return await Cart.findById(cid).lean();
    } catch (error) {
      console.error("Error vaciando carrito:", error);
      throw error;
    }
  }
}

module.exports = CartsDaoDB;
