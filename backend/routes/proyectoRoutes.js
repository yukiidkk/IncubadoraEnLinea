const express = require("express");

import {
  obtenerProyectos,
  crearProyecto,
  buscarProyecto,
  eliminarProyecto,
} from "../controladores/proyectoController.js";

const router = express.Router();

router.get("/obtenerProyectos", obtenerProyectos);
router.post("/crearProyectos", crearProyecto);
router.get("/buscarProyecto", buscarProyecto);
router.delete("/:Id_Proyecto", eliminarProyecto);

module.exports = router;
