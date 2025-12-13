const ExcelJS = require("exceljs");
const { query, pool } = require("../config/database");

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
        const { id_proyecto, comentario ,id_usuario} = req.body;
        console.log("👉 BODY RECIBIDO:", req.body);
           
        if (!id_proyecto || !comentario || !id_usuario) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos"
      });
    }

        const sql = `
            INSERT INTO avances (id_proyecto, hitos, notas, fecha_creacion , id_usuario)
            VALUES (?, 'Comentario Coordinador', ?, NOW(),?)
        `;
         const params = [
      Number(id_proyecto),
      comentario,
      Number(id_usuario)
    ];
        await query(sql , params);

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
        const { id_proyecto } = req.params;
        const { progreso } = req.body;


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



const getEstadisticas = async (req, res) => {
  try {
    const barrasQuery = `
      SELECT 
        MONTH(fecha_inicio) AS mes,
        COUNT(*) AS total
      FROM proyecto
      WHERE YEAR(fecha_inicio) = YEAR(CURDATE())
      GROUP BY MONTH(fecha_inicio)
      ORDER BY mes;
    `;

    const pieQuery = `
      SELECT 
        estatus,
        COUNT(*) AS total
      FROM proyecto
      GROUP BY estatus;
    `;

    const horizontalQuery = `
      SELECT 
        e.nombre_especialidad AS especialidad,
        COUNT(p.id_proyecto) AS total
      FROM proyecto p
      JOIN usuarios u ON p.id_usuario = u.id_usuario
      JOIN persona pe ON u.id_persona = pe.id_persona
      JOIN especialidad e ON pe.id_especialidad = e.id_especialidad
      GROUP BY e.nombre_especialidad
      ORDER BY total DESC;
    `;
    
    const totalEmprendedoresQuery = `
        SELECT COUNT(*) AS total
        FROM usuarios u
         INNER JOIN rol r ON u.id_rol = r.id_rol
         WHERE r.nombre_rol = 'Emprendedor';
    `;

    // === CONSULTAS ===
    const barras = await query(barrasQuery);
    const pie = await query(pieQuery);
    const horizontal = await query(horizontalQuery);
    const totalEmprendedores = await query(totalEmprendedoresQuery);

    console.log("DEBUG PIE ===>", pie);
    console.log("DEBUG horizontal ===>", horizontal);

    // === FORZAR A ARREGLO SI ES OBJETO ÚNICO ===
    const barrasArray = Array.isArray(barras) ? barras : [barras];
    const pieArray = Array.isArray(pie) ? pie : [pie];
    const horizontalArray = Array.isArray(horizontal) ? horizontal : [horizontal];

    // === FORMATEO PARA CHART.JS ===

    // BARRAS
    const barrasData = new Array(12).fill(0);
    barrasArray.forEach(f => barrasData[f.mes - 1] = f.total);

    // PIE
    const pieData = [
      pieArray.find(x => x.estatus === "Finalizado")?.total || 0,
      pieArray.find(x => x.estatus === "Aprobado" || x.estatus === "En curso")?.total || 0,
      pieArray.find(x => x.estatus === "Pendiente")?.total || 0
    ];

    // HORIZONTAL
    const horizontalLabels = horizontalArray.map(x => x.especialidad);
    const horizontalData = horizontalArray.map(x => x.total);
 

    //const totalEmprendedores = totalEmprendedoresResult.total || 0;


    res.json({
      barras: barrasData.slice(0, 6),
      pie: pieData,
      horizontal: horizontalData,
      horizontalLabels,
      totalEmprendedores: totalEmprendedores[0].total
    });

  } catch (err) {
    console.error("ERROR en estadísticas:", err);
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
};




//EMPRENDEDOOOOOOR

const buscarProyectoPorNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    const id_usuario = req.query.id_usuario || null; // opcional

    let sql = `
      SELECT id_proyecto, id_usuario, nombre_proyecto, fecha_inicio, estatus, progreso, descripcion
      FROM proyecto
      WHERE nombre_proyecto LIKE ?
    `;
    const params = [`%${nombre}%`];

    if (id_usuario-usuario) {
      sql += ' AND id_usuario = ?';
      params.push(id_usuario);
    }

    const proyectos = await query(sql, params);

    if (proyectos.length === 0) {
      return res.json({ success: false, message: "No se encontraron proyectos con ese nombre" });
    }

    res.json({ success: true, data: proyectos });
  } catch (error) {
    console.error("Error al buscar proyecto:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};


const crearComentario = async (req, res) => {
  try {
    //const { id_proyecto } = req.params;
    console.log("👉 BODY RECIBIDO:", req.body);
    const { id_proyecto, comentario, id_usuario_emisor } = req.body; // opcional id del que envía

    if (!comentario || comentario.trim() === '') {
      return res.status(400).json({ success: false, message: "Comentario vacío" });
    }

    const sql = `
      INSERT INTO avances (id_proyecto, hitos ,notas ,fecha_creacion,id_usuario)
      VALUES (?, 'Comentario', ?, NOW(),?)
    `;
    await query(sql, [id_proyecto, comentario , id_usuario_emisor ]);

    res.json( { success: true, message: "Comentario enviado al coordinador" });
  } catch (err) {
    console.error("Error en crearComentario:", err);
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

const getProyectosFiltrados = async (req, res) => {
    try {
        const { nombre } = req.query;

        let sql = "SELECT * FROM proyecto";

        if (nombre) {
            sql += " WHERE nombre_proyecto LIKE ?";
        }

        const [rows] = await query(sql, [`%${nombre}%`]);

        res.json({ success: true, data: rows });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getProyectoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const sql = `
            SELECT p.id_proyecto, p.nombre_proyecto, p.fecha_inicio,
                   p.estatus, p.progreso, p.descripcion,
                   per.nombre AS nombre_emprendedor, per.apellido
            FROM proyecto p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            INNER JOIN persona per ON u.id_persona = per.id_persona
            WHERE p.id_proyecto = ?
        `;

        const rows = await query(sql, [id]);

        if (rows.length === 0) {
            return res.json({
                success: false,
                message: "Proyecto no encontrado"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
};

const crearAvance = async (req, res) => {
    try {
        const { id } = req.params;
        const { hitos, notas , id_usuario } = req.body;

        const sql = `
            INSERT INTO avances(id_proyecto, hitos, notas , id_usuario)
            VALUES (?, ?, ? , ?)
        `;

        await query(sql, [id, hitos, notas, id_usuario]);

        res.json({ success: true, message: "Avance creado" });

    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Error interno" });
    }
};


const getProyectosDeUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;

        const sql = `
            SELECT 
                p.id_proyecto,
                p.nombre_proyecto,
                p.fecha_inicio,
                p.estatus,
                p.progreso,
                p.descripcion,
                per.nombre,
                per.apellido,
                u.id_usuario
            FROM proyecto p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            INNER JOIN persona per ON u.id_persona = per.id_persona
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_inicio DESC
        `;

        const proyectos = await query(sql, [id_usuario]);

        if (!proyectos || proyectos.length === 0) {
            return res.json({
                success: false,
                message: "Este usuario no tiene proyectos registrados"
            });
        }

        res.json({
            success: true,
            data: proyectos
        });

    } catch (error) {
        console.error("Error en getProyectosDeUsuario:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
};

//para el emprendedor
const getAvancesProyectoEmprendedor = async (req, res) => {
    try {
        console.log("👉 ENTRO AL CONTROLADOR getAvancesProyectoEmprendedor");
        const { id } = req.params;
         console.log("👉 ID PROYECTO RECIBIDO:", id);
        const sql = `
          SELECT 
        a.id_avances,
        a.hitos,
        a.notas,
        a.fecha_creacion,
        p.nombre,
        p.apellido
      FROM avances a
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      INNER JOIN persona p ON p.id_persona = u.id_persona
      WHERE a.id_proyecto = ?
      ORDER BY a.fecha_creacion DESC
        `;

       // const [rows] = await query(query, [id]);
        console.log("👉 SQL:", sql);
       const rows = await query(sql, [id]);

        console.log("👉 RESULTADO QUERY:", rows);


        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error("Error en getAvancesProyectoEmprendedor:",error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
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
    getEstadisticas,
    getProyectosFiltrados,
    crearComentario,
    getProyectoPorId,
    buscarProyectoPorNombre,
    crearAvance,
    getProyectosDeUsuario,
    getAvancesProyectoEmprendedor
    
};




  