const fs = require("fs").promises;
const crypto = require("crypto");

class CartsDao {
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

  async #saveFile(carts) {
    await fs.writeFile(this.filePath, JSON.stringify(carts, null, 2), "utf8");
  }

  #generateId() {
    return crypto.randomUUID();
  }

  async getAll() {
    const carts = await this.#readFile();
    return JSON.parse(JSON.stringify(carts));
  }

  async getById(id) {
    const carts = await this.#readFile();
    return carts.find((c) => c.id === id);
  }

  async create(cartData = { products: [] }) {
    const carts = await this.#readFile();
    const newCart = { id: this.#generateId(), ...cartData };
    carts.push(newCart);
    await this.#saveFile(carts);
    return newCart;
  }

  async update(id, updatedCart) {
    const carts = await this.#readFile();
    const index = carts.findIndex((c) => c.id === id);

    if (index === -1) throw new Error("Carrito no encontrado");

    carts[index] = { ...updatedCart, id };
    await this.#saveFile(carts);

    return carts[index];
  }

  async deleteCart(id) {
    const carts = await this.#readFile();
    const filteredCarts = carts.filter((c) => c.id !== id);

    if (carts.length === filteredCarts.length) {
      throw new Error("Carrito no encontrado");
    }

    await this.#saveFile(filteredCarts);
    return id;
  }
}

module.exports = CartsDao;
