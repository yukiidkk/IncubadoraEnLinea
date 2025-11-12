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

const obtenerArchivo = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Solicitando archivo del proyecto ID:", id);

    // Ejecutar consulta sin destructuring
    const result = await query(
      "SELECT formato_registro, nombre_proyecto FROM proyecto WHERE id_proyecto = ?",
      [id]
    );

    // Verificar si el resultado es un arreglo con filas
    const rows = Array.isArray(result) ? result : (result[0] ? result[0] : []);
    console.log(" Resultado SQL:", rows);

    if (!rows || rows.length === 0) {
      console.warn("No se encontró el proyecto con ese ID");
      return res.status(404).send("Proyecto no encontrado");
    }

    const archivo = rows[0].formato_registro;
    const nombreProyecto = rows[0].nombre_proyecto || `proyecto_${id}`;

    if (!archivo) {
      console.warn("El proyecto no tiene archivo adjunto");
      return res.status(404).send("No hay archivo adjunto para este proyecto");
    }

    // Detectar tipo MIME
    let tipoMime = "application/octet-stream";
    const encabezado = archivo.slice(0, 4).toString("hex");

    if (encabezado.startsWith("25504446")) tipoMime = "application/pdf";
    else if (encabezado === "504b0304") tipoMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (encabezado.startsWith("d0cf")) tipoMime = "application/msword";

    const extension = tipoMime.includes("pdf") ? "pdf" :
                      tipoMime.includes("wordprocessingml") ? "docx" :
                      "doc";

    console.log(`Enviando archivo (${tipoMime}) del proyecto "${nombreProyecto}"`);

    res.setHeader("Content-Type", tipoMime);
    res.setHeader("Content-Disposition", `attachment; filename="${nombreProyecto}.${extension}"`);
    res.send(archivo);

  } catch (error) {
    console.error("Error al obtener archivo:", error);
    res.status(500).send("Error interno al obtener el archivo");
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

// ================================
// Actualizar estatus de un proyecto
// ================================
const actualizarEstatusProyecto = async (req, res) => {
  try {
    const { id_proyecto, estatus } = req.body;

    console.log("Datos recibidos en PUT /proyectos/estatus:", { id_proyecto, estatus });

    if (!id_proyecto || !estatus) {
      return res.status(400).json({ mensaje: "Faltan datos para actualizar el estatus" });
    }

    const result = await query(
      "UPDATE proyecto SET estatus = ? WHERE id_proyecto = ?",
      [estatus, id_proyecto]
    );

    console.log("Resultado del UPDATE:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, mensaje: "No se encontró el proyecto con ese ID" });
    }

    res.json({ success: true, mensaje: `Estatus actualizado a "${estatus}"` });
  } catch (error) {
    console.error("Error al actualizar estatus:", error);
    res.status(500).json({ success: false, mensaje: "Error al actualizar estatus del proyecto" });
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
  obtenerProyectosPorUsuario,
  actualizarEstatusProyecto
};
