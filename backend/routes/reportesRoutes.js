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
router.get("/estadisticas",reportesController.getEstadisticas);







//Rutas para emprendedor

//lista filtrada
router.get("/proyectos", reportesController.getProyectosFiltrados);
//lista proyectos del usuario
router.get('/proyectos/usuario/:id_usuario', reportesController.getProyectosDeUsuario); // lista proyectos del usuario
// Buscar proyectos por nombre (acepta ?idUsuario= )
router.get('/proyectos/buscar/:nombre', reportesController.buscarProyectoPorNombre);    // acepta ?idUsuario=#
// Obtener un proyecto por ID
router.get("/proyectos/:id", reportesController.getProyectoPorId);
// Obtener avances del proyecto
router.get("/emprendedor/proyectos/:id/avances", reportesController.getAvancesProyectoEmprendedor);
// Crear avance (hito)
router.post("/proyectos/:id/avances", reportesController.crearAvance);
// Crear comentario del emprendedor
router.post("/proyectos/:id/comentarios", reportesController.crearComentario);
// Actualizar progreso del proyecto
router.put("/proyectos/:id/progreso", reportesController.actualizarProgresoProyecto);
// Descargar reporte en Excel
router.get("/proyectos/:id/excel", reportesController.generarReporteExcel);

module.exports = router;
