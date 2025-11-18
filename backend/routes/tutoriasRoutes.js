const express = require("express");
const Router = express.Router();

const { 
    obtenerTutores,
    obtenerDisponibilidad,
    insertarDisponibilidad,
    actualizarDisponibilidad,
    eliminarDisponibilidad,
    obtenerEmprendedores,
    obtenerProyectos
} = require("../controladores/tutoriasControlador");

Router.get("/tutores", obtenerTutores);
Router.get("/disponibilidad", obtenerDisponibilidad);
Router.post("/disponibilidad", insertarDisponibilidad);
Router.put("/disponibilidad", actualizarDisponibilidad);
Router.delete("/disponibilidad", eliminarDisponibilidad);
Router.get("/emprendedores", obtenerEmprendedores);
Router.get("/proyectos/:id_emprendedor", obtenerProyectos);


module.exports = Router;