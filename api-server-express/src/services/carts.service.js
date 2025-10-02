class CartsService {
  constructor(cartsDao) {
    this.cartsDao = cartsDao;
  }

  async createCart() {
    const newCart = {
      products: [],
    };
    return await this.cartsDao.create(newCart);
  }

  async getCartProducts(cid) {
    if (!cid) throw new Error("El ID del carrito es requerido");
    const cart = await this.cartsDao.getById(cid);
    if (!cart) {
      throw new Error(`El carrito con ID ${cid} no fue encontrado`);
    }
    return cart.products;
  }

  async getCartById(cid) {
    if (!cid) throw new Error("El ID del carrito es requerido");
    const cart = await this.cartsDao.getById(cid);
    if (!cart) throw new Error(`El carrito con ID ${cid} no fue encontrado`);
    return cart;
  }

  async addProductToCart(cid, pid, quantity = 1) {
    if (!cid) throw new Error("El ID del carrito es requerido");
    if (!pid) throw new Error("El ID del producto es requerido");

    const cart = await this.cartsDao.getById(cid);
    if (!cart) {
      throw new Error(`El carrito con ID ${cid} no fue encontrado`);
    }

    const existingProduct = cart.products.find((p) => p.product === pid || p.product === pid.toString());

    if (existingProduct) {
      existingProduct.quantity = Number(existingProduct.quantity) + Number(quantity);
    } else {
      cart.products.push({ product: pid, quantity: Number(quantity) });
    }

    // If DAO exposes addProduct, prefer it (DB implementation). Otherwise fallback to update.
    if (typeof this.cartsDao.addProduct === "function") {
      return await this.cartsDao.addProduct(cid, pid, quantity);
    }

    return await this.cartsDao.update(cid, cart);
  }

  async removeProductFromCart(cid, pid) {
    if (!cid) throw new Error("El ID del carrito es requerido");
    if (!pid) throw new Error("El ID del producto es requerido");

    if (typeof this.cartsDao.removeProduct === "function") {
      return await this.cartsDao.removeProduct(cid, pid);
    }

    // Fallback para DAO local
    const cart = await this.cartsDao.getById(cid);
    if (!cart) throw new Error("Carrito no encontrado");
    cart.products = cart.products.filter((p) => p.product !== pid && p.id !== pid);
    return await this.cartsDao.update(cid, cart);
  }

  async replaceCartProducts(cid, productsArray = []) {
    if (!cid) throw new Error("El ID del carrito es requerido");

    if (typeof this.cartsDao.updateCartProducts === "function") {
      return await this.cartsDao.updateCartProducts(cid, productsArray);
    }

    // Fallback local: recuperar, reemplazar y guardar
    const cart = await this.cartsDao.getById(cid);
    if (!cart) throw new Error("Carrito no encontrado");
    cart.products = productsArray.map((p) => ({ product: p.product, quantity: Number(p.quantity) }));
    return await this.cartsDao.update(cid, cart);
  }

  async updateProductQuantity(cid, pid, quantity) {
    if (!cid) throw new Error("El ID del carrito es requerido");
    if (!pid) throw new Error("El ID del producto es requerido");
    if (quantity === undefined || quantity === null) throw new Error("Quantity es requerido");

    if (typeof this.cartsDao.updateProductQuantity === "function") {
      return await this.cartsDao.updateProductQuantity(cid, pid, Number(quantity));
    }

    // Fallback local
    const cart = await this.cartsDao.getById(cid);
    if (!cart) throw new Error("Carrito no encontrado");
    const existing = cart.products.find((p) => p.product === pid || p.product === pid.toString());
    if (!existing) throw new Error("Producto no encontrado en el carrito");
    existing.quantity = Number(quantity);
    return await this.cartsDao.update(cid, cart);
  }

  async clearCart(cid) {
    if (!cid) throw new Error("El ID del carrito es requerido");
    if (typeof this.cartsDao.clearCart === "function") {
      return await this.cartsDao.clearCart(cid);
    }

    // Fallback local
    const cart = await this.cartsDao.getById(cid);
    if (!cart) throw new Error("Carrito no encontrado");
    cart.products = [];
    return await this.cartsDao.update(cid, cart);
  }
}

module.exports = CartsService;
