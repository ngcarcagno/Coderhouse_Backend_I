class ProductsController {
  constructor(productsService) {
    this.productsService = productsService;
  }

  getProducts = async (req, res, next) => {
    try {
      const products = await this.productsService.getAllProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req, res, next) => {
    try {
      const { pid } = req.params;
      const product = await this.productsService.getProductById(pid);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req, res, next) => {
    try {
      const newProduct = await this.productsService.createProduct(req.body);

      // Emitir actualización vía websocket si está disponible
      const io = req.app.get("io");
      if (io) {
        const allProducts = await this.productsService.getAllProducts();
        io.emit("updateProducts", allProducts);
      }

      res.status(201).json(newProduct);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req, res, next) => {
    try {
      const { pid } = req.params;
      const updatedProduct = await this.productsService.updateProduct(pid, req.body);

      // Emitir actualización vía websocket si está disponible
      const io = req.app.get("io");
      if (io) {
        const allProducts = await this.productsService.getAllProducts();
        io.emit("updateProducts", allProducts);
      }

      res.json(updatedProduct);
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req, res, next) => {
    try {
      const { pid } = req.params;
      const deletedId = await this.productsService.deleteProduct(pid);

      // Emitir actualización vía websocket si está disponible
      const io = req.app.get("io");
      if (io) {
        const allProducts = await this.productsService.getAllProducts();
        io.emit("updateProducts", allProducts);
      }

      res.json({ pid: deletedId, message: "Producto eliminado" });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = ProductsController;
