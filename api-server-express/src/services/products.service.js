class ProductsService {
  constructor(productsDao) {
    this.productsDao = productsDao;
  }

  async getAllProducts() {
    return await this.productsDao.getAll();
  }

  async getProductById(id) {
    if (!id) throw new Error("ID requerido");
    return await this.productsDao.getById(id);
  }

  async createProduct(productData) {
    const requiredFields = ["title", "description", "code", "price", "status", "stock", "category", "thumbnails"];
    const missingFields = requiredFields.filter((field) => !productData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(", ")}`);
    }

    return await this.productsDao.create(productData);
  }

  async updateProduct(id, updateData) {
    if (!id) throw new Error("ID requerido");
    const existing = await this.productsDao.getById(id);
    if (!existing) throw new AppError("Libro no encontrado", 404);
    return await this.productsDao.update(id, updateData);
  }

  async deleteProduct(id) {
    if (!id) throw new Error("ID requerido");
    const existing = await this.productsDao.getById(id);
    if (!existing) throw new AppError("Libro no encontrado", 404);
    return await this.productsDao.delete(id);
  }
}

module.exports = ProductsService;
