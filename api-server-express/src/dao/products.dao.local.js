const fs = require("fs").promises;
const crypto = require("crypto");

class ProductsDaoLocal {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async #readFile() {
    try {
      const data = await fs.readFile(this.filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        await this.#saveFile([]);
        return [];
      }
      throw error;
    }
  }

  async #saveFile(products) {
    await fs.writeFile(this.filePath, JSON.stringify(products, null, 2), "utf8");
  }

  #generateId() {
    return crypto.randomUUID();
  }

  async getAll() {
    const products = await this.#readFile();
    return JSON.parse(JSON.stringify(products));
  }

  async getById(id) {
    const products = await this.#readFile();
    return products.find((b) => b.id === id);
  }

  async create(product) {
    const products = await this.#readFile();
    const newProduct = { ...product, id: this.#generateId() };
    products.push(newProduct);
    await this.#saveFile(products);
    return newProduct;
  }

  async update(id, updatedFields) {
    const products = await this.#readFile();
    const index = products.findIndex((b) => b.id === id);

    if (index === -1) throw new Error("Producto no encontrado");

    const updatedProduct = {
      ...products[index],
      ...updatedFields,
      id, // Asegura que el ID no se modifique
    };

    products[index] = updatedProduct;
    await this.#saveFile(products);
    return updatedProduct;
  }

  async delete(id) {
    const products = await this.#readFile();
    const filteredProducts = products.filter((b) => b.id !== id);

    if (products.length === filteredProducts.length) {
      throw new Error("Producto no encontrado");
    }

    await this.#saveFile(filteredProducts);
    return id;
  }
}

module.exports = ProductsDaoLocal;
