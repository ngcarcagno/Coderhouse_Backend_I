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
    // Legacy signature: getAll() -> devolver todos los documentos
    // Para compatibilidad, si se llama sin argumentos devolvemos todos.
    try {
      const products = await Product.find({}, "brand model code size category price stock thumbnails description");
      return products;
    } catch (error) {
      console.error("Error al buscar productos:", error);
      throw new Error("Error al obtener productos");
    }
  }

  // Nueva firma: getAll(options)
  async getAllWithOptions(options = {}) {
    const { limit = 10, page = 1, sort, query, category, brand, size, available } = options;
    try {
      // Si mongoose no está conectado, devolver estructura vacía para evitar buffering timeouts
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        return {
          docs: [],
          totalDocs: 0,
          limit: Number(limit) || 10,
          page: Number(page) || 1,
          totalPages: 1,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        };
      }
      const filter = {};

      // New: accept explicit filters (category, brand, size, available)
      // Support CSV or array values for multi-select filters
      function normalizeMulti(val) {
        if (Array.isArray(val))
          return val
            .map(String)
            .map((s) => s.trim())
            .filter(Boolean);
        if (val === undefined || val === null) return [];
        return String(val)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      const cats = normalizeMulti(category);
      const brands = normalizeMulti(brand);
      const sizes = normalizeMulti(size);
      if (cats.length) filter.category = { $in: cats };
      if (brands.length) filter.brand = { $in: brands };
      if (sizes.length) filter.size = { $in: sizes };
      if (available !== undefined && available !== null && String(available).trim() !== "") {
        const av = String(available).toLowerCase();
        if (av === "true" || av === "available") filter.stock = { $gt: 0 };
        else if (av === "false" || av === "unavailable") filter.stock = { $lte: 0 };
      }

      // Backwards-compat: if 'query' is provided, keep legacy behavior
      if (query !== undefined && query !== null && String(query).trim() !== "" && Object.keys(filter).length === 0) {
        const q = String(query).toLowerCase();
        if (q === "true" || q === "available") {
          filter.stock = { $gt: 0 };
        } else if (q === "false" || q === "unavailable") {
          filter.stock = { $lte: 0 };
        } else {
          // Interpretamos query como category por defecto
          filter.category = query;
        }
      }

      const sortObj = {};
      // Support price and brand sorting. Accept values: price_asc, price_desc, brand_asc, brand_desc, asc, desc (legacy price)
      const s = String(sort || "").toLowerCase();
      if (s === "asc" || s === "price_asc") sortObj.price = 1;
      else if (s === "desc" || s === "price_desc") sortObj.price = -1;
      else if (s === "brand_asc") sortObj.brand = 1;
      else if (s === "brand_desc") sortObj.brand = -1;

      const totalDocs = await Product.countDocuments(filter);
      const lim = Number(limit) > 0 ? Number(limit) : 10;
      const pg = Number(page) > 0 ? Number(page) : 1;
      const totalPages = Math.max(Math.ceil(totalDocs / lim), 1);

      const products = await Product.find(filter, "brand model code size category price stock thumbnails description")
        .sort(sortObj)
        .skip((pg - 1) * lim)
        .limit(lim)
        .lean();

      return {
        docs: products,
        totalDocs,
        limit: lim,
        page: pg,
        totalPages,
        hasPrevPage: pg > 1,
        hasNextPage: pg < totalPages,
        prevPage: pg > 1 ? pg - 1 : null,
        nextPage: pg < totalPages ? pg + 1 : null,
      };
    } catch (error) {
      console.error("Error al buscar productos con opciones:", error);
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

  // Return distinct values for a given field (useful to populate filters)
  async getDistinctValues(field) {
    try {
      if (!field) return [];
      if (!mongoose.connection || mongoose.connection.readyState !== 1) return [];
      const vals = await Product.distinct(field);
      return vals || [];
    } catch (error) {
      console.error("Error getting distinct values for", field, error);
      return [];
    }
  }
}

module.exports = ProductsDaoDB;
