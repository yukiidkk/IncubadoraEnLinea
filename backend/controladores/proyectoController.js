const { query } = require("../config/database");

// Obtener todos los proyectos
const obtenerProyectos = async (req, res) => {
  try {
    const rows = await query("SELECT * FROM proyecto");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener proyectos" });
  }
};

// Crear nuevo proyecto
const crearProyecto = async (req, res) => {
  try {
    const { titulo, responsable, fecha_inicio, estatus, progreso } = req.body;
    const result = await query(
      "INSERT INTO proyectos (Nombre_Proyecto, Responsable, Fecha_Inicio, Estatus, Progreso) VALUES (?, ?, ?, ?, ?)",
      [titulo, responsable, fecha_inicio, estatus, progreso]
    );
    res.json({ mensaje: "Proyecto creado", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear proyecto" });
  }
};

// Buscar proyectos por título
const buscarProyecto = async (req, res) => {
  try {
    const { titulo } = req.query;
    const rows = await query(
      "SELECT * FROM proyecto WHERE Nombre_Proyecto LIKE ?",
      [`%${titulo}%`]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al buscar proyecto" });
  }
};

// Eliminar proyecto
const eliminarProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM proyecto WHERE Id_Proyecto = ?", [id]);
    res.json({ mensaje: "Proyecto eliminado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar proyecto" });
  }
};

module.exports = {
  obtenerProyectos,
  crearProyecto,
  buscarProyecto,
  eliminarProyecto,
};
