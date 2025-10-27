const express = require("express");
const router = express.Router();
const {
    crearRol,
    actualizarRol,
    eliminarRol,
    obtenerRoles // Incluye la obtención de permisos en esta ruta
} = require("../controladores/rolControlador");

// CRUD completo para la base /api/rol
router.get("/", obtenerRoles); // GET /api/rol
router.post("/", crearRol); // POST /api/rol
router.put("/:id", actualizarRol); // PUT /api/rol/:id
router.delete("/:id", eliminarRol);// DELETE /api/rol/:id

module.exports = router;