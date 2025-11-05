// --- CHIVATO 1 ---
// Si reinicias el servidor, ESTE MENSAJE DEBE APARECER EN TU TERMINAL DE NODE.JS
console.log("--- [PRUEBA] Node.js está leyendo 'eventosControlador.js' (Versión con LEFT JOIN) ---");

// Asumimos que tu archivo de conexión está en ../config/database
const { query } = require("../config/database");

// --- CRUD BÁSICO para /api/eventos ---

/**
 * (POST) /api/eventos
 */
exports.crearEvento = async (req, res) => {
  try {
    const { id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion } = req.body;
    if (!nombre_evento || !fecha_evento || !id_usuario || !id_tipos_eve || !cupo) {
      return res.status(400).json({ success: false, message: "Faltan campos obligatorios." });
    }
    const sql = `
      INSERT INTO eventos (id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion]);
    res.status(201).json({ success: true, message: "Evento creado con éxito" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error interno del servidor al crear evento." });
  }
};

/**
 * (PUT) /api/eventos/:id
 */
exports.actualizarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion } = req.body;
    const sql = `
      UPDATE eventos SET 
      id_usuario = ?, id_tipos_eve = ?, nombre_evento = ?, 
      fecha_evento = ?, cupo = ?, descripcion = ? 
      WHERE id_evento = ?
    `;
    await query(sql, [id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion, id]);
    res.json({ success: true, message: "Evento actualizado con éxito" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error interno del servidor al actualizar." });
  }
};

/**
 * (DELETE) /api/eventos/:id
 */
exports.eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM eventos WHERE id_evento = ?";
    await query(sql, [id]);
    res.json({ success: true, message: "Evento eliminado con éxito" });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
         return res.status(400).json({ success: false, message: "No se puede eliminar: el evento tiene inscripciones asociadas." });
    }
    res.status(500).json({ success: false, message: "Error interno del servidor al eliminar." });
  }
};

/**
 * (GET) /api/eventos/:id
 */
exports.obtenerEventoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        e.*, 
        CONCAT_WS(' ', p.nombre, p.apellido) AS nombre_encargado, 
        t.nombre_tipo_eve AS nombre_tipo 
      FROM eventos e
      LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
      LEFT JOIN persona p ON u.id_persona = p.id_persona
      LEFT JOIN tipos_eventos t ON e.id_tipos_eve = t.id_tipos_eve
      WHERE e.id_evento = ?
    `;
    const eventos = await query(sql, [id]);
    if (eventos.length === 0) {
      return res.status(404).json({ success: false, message: "Evento no encontrado." });
    }
    res.json(eventos[0]); 
  } catch (error) {
    res.status(500).json({ success: false, message: "Error interno del servidor al obtener evento." });
  }
};


// --- FUNCIONES DEL PANEL DERECHO (Lista y Búsqueda) ---

/**
 * (GET) /api/eventos
 */
exports.obtenerEventos = async (req, res) => {
  // --- CHIVATO 2 (para la lista de eventos) ---
  console.log("--- [PRUEBA] Ejecutando 'obtenerEventos' ---");
  try {
    const sql = `
      SELECT 
        e.*, 
        CONCAT_WS(' ', p.nombre, p.apellido) AS nombre_encargado, 
        t.nombre_tipo_eve AS nombre_tipo 
      FROM eventos e
      LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
      LEFT JOIN persona p ON u.id_persona = p.id_persona
      LEFT JOIN tipos_eventos t ON e.id_tipos_eve = t.id_tipos_eve
      ORDER BY e.fecha_evento DESC
    `;
    const eventos = await query(sql);
    res.json(eventos);
  } catch (error) {
    // El error SQL ya se imprimió en database.js
    res.status(500).json({ success: false, message: "Error interno del servidor al obtener eventos." });
  }
};

/**
 * (GET) /api/eventos/buscar
 */
exports.buscarEventoPorNombre = async (req, res) => {
  try {
    const { nombre } = req.query; 
    const sql = `
      SELECT 
        e.*, 
        CONCAT_WS(' ', p.nombre, p.apellido) AS nombre_encargado, 
        t.nombre_tipo_eve AS nombre_tipo 
      FROM eventos e 
      LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
      LEFT JOIN persona p ON u.id_persona = p.id_persona
      LEFT JOIN tipos_eventos t ON e.id_tipos_eve = t.id_tipos_eve
      WHERE e.nombre_evento LIKE ?
      ORDER BY e.fecha_evento DESC
    `;
    const eventos = await query(sql, [`%${nombre}%`]); 
    res.json(eventos); 
  } catch (err) {
    res.status(500).json({ success: false, message: "Error al buscar evento" });
  }
};


// --- FUNCIONES HELPER (Para los Dropdowns del Formulario) ---

/**
 * (GET) /api/usuarios-coordinadores
 */
exports.obtenerCoordinadores = async (req, res) => {
  // --- CHIVATO 3 (para los coordinadores) ---
  console.log("--- [PRUEBA] Ejecutando 'obtenerCoordinadores' ---");
  try {
    const sql = `
      SELECT 
        u.id_usuario, 
        CONCAT_WS(' ', p.nombre, p.apellido) AS nombre
      FROM usuarios u
      LEFT JOIN persona p ON u.id_persona = p.id_persona
      WHERE u.id_rol = 2 
      ORDER BY p.nombre, p.apellido
    `;
    const coordinadores = await query(sql);
    res.json(coordinadores);
  } catch (error) {
    // El error SQL ya se imprimió en database.js
    res.status(500).json({ success: false, message: "Error al obtener coordinadores" });
  }
};

