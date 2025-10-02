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

  // Nueva firma compatible con la implementacion en Mongo
  async getAllWithOptions(options = {}) {
    const { limit = 10, page = 1, sort, query } = options;
    const all = await this.#readFile();

    // Filtrado
    let filtered = all;
    if (query !== undefined && query !== null && String(query).trim() !== "") {
      const q = String(query).toLowerCase();
      if (q === "true" || q === "available") {
        filtered = filtered.filter((p) => Number(p.stock) > 0);
      } else if (q === "false" || q === "unavailable") {
        filtered = filtered.filter((p) => Number(p.stock) <= 0);
      } else {
        filtered = filtered.filter((p) => String(p.category).toLowerCase() === q);
      }
    }

    // Ordenamiento por precio
    if (sort === "asc") filtered.sort((a, b) => a.price - b.price);
    else if (sort === "desc") filtered.sort((a, b) => b.price - a.price);

    const lim = Number(limit) > 0 ? Number(limit) : 10;
    const pg = Number(page) > 0 ? Number(page) : 1;
    const totalDocs = filtered.length;
    const totalPages = Math.max(Math.ceil(totalDocs / lim), 1);

    const start = (pg - 1) * lim;
    const docs = filtered.slice(start, start + lim);

    return {
      docs,
      totalDocs,
      limit: lim,
      page: pg,
      totalPages,
      hasPrevPage: pg > 1,
      hasNextPage: pg < totalPages,
      prevPage: pg > 1 ? pg - 1 : null,
      nextPage: pg < totalPages ? pg + 1 : null,
    };
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
