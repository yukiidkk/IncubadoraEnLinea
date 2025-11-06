const express = require("express");
console.log("Cargando proyectoRoutes...");

const proyectoController = require("../controladores/proyectoController"); // IMPORTA TODO EL CONTROLADOR

const router = express.Router();

router.get("/usuarios", proyectoController.obtenerUsuarios);
router.get("/proyectos", proyectoController.obtenerProyectos);
router.post("/crearProyecto", proyectoController.crearProyecto);
router.get("/buscarProyecto", proyectoController.buscarProyecto);
router.delete("/eliminarProyecto/:id", proyectoController.eliminarProyecto);
router.get("/archivo/:id", proyectoController.obtenerArchivo);
router.get("/proyectos/:id_usuario", proyectoController.obtenerProyectosPorUsuario);

module.exports = router;
