class ProductsController {
  constructor(productsService) {
    this.productsService = productsService;
  }

  getProducts = async (req, res, next) => {
    try {
      // Parse query params for pagination/filter/sort
      const { limit, page, sort, query } = req.query;

      // If the service supports options-based queries, pass them.
      let result;
      try {
        result = (await this.productsService.productsDao?.getAllWithOptions)
          ? await this.productsService.productsDao.getAllWithOptions({ limit, page, sort, query })
          : await this.productsService.getAllProducts();
      } catch (e) {
        // Fallback to service method
        result = await this.productsService.getAllProducts();
      }

      // Normalize result to expected shape
      let docs = [];
      let meta = {
        totalPages: 1,
        prevPage: null,
        nextPage: null,
        page: 1,
        hasPrevPage: false,
        hasNextPage: false,
      };

      if (result) {
        if (result.docs !== undefined) {
          docs = result.docs;
          meta.totalPages = result.totalPages;
          meta.prevPage = result.prevPage;
          meta.nextPage = result.nextPage;
          meta.page = result.page;
          meta.hasPrevPage = result.hasPrevPage;
          meta.hasNextPage = result.hasNextPage;
        } else if (Array.isArray(result)) {
          docs = result;
        }
      }

      // Build prev/next links
      const buildLink = (pageNum) => {
        if (!pageNum) return null;
        const url = new URL(req.protocol + "://" + req.get("host") + req.baseUrl + req.path);
        const params = url.searchParams;
        params.set("page", pageNum);
        if (limit) params.set("limit", limit);
        if (sort) params.set("sort", sort);
        if (query) params.set("query", query);
        return url.toString();
      };

      const response = {
        status: "success",
        payload: docs,
        totalPages: meta.totalPages,
        prevPage: meta.prevPage,
        nextPage: meta.nextPage,
        page: meta.page,
        hasPrevPage: meta.hasPrevPage,
        hasNextPage: meta.hasNextPage,
        prevLink: meta.hasPrevPage ? buildLink(meta.prevPage) : null,
        nextLink: meta.hasNextPage ? buildLink(meta.nextPage) : null,
      };

      res.json(response);
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
