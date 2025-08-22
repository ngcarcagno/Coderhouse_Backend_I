const express = require("express");
const router = express.Router();
const config = require("../../config/config");

const CartsDao = require("../dao/carts.dao");
const CartsService = require("../services/carts.service");
const CartsController = require("../controllers/carts.controller");

const cartsDao = new CartsDao(config.getFilePath("carts.json"));
const cartsService = new CartsService(cartsDao);
const cartsController = new CartsController(cartsService);

//Carts Routes
router.post("/", cartsController.createCart);
router.get("/:cid", cartsController.getCartProducts);
router.post("/:cid/product/:pid", cartsController.addProductToCart);

module.exports = router;
