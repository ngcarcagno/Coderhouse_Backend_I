class CartsController {
  constructor(cartsService) {
    this.cartsService = cartsService;
  }

  createCart = async (req, res, next) => {
    try {
      const newCart = await this.cartsService.createCart();
      res.status(201).json(newCart);
    } catch (error) {
      next(error);
    }
  };

  getCartProducts = async (req, res, next) => {
    try {
      const { cid } = req.params;
      const products = await this.cartsService.getCartProducts(cid);
      res.json(products);
    } catch (error) {
      next(error);
    }
  };

  addProductToCart = async (req, res, next) => {
    try {
      const { cid, pid } = req.params;
      const { quantity } = req.body;
      const updatedCart = await this.cartsService.addProductToCart(cid, pid, quantity || 1);
      res.json({ message: "Producto agregado al carrito", cart: updatedCart });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CartsController;
