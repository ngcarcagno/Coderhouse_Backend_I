const express = require("express");
const app = express();
const PORT = 8080;

const productsRoutes = require("./src/routes/products.routes");
const cartsRoutes = require("./src/routes/carts.routes");

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));
// Middleware for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Routes
app.use("/api/products", productsRoutes);
app.use("/api/carts", cartsRoutes);

// Default route
app.get("/", (req, res) => {
  try {
    const styles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          margin: 0;
          padding: 0;
          background-color: #f4f4f9;
          color: #333;
        }
        header {
          background-color: #4a90e2;
          color: white;
          padding: 20px;
        }
        h1 {
          margin: 0;
        }
        .container {
          margin-top: 60px;
        }
        button {
          padding: 12px 24px;
          margin: 10px;
          font-size: 16px;
          cursor: pointer;
          border: none;
          border-radius: 5px;
          background-color: #4a90e2;
          color: white;
          transition: background 0.3s;
        }
        button:hover {
          background-color: #357abd;
        }
      </style>
    `;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>API Products</title>
        ${styles}
      </head>
      <body>
        <header>
          <h1>Welcome to API</h1>
        </header>
        <div class="container">
          <button onclick="location.href='/api/products'">Go to Products</button>
          <button onclick="location.href='/api/carts'">Go to Carts</button>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Error en la ruta raíz:", error);
    res.status(500).send("Error en el servidor");
  }
});

//* Middleware para 404
app.use((req, res, next) => {
  const styles = `
    body {
      font-family: Arial, sans-serif;
      background-color: #f8f9fa;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    a {
      margin-top: 15px;
      text-decoration: none;
      padding: 10px 20px;
      background-color: #4a90e2;
      color: white;
      border-radius: 5px;
      transition: background 0.3s;
    }
    a:hover {
      background-color: #357abd;
    }
  `;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>404 - Not Found</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="container">
        <h1>404 - Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/">Back to Home</a>
      </div>
    </body>
    </html>
  `;

  res.status(404).send(html);
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
