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


const obtenerEmprendedores = async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.id_usuario,
                CONCAT(p.nombre, ' ', p.apellido) AS nombre_completo
            FROM usuarios u
            JOIN persona p ON u.id_persona = p.id_persona
            JOIN rol r ON u.id_rol = r.id_rol
            WHERE r.nombre_rol = 'Emprendedor';
        `;
        const data = await query(sql);
        res.json(data);
    } catch (error) {
        console.error("Error al obtener emprendedores:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

// Obtener proyectos de un emprendedor
const obtenerProyectos = async (req, res) => {
    try {
        const { id_emprendedor } = req.params;
        const sql = `
            SELECT id_proyecto, nombre_proyecto
            FROM proyecto
            WHERE id_usuario = ?
        `;
        const data = await query(sql, [id_emprendedor]);
        res.json(data);
    } catch (error) {
        console.error("Error al obtener proyectos:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

/* =========================
   REGISTRAR TUTORÍA
========================= */
const registrarTutoria = async (req, res) => {
    try {
        const { id_usuario, id_tutor, id_proyecto, fecha, hora } = req.body;

        if (!id_usuario || !id_tutor || !id_proyecto || !fecha || !hora) {
            return res.status(400).json({ mensaje: "Faltan datos" });
        }

        // Validar choque de horario
        const existe = await query(
            `SELECT * FROM tutoria WHERE id_tutor = ? AND fecha = ? AND hora = ?`,
            [id_tutor, fecha, hora]
        );

        if (existe.length > 0) {
            return res.status(400).json({ mensaje: "El tutor ya tiene una tutoría en ese horario" });
        }

        // Insertar
        const sql = `
            INSERT INTO tutoria (id_usuario, id_tutor, id_proyecto, fecha, hora)
            VALUES (?, ?, ?, ?, ?)
        `;

        await query(sql, [id_usuario, id_tutor, id_proyecto, fecha, hora]);

        res.json({ mensaje: "Tutoría registrada correctamente" });

    } catch (error) {
        console.error("Error al registrar tutoría:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};


/* =========================
    ACTUALIZAR TUTORÍA
========================= */
const actualizarTutoria = async (req, res) => {
    try {
        // Asumo que el id_tutoria será enviado para saber qué registro modificar
        const { id_tutoria, id_usuario, id_tutor, id_proyecto, fecha, hora } = req.body;

        if (!id_tutoria || !id_usuario || !id_tutor || !id_proyecto || !fecha || !hora) {
            return res.status(400).json({ mensaje: "Faltan datos requeridos para la actualización" });
        }
        
        // Opcional: Validar que el nuevo horario no choque con otra tutoría del mismo tutor (excluyendo la tutoría actual)
        const choque = await query(
            `SELECT * FROM tutoria WHERE id_tutor = ? AND fecha = ? AND hora = ? AND id_tutoria != ?`,
            [id_tutor, fecha, hora, id_tutoria]
        );
        
        if (choque.length > 0) {
            return res.status(400).json({ mensaje: "El tutor ya tiene otra tutoría programada en ese nuevo horario" });
        }


        const sql = `
            UPDATE tutoria
            SET id_usuario = ?, id_tutor = ?, id_proyecto = ?, fecha = ?, hora = ?
            WHERE id_tutoria = ?
        `;

        const result = await query(sql, [id_usuario, id_tutor, id_proyecto, fecha, hora, id_tutoria]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "No se encontró la tutoría para actualizar" });
        }

        res.json({ mensaje: "Tutoría actualizada correctamente" });

    } catch (error) {
        console.error("Error al actualizar tutoría:", error);
        res.status(500).json({ mensaje: "Error en el servidor al actualizar" });
    }
};

/* =========================
    ELIMINAR TUTORÍA
========================= */
const eliminarTutoria = async (req, res) => {
    try {
        const { id_tutoria } = req.body;

        if (!id_tutoria) {
            // Se puede eliminar por params si es DELETE, pero usamos body para consistencia con tu código
            return res.status(400).json({ mensaje: "Falta el ID de la tutoría a eliminar" });
        }

        const sql = `DELETE FROM tutoria WHERE id_tutoria = ?`;
        const result = await query(sql, [id_tutoria]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: "No se encontró la tutoría para eliminar" });
        }

        res.json({ mensaje: "Tutoría eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar tutoría:", error);
        res.status(500).json({ mensaje: "Error en el servidor al eliminar" });
    }
};

/* =========================
    OBTENER TODAS LAS TUTORÍAS
========================= */
const obtenerTodasTutorias = async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.id_tutoria,
                t.id_usuario,
                t.id_tutor,
                t.id_proyecto,
                t.fecha,
                t.hora,
                CONCAT(pe.nombre, ' ', pe.apellido) AS nombre_emprendedor,
                p.nombre_proyecto
            FROM tutoria t
            JOIN usuarios u ON t.id_usuario = u.id_usuario
            JOIN persona pe ON u.id_persona = pe.id_persona
            JOIN proyecto p ON t.id_proyecto = p.id_proyecto
            ORDER BY t.fecha DESC, t.hora DESC;
        `;
        const data = await query(sql);
        res.json(data);
    } catch (error) {
        console.error("Error al obtener tutorías:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

/* =========================
   OBTENER TUTORÍAS DE UN USUARIO (Usado por Emprendedor)
========================= */
const obtenerTutoriasPorUsuario = async (req, res) => {
        try {
             const { id_usuario } = req.params;

         if (!id_usuario) {
            return res.status(400).json({ mensaje: "Falta el ID del usuario" });
        }

        const sql = `
            SELECT 
    t.id_tutoria,
    t.id_usuario,
    t.id_tutor,
    t.id_proyecto,
    t.fecha,
    t.hora,
    CONCAT(pe.nombre, ' ', pe.apellido) AS nombre_emprendedor,
    CONCAT(pt.nombre, ' ', pt.apellido) AS nombre_tutor,
    p.nombre_proyecto
FROM tutoria t
JOIN usuarios u ON t.id_usuario = u.id_usuario
JOIN persona pe ON u.id_persona = pe.id_persona
JOIN usuarios tu ON t.id_tutor = tu.id_usuario
JOIN persona pt ON tu.id_persona = pt.id_persona
JOIN proyecto p ON t.id_proyecto = p.id_proyecto
WHERE t.id_usuario = ?
ORDER BY t.fecha DESC, t.hora DESC;

            `;

        const data = await query(sql, [id_usuario]);
        res.json(data);

    } catch (error) {
        console.error("Error al obtener tutorías del usuario:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};


//Exportar todo 
module.exports = { 
    obtenerTutores,
    obtenerDisponibilidad,
    insertarDisponibilidad,
    actualizarDisponibilidad,
    eliminarDisponibilidad,
    obtenerEmprendedores,
    obtenerProyectos,
    registrarTutoria,
    actualizarTutoria,
    eliminarTutoria,
    obtenerTodasTutorias,
    obtenerTutoriasPorUsuario
};



