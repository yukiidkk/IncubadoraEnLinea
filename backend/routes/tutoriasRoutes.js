const express = require("express");
const Router = express.Router();

const { 
    obtenerTutores,
    obtenerDisponibilidad,
    insertarDisponibilidad,
    actualizarDisponibilidad,
    eliminarDisponibilidad,
    obtenerEmprendedores,
    obtenerProyectos,
    registrarTutoria,
    actualizarTutoria,
    eliminarTutoria,
    obtenerTodasTutorias,
    obtenerTutoriasPorUsuario
} = require("../controladores/tutoriasControlador");

Router.get("/tutores", obtenerTutores);
Router.get("/disponibilidad", obtenerDisponibilidad);
Router.post("/disponibilidad", insertarDisponibilidad);
Router.put("/disponibilidad", actualizarDisponibilidad);
Router.delete("/disponibilidad", eliminarDisponibilidad);
Router.get("/emprendedores", obtenerEmprendedores);
Router.get("/proyectos/:id_emprendedor", obtenerProyectos);
Router.post("/registrar", registrarTutoria);
Router.put("/registrar", actualizarTutoria);     
Router.delete("/registrar", eliminarTutoria);   
Router.get("/tutorias-listado", obtenerTodasTutorias);
Router.get("/tutorias/usuario/:id_usuario", obtenerTutoriasPorUsuario);

module.exports = Router;