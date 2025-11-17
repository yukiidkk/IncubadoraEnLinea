const express = require("express");
const Router = express.Router();

const { obtenerTutores } = require("../controladores/tutoriasControlador");

Router.get("/tutores", obtenerTutores);

module.exports = Router;
