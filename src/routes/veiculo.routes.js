const { Router } = require("express");

const fipeMiddleware = require("../middlewares/fipe.middleware");
const fipeController = require("../controllers/fipe.controller");

const router = Router()

router.get("/placa/:placa", fipeMiddleware.getPlaca, fipeController.getPlaca)
router.get("/fipe/:tipo/:placa", fipeMiddleware.getFipe, fipeController.getFipe)
router.get("/fipe/:tipo/:marca/:modelo/:ano/:combustivel", fipeController.getPreco)

module.exports = router