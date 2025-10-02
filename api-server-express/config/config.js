const path = require("path");
const dotenv = require("dotenv");

/* // Cargar variables de entorno según el ambiente
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "test"
    ? ".env.test"
    : ".env.development";

dotenv.config({ path: path.join(__dirname, "..", envFile) });

// Validación de variables críticas
const requiredEnvVars = ["NODE_ENV", "PORT", "DB_NAME"];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (missing.length > 0) {
    console.error(`❌ Variables de entorno faltantes: ${missing.join(", ")}`);
    process.exit(1);
  }
};

validateEnvironment(); */

const config = {
  PORT: process.env.PORT || 8080,
  getFilePath: (filename) => path.join(__dirname, `../data/${filename}`),
  paths: {
    views: path.join(__dirname, "../src/views"),
    public: path.join(__dirname, "../public"),
    upload: path.join(__dirname, "../uploads"),
  },

  // Base de datos
  database: {
    port: parseInt(process.env.DB_PORT) || 27017,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    uri: process.env.MONGO_URI,
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
    timeout: parseInt(process.env.DB_TIMEOUT) || 5000,
    socketTimeout: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
  },
};

module.exports = config;
