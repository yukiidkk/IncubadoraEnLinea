// routes/tiposEventosRoutes.js (o donde tengas definido tu router)

const express = require("express");
const router = express.Router();
const {
    // Funciones del CRUD para Tipos de Eventos
    crearTipoEvento,
    actualizarTipoEvento,
    eliminarTipoEvento,
    obtenerTiposEventos,
    
    // Funciones de relación para Eventos
    obtenerEventosConTipo,
    buscarEventoPorNombre // Renombrada para ser más descriptiva
} = require("../controladores/tipoeventocontrolador"); // ¡Asegúrate que esta ruta sea correcta!

// --- CRUD para la base /api/tipos-eventos ---

// Obtener todos los Tipos de Eventos
router.get("/tipos-eventos", obtenerTiposEventos); 

// Crear nuevo Tipo de Evento
router.post("/tipos-eventos", crearTipoEvento); 

// Actualizar Tipo de Evento por ID
router.put("/tipos-eventos/:id", actualizarTipoEvento); 

// Eliminar Tipo de Evento por ID
router.delete("/tipos-eventos/:id", eliminarTipoEvento);

// --- Rutas para Eventos y su Tipo (Relación) ---

// GET /api/eventos-con-tipo
router.get("/eventos-con-tipo", obtenerEventosConTipo); 

// GET /api/eventos-con-tipo/buscar?nombre=...
router.get("/eventos-con-tipo/buscar", buscarEventoPorNombre); 

module.exports = router;