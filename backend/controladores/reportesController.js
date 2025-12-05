const ExcelJS = require("exceljs");
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
        const proyecto = await query(proyectoQuery, [`%${nombreProyecto}%`, nombreProyecto]);

        if (!proyecto || proyecto.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Proyecto no encontrado"
            });
        }

        const idProyecto = proyecto[0].id_proyecto;

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

        const [proyectos] = await query(proyectosQuery);

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

        await query(insertQuery, [id_proyecto, comentario]);

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

        await query(updateQuery, [progreso, progreso, progreso, id_proyecto]);

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
        const idProyecto = req.params.id_proyecto;

        // 1. Traer datos del proyecto
        const proyecto = await query(
            `SELECT nombre_proyecto, estatus, progreso, fecha_inicio, descripcion
             FROM proyecto
             WHERE id_proyecto = ?`,
            [idProyecto]
        );

        if (!proyecto.length) {
            return res.status(404).json({ success: false, message: "Proyecto no encontrado" });
        }

        // 2. Traer avances
        const avances = await query(
            `SELECT hitos, notas, fecha_creacion
             FROM avances
             WHERE id_proyecto = ?
             ORDER BY fecha_creacion DESC`,
            [idProyecto]
        );

        // 3. Crear libro de Excel
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Reporte del Proyecto");

        // TÍTULO
        sheet.addRow([`Reporte del proyecto: ${proyecto[0].nombre_proyecto}`]);
        sheet.addRow([]);
        
        // DATOS DEL PROYECTO
        sheet.addRow(["Estado", proyecto[0].estatus]);
        sheet.addRow(["Progreso", proyecto[0].progreso + "%"]);
        sheet.addRow(["Fecha inicio", proyecto[0].fecha_inicio]);
        sheet.addRow(["Descripción", proyecto[0].descripcion]);
        sheet.addRow([]);

        // TABLA DE AVANCES
        sheet.addRow(["Hito", "Notas", "Fecha"]);
        avances.forEach(a => {
            sheet.addRow([a.hitos, a.notas, a.fecha_creacion]);
        });

        // 4. Enviar Excel como descarga
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=reporte_proyecto_${idProyecto}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error al generar Excel:", error);
        res.status(500).json({ success: false, message: "Error interno al generar el reporte" });
    }
};

