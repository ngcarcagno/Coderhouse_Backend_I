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

  async addProductToCart(cid, pid, quantity = 1) {
    if (!cid) throw new Error("El ID del carrito es requerido");
    if (!pid) throw new Error("El ID del producto es requerido");

    const cart = await this.cartsDao.getById(cid);
    if (!cart) {
      throw new Error(`El carrito con ID ${cid} no fue encontrado`);
    }

    const existingProduct = cart.products.find((p) => p.product === pid);

    if (existingProduct) {
      existingProduct.quantity += quantity;
    } else {
      cart.products.push({ product: pid, quantity });
    }

    return await this.cartsDao.update(cid, cart);
  }
}

module.exports = CartsService;
