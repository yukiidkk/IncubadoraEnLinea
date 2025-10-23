// backend/routes/loginRoutes.js
const express = require("express");
const router = express.Router();
const { login } = require("../controladores/loginController");

// Ruta para el login
router.post("/login", login);

module.exports = router;
