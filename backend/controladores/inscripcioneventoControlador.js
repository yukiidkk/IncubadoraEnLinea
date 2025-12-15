const { query } = require("../config/database");

// POST: Inscribir usuario
exports.inscribir = async (req, res) => {
    const { id_evento, id_persona } = req.body;

    if (!id_evento || !id_persona) {
        return res.status(400).json({ success: false, message: "Faltan datos." });
    }

    try {
        // 1. Validar si ya existe
        const duplicado = await query("SELECT * FROM persona_has_eventos WHERE id_evento = ? AND id_persona = ?", [id_evento, id_persona]);
        if (duplicado.length > 0) return res.status(400).json({ success: false, message: "Ya estás inscrito." });

        // 2. Validar Cupo
        const evento = await query("SELECT cupo FROM eventos WHERE id_evento = ?", [id_evento]);
        if (evento.length === 0) return res.status(404).json({ message: "Evento no existe" });
        
        const conteo = await query("SELECT COUNT(*) as total FROM persona_has_eventos WHERE id_evento = ?", [id_evento]);
        if (conteo[0].total >= evento[0].cupo) return res.status(400).json({ success: false, message: "Cupo lleno." });

        // 3. Insertar
        await query("INSERT INTO persona_has_eventos (id_evento, id_persona) VALUES (?, ?)", [id_evento, id_persona]);
        
        res.status(201).json({ success: true, message: "¡Inscripción exitosa!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error del servidor." });
    }
};

// GET: Ver mis eventos
exports.misEventos = async (req, res) => {
    const { id_persona } = req.params;
    try {
        const sql = `
            SELECT e.id_evento, e.nombre_evento, e.fecha_evento, e.descripcion, t.nombre_tipo_eve
            FROM persona_has_eventos phe
            JOIN eventos e ON phe.id_evento = e.id_evento
            LEFT JOIN tipos_eventos t ON e.id_tipos_eve = t.id_tipos_eve
            WHERE phe.id_persona = ?
            ORDER BY e.fecha_evento DESC
        `;
        const rows = await query(sql, [id_persona]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error al cargar." });
    }
};