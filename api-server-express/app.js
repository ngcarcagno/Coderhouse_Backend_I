const express = require("express");
const app = express();
const { paths,PORT } = require("./config/config");

const handlebars = require("express-handlebars");
const multer = require("multer");

//!-------------------------------------
//! ---------- HANDLEBARS --------------
//!-------------------------------------
app.engine(
    "hbs",
    handlebars.engine({
        extname: ".hbs",
        defaultLayout: "main",
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

// Routes
const routes = require("./src/routes/index");
app.use("/api", routes);

// Default route - usando Handlebars
app.get("/", (req, res) => {
  try {
    res.render("pages/home", { title: "API Products" });
  } catch (error) {
    console.error("Error en la ruta raíz:", error);
    res.status(500).send("Error en el servidor");
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

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
