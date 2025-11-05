const { query } = require("../config/database");

// --- CRUD para TIPOS_EVENTOS ---

// Crear nuevo tipo de evento
exports.crearTipoEvento = async (req, res) => {
    const { nombreTipoE } = req.body;
    try {
        await query("INSERT INTO tipos_eventos (nombre_tipo_eve) VALUES (?)", [
            nombreTipoE
        ]);
        res.status(201).json({ success: true, message: "Tipo de Evento creado correctamente" });
    } catch (err) {
        console.error("Error al crear tipo de evento:", err);
        res.status(500).json({ success: false, message: "Error al crear tipo de evento" });
    }
};

exports.obtenerTiposEventos = async (req, res) => {
    try {
        const sql = "SELECT id_tipos_eve, nombre_tipo_eve FROM tipos_eventos ORDER BY nombre_tipo_eve";
        const tipos = await query(sql);
        
        // Devolvemos el array directamente para que el frontend lo consuma
        res.json(tipos); 

    } catch (error) {
        console.error("Error al obtener tipos de evento:", error);
        // Devolvemos una respuesta de error consistente
        res.status(500).json({ success: false, message: "Error al obtener tipos de evento" });
    }
};
// Actualizar tipo de evento
exports.actualizarTipoEvento = async (req, res) => {
    const { id } = req.params; 
    const { nombreTipoE } = req.body;
    try {
        await query("UPDATE tipos_eventos SET nombre_tipo_eve=? WHERE id_tipos_eve=?", [
            nombreTipoE,
            id
        ]);
        res.json({ success: true, message: "Tipo de Evento actualizado correctamente" });
    } catch (err) {
        console.error("Error al actualizar tipo de evento:", err);
        res.status(500).json({ success: false, message: "Error al actualizar tipo de evento" });
    }
};

// Eliminar tipo de evento
exports.eliminarTipoEvento = async (req, res) => {
    const { id } = req.params; 
    try {
        await query("DELETE FROM tipos_eventos WHERE id_tipos_eve=?", [id]);
        res.json({ success: true, message: "Tipo de Evento eliminado correctamente" });
    } catch (err) {
        console.error("Error al eliminar tipo de evento:", err);
        res.status(500).json({ success: false, message: "Error al eliminar tipo de evento" });
    }
};

// Obtener lista de todos los tipos de eventos
exports.obtenerTiposEventos = async (req, res) => {
    try {
        const tiposEventos = await query("SELECT id_tipos_eve, nombre_tipo_eve FROM tipos_eventos ORDER BY nombre_tipo_eve"); 
        
        res.json({ 
            success: true, 
            tiposEventos: tiposEventos, 
            permisosDisponibles: [] // Se mantiene la clave por consistencia con el viejo endpoint, aunque esté vacía
        });
    } catch (err) {
        console.error("Error al obtener tipos de eventos:", err);
        res.status(500).json({ success: false, message: "Error al obtener tipos de eventos" });
    }
};

// --- Funciones para el Panel Derecho (Relación con Eventos) ---

// Obtener Eventos con su Tipo de Evento asignado (Asume tabla 'eventos')
exports.obtenerEventosConTipo = async (req, res) => {
    try {
        const eventos = await query(`
            SELECT e.nombre_evento, t.nombre_tipo_eve 
            FROM eventos e 
            INNER JOIN tipos_eventos t ON e.id_tipos_eve = t.id_tipos_eve
        `);
        res.json({ success: true, eventos: eventos }); 
    } catch (err) {
        console.error("Error al obtener eventos con tipo:", err);
        res.status(500).json({ success: false, message: "Error al obtener eventos con tipo" });
    }
};

// Buscar Eventos por nombre
exports.buscarEventoPorNombre = async (req, res) => {
    try {
        const { nombre } = req.query; 
        const eventos = await query(`
            SELECT e.nombre_evento, t.nombre_tipo_eve 
            FROM eventos e 
            INNER JOIN tipos_eventos t ON e.id_tipos_eve = t.id_tipos_eve
            WHERE e.nombre_evento LIKE ?
        `, [`%${nombre}%`]); 
        
        res.json({ success: true, eventos: eventos }); 
    } catch (err) {
        console.error("Error al buscar evento:", err);
        res.status(500).json({ success: false, message: "Error al buscar evento" });
    }
};