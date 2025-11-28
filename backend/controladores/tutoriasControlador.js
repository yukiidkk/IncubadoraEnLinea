const { query } = require("../config/database");

const obtenerTutores = async (req, res) => {
    try {
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

// Obtener disponibilidad (ahora devuelve hora_inicio y hora_fin)
const obtenerDisponibilidad = async (req, res) => {
    try {
        const sql = `
            SELECT id_disponibilidad, id_usuario, dia, hora_inicio, hora_fin
            FROM disponibilidad_tuto;
        `;
        const data = await query(sql);
        res.json(data);
    } catch (error) {
        console.error("Error al obtener disponibilidad:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

// Insertar disponibilidad (valida formato y solapamientos)
const insertarDisponibilidad = async (req, res) => {
    try {
        const { id_usuario, dia, hora_inicio, hora_fin } = req.body;

        if (!id_usuario || !dia || !hora_inicio || !hora_fin) {
            return res.status(400).json({ mensaje: "Faltan datos" });
        }

        // Validar que hora_fin > hora_inicio (compara como TIME strings 'HH:MM:SS')
        if (hora_fin <= hora_inicio) {
            return res.status(400).json({ mensaje: "La hora fin debe ser mayor que la hora inicio" });
        }

        // Evitar solapamientos: existe registro donde NOT (ex.hora_fin <= new.hora_inicio OR ex.hora_inicio >= new.hora_fin)
        const existeSolapamiento = await query(
            `SELECT * FROM disponibilidad_tuto
             WHERE id_usuario = ? AND dia = ?
               AND NOT (hora_fin <= ? OR hora_inicio >= ?)`,
            [id_usuario, dia, hora_inicio, hora_fin]
        );

        if (existeSolapamiento.length > 0) {
            return res.status(400).json({ mensaje: "El rango seleccionado se solapa con otra disponibilidad del tutor ese día" });
        }

        const sql = `
            INSERT INTO disponibilidad_tuto (id_usuario, dia, hora_inicio, hora_fin)
            VALUES (?, ?, ?, ?)
        `;

        await query(sql, [id_usuario, dia, hora_inicio, hora_fin]);

        res.json({ mensaje: "Disponibilidad registrada" });

    } catch (error) {
        console.error("Error al insertar disponibilidad:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

// ACTUALIZAR disponibilidad (valida solapamientos excluyendo el propio registro si id_disponibilidad se envía)
const actualizarDisponibilidad = async (req, res) => {
    try {
        // Opcional: permitir enviar id_disponibilidad para identificar registro a actualizar
        const { id_disponibilidad, id_usuario, dia, hora_inicio, hora_fin } = req.body;

        if (!id_usuario || !dia || !hora_inicio || !hora_fin) {
            return res.status(400).json({ mensaje: "Datos incompletos" });
        }

        if (hora_fin <= hora_inicio) {
            return res.status(400).json({ mensaje: "La hora fin debe ser mayor que la hora inicio" });
        }

        // Evitar solapamiento con otros registros (excluir id_disponibilidad si viene)
        let sqlCheck = `
            SELECT * FROM disponibilidad_tuto
            WHERE id_usuario = ? AND dia = ? AND NOT (hora_fin <= ? OR hora_inicio >= ?)
        `;
        const paramsCheck = [id_usuario, dia, hora_inicio, hora_fin];

        if (id_disponibilidad) {
            sqlCheck += " AND id_disponibilidad != ?";
            paramsCheck.push(id_disponibilidad);
        }

        const solap = await query(sqlCheck, paramsCheck);
        if (solap.length > 0) {
            return res.status(400).json({ mensaje: "El nuevo rango se solapa con otra disponibilidad del tutor ese día" });
        }

        // Si id_disponibilidad viene, actualizamos por ese id, si no, intentamos actualizar por id_usuario+dia
        let sql, params;
        if (id_disponibilidad) {
            sql = `
                UPDATE disponibilidad_tuto
                SET hora_inicio = ?, hora_fin = ?
                WHERE id_disponibilidad = ?
            `;
            params = [hora_inicio, hora_fin, id_disponibilidad];
        } else {
            sql = `
                UPDATE disponibilidad_tuto
                SET hora_inicio = ?, hora_fin = ?
                WHERE id_usuario = ? AND dia = ?
            `;
            params = [hora_inicio, hora_fin, id_usuario, dia];
        }

        const result = await query(sql, params);

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
   REGISTRAR TUTORÍA (ahora con rango)
   NOTA: se valida solapamiento con otras tutorías del mismo tutor en la misma fecha.
========================= */
const registrarTutoria = async (req, res) => {
    try {
        const { id_usuario, id_tutor, id_proyecto, fecha, hora_inicio, hora_fin } = req.body;

        if (!id_usuario || !id_tutor || !id_proyecto || !fecha || !hora_inicio || !hora_fin) {
            return res.status(400).json({ mensaje: "Faltan datos" });
        }

        if (hora_fin <= hora_inicio) {
            return res.status(400).json({ mensaje: "La hora fin debe ser mayor que la hora inicio" });
        }

        // Validar choque de horario con otras tutorías del mismo tutor (overlap)
        const choque = await query(
            `SELECT * FROM tutoria
             WHERE id_tutor = ? AND fecha = ?
               AND NOT (hora_fin <= ? OR hora_inicio >= ?)`,
            [id_tutor, fecha, hora_inicio, hora_fin]
        );

        if (choque.length > 0) {
            return res.status(400).json({ mensaje: "El tutor ya tiene una tutoría en ese rango horario" });
        }

        // Insertar
        const sql = `
            INSERT INTO tutoria (id_usuario, id_tutor, id_proyecto, fecha, hora_inicio, hora_fin)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        await query(sql, [id_usuario, id_tutor, id_proyecto, fecha, hora_inicio, hora_fin]);

        res.json({ mensaje: "Tutoría registrada correctamente" });

    } catch (error) {
        console.error("Error al registrar tutoría:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

/* =========================
    ACTUALIZAR TUTORÍA (validación de solapamiento excluyendo la propia)
========================= */
const actualizarTutoria = async (req, res) => {
    try {
        const { id_tutoria, id_usuario, id_tutor, id_proyecto, fecha, hora_inicio, hora_fin } = req.body;

        if (!id_tutoria || !id_usuario || !id_tutor || !id_proyecto || !fecha || !hora_inicio || !hora_fin) {
            return res.status(400).json({ mensaje: "Faltan datos requeridos para la actualización" });
        }

        if (hora_fin <= hora_inicio) {
            return res.status(400).json({ mensaje: "La hora fin debe ser mayor que la hora inicio" });
        }

        const choque = await query(
    // La consulta es correcta si la tabla es 'tutoria'
    `SELECT * FROM tutoria
     WHERE id_tutor = ? AND fecha = ? AND id_tutoria != ? // <-- 'id_tutoria != ?' es el tercer signo
       AND NOT (hora_fin <= ? OR hora_inicio >= ?)`,
    // El orden de los parámetros DEBE coincidir con los '?' en la consulta.
    [id_tutor, fecha, id_tutoria, hora_inicio, hora_fin] // <-- 'id_tutoria' es el tercer parámetro
);

if (choque.length > 0) {
    // Si esta línea se ejecuta y falla la actualización, aquí está el problema.
    return res.status(400).json({ mensaje: "El tutor ya tiene otra tutoría en ese nuevo rango horario" });
}

        const sql = `
            UPDATE tutoria
            SET id_usuario = ?, id_tutor = ?, id_proyecto = ?, fecha = ?, hora_inicio = ?, hora_fin = ?
            WHERE id_tutoria = ?
        `;

        const result = await query(sql, [id_usuario, id_tutor, id_proyecto, fecha, hora_inicio, hora_fin, id_tutoria]);

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
    OBTENER TODAS LAS TUTORÍAS (incluye rango)
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
                t.hora_inicio,
                t.hora_fin,
                CONCAT(pe.nombre, ' ', pe.apellido) AS nombre_emprendedor,
                p.nombre_proyecto
            FROM tutoria t
            JOIN usuarios u ON t.id_usuario = u.id_usuario
            JOIN persona pe ON u.id_persona = pe.id_persona
            JOIN proyecto p ON t.id_proyecto = p.id_proyecto
            ORDER BY t.fecha DESC, t.hora_inicio DESC;
        `;
        const data = await query(sql);
        res.json(data);
    } catch (error) {
        console.error("Error al obtener tutorías:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

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
                t.hora_inicio,
                t.hora_fin,
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
            ORDER BY t.fecha DESC, t.hora_inicio DESC;
        `;

        const data = await query(sql, [id_usuario]);
        res.json(data);

    } catch (error) {
        console.error("Error al obtener tutorías del usuario:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

// Exportar todo
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
