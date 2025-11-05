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

     console.log('📥 Iniciando creación de proyecto...');

    const { id_usuario,nombre_proyecto, descripcion, formato_registro, archivoBase64, socios } = req.body;
    // Verificar si el body está completo
    if (!req.body) {
      console.log('❌ Body vacío o muy grande');
      return res.status(413).json({ mensaje: "Payload too large" });
    }

    console.log('📊 Tamaño del archivo base64:', archivoBase64 ? archivoBase64.length : 0);

    let archivoBuffer = null;
    if (archivoBase64 && archivoBase64.length > 0) {
      // Verificar tamaño máximo (ej: 10MB)
      if (archivoBase64.length > 10 * 1024 * 1024) {
        return res.status(413).json({ mensaje: "Archivo demasiado grande. Máximo 10MB" });
      }
      
      try {
        archivoBuffer = Buffer.from(archivoBase64, "base64");
        console.log('✅ Archivo convertido a buffer, tamaño:', archivoBuffer.length, 'bytes');
      } catch (error) {
        console.error('❌ Error convirtiendo archivo:', error);
        return res.status(400).json({ mensaje: "Error en el formato del archivo" });
      }
    }
    
    console.log('💾 Insertando en base de datos...');
    
    const result = await query(
      "INSERT INTO proyecto (id_usuario, nombre_proyecto, descripcion, formato_registro, fecha_inicio, estatus, progreso) VALUES (?, ?, ?, ?, CURDATE(), 'Pendiente', '0%')",
      [id_usuario, nombre_proyecto, descripcion, archivoBuffer]
    );
     const idProyecto = result.insertId;
    console.log('✅ Proyecto creado con ID:', idProyecto);
    
    // 2. Insertar los socios (en tabla intermedia persona_has_proyecto)
  if (Array.isArray(socios) && socios.length > 0) {
      console.log('👥 Insertando socios:', socios.length);
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