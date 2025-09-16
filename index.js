const server = require("./api-server-express/server");
const { PORT } = require("./api-server-express/config/config");

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
