const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const config = require("../config/config");
const Product = require("../src/models/product.model");

async function run() {
  const uri = config.database.uri;
  if (!uri) {
    console.error("MONGO_URI no definido en config. Setea la variable de entorno MONGO_URI o config.database.uri");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Conectado a MongoDB");

  const filePath = config.getFilePath("products.json");
  const raw = await fs.readFile(filePath, "utf8");
  const products = JSON.parse(raw);

  for (const p of products) {
    try {
      // Helper: eliminar acentos
      const removeAccents = (s = "") =>
        String(s)
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .replace(/[\u0300-\u036f]/g, "");

      // Extraer size desde el title si es posible (ej: 205/55 R16)
      const title = String(p.title || "").trim();
      const sizeMatch = title.match(/(\d{2,4}\/\d{2}\s*R\d{2,3})/i);
      const sizeFromTitle = sizeMatch ? sizeMatch[1] : null;

      // Dividir brand y model a partir del title (brand = primer token, model = resto antes del size)
      let brand = p.brand || "";
      let model = p.model || "";
      if (!brand || !model) {
        let rest = title;
        if (sizeFromTitle) rest = title.replace(sizeFromTitle, "").trim();
        const parts = rest.split(/\s+/);
        if (parts.length > 0) {
          brand = brand || parts[0];
          model = model || parts.slice(1).join(" ") || parts[0];
        }
      }

      // Normalizar y quitar acentos de brand/model/category
      brand = removeAccents(brand);
      model = removeAccents(model);
      const category = removeAccents(p.category || "");

      // Mapear campos del JSON a nuestro esquema Neumatic
      const resolvedSize = String(sizeFromTitle || p.size || "UNSPEC").trim() || "UNSPEC";
      const doc = {
        brand: brand || "Unknown",
        model: model || "Unknown",
        code: p.code || p.id || undefined,
        size: resolvedSize,
        category: category || "",
        price: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        thumbnails: Array.isArray(p.thumbnails) ? p.thumbnails : [],
      };

      if (!doc.code) {
        // si no hay code, generar con title
        doc.code = `IMPORTED-${Math.random().toString(36).slice(2, 9)}`;
      }

      // Upsert por code
      const existing = await Product.findOne({ code: doc.code });
      if (existing) {
        await Product.updateOne({ _id: existing._id }, { $set: doc });
        console.log(`Actualizado: ${doc.code}`);
      } else {
        // Log más claro antes del create para facilitar debug si falla la validación
        console.log("Creando producto con doc:", {
          code: doc.code,
          brand: doc.brand,
          model: doc.model,
          size: doc.size,
          price: doc.price,
          stock: doc.stock,
        });
        await Product.create(doc);
        console.log(`Insertado: ${doc.code}`);
      }
    } catch (err) {
      console.error("Error insertando producto", p, err.message);
    }
  }

  await mongoose.disconnect();
  console.log("Importación finalizada");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
