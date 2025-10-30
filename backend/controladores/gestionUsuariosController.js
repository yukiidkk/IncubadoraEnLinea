// backend/controladores/gestionUsuariosController.js
const { pool } = require("../config/database");

// ====================
// 🔍 BUSCAR USUARIOS
// ====================
exports.buscarUsuarios = async (req, res) => {
  try {
    const { nombre } = req.query;
    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({ message: "Debe proporcionar un nombre para buscar" });
    }

    const [rows] = await pool.query(
      `
      SELECT 
        e.Id_Emprendedor,
        e.Nombre,
        e.Apellido,
        e.Telefono,
        e.Fecha_Nacimiento,
        e.Correo,
        e.Ingresos,
        e.Dependientes_Eco,
        e.RFC,
        e.CURP,
        e.Estado_Civil,
        e.Genero,
        e.Colonia,
        e.CP,
        e.Calle,
        e.Jornada,
        e.No_Control,
        e.ESPECIALIDAD_Id_Especialidad,
        es.Nombre_Especialidad,
        r.Nombre_Rol
      FROM emprendedor e
      LEFT JOIN usuarios u ON e.Id_Emprendedor = u.EMPRENDEDOR_Id_Emprendedor
      LEFT JOIN rol r ON e.Rol_id_Rol = r.id_Rol
      LEFT JOIN especialidad es ON e.ESPECIALIDAD_Id_Especialidad = es.Id_Especialidad
      WHERE e.Nombre LIKE ? OR e.Apellido LIKE ? OR e.Correo LIKE ?
      `,
      [`%${nombre}%`, `%${nombre}%`, `%${nombre}%`]
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al buscar usuarios:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ====================
// 🧩 CREAR USUARIO
// ====================
exports.crearUsuario = async (req, res) => {
  try {
    const {
      Nombre,
      Apellido,
      Telefono,
      Fecha_Nacimiento,
      Correo,
      Ingresos,
      Dependientes_Eco,
      RFC,
      CURP,
      Estado_Civil,
      Genero,
      Colonia,
      CP,
      Calle,
      Jornada,
      No_Control,
      id_Rol,
      Id_Especialidad,
      Contrasena
    } = req.body;

    // Insertar en EMPRENDEDOR
    const [result] = await pool.query(
      `INSERT INTO emprendedor (
        Nombre, Apellido, Telefono, Fecha_Nacimiento, Correo, Ingresos,
        Dependientes_Eco, RFC, CURP, Estado_Civil, Genero, Colonia, CP, Calle,
        Jornada, No_Control, Rol_id_Rol, ESPECIALIDAD_Id_Especialidad
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Nombre, Apellido, Telefono, Fecha_Nacimiento, Correo, Ingresos,
        Dependientes_Eco, RFC, CURP, Estado_Civil, Genero, Colonia, CP, Calle,
        Jornada, No_Control, id_Rol, Id_Especialidad
      ]
    );

    const nuevoIdEmprendedor = result.insertId;

    // Insertar en USUARIOS
    await pool.query(
      `INSERT INTO usuarios (id_Rol, EMPRENDEDOR_Id_Emprendedor, Usuario, Contrasena)
       VALUES (?, ?, ?, ?)`,
      [id_Rol, nuevoIdEmprendedor, Correo, Contrasena]
    );

    res.json({ message: "✅ Usuario creado correctamente", id: nuevoIdEmprendedor });
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);
    res.status(500).json({ message: "Error al crear usuario" });
  }
};

// ====================
// 🔁 ACTUALIZAR USUARIO
// ====================
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Nombre,
      Apellido,
      Telefono,
      Fecha_Nacimiento,
      Correo,
      Ingresos,
      Dependientes_Eco,
      RFC,
      CURP,
      Estado_Civil,
      Genero,
      Colonia,
      CP,
      Calle,
      Jornada,
      No_Control,
      Id_Especialidad
    } = req.body;

    await pool.query(
      `
      UPDATE emprendedor
      SET Nombre=?, Apellido=?, Telefono=?, Fecha_Nacimiento=?, Correo=?,
          Ingresos=?, Dependientes_Eco=?, RFC=?, CURP=?, Estado_Civil=?, Genero=?,
          Colonia=?, CP=?, Calle=?, Jornada=?, No_Control=?, ESPECIALIDAD_Id_Especialidad=?
      WHERE Id_Emprendedor=?
      `,
      [
        Nombre, Apellido, Telefono, Fecha_Nacimiento, Correo,
        Ingresos, Dependientes_Eco, RFC, CURP, Estado_Civil, Genero,
        Colonia, CP, Calle, Jornada, No_Control, Id_Especialidad, id
      ]
    );

    res.json({ message: "✅ Usuario actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

// ====================
// 🗑️ ELIMINAR USUARIO
// ====================
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE EMPRENDEDOR_Id_Emprendedor = ?", [id]);
    await pool.query("DELETE FROM emprendedor WHERE Id_Emprendedor = ?", [id]);
    res.json({ message: "🗑️ Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

// ====================
// 📚 CATÁLOGOS
// ====================
exports.obtenerEspecialidades = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT Id_Especialidad, Nombre_Especialidad FROM especialidad");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener especialidades:", error);
    res.status(500).json({ message: "Error al obtener especialidades" });
  }
};

exports.obtenerJornadas = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT Jornada FROM emprendedor WHERE Jornada IS NOT NULL AND Jornada != ''");
    res.json(rows.map(r => r.Jornada));
  } catch (error) {
    console.error("❌ Error al obtener jornadas:", error);
    res.status(500).json({ message: "Error al obtener jornadas" });
  }
};

exports.obtenerEstadosCiviles = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT Estado_Civil FROM emprendedor WHERE Estado_Civil IS NOT NULL AND Estado_Civil != ''");
    res.json(rows.map(r => r.Estado_Civil));
  } catch (error) {
    console.error("❌ Error al obtener estados civiles:", error);
    res.status(500).json({ message: "Error al obtener estados civiles" });
  }
};

exports.obtenerGeneros = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT DISTINCT Genero FROM emprendedor WHERE Genero IS NOT NULL AND Genero != ''");
    res.json(rows.map(r => r.Genero));
  } catch (error) {
    console.error("❌ Error al obtener géneros:", error);
    res.status(500).json({ message: "Error al obtener géneros" });
  }
};
