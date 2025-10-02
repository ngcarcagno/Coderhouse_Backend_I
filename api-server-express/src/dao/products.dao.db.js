const Product = require("../models/product.model");
const mongoose = require("mongoose");

class ProductsDaoDB {
  async create(data) {
    try {
      if (!data) throw new Error("Datos de producto no proporcionados");
      const newProduct = new Product(data);
      await newProduct.save();
      return newProduct;
    } catch (error) {
      console.error("Error creando producto:", error);
      throw new Error("Error al crear producto");
    }
  }

  async getAll() {
    try {
      const products = await Product.find({}, "brand model code size category price stock thumbnails");
      return products;
    } catch (error) {
      console.error("Error al buscar productos:", error);
      throw new Error("Error al obtener productos");
    }
  }

  async getById(id) {
    try {
      if (!id) throw new Error("ID no proporcionado");
      const product = await Product.findById(id);
      return product;
    } catch (error) {
      console.error("Error obteniendo producto:", error);
      return null;
    }
  }

  async update(id, data) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("ID no válido");
      }
      const updateProduct = await Product.findByIdAndUpdate(id, data, { new: true });
      return updateProduct;
    } catch (error) {
      console.error("Error actualizando:", error);
      throw new Error("Error al actualizar");
    }
  }

  async delete(id) {
    try {
      const productDelete = await Product.findByIdAndDelete(id);
      return productDelete;
    } catch (error) {
      console.error("Error eliminando:", error.message);
      return null;
    }
  }
}

module.exports = ProductsDaoDB;
