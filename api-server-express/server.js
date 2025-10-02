const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const server = createServer(app);
const io = new Server(server);

const config = require("./config/config");
const { paths } = config;

const handlebars = require("express-handlebars");
const multer = require("multer");
const mongoose = require("mongoose");

// Importar e instanciar servicios para websockets (usar DAO Mongo)
const ProductsDaoDB = require("./src/dao/products.dao.db");
const ProductsService = require("./src/services/products.service");

// Conectar a MongoDB antes de instanciar DAOs que lo usen
if (config.database && config.database.uri) {
  mongoose
    .connect(config.database.uri, {
      maxPoolSize: config.database.maxPoolSize || 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: config.database.socketTimeout || 45000,
    })
    .then(() => console.log("Conexión a MongoDB exitosa"))
    .catch((error) => console.error("Error de conexión a MongoDB:", error.message || error));
} else {
  console.warn(
    "Warning: config.database.uri no está definido. La app seguirá funcionando con DAOs locales si están habilitados."
  );
}

// Instanciamos el DAO basado en MongoDB. Si querés volver al local, reemplaza por products.dao.local
const productsDao = new ProductsDaoDB();
const productsService = new ProductsService(productsDao);

// -------------------------
// Helpers / small utilities
// -------------------------
// Normaliza un resultado que puede ser: array, objeto paginado { docs, ... } o { payload: [...] }
function extractDocs(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (result.docs !== undefined && Array.isArray(result.docs)) return result.docs;
  if (result.payload !== undefined && Array.isArray(result.payload)) return result.payload;
  return [];
}

