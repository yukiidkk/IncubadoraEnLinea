const express = require("express");
const Router = express.Router();

const { 
    obtenerTutores,
    obtenerDisponibilidad,
    insertarDisponibilidad,
    actualizarDisponibilidad,
    eliminarDisponibilidad
} = require("../controladores/tutoriasControlador");

Router.get("/tutores", obtenerTutores);
Router.get("/disponibilidad", obtenerDisponibilidad);
Router.post("/disponibilidad", insertarDisponibilidad);
Router.put("/disponibilidad", actualizarDisponibilidad);
Router.delete("/disponibilidad", eliminarDisponibilidad);


module.exports = Router;