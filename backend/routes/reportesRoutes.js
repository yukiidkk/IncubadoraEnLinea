const express = require('express');
const router = express.Router();

// IMPORTA el objeto correctamente
const reportesController = require('../controladores/reportesController');

// Asigna las rutas
router.get('/reportes/avances-proyecto', reportesController.getAvancesPorProyecto);
router.get('/reportes/proyectos-coordinador', reportesController.getProyectosCoordinador);
router.post('/reportes/comentario', reportesController.agregarComentarioAvance);
router.put('/reportes/actualizar-progreso', reportesController.actualizarProgresoProyecto);
router.get('/reportes/exportar-excel/:id_proyecto', reportesController.generarReporteExcel);
router.get('/reportes/emprendedores', reportesController.getReporteEmprendedores);
module.exports = router;