//!-------------------------------------
//! ---------- HANDLEBARS --------------
//!-------------------------------------
app.engine(
  "hbs",
  handlebars.engine({
    extname: ".hbs",
    defaultLayout: "main",
    // Register small helpers used by the templates
    helpers: {
      // concat helper: joins all provided arguments into a single string
      concat: function (...args) {
        // Handlebars passes an options object as the last arg; remove it
        if (args.length && typeof args[args.length - 1] === "object") args.pop();
        return args.join("");
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", paths.views);

//!-------------------------------------
//! ----------- MULTER -----------------
//!-------------------------------------

// const upload = multer({ dest: "uploads/" }); // config simple por defecto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  // * ACA usamos este filename para renombrar el path 82376786981243 -> img-44-simple.jpg
  filename: (req, file, cb) => {
    const originalName = `img-${req.params.id}-${file.originalname}`;
    //* Lo guardamos en el objeto req.query para usarlo en el controlador
    req.query.filename = originalName;
    cb(null, originalName);
  },
});

const upload = multer({ storage: storage });

//!-------------------------------------
//! --------- MIDDLEWARES --------------
//!-------------------------------------
// SIEMPRE VAN ARRIBA DE LAS RUTAS, SE APLICA A TODO LO QUE ESTA DEBAJO
// SI NO QUIERO QUE SE APLIQUE A TODAS LAS RUTAS NO USO .USE Y SOLO LO SUMO EN LA RUTA ESPECIFICA

app.use(express.json()); // Middleware to parse JSON
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded data
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); // Middleware for CORS

//* Static
//* Todos nuestros archivos ESTATICOS (html, css, img, etc)
// que se encuentran en la carpeta 'public' sen van a servir en /static
app.use("/static", express.static(paths.public));
app.use("/uploads", express.static(paths.upload));

// Hacer io disponible globalmente para los controladores
app.set("io", io);

// Routes
const routes = require("./src/routes/index");
app.use("/api", routes);

// Ruta para la vista estática de productos
app.get("/", (req, res) => {
  try {
    res.render("pages/home", { title: "API Products" });
  } catch (error) {
    console.error("Error en la ruta raíz:", error);
    res.status(500).send("Error en el servidor");
  }
});

// Ruta para la vista de productos en tiempo real
app.get("/realtimeproducts", async (req, res) => {
  try {
    // Para la vista en tiempo real queremos TODOS los productos.
    // Si el DAO dispone del método legacy getAll() lo usamos (devuelve todos los docs),
    // sino pedimos al service (que puede devolver un objeto paginado con limit=10 por defecto).
    let productsRaw;
    if (productsService && productsService.productsDao && typeof productsService.productsDao.getAll === "function") {
      productsRaw = await productsService.productsDao.getAll();
    } else {
      productsRaw = await productsService.getAllProducts();
    }

    const products = extractDocs(productsRaw);

    res.render("pages/realtimeproducts", { title: "Products Real Time", products });
  } catch (error) {
    console.error("Error en ruta realtimeproducts:", error);
    res.status(500).send("Error en el servidor");
  }
});

// Vista pública de productos con paginación
app.get("/products", async (req, res) => {
  try {
    const { limit, page, sort, query, category, brand, size, available } = req.query;
    let products;
    if (
      productsService &&
      productsService.productsDao &&
      typeof productsService.productsDao.getAllWithOptions === "function"
    ) {
      products = await productsService.productsDao.getAllWithOptions({
        limit,
        page,
        sort,
        query,
        category,
        brand,
        size,
        available,
      });
    } else {
      // fallback to legacy behavior
      products = await productsService.getAllProducts();
      if (products && products.docs !== undefined) products = products.docs;
      if (!Array.isArray(products)) products = Array.isArray(products.payload) ? products.payload : [];
      products = { docs: products, limit: Number(limit) || 10, page: Number(page) || 1, totalPages: 1 };
    }

    // Normalize meta for the template
    const meta = {
      totalDocs: 0,
      limit: Number(limit) || (products && products.limit) || 10,
      page: Number(page) || (products && products.page) || 1,
      totalPages: (products && products.totalPages) || 1,
      hasPrevPage: products && products.hasPrevPage,
      hasNextPage: products && products.hasNextPage,
      prevPage: products && products.prevPage,
      nextPage: products && products.nextPage,
    };

    if (products && products.docs !== undefined) {
      meta.totalDocs = products.totalDocs || products.docs.length || 0;
      meta.currentCount = products.docs.length;
      const pg = meta.page;
      const lim = meta.limit;
      meta.showingFrom = meta.totalDocs === 0 ? 0 : (pg - 1) * lim + 1;
      meta.showingTo = Math.min(pg * lim, meta.totalDocs);
    } else if (Array.isArray(products)) {
      meta.totalDocs = products.length;
      meta.currentCount = products.length;
      meta.showingFrom = products.length === 0 ? 0 : 1;
      meta.showingTo = products.length;
      // wrap into docs for template compatibility
      products = { docs: products, limit: meta.limit, page: meta.page, totalPages: meta.totalPages };
    }

    // Build prevLink / nextLink preserving query params
    const baseUrl = req.path;
    const q = { ...req.query };
    const makeLink = (p) => {
      const qp = new URLSearchParams({ ...q, page: p, limit: meta.limit }).toString();
      return `${baseUrl}?${qp}`;
    };

    const prevLink = meta.hasPrevPage ? makeLink(meta.prevPage) : null;
    const nextLink = meta.hasNextPage ? makeLink(meta.nextPage) : null;

    // Also fetch distinct brands/categories to populate filters server-side
    try {
      const brands =
        productsService &&
        productsService.productsDao &&
        typeof productsService.productsDao.getDistinctValues === "function"
          ? await productsService.productsDao.getDistinctValues("brand")
          : [];
      const categories =
        productsService &&
        productsService.productsDao &&
        typeof productsService.productsDao.getDistinctValues === "function"
          ? await productsService.productsDao.getDistinctValues("category")
          : [];
      res.render("pages/products", {
        title: "Products",
        products,
        meta,
        prevLink,
        nextLink,
        showCart: true,
        filters: { brands, categories },
      });
    } catch (ferr) {
      console.warn("Could not fetch distinct filter values", ferr);
      res.render("pages/products", { title: "Products", products, meta, prevLink, nextLink, showCart: true });
    }
  } catch (error) {
    console.error("Error rendering products view:", error);
    res.status(500).send("Error loading products");
  }
});

// Product detail page (server-rendered)
app.get("/products/:pid", async (req, res) => {
  try {
    const pid = req.params.pid;
    const product = await productsService.getProductById(pid);
    if (!product) return res.status(404).render("pages/404", { title: "Producto no encontrado" });
    res.render("pages/product", { product, title: `${product.brand} ${product.model}` });
  } catch (err) {
    console.error("Error rendering product detail:", err);
    res.status(500).send("Error loading product");
  }
});

// Cart page (server-rendered)
const CartsDaoDB = require("./src/dao/carts.dao.db");
const CartsService = require("./src/services/carts.service");
const cartsDaoForViews = new CartsDaoDB();
const cartsServiceForViews = new CartsService(cartsDaoForViews);
app.get("/carts/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const cart = await cartsServiceForViews.getCartById(cid);
    if (!cart) return res.status(404).render("pages/404", { title: "Carrito no encontrado" });
    res.render("pages/cart", { cart, title: "Carrito" });
  } catch (err) {
    console.error("Error rendering cart page:", err);
    res.status(500).send("Error loading cart");
  }
});

// Ruta para subir una imagen asociada a un producto (usada por el formulario en la vista)
app.post("/products/:id/upload", upload.single("thumbnail"), async (req, res) => {
  try {
    const pid = req.params.id;
    if (!req.file) return res.status(400).send("No file uploaded");

    // URL pública donde se sirve la imagen
    const publicUrl = `/uploads/${req.file.filename}`;

    // Actualizamos el producto agregando la imagen al array thumbnails
    if (productsService && productsService.productsDao && typeof productsService.productsDao.update === "function") {
      const existing = await productsService.productsDao.getById(pid);
      if (!existing) return res.status(404).send("Product not found");

      const thumbs = Array.isArray(existing.thumbnails) ? existing.thumbnails.slice() : [];
      thumbs.unshift(publicUrl); // añadimos al inicio

      await productsService.productsDao.update(pid, { thumbnails: thumbs });
      return res.redirect("/products");
    }

    return res.status(500).send("Upload handler not available");
  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    return res.status(500).send("Error uploading file");
  }
});

//* Middleware para 404 - usando Handlebars
app.use((req, res, next) => {
  res.status(404).render("pages/404", { title: "404 - Not Found" });
});

//* Middleware de manejo de errores - para capturar errores no manejados
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Error interno en el servidor",
  });
});

// Configuración de Socket.io
io.on("connection", (socket) => {
  console.log("🔌 Usuario conectado:", socket.id);

  // Enviar lista de productos al conectarse
  socket.on("requestProducts", async () => {
    try {
      const raw =
        productsService && productsService.productsDao && typeof productsService.productsDao.getAll === "function"
          ? await productsService.productsDao.getAll()
          : await productsService.getAllProducts();
      socket.emit("updateProducts", extractDocs(raw));
    } catch (error) {
      socket.emit("error", "Error al obtener productos");
    }
  });

  // Agregar producto
  socket.on("addProduct", async (productData) => {
    try {
      const newProduct = await productsService.createProduct(productData);
      const raw =
        productsService && productsService.productsDao && typeof productsService.productsDao.getAll === "function"
          ? await productsService.productsDao.getAll()
          : await productsService.getAllProducts();
      io.emit("updateProducts", extractDocs(raw));
      socket.emit("productAdded", { success: true, product: newProduct });
    } catch (error) {
      socket.emit("productAdded", { success: false, error: error.message });
    }
  });

  // Eliminar producto
  socket.on("deleteProduct", async (productId) => {
    try {
      await productsService.deleteProduct(productId);
      const raw =
        productsService && productsService.productsDao && typeof productsService.productsDao.getAll === "function"
          ? await productsService.productsDao.getAll()
          : await productsService.getAllProducts();
      io.emit("updateProducts", extractDocs(raw));
      socket.emit("productDeleted", { success: true, id: productId });
    } catch (error) {
      socket.emit("productDeleted", { success: false, error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado:", socket.id);
  });
});

// Exportar el server para que pueda ser iniciado desde index.js
module.exports = server;
