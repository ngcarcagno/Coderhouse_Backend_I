const express = require("express");
const router = express.Router();

const productsRoutes = require("./products.routes");
const cartsRoutes = require("./carts.routes");

router.use("/products", productsRoutes);
router.use("/carts", cartsRoutes);

module.exports = router;