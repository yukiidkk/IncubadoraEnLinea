const { query } = require("../config/database");

// Obtener avances por proyecto específico
const getAvancesPorProyecto = async (req, res) => {
    try {
        const { nombreProyecto } = req.query;

        const proyectoQuery = `
            SELECT p.id_proyecto, p.nombre_proyecto, p.fecha_inicio, 
                   p.estatus, p.progreso, p.descripcion,
                   per.nombre as nombre_emprendedor, per.apellido,
                   u.id_usuario
            FROM proyecto p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            INNER JOIN persona per ON u.id_persona = per.id_persona
            WHERE p.nombre_proyecto LIKE ? OR p.id_proyecto = ?
        `;

        const avancesQuery = `
            SELECT a.id_avances, a.hitos, a.notas, a.fecha_creacion
            FROM avances a
            WHERE a.id_proyecto = ?
            ORDER BY a.fecha_creacion DESC
        `;

        const tareasQuery = `
            SELECT t.id_tarea, t.nombre_tarea, t.descripcion_tarea, 
                   t.estatus, t.fecha_creacion
            FROM tarea t
            WHERE t.id_proyecto = ?
            ORDER BY t.fecha_creacion DESC
        `;

        // ❌ Antes: const [proyecto] = await query.execute(...)
        // ✔️ Ahora:
        const proyecto = await query(proyectoQuery, [`%${nombreProyecto}%`, nombreProyecto]);

        if (!proyecto || proyecto.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Proyecto no encontrado"
            });
        }

        const idProyecto = proyecto[0].id_proyecto;

        // ❌ Antes: const [avances] = await query.execute(...)
        // ✔️ Ahora:
        const avances = await query(avancesQuery, [idProyecto]);

        const tareas = await query(tareasQuery, [idProyecto]);

        res.json({
            success: true,
            data: {
                proyecto: proyecto[0],
                avances: avances,
                tareas: tareas
            }
        });

    } catch (error) {
        console.error("Error en getAvancesPorProyecto:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
};

// Obtener lista de proyectos para el coordinador
const getProyectosCoordinador = async (req, res) => {
    try {
        const proyectosQuery = `
            SELECT p.id_proyecto, p.nombre_proyecto, p.estatus, 
                   p.progreso, p.fecha_inicio,
                   per.nombre, per.apellido
            FROM proyecto p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            INNER JOIN persona per ON u.id_persona = per.id_persona
            ORDER BY p.fecha_inicio DESC
        `;

        const [proyectos] = await query.execute(proyectosQuery);

        res.json({
            success: true,
            data: proyectos
        });

    } catch (error) {
        console.error('Error en getProyectosCoordinador:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Agregar comentario/nota del coordinador
const agregarComentarioAvance = async (req, res) => {
    try {
        const { id_proyecto, comentario } = req.body;

        const insertQuery = `
            INSERT INTO avances (id_proyecto, hitos, notas, fecha_creacion)
            VALUES (?, 'Comentario Coordinador', ?, NOW())
        `;

        await query.execute(insertQuery, [id_proyecto, comentario]);

        res.json({
            success: true,
            message: 'Comentario agregado correctamente'
        });

    } catch (error) {
        console.error('Error en agregarComentarioAvance:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar comentario'
        });
    }
};

// Actualizar progreso del proyecto
const actualizarProgresoProyecto = async (req, res) => {
    try {
        const { id_proyecto, progreso } = req.body;

        if (progreso < 0 || progreso > 100) {
            return res.status(400).json({
                success: false,
                message: 'El progreso debe estar entre 0 y 100'
            });
        }

        const updateQuery = `
            UPDATE proyecto 
            SET progreso = ?, 
            estatus = CASE
                WHEN ? = 100 THEN 'Finalizado'
                WHEN ? > 0 THEN 'En curso' 
                ELSE 'Pendiente'
            END
            WHERE id_proyecto = ?
        `;

        await query.execute(updateQuery, [progreso, progreso, progreso, id_proyecto]);

        res.json({
            success: true,
            message: 'Progreso actualizado correctamente'
        });

    } catch (error) {
        console.error('Error en actualizarProgresoProyecto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar progreso'
        });
    }
};

// Generar reporte Excel
const generarReporteExcel = async (req, res) => {
    try {
        const { id_proyecto } = req.params;

        const proyectoQuery = `
            SELECT p.*, per.nombre, per.apellido, per.correo
            FROM proyecto p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            INNER JOIN persona per ON u.id_persona = per.id_persona
            WHERE p.id_proyecto = ?
        `;

        const avancesQuery = `
            SELECT hitos, notas, fecha_creacion
            FROM avances
            WHERE id_proyecto = ?
            ORDER BY fecha_creacion DESC
        `;

        const [proyecto] = await query.execute(proyectoQuery, [id_proyecto]);
        const [avances] = await query.execute(avancesQuery, [id_proyecto]);

        res.json({
            success: true,
            data: {
                proyecto: proyecto[0],
                avances: avances
            }
        });

    } catch (error) {
        console.error('Error en generarReporteExcel:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte'
        });
    }
};

module.exports = {
    getAvancesPorProyecto,
    getProyectosCoordinador,
    agregarComentarioAvance,
    actualizarProgresoProyecto,
    generarReporteExcel
};




  