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
    console.log("Iniciando creación de proyecto...");

    const { id_usuario, nombre_proyecto, descripcion, formato_registro, archivoBase64, socios } = req.body;

    if (!req.body) {
      console.log("Body vacío o muy grande");
      return res.status(413).json({ mensaje: "Payload too large" });
    }

    console.log("Tamaño del archivo base64:", archivoBase64 ? archivoBase64.length : 0);

    let archivoBuffer = null;
    if (archivoBase64 && archivoBase64.length > 0) {
      if (archivoBase64.length > 10 * 1024 * 1024) {
        return res.status(413).json({ mensaje: "Archivo demasiado grande. Máximo 10MB" });
      }

      try {
        archivoBuffer = Buffer.from(archivoBase64, "base64");
        console.log("Archivo convertido a buffer, tamaño:", archivoBuffer.length, "bytes");
      } catch (error) {
        console.error("Error convirtiendo archivo:", error);
        return res.status(400).json({ mensaje: "Error en el formato del archivo" });
      }
    }

    console.log("Insertando en base de datos...");

    const result = await query(
      "INSERT INTO proyecto (id_usuario, nombre_proyecto, descripcion, formato_registro, fecha_inicio, estatus, progreso) VALUES (?, ?, ?, ?, CURDATE(), 'Pendiente', '0%')",
      [id_usuario, nombre_proyecto, descripcion, archivoBuffer]
    );

    const idProyecto = result.insertId;
    console.log("Proyecto creado con ID:", idProyecto);

    // Insertar socios si existen
    if (Array.isArray(socios) && socios.length > 0) {
      console.log("Insertando socios:", socios.length);
      for (const socio of socios) {
        await query(
          "INSERT INTO persona_has_proyecto (id_proyecto, id_persona) VALUES (?, ?)",
          [idProyecto, socio.id_persona]
        );
      }
    }

    res.json({ mensaje: "Proyecto creado con éxito", id_proyecto: idProyecto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear proyecto" });
  }
};

// Ver archivo asociado
const obtenerArchivo = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await query("SELECT Formato_Registro FROM proyecto WHERE id_Proyecto = ?", [id]);
    if (rows.length === 0) return res.status(404).send("Archivo no encontrado");

    const archivo = rows[0].Formato_Registro;
    res.setHeader("Content-Type", "application/pdf");
    res.send(archivo);
  } catch (error) {
    res.status(500).send("Error al obtener archivo");
  }
};

// Buscar proyectos por nombre
const buscarProyecto = async (req, res) => {
  try {
    const { titulo } = req.query;
    const rows = await query("SELECT * FROM proyecto WHERE nombre_proyecto LIKE ?", [`%${titulo}%`]);
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

// Obtener todos los usuarios (para crear proyectos)
const obtenerUsuarios = async (req, res) => {
  try {
    const { nombre } = req.query;

    let sql = `
      SELECT 
        p.id_persona AS Id_Persona,
        p.nombre AS Nombre,
        p.apellido AS Apellido,
        u.id_usuario AS Id_Usuario
      FROM persona p
      LEFT JOIN usuarios u ON p.id_persona = u.id_persona
    `;

    let values = [];

    if (nombre && nombre.trim() !== "") {
      sql += " WHERE p.nombre LIKE ? OR p.apellido LIKE ?";
      values = [`%${nombre}%`, `%${nombre}%`];
    }

    const rows = await query(sql, values);
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

// ================================
// Obtener proyectos del usuario o todos si es coordinador
// ================================
const obtenerProyectosPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    console.log("Recibido id_usuario:", id_usuario);

    if (!id_usuario || isNaN(id_usuario)) {
      console.log("id_usuario inválido o no numérico:", id_usuario);
      return res.status(400).json({ mensaje: "id_usuario inválido" });
    }

            // 🔹 1. Obtener rol del usuario
    const resultRol = await query(`
      SELECT r.nombre_rol 
      FROM usuarios u
      INNER JOIN rol r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = ?;
    `, [id_usuario]);

    console.log("Resultado de la consulta del rol:", resultRol);

    // 🔸 Soporta tanto arreglo como objeto
    let rol = null;
    if (Array.isArray(resultRol) && resultRol.length > 0) {
      rol = resultRol[0].nombre_rol?.toLowerCase();
    } else if (resultRol && resultRol.nombre_rol) {
      rol = resultRol.nombre_rol.toLowerCase();
    }

    if (!rol) {
      console.log("No se encontró usuario con ese id_usuario:", id_usuario);
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    console.log("Rol detectado:", rol);

    console.log("Rol detectado:", rol);

    let rows;
    if (rol === "coordinador") {
  console.log("Cargando todos los proyectos...");
  const proyectos = await query(`
    SELECT 
      p.id_proyecto,
      p.nombre_proyecto,
      p.descripcion,
      p.fecha_inicio,
      p.estatus,
      p.progreso,
      per.nombre AS responsable,
      per.apellido AS responsable_apellido
    FROM proyecto p
    INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
    INNER JOIN persona per ON u.id_persona = per.id_persona
    ORDER BY p.fecha_inicio DESC;
  `);

  console.log("Proyectos encontrados:", proyectos.length);
  res.json(proyectos);

} else {
  console.log("Cargando proyectos del usuario:", id_usuario);
  const proyectos = await query(`
    SELECT 
      p.id_proyecto,
      p.nombre_proyecto,
      p.descripcion,
      p.fecha_inicio,
      p.estatus,
      p.progreso
    FROM proyecto p
    WHERE p.id_usuario = ?
    ORDER BY p.fecha_inicio DESC;
  `, [id_usuario]);

  console.log("Proyectos encontrados:", proyectos.length);
  res.json(proyectos);
}
  } 
  catch (error) {
    console.error("ERROR DETALLADO al obtener proyectos:", error.message);
    console.error(error.stack);
    res.status(500).json({ mensaje: "Error al obtener proyectos del usuario", error: error.message });
  }
};



// Exportar controladores
module.exports = {
  obtenerProyectos,
  crearProyecto,
  buscarProyecto,
  eliminarProyecto,
  obtenerArchivo,
  obtenerUsuarios,
  obtenerProyectosPorUsuario
};
