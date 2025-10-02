const express = require("express");
const router = express.Router();
const config = require("../../config/config");

const ProductsDao = require("../dao/products.dao.local");
const ProductsService = require("../services/products.service");
const ProductsController = require("../controllers/products.controller");

const productsDao = new ProductsDao(config.getFilePath("products.json"));
const productsService = new ProductsService(productsDao);
const productsController = new ProductsController(productsService);

router.get("/", productsController.getProducts);
router.get("/:pid", productsController.getProductById);
router.post("", productsController.createProduct);
router.put("/:pid", productsController.updateProduct);
router.delete("/:pid", productsController.deleteProduct);

module.exports = router;
