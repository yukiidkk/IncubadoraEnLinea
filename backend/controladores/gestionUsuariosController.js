const { pool } = require("../config/database");

// ====================
// BUSCAR USUARIOS
// ====================
exports.buscarUsuarios = async (req, res) => {
  try {
    const { nombre } = req.query;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({ message: "Debe proporcionar un nombre para buscar." });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        p.id_persona AS Id_Persona,
        p.nombre AS Nombre,
        p.apellido AS Apellido,
        p.telefono AS Telefono,
        p.fecha_nacimiento AS Fecha_Nacimiento,
        p.correo AS Correo,
        p.ingresos AS Ingresos,
        p.dependientes_eco AS Dependientes_Eco,
        p.rfc AS RFC,
        p.curp AS CURP,
        p.estado_civil AS Estado_Civil,
        p.genero AS Genero,
        p.colonia AS Colonia,
        p.cp AS CP,
        p.calle AS Calle,
        p.jornada AS Jornada,
        p.no_control AS No_Control,
        p.id_especialidad AS Id_Especialidad,
        e.nombre_especialidad AS Nombre_Especialidad,
        u.id_rol AS Id_Rol,
        r.nombre_rol AS Nombre_Rol
      FROM persona p
      LEFT JOIN usuarios u ON p.id_persona = u.id_persona
      LEFT JOIN rol r ON u.id_rol = r.id_rol
      LEFT JOIN especialidad e ON p.id_especialidad = e.id_especialidad
      WHERE p.nombre LIKE ? OR p.apellido LIKE ? OR p.correo LIKE ?
      `,
      [`%${nombre}%`, `%${nombre}%`, `%${nombre}%`]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// ====================
// CREAR USUARIO
// ====================
exports.crearUsuario = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      telefono,
      fecha_nacimiento,
      correo,
      ingresos,
      dependientes_eco,
      rfc,
      curp,
      estado_civil,
      genero,
      colonia,
      cp,
      calle,
      jornada,
      no_control,
      id_rol,
      id_especialidad,
      contrasena
    } = req.body;

    // Insertar en PERSONA
    const [result] = await pool.query(
      `
      INSERT INTO persona (
        id_especialidad, id_rol, nombre, apellido, telefono, fecha_nacimiento,
        correo, ingresos, dependientes_eco, rfc, curp,
        estado_civil, genero, colonia, cp, calle, jornada, no_control
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id_especialidad, id_rol, nombre, apellido, telefono, fecha_nacimiento,
        correo, ingresos, dependientes_eco, rfc, curp,
        estado_civil, genero, colonia, cp, calle, jornada, no_control
      ]
    );

    const id_persona = result.insertId;

    // Insertar en USUARIOS
    await pool.query(
      `
      INSERT INTO usuarios (id_persona, id_rol, id_especialidad, contrasena)
      VALUES (?, ?, ?, ?)
      `,
      [id_persona, id_rol, id_especialidad, contrasena]
    );

    res.json({ message: "Usuario creado correctamente.", id: id_persona });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ message: "Error al crear usuario." });
  }
};

// ====================
// ACTUALIZAR USUARIO
// ====================
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      telefono,
      fecha_nacimiento,
      correo,
      ingresos,
      dependientes_eco,
      rfc,
      curp,
      estado_civil,
      genero,
      colonia,
      cp,
      calle,
      jornada,
      no_control,
      id_especialidad,
      id_rol
    } = req.body;

    // Actualizar datos en PERSONA
    await pool.query(
      `
      UPDATE persona
      SET nombre=?, apellido=?, telefono=?, fecha_nacimiento=?, correo=?,
          ingresos=?, dependientes_eco=?, rfc=?, curp=?, estado_civil=?, genero=?,
          colonia=?, cp=?, calle=?, jornada=?, no_control=?, id_especialidad=?, id_rol=?
      WHERE id_persona=?
      `,
      [
        nombre, apellido, telefono, fecha_nacimiento, correo,
        ingresos, dependientes_eco, rfc, curp, estado_civil, genero,
        colonia, cp, calle, jornada, no_control, id_especialidad, id_rol, id
      ]
    );

    // Actualizar también el rol en USUARIOS
    await pool.query(
      `
      UPDATE usuarios
      SET id_rol=?, id_especialidad=?
      WHERE id_persona=?
      `,
      [id_rol, id_especialidad, id]
    );

    res.json({ message: "Usuario actualizado correctamente (incluido el rol)." });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario." });
  }
};

// ====================
// ELIMINAR USUARIO
// ====================
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE id_persona = ?", [id]);
    await pool.query("DELETE FROM persona WHERE id_persona = ?", [id]);
    res.json({ message: "Usuario eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario." });
  }
};

// ====================
// CATÁLOGOS
// ====================
exports.obtenerEspecialidades = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id_especialidad, nombre_especialidad FROM especialidad");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    res.status(500).json({ message: "Error al obtener especialidades." });
  }
};

exports.obtenerJornadas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT jornada FROM persona WHERE jornada IS NOT NULL AND jornada != ''"
    );
    res.json(rows.map(r => r.jornada));
  } catch (error) {
    console.error("Error al obtener jornadas:", error);
    res.status(500).json({ message: "Error al obtener jornadas." });
  }
};

exports.obtenerEstadosCiviles = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT estado_civil FROM persona WHERE estado_civil IS NOT NULL AND estado_civil != ''"
    );
    res.json(rows.map(r => r.estado_civil));
  } catch (error) {
    console.error("Error al obtener estados civiles:", error);
    res.status(500).json({ message: "Error al obtener estados civiles." });
  }
};

exports.obtenerGeneros = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DISTINCT genero FROM persona WHERE genero IS NOT NULL AND genero != ''"
    );
    res.json(rows.map(r => r.genero));
  } catch (error) {
    console.error("Error al obtener géneros:", error);
    res.status(500).json({ message: "Error al obtener géneros." });
  }
};
