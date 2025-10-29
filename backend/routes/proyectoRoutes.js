const express = require("express");
const {
  obtenerProyectos,
  crearProyecto,
  buscarProyecto,
  eliminarProyecto,
} = require("../controladores/proyectoController");

const router = express.Router();

router.get("/obtenerProyectos", obtenerProyectos);
router.post("/crearProyecto", crearProyecto);
router.get("/buscarProyecto", buscarProyecto);
router.delete("/:id", eliminarProyecto);

module.exports = router;
