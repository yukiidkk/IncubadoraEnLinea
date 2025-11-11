// backend/controllers/seguimientoController.js
const { pool } = require("../config/database");

// 🔹 Obtener todos los proyectos
const obtenerProyectos = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id_proyecto, nombre_proyecto, descripcion, estatus, progreso
      FROM proyecto
      ORDER BY id_proyecto DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    res.status(500).json({ mensaje: "Error al obtener proyectos" });
  }
};

// 🔹 Obtener tareas de un proyecto
const obtenerTareasPorProyecto = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const [rows] = await pool.query(
      `SELECT id_tarea, nombre_tarea, descripcion_tarea, estatus
       FROM tarea
       WHERE id_proyecto = ?`,
      [id_proyecto]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ mensaje: "Error al obtener tareas" });
  }
};

// 🔹 Crear nueva tarea
const crearTarea = async (req, res) => {
  try {
    const { id_proyecto, nombre_tarea, descripcion_tarea, estatus } = req.body;

    if (!id_proyecto || !nombre_tarea) {
      return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
    }

    const [result] = await pool.query(
      `INSERT INTO tarea (id_proyecto, nombre_tarea, descripcion_tarea, estatus)
       VALUES (?, ?, ?, ?)`,
      [id_proyecto, nombre_tarea, descripcion_tarea || "", estatus || "Pendiente"]
    );

    res.json({
      id_tarea: result.insertId,
      mensaje: "Tarea creada correctamente",
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ mensaje: "Error al crear tarea" });
  }
};

// 🔹 Editar tarea existente
const editarTarea = async (req, res) => {
  try {
    const { id_tarea, nombre_tarea, descripcion_tarea, estatus } = req.body;

    if (!id_tarea) {
      return res.status(400).json({ mensaje: "Falta el id_tarea" });
    }

    await pool.query(
      `UPDATE tarea
       SET nombre_tarea = ?, descripcion_tarea = ?, estatus = ?
       WHERE id_tarea = ?`,
      [nombre_tarea, descripcion_tarea, estatus, id_tarea]
    );

    res.json({ mensaje: "Tarea actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    res.status(500).json({ mensaje: "Error al actualizar tarea" });
  }
};

// 🔹 Eliminar tarea
const eliminarTarea = async (req, res) => {
  const { id_tarea } = req.params;
  console.log("ID recibido para eliminar:", id_tarea);

  try {
    const id = Number(id_tarea);
    const [result] = await pool.query("DELETE FROM tarea WHERE id_tarea = ?", [id]);
    console.log(" Resultado MySQL:", result);

    if (result.affectedRows > 0) {
      res.json({ success: true, mensaje: "Tarea eliminada correctamente" });
    } else {
      res.json({ success: false, mensaje: " No se encontró ninguna tarea con ese ID" });
    }
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    res.status(500).json({ success: false, mensaje: "Error al eliminar tarea" });
  }
};

module.exports = {
  obtenerProyectos,
  obtenerTareasPorProyecto,
  crearTarea,
  editarTarea,
  eliminarTarea,
};
