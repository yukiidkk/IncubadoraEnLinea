const express = require("express");
const router = express.Router();
const {
  buscarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerEspecialidades,
  obtenerJornadas,
  obtenerEstadosCiviles,
  obtenerGeneros
} = require("../controladores/gestionUsuariosController");

// CRUD
router.get("/usuarios/buscar", buscarUsuarios);
router.post("/usuarios", crearUsuario);
router.put("/usuarios/:id", actualizarUsuario);
router.delete("/usuarios/:id", eliminarUsuario);

// Catálogos
router.get("/usuarios/especialidades", obtenerEspecialidades);
router.get("/usuarios/jornadas", obtenerJornadas);
router.get("/usuarios/estados-civiles", obtenerEstadosCiviles);
router.get("/usuarios/generos", obtenerGeneros);

module.exports = router;
