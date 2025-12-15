const express = require("express");
const router = express.Router();

const {
    crearEvento, actualizarEvento, eliminarEvento, obtenerEventoPorId,
    obtenerEventos, buscarEventoPorNombre, obtenerCoordinadores,
    inscribirPersonaAEvento, obtenerEventosPorPersona, cancelarInscripcionAEvento,
    obtenerInscritosPorEvento // <--- ESTA ES LA NUEVA
} = require("../controladores/eventosControlador.js"); 

// Eventos
router.get("/eventos/buscar", buscarEventoPorNombre);
router.get("/eventos", obtenerEventos);
router.post("/eventos", crearEvento);
router.get("/eventos/:id", obtenerEventoPorId);
router.put("/eventos/:id", actualizarEvento);
router.delete("/eventos/:id", eliminarEvento);

// Coordinadores
router.get("/solo-coordinadores-reales", obtenerCoordinadores);

// Inscripciones (Usuario)
router.post("/inscripciones", inscribirPersonaAEvento);
router.delete("/inscripciones", cancelarInscripcionAEvento);
router.get("/inscripciones/persona/:id_persona", obtenerEventosPorPersona);

// Lista de Asistencia (Admin) - ESTA ES LA NUEVA RUTA
router.get("/inscripciones/evento/:id_evento", obtenerInscritosPorEvento);
// ... otras rutas ...

// RUTA PARA LISTA DE ASISTENCIA (¿Está esta línea en tu archivo?)
router.get("/inscripciones/evento/:id_evento", obtenerInscritosPorEvento);


module.exports = router;