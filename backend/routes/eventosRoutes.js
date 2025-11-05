// eventosRoutes.js
// Corregido para seguir el estilo de 'tiposEventosRoutes.js'
// y para funcionar con 'eventoscontrolador.js'

const express = require("express");
const router = express.Router();

// Importamos TODAS las funciones del controlador de eventos
// Asegúrate que el archivo se llame 'eventoscontrolador.js'
const {
    // Funciones CRUD del formulario
    crearEvento,
    actualizarEvento,
    eliminarEvento,
    obtenerEventoPorId,
    
    // Funciones del Panel Derecho (Lista y Búsqueda)
    obtenerEventos,         // Para la lista completa
    buscarEventoPorNombre,  // Para la barra de búsqueda
    
    // Funciones Helper (Dropdowns)
    obtenerCoordinadores
} = require("../controladores/eventoscontrolador.js"); // <-- Ruta al controlador correcto

// --- Rutas del Panel Derecho (Lista y Búsqueda) ---

// GET /api/eventos/buscar?nombre=...
// (Debe ir ANTES de /api/eventos/:id para que no confunda 'buscar' con un ID)
router.get("/eventos/buscar", buscarEventoPorNombre);

// GET /api/eventos (Obtener TODOS los eventos para la tabla)
// (Esto reemplaza a /eventos-con-tipo de tu otro router, ya que hace el JOIN)
router.get("/eventos", obtenerEventos);


// --- Rutas CRUD (Formulario Izquierdo) ---

// POST /api/eventos (Crear nuevo Evento)
router.post("/eventos", crearEvento);

// GET /api/eventos/:id (Obtener un Evento por ID)
router.get("/eventos/:id", obtenerEventoPorId);

// PUT /api/eventos/:id (Actualizar un Evento por ID)
router.put("/eventos/:id", actualizarEvento);

// DELETE /api/eventos/:id (Eliminar un Evento por ID)
router.delete("/eventos/:id", eliminarEvento);


// --- Rutas Helper (Dropdowns del Formulario) ---

// GET /api/usuarios-coordinadores (Para poblar el dropdown de encargados)
router.get("/usuarios-coordinadores", obtenerCoordinadores);


// --- EXPORTAR EL ROUTER ---
// ¡ESTA LÍNEA FALTABA EN TU CÓDIGO!
module.exports = router;
