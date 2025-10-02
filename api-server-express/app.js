const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const server = createServer(app);
const io = new Server(server);

const config = require("./config/config");

const handlebars = require("express-handlebars");
const multer = require("multer");

const mongoose = require("mongoose");

// Importar e instanciar servicios para websockets
const ProductsDao = require("./src/dao/products.dao.local");
const ProductsService = require("./src/services/products.service");

const productsDao = new ProductsDao(config.getFilePath("products.json"));
const productsService = new ProductsService(productsDao);

//! ---------- HANDLEBARS --------------
app.engine(
  "hbs",
  handlebars.engine({
    extname: ".hbs",
    defaultLayout: "main",
  })
);
app.set("view engine", "hbs");
app.set("views", config.paths.views);

//! ----------- MULTER -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const originalName = `img-${req.params.id}-${file.originalname}`;
    req.query.filename = originalName;
    cb(null, originalName);
  },
});
const upload = multer({ storage: storage });

//! --------- MIDDLEWARES --------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use((req, res, next) => {
  res.status(404).render("pages/404", { title: "404 - Not Found" });
});

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Error interno en el servidor",
  });
});

//! --------- STATIC FILES -------------
app.use("/static", express.static(config.paths.public));
app.use("/uploads", express.static(config.paths.upload));

//! --------- ROUTES -------------------
const routes = require("./src/routes/index");
app.use("/api", routes);

//! --------- VIEWS (Handlebars) -------
app.get("/", (req, res) => {
  try {
    res.render("pages/home", { title: "API Products" });
  } catch (error) {
    console.error("Error en la ruta raíz:", error);
    res.status(500).send("Error en el servidor");
  }
});

app.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await productsService.getAllProducts();
    res.render("pages/realtimeproducts", {
      title: "Products Real Time",
      products: products,
    });
  } catch (error) {
    console.error("Error en ruta realtimeproducts:", error);
    res.status(500).send("Error en el servidor");
  }
});

//! --------- SOCKET.IO ----------------
app.set("io", io);

io.on("connection", (socket) => {
  // Enviar lista de productos al conectarse
  socket.on("requestProducts", async () => {
    try {
      const products = await productsService.getAllProducts();
      socket.emit("updateProducts", products);
    } catch (error) {
      socket.emit("error", "Error al obtener productos");
    }
  });

  socket.on("addProduct", async (productData) => {
    try {
      const newProduct = await productsService.createProduct(productData);
      const allProducts = await productsService.getAllProducts();
      io.emit("updateProducts", allProducts);
      socket.emit("productAdded", { success: true, product: newProduct });
    } catch (error) {
      socket.emit("productAdded", { success: false, error: error.message });
    }
  });

  socket.on("deleteProduct", async (productId) => {
    try {
      await productsService.deleteProduct(productId);
      const allProducts = await productsService.getAllProducts();
      io.emit("updateProducts", allProducts);
      socket.emit("productDeleted", { success: true, id: productId });
    } catch (error) {
      socket.emit("productDeleted", { success: false, error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Usuario desconectado:", socket.id);
  });
});

//! --------- MongoDB ------------------
mongoose
  .connect(config.database.uri)
  .then(() => console.log("Conexión a MongoDB exitosa"))
  .catch((error) => console.error("Error de conexión a MongoDB:", error));

//! --------- Server Init --------------
server.listen(config.PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${config.PORT}`);
});
