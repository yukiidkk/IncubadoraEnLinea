const express = require("express");
const router = express.Router();

// Importamos el controlador que acabamos de crear
const controller = require("../controladores/inscripcioneventoControlador");

// Ruta para botón Inscribirse
router.post("/inscripciones", controller.inscribir);

// Ruta para cargar lista Mis Eventos
router.get("/inscripciones/persona/:id_persona", controller.misEventos);

module.exports = router;