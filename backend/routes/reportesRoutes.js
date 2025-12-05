const express = require('express');
const router = express.Router();
console.log("ROUTES REPORTES CARGADAS");

// IMPORTA el objeto correctamente
const reportesController = require('../controladores/reportesController');


// Asigna las rutas
router.get('/avances-proyecto', reportesController.getAvancesPorProyecto);
router.get('/proyectos-coordinador', reportesController.getProyectosCoordinador);
router.post('/comentario', reportesController.agregarComentarioAvance);
router.put('/actualizar-progreso', reportesController.actualizarProgresoProyecto);
router.get('/exportar-excel/:id_proyecto', reportesController.generarReporteExcel);
router.get("/emprendedores", reportesController.getReporteEmprendedores);
router.get('/proyectos', reportesController.getReporteProyectos);
router.get('/estadisticas' ,reportesController.getEstadisticas);

//rutas para emprendedor
router.get("/proyectos/usuario/:idUsuario",reportesController.getProyectosDeUsuario);
router.get("/proyectos/:idProyecto", reportesController.getProyecto);
router.get("/proyectos/:idProyecto/avances", reportesController.getAvancesProyecto);
router.post("/proyectos/:idProyecto/avances",reportesController.crearAvance);
router.put("/proyectos/:idProyecto/progreso", reportesController.actualizarProgresoProyecto);


module.exports = router;
