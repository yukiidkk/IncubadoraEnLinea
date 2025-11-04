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

// controlador para Crear nuevo proyecto
const crearProyecto = async (req, res) => {
  try {
    const { id_usuario,nombre_proyecto, descripcion, formato_registro, archivoBase64, socios } = req.body;
    const archivoBuffer =Buffer.from(archivoBase64,"base64");

    const result = await query(
      "INSERT INTO proyecto (id_usuario, nombre_proyecto, descripcion, formato_registro, fecha_inicio, estatus, progreso) VALUES (?, ?, ?,?,CURDATE(),'Pendiente','0%')",
      [id_usuario,nombre_proyecto, descripcion, archivoBuffer]
    );
     const idProyecto = result.insertId;

     //obtener el id_perona (creador del proyecto)
     const [personaCreadora] = await query(
      "SELECT id_persona FROM persona WHERE id_rol = (SELECT id_rol FROM usuarios WHERE id_usuario = ?) AND id_persona = (SELECT id_persona FROM usuarios WHERE id_usuario = ?)",
      [id_usuario, id_usuario]
    );
    if (personaCreadora.length > 0) {
      await query(
        "INSERT INTO persona_has_proyecto (id_proyecto, id_persona) VALUES (?, ?)",
        [idProyecto, personaCreadora[0].id_persona]
      );
    }

    // 2. Insertar los socios (en tabla intermedia persona_has_proyecto)
  if (socios && socios.length > 0) {
      for (const socio of socios) {
         const [persona] = await query(
          "SELECT id_persona FROM persona WHERE nombre = ?",
          [socio]
        );

        if (persona.length > 0) {
        await query(
          "INSERT INTO persona_has_proyecto (id_proyecto, id_persona) VALUES (?, ?)",
          [idProyecto, persona[0].id_persona]
        );
      }
    }
  }

    res.json({ mensaje: "Proyecto creado con éxito", id_proyecto: idProyecto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear proyecto" });
  }
};

//Ver el archivo 
 const obtenerArchivo = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await query("SELECT Formato_Registro FROM proyecto WHERE id_Proyecto = ?", [id]);
    if (rows.length === 0) return res.status(404).send("Archivo no encontrado");

    const archivo = rows[0].Formato_Registro;
    res.setHeader("Content-Type", "application/pdf"); // o detecta el tipo real
    res.send(archivo);
  } catch (error) {
    res.status(500).send("Error al obtener archivo");
  }
};


// Buscar proyectos por nombre
const buscarProyecto = async (req, res) => {
  try {
    const { titulo } = req.query;
    const rows = await query(
      "SELECT * FROM proyecto WHERE nombre_proyecto LIKE ?",
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
    await query("DELETE FROM proyecto WHERE id_Proyecto = ?", [id]);
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
  obtenerArchivo
};