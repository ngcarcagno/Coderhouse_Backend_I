class ProductsService {
  constructor(productsDao) {
    this.productsDao = productsDao;
  }

  async getAllProducts() {
    return await this.productsDao.getAll();
  }

  async getBookById(id) {
    if (!id) throw new Error("ID requerido");
    return await this.productsDao.getById(id);
  }

  async createBook(bookData) {
    const requiredFields = ["title", "author", "price", "stock"];
    const missingFields = requiredFields.filter((field) => !bookData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(", ")}`);
    }

    return await this.productsDao.create(bookData);
  }

  async updateBook(id, updateData) {
    if (!id) throw new Error("ID requerido");
    const existing = await this.productsDao.getById(id);
    if (!existing) throw new AppError("Libro no encontrado", 404);
    return await this.productsDao.update(id, updateData);
  }

  async deleteBook(id) {
    if (!id) throw new Error("ID requerido");
    const existing = await this.productsDao.getById(id);
    if (!existing) throw new AppError("Libro no encontrado", 404);
    return await this.productsDao.delete(id);
  }
}

module.exports = ProductsService;