const getReporteEmprendedores = async (req, res) => {
    try {
        const sql = `
            SELECT 
        per.id_persona,
    per.nombre,
    per.apellido,
    per.telefono,
    per.fecha_nacimiento,
    per.correo,
    per.ingresos,
    per.dependientes_eco,
    per.rfc,
    per.curp,
    per.estado_civil,
    per.genero,
    per.colonia,
    per.cp,
    per.calle,
    per.jornada,
    per.no_control,
    per.fecha_registro,
    e.nombre_especialidad AS especialidad,

    u.id_usuario,

    (
        SELECT COUNT(*)
        FROM proyecto p
        WHERE p.id_usuario = u.id_usuario
    ) AS total_proyectos

FROM persona per
INNER JOIN usuarios u ON per.id_persona = u.id_persona
LEFT JOIN especialidad e ON u.id_especialidad = e.id_especialidad
WHERE u.id_rol = 2  
ORDER BY per.fecha_registro DESC

        `;

        const emprendedores = await query(sql);

        res.json({
            success: true,
            data: emprendedores
        });

    } catch (error) {
        console.error("Error en getReporteEmprendedores:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
};


 const getReporteProyectos = async (req, res) => {
    try {
        const sql = `
            SELECT 
        per.id_proyecto,
    per.nombre_proyecto,
    per.fecha_inicio,
    per.estatus,
    per.progreso,
    
    e.nombre as nombre,
    e.apellido as apellido,
    u.id_usuario
FROM proyecto per
JOIN usuarios u ON u.id_usuario = per.id_usuario
LEFT JOIN persona e ON u.id_persona = e.id_persona
WHERE u.id_rol = 2  
ORDER BY per.nombre_proyecto DESC

    `;

        const proyectos = await query(sql);

        res.json({
            success: true,
            data: proyectos
        });

    } catch (error) {
        console.error("Error en getReporteProyectos:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
};




const getProyectosDeUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;

    const sql = `
      SELECT id_proyecto, nombre_proyecto, estatus, progreso
      FROM proyecto
      WHERE id_usuario = ?
    `;

    const rows = await query(sql, [idUsuario]);

    res.json({ success: true, data: rows });

  } catch (e) {
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

const getProyecto = async (req, res) => {
  try {
    const { idProyecto } = req.params;

    const sql = `
      SELECT *
      FROM proyecto
      WHERE id_proyecto = ?
    `;

    const rows = await query(sql, [idProyecto]);

    res.json({ success: true, data: rows[0] });

  } catch (e) {
    res.status(500).json({ success: false, message: "Error interno" });
  }
};


const getAvancesProyecto = async (req, res) => {
  try {
    const { idProyecto } = req.params;

    const sql = `
      SELECT id_avances, hitos, notas, fecha_creacion
      FROM avances
      WHERE id_proyecto = ?
      ORDER BY fecha_creacion DESC
    `;

    const rows = await query(sql, [idProyecto]);

    res.json({ success: true, data: rows });

  } catch (e) {
    res.status(500).json({ success: false, message: "Error interno" });
  }
};


const crearAvance = async (req, res) => {
  try {
    const { idProyecto } = req.params;
    const { hitos, notas } = req.body;

    const sql = `
      INSERT INTO avances (id_proyecto, hitos, notas, fecha_creacion)
      VALUES (?, ?, ?, CURDATE())
    `;

    await query(sql, [idProyecto, hitos, notas || ""]);

    res.json({ success: true, message: "Avance registrado" });

  } catch (e) {
    res.status(500).json({ success: false, message: "Error interno" });
  }
};




const getEstadisticas = async (req, res) => {
  try {
    const barras = await query(`
      SELECT 
        MONTH(fecha_inicio) AS mes,
        COUNT(*) AS total
      FROM proyecto
      WHERE YEAR(fecha_inicio) = YEAR(CURDATE())
      GROUP BY MONTH(fecha_inicio)
      ORDER BY mes;
    `);
     
    const pie = await query(`
      SELECT 
        estatus,
        COUNT(*) AS total
      FROM proyecto
      GROUP BY estatus;
    `);

    const horizontal = await query(`
      SELECT 
        e.nombre_especialidad AS especialidad,
        COUNT(p.id_proyecto) AS total
      FROM proyecto p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      JOIN persona pe ON u.id_persona = pe.id_persona
      JOIN especialidad e ON pe.id_especialidad = e.id_especialidad
      GROUP BY e.nombre_especialidad
      ORDER BY total DESC;
    `);

    // Transformar formatos a los que consume Chart.js
    const barrasData = new Array(12).fill(0);
    barras.forEach(f => barrasData[f.mes - 1] = f.total);

    const pieData = [
      pie.find(x => x.estatus === "Finalizado")?.total || 0,
      pie.find(x => x.estatus === "Aprobado")?.total || 0,
      pie.find(x => x.estatus === "Pendiente")?.total || 0
    ];

    const horizontalLabels = horizontal.map(x => x.especialidad);
    const horizontalData = horizontal.map(x => x.total);

    res.json({
      barras: barrasData.slice(0, 6), // Ene-Jun (tu diseño actual)
      pie: pieData,
      horizontal: horizontalData,
      horizontalLabels
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
};


module.exports = {
    getAvancesPorProyecto,
    getProyectosCoordinador,
    agregarComentarioAvance,
    actualizarProgresoProyecto,
    generarReporteExcel,
    getReporteEmprendedores,
    getReporteProyectos,
    getProyectosDeUsuario,
    getProyecto,
    getEstadisticas,
    getAvancesProyecto,
    crearAvance
    
};




  