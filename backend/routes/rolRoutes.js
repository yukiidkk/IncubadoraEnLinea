const express = require("express");
const router = express.Router();
const {
    crearRol,
    actualizarRol,
    eliminarRol,
    obtenerRoles // Incluye la obtención de permisos en esta ruta
} = require("../controladores/rolControlador");

// CRUD completo para la base /api/rol
router.get("/roles", obtenerRoles); // GET /api/rol
router.post("/roles", crearRol); // POST /api/rol
router.put("/roles/:id", actualizarRol); // PUT /api/rol/:id
router.delete("/roles/:id", eliminarRol);// DELETE /api/rol/:id

module.exports = router;