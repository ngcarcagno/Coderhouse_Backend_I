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
      // Return full cart object (with populated products) to the client
      const cart = await this.cartsService.getCartById(cid);
      res.json(cart);
    } catch (error) {
      next(error);
    }
  };

  addProductToCart = async (req, res, next) => {
    try {
      const { cid, pid } = req.params;
      const qty = req.body && req.body.quantity ? Number(req.body.quantity) : 1;
      const updatedCart = await this.cartsService.addProductToCart(cid, pid, qty);
      res.json({ message: "Producto agregado al carrito", cart: updatedCart });
    } catch (error) {
      next(error);
    }
  };

  // Eliminar producto seleccionado del carrito
  removeProductFromCart = async (req, res, next) => {
    try {
      const { cid, pid } = req.params;
      const updatedCart = await this.cartsService.removeProductFromCart(cid, pid);
      res.json({ message: "Producto eliminado del carrito", cart: updatedCart });
    } catch (error) {
      // Map common errors to HTTP statuses
      if (error.message && /no encontrado/i.test(error.message))
        return res.status(404).json({ success: false, message: error.message });
      if (error.message && /id.*requerido|id.*no válido/i.test(error.message))
        return res.status(400).json({ success: false, message: error.message });
      next(error);
    }
  };

  // Reemplazar todos los productos del carrito con un arreglo
  replaceCartProducts = async (req, res, next) => {
    try {
      const { cid } = req.params;
      const productsArray = req.body; // esperar [{ product: pid, quantity: N }, ...]
      const updatedCart = await this.cartsService.replaceCartProducts(cid, productsArray);
      res.json({ message: "Carrito actualizado", cart: updatedCart });
    } catch (error) {
      next(error);
    }
  };

  // Actualizar sólo la cantidad de un producto en el carrito
  updateProductQuantity = async (req, res, next) => {
    try {
      const { cid, pid } = req.params;
      const { quantity } = req.body;
      const updatedCart = await this.cartsService.updateProductQuantity(cid, pid, quantity);
      res.json({ message: "Cantidad actualizada", cart: updatedCart });
    } catch (error) {
      if (error.message && /no encontrado/i.test(error.message))
        return res.status(404).json({ success: false, message: error.message });
      if (error.message && /quantity.*requerido|id.*requerido|id carrito no válido/i.test(error.message))
        return res.status(400).json({ success: false, message: error.message });
      next(error);
    }
  };

  // Eliminar todos los productos del carrito
  clearCart = async (req, res, next) => {
    try {
      const { cid } = req.params;
      const updatedCart = await this.cartsService.clearCart(cid);
      res.json({ message: "Carrito vaciado", cart: updatedCart });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = CartsController;
