const express = require("express");
const {
  obtenerProyectos,
  crearProyecto,
  buscarProyecto,
  eliminarProyecto,
  obtenerArchivo
} = require("../controladores/proyectoController");

const router = express.Router();

router.get("/proyectos", obtenerProyectos);
router.post("/crearProyecto", crearProyecto);
router.get("/buscarProyecto", buscarProyecto);
router.delete("/proyecto/:id", eliminarProyecto);

module.exports = router;
