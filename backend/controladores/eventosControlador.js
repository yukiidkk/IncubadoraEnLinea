const { query } = require("../config/database");

// ==========================================
//  1. GESTIÓN DE EVENTOS (CRUD)
// ==========================================

exports.crearEvento = async (req, res) => {
  try {
    const { id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion } = req.body;
    if (!nombre_evento) return res.status(400).json({ success: false, message: "Faltan datos." });
    await query("INSERT INTO eventos (id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion) VALUES (?, ?, ?, ?, ?, ?)", [id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion]);
    res.status(201).json({ success: true, message: "Creado." });
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};

exports.actualizarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion } = req.body;
    await query("UPDATE eventos SET id_usuario=?, id_tipos_eve=?, nombre_evento=?, fecha_evento=?, cupo=?, descripcion=? WHERE id_evento=?", [id_usuario, id_tipos_eve, nombre_evento, fecha_evento, cupo, descripcion, id]);
    res.json({ success: true, message: "Actualizado." });
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};

exports.eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM eventos WHERE id_evento = ?", [id]);
    res.json({ success: true, message: "Eliminado." });
  } catch (e) {
    console.error(e);
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return res.status(400).json({ success: false, message: "Tiene alumnos inscritos." });
    res.status(500).json({ success: false });
  }
};

exports.obtenerEventos = async (req, res) => {
  try {
    const sql = `
      SELECT e.*, CONCAT_WS(' ', p.nombre, p.apellido) AS nombre_encargado, t.nombre_tipo_eve AS nombre_tipo,
      (SELECT COUNT(*) FROM persona_has_eventos phe WHERE phe.id_evento = e.id_evento) AS inscritos
      FROM eventos e
      LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
      LEFT JOIN persona p ON u.id_persona = p.id_persona
      LEFT JOIN tipos_eventos t ON e.id_tipos_eve = t.id_tipos_eve
      ORDER BY e.fecha_evento DESC
    `;
    const eventos = await query(sql);
    res.json(eventos);
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};

exports.buscarEventoPorNombre = async (req, res) => {
  try {
    const { nombre } = req.query; 
    const sql = `SELECT e.* FROM eventos e WHERE e.nombre_evento LIKE ? ORDER BY e.fecha_evento DESC`;
    const eventos = await query(sql, [`%${nombre}%`]); 
    res.json(eventos); 
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};

exports.obtenerEventoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const eventos = await query("SELECT * FROM eventos WHERE id_evento = ?", [id]);
    if (!eventos.length) return res.status(404).json({ success: false });
    res.json(eventos[0]); 
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};

exports.obtenerCoordinadores = async (req, res) => {
  try {
    const sql = `SELECT u.id_usuario, p.id_persona, CONCAT_WS(' ', p.nombre, p.apellido) AS nombre FROM usuarios u LEFT JOIN persona p ON u.id_persona = p.id_persona WHERE u.id_rol = 3 ORDER BY p.nombre`;
    const coordinadores = await query(sql);
    res.json(coordinadores);
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};

// ==========================================
//  2. INSCRIPCIONES
// ==========================================

exports.inscribirPersonaAEvento = async (req, res) => {
    const { id_evento, id_persona } = req.body;
    if (!id_evento || !id_persona) return res.status(400).json({ success: false, message: "Faltan datos." });

    try {
        const dup = await query("SELECT * FROM persona_has_eventos WHERE id_evento = ? AND id_persona = ?", [id_evento, id_persona]);
        if (dup.length > 0) return res.status(400).json({ success: false, message: "Ya estás inscrito." });

        const ev = await query("SELECT cupo FROM eventos WHERE id_evento = ?", [id_evento]);
        if (!ev.length) return res.status(404).json({ message: "Evento no existe" });
        
        const count = await query("SELECT COUNT(*) AS total FROM persona_has_eventos WHERE id_evento = ?", [id_evento]);
        if (count[0].total >= ev[0].cupo) return res.status(400).json({ success: false, message: "Cupo lleno." });

        await query("INSERT INTO persona_has_eventos (id_evento, id_persona) VALUES (?, ?)", [id_evento, id_persona]);
        res.status(201).json({ success: true, message: "Inscrito." });
    } catch (e) { 
        console.error(e); 
        if (e.errno === 1452) return res.status(400).json({success:false, message:"Usuario no válido en BD"});
        res.status(500).json({ success: false }); 
    }
};

exports.obtenerEventosPorPersona = async (req, res) => {
    const { id_persona } = req.params;
    try {
        const sql = `SELECT e.id_evento, e.nombre_evento, e.fecha_evento, e.descripcion, t.nombre_tipo_eve FROM persona_has_eventos phe JOIN eventos e ON phe.id_evento = e.id_evento LEFT JOIN tipos_eventos t ON e.id_tipos_eve = t.id_tipos_eve WHERE phe.id_persona = ? ORDER BY e.fecha_evento DESC`;
        const misEventos = await query(sql, [id_persona]);
        res.json(misEventos); 
    } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};

// --- 3. LISTA DE ALUMNOS (Para esta pantalla) ---
exports.obtenerInscritosPorEvento = async (req, res) => {
    const { id_evento } = req.params;
    try {
        const sql = `
            SELECT p.id_persona, p.nombre, p.apellido, p.correo, p.no_control
            FROM persona_has_eventos phe
            INNER JOIN persona p ON phe.id_persona = p.id_persona
            WHERE phe.id_evento = ?
            ORDER BY p.apellido ASC, p.nombre ASC
        `;
        const inscritos = await query(sql, [id_evento]);
        res.json(inscritos);
    } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};

exports.cancelarInscripcionAEvento = async (req, res) => {
    const { id_evento, id_persona } = req.body;
    try {
        await query("DELETE FROM persona_has_eventos WHERE id_evento = ? AND id_persona = ?", [id_evento, id_persona]);
        res.json({ success: true, message: "Desinscrito." });
    } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};