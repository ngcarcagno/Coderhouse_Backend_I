# Desarrollo Backend I - CoderHouse

Este repositorio contiene los proyectos y entregas del curso **Desarrollo Backend I** de **CoderHouse**.

## 📚 Descripción

El curso de Backend I se enfoca en el desarrollo de APIs RESTful usando **Node.js** y **Express**, incluyendo conceptos fundamentales como:

- Creación de servidores HTTP
- Manejo de rutas y middlewares
- Gestión de archivos JSON como base de datos
- Implementación de WebSockets con Socket.IO
- Templating con Handlebars
- Upload de archivos con Multer

## 🏗️ Estructura del Proyecto

```
├── index.js                    # Punto de entrada principal
├── api-server-express/         # API REST con Express
│   ├── server.js              # Configuración del servidor
│   ├── config/                # Configuraciones
│   ├── src/                   # Código fuente
│   │   ├── controllers/       # Controladores
│   │   ├── dao/              # Data Access Objects
│   │   ├── routes/           # Definición de rutas
│   │   └── services/         # Lógica de negocio
│   └── data/                 # Archivos JSON de datos
└── docs/                     # Documentación
```

## 📋 Consignas del Curso

### Entregas Realizadas

- [**Consigna N°1**](./Consigna_N1.md) - Servidor Express con gestión de productos y carritos
- [**Consigna N°2**](./Consigna_N2.md) - Handlebars y WebSockets para vistas dinámicas

## 🚀 Instalación y Uso

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/ngcarcagno/Coderhouse_Backend_I.git
   cd Coderhouse_Backend_I
   ```

2. **Instalar dependencias**

   ```bash
   cd api-server-express
   npm install
   ```

3. **Ejecutar el servidor**

   ```bash
   npm start
   ```

4. **Acceder a la aplicación**
   - API: `http://localhost:8080/api`
   - Vista principal: `http://localhost:8080`
   - Productos en tiempo real: `http://localhost:8080/realtimeproducts`

## 🛠️ Tecnologías Utilizadas

- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **Socket.IO** - WebSockets para comunicación en tiempo real
- **Handlebars** - Motor de plantillas
- **Multer** - Manejo de archivos
- **Nodemon** - Desarrollo con auto-reload

## 📡 Endpoints Principales

### Productos (`/api/products`)

- `GET /` - Obtener todos los productos
- `GET /:id` - Obtener producto por ID
- `POST /` - Crear nuevo producto
- `PUT /:id` - Actualizar producto
- `DELETE /:id` - Eliminar producto

### Carritos (`/api/carts`)

- `POST /` - Crear nuevo carrito
- `GET /:id` - Obtener carrito por ID
- `POST /:cid/product/:pid` - Agregar producto al carrito

## 👨‍💻 Autor

**Nicolas Carcagno**  
Estudiante de Desarrollo Backend I - CoderHouse

## 📄 Licencia

Este proyecto es con fines educativos para el curso de CoderHouse.
