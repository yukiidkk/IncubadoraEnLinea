const { query } = require("../config/database");

// Obtener todos los proyectos
export const obtenerProyectos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM proyecto");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al obtener proyectos" });
  }
};

// Crear nuevo proyecto
export const crearProyecto = async (req, res) => {
  try {
    const { titulo,responsable, fecha_inicio, estatus, progreso } = req.body;
    const [result] = await pool.query(
      "INSERT INTO proyectos (Nombre_Proyecto, Fecha_Inicio, Estatus, Progreso ,Descripcion,Formato_Registro) VALUES (?, ?, ?, ?, ?, ?)",
      [titulo,responsable, fecha_inicio, estatus, progreso]
    );
    res.json({ mensaje: "Proyecto creado", id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear proyecto" });
  }
};

// Buscar proyectos por título
export const buscarProyecto = async (req, res) => {
  try {
    const { titulo } = req.query;
    const [rows] = await pool.query(
      "SELECT * FROM proyecto WHERE Nombre_Proyecto LIKE ?",
      [`%${titulo}%`]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al buscar proyecto" });
  }
};

// Eliminar proyecto
export const eliminarProyecto = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM proyecto WHERE Id_Proyecto = ?", [id]);
    res.json({ mensaje: "Proyecto eliminado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar proyecto" });
  }
};
