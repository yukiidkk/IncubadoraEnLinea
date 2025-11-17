const { query } = require("../config/database");

const obtenerTutores = async (req, res) => {
    try {
        const [db] = await query("SELECT DATABASE() AS db");
        const sql = `
            SELECT 
                u.id_usuario,
                CONCAT(p.nombre, ' ', p.apellido) AS nombre_completo
            FROM usuarios u
            JOIN persona p ON u.id_persona = p.id_persona
            JOIN rol r ON u.id_rol = r.id_rol
            WHERE r.nombre_rol = 'Coordinador';
        `;
        const data = await query(sql);
        res.json(data);
    } catch (error) {
        console.error("Error al obtener tutores:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

//Obtener disponibilidad

const obtenerDisponibilidad = async (req, res) => {
    try {
        const sql = `
            SELECT id_usuario, dia, hora 
            FROM disponibilidad_tuto;
        `;
        const data = await query(sql);
        res.json(data);
    } catch (error) {
        console.error("Error al obtener disponibilidad:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};


//Insertar disponibilidad
const insertarDisponibilidad = async (req, res) => {
    try {
        const { id_usuario, dia, hora } = req.body;

        if (!id_usuario || !dia || !hora) {
            return res.status(400).json({ mensaje: "Faltan datos" });
        }

        // Validación para evitar duplicados
        const existe = await query(
            "SELECT * FROM disponibilidad_tuto WHERE id_usuario = ? AND dia = ?",
            [id_usuario, dia]
        );

        if (existe.length > 0) {
            return res.status(400).json({ mensaje: "El tutor ya tiene disponibilidad ese día" });
        }

        const sql = `
            INSERT INTO disponibilidad_tuto (id_usuario, dia, hora)
            VALUES (?, ?, ?)
        `;

        await query(sql, [id_usuario, dia, hora]);

        res.json({ mensaje: "Disponibilidad registrada" });

    } catch (error) {
        console.error("Error al insertar disponibilidad:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

// ACTUALIZAR disponibilidad
const actualizarDisponibilidad = async (req, res) => {
    try {
        const { id_usuario, dia, hora } = req.body;

        if (!id_usuario || !dia || !hora) {
            return res.status(400).json({ mensaje: "Datos incompletos" });
        }

        const sql = `
            UPDATE disponibilidad_tuto 
            SET hora = ?
            WHERE id_usuario = ? AND dia = ?
        `;

        const result = await query(sql, [hora, id_usuario, dia]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "No existe una disponibilidad para actualizar" });
        }

        res.json({ mensaje: "Disponibilidad actualizada correctamente" });

    } catch (error) {
        console.error("Error al actualizar disponibilidad:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

// ELIMINAR disponibilidad
const eliminarDisponibilidad = async (req, res) => {
    try {
        // Permitimos eliminar por id_disponibilidad o por id_usuario+dia
        const { id_disponibilidad, id_usuario, dia } = req.body;

        let sql, params;

        if (id_disponibilidad) {
            sql = `DELETE FROM disponibilidad_tuto WHERE id_disponibilidad = ?`;
            params = [id_disponibilidad];
        } else if (id_usuario && dia) {
            sql = `DELETE FROM disponibilidad_tuto WHERE id_usuario = ? AND dia = ?`;
            params = [id_usuario, dia];
        } else {
            return res.status(400).json({ mensaje: "Proporcione id_disponibilidad o (id_usuario y dia) para eliminar" });
        }

        const result = await query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "Registro no encontrado para eliminar" });
        }

        res.json({ mensaje: "Disponibilidad eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar disponibilidad:", error);
        res.status(500).json({ mensaje: "Error en el servidor al eliminar disponibilidad" });
    }
};

//Exportar todo 
module.exports = { 
    obtenerTutores,
    obtenerDisponibilidad,
    insertarDisponibilidad,
    actualizarDisponibilidad,
    eliminarDisponibilidad
};



