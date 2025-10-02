const express = require("express");
const router = express.Router();
const config = require("../../config/config");

const CartsService = require("../services/carts.service");
const CartsController = require("../controllers/carts.controller");

// Usar implementación MongoDB por defecto
const CartsDaoDB = require("../dao/carts.dao.db");
const cartsDao = new CartsDaoDB();
// const CartsDao = require("../dao/carts.dao.local");
// const cartsDao = new CartsDao(config.getFilePath("carts.json"));

const cartsService = new CartsService(cartsDao);
const cartsController = new CartsController(cartsService);

// Carts Routes
router.post("/", cartsController.createCart);
router.get("/:cid", cartsController.getCartProducts);
router.post("/:cid/product/:pid", cartsController.addProductToCart);

router.delete("/:cid/products/:pid", cartsController.removeProductFromCart);
router.put("/:cid", cartsController.replaceCartProducts);
router.put("/:cid/products/:pid", cartsController.updateProductQuantity);
router.delete("/:cid", cartsController.clearCart);

module.exports = router;
