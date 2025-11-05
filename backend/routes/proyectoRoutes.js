const express = require("express");
console.log('🔍 Cargando proyectoRoutes...');

const {
  obtenerProyectos,
  crearProyecto,
  buscarProyecto,
  eliminarProyecto,
  obtenerArchivo
} = require("../controladores/proyectoController");

const router = express.Router();



router.get('/proyectos',obtenerProyectos);
router.post('/crearProyecto',crearProyecto); // ← ESTA ES LA IMPORTANTE
router.get('/buscarProyecto',buscarProyecto);
router.delete('/eliminarProyecto/:id', eliminarProyecto);
router.get('/archivo/:id', obtenerArchivo);
//router.delete("/proyecto/:id", eliminarProyecto);

module.exports = router;


