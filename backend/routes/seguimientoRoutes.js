// backend/routes/seguimientoRoutes.js
const express = require("express");
const {
  obtenerProyectos,
  obtenerTareasPorProyecto,
  crearTarea,
  editarTarea,
  eliminarTarea,
} = require("../controladores/seguimientoController");

const router = express.Router();

// Rutas limpias (sin repetir “seguimiento”)
router.get("/proyectos", obtenerProyectos);
router.get("/proyectos/:id_proyecto/tareas", obtenerTareasPorProyecto);
router.post("/tareas", crearTarea);
router.put("/tareas", editarTarea);
router.delete("/tareas/:id_tarea", eliminarTarea);

module.exports = router;
