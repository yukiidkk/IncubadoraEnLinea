const { query } = require("../config/database");

// --- CRUD para TIPOS_EVENTOS ---

// Crear nuevo tipo de evento (CON VALIDACIÓN ESTRICTA)
exports.crearTipoEvento = async (req, res) => {
    // 1. Obtenemos el nombre
    let { nombreTipoE } = req.body;

    // Validación básica de existencia
    if (!nombreTipoE) {
        return res.status(400).json({ success: false, message: "El nombre es obligatorio" });
    }

    // 2. LIMPIEZA: Quitamos espacios al inicio y final
    // Esto hace que " Asamblea " sea igual a "Asamblea"
    nombreTipoE = nombreTipoE.trim();

    if (nombreTipoE === '') {
        return res.status(400).json({ success: false, message: "El nombre no puede estar vacío" });
    }

    try {
        console.log(`[DEBUG] Intentando crear: "${nombreTipoE}"`);

        // 3. BUSCAR SI YA EXISTE (Validación de duplicados)
        // Buscamos exactamente ese nombre en la base de datos
        const busqueda = await query("SELECT id_tipos_eve FROM tipos_eventos WHERE nombre_tipo_eve = ?", [nombreTipoE]);

        console.log(`[DEBUG] Resultado búsqueda:`, busqueda);

        if (busqueda && busqueda.length > 0) {
            // Si el arreglo tiene datos, es que ya existe
            console.log("[DEBUG] ¡Duplicado detectado!");
            return res.status(400).json({ success: false, message: `¡El tipo de evento "${nombreTipoE}" ya existe!` });
        }

        // 4. SI NO EXISTE, LO CREAMOS
        await query("INSERT INTO tipos_eventos (nombre_tipo_eve) VALUES (?)", [nombreTipoE]);
        
        console.log("[DEBUG] Insertado correctamente.");
        res.status(201).json({ success: true, message: "Tipo de Evento creado correctamente" });

    } catch (err) {
        console.error("Error al crear tipo de evento:", err);
        res.status(500).json({ success: false, message: "Error interno al crear tipo de evento" });
    }
};

// Actualizar tipo de evento
exports.actualizarTipoEvento = async (req, res) => {
    const { id } = req.params; 
    let { nombreTipoE } = req.body;

    try {
        // Limpiamos el nombre también al actualizar
        if(nombreTipoE) nombreTipoE = nombreTipoE.trim();

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
        // Manejo básico de llave foránea
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
             return res.status(409).json({ success: false, message: "No se puede eliminar porque hay eventos usando este tipo." });
        }
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
            permisosDisponibles: [] 
        });
    } catch (err) {
        console.error("Error al obtener tipos de eventos:", err);
        res.status(500).json({ success: false, message: "Error al obtener tipos de eventos" });
    }
};

// --- Funciones para el Panel Derecho (Relación con Eventos) ---

// Obtener Eventos con su Tipo de Evento asignado
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