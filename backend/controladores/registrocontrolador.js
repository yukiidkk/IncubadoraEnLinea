const { query } = require("../config/database");

// Registro de nuevos usuarios (rol por defecto = emprendedor)
exports.registro = async (req, res) => {
  const {
    nombre,
    apellido,
    correo,
    password,
    telefono,
    fecha_nacimiento,
    ingresos,
    dependientes,
    rfc,
    curp,
    estado_civil,
    genero,
    colonia,
    cp,
    calle,
    jornada,
    no_control,
    especialidad
  } = req.body;

  try {
    // Rol fijo = 2 (Emprendedor)
    const rol = 2;

    // Insertar en tabla EMPRENDEDOR
    const sqlEmp = `
      INSERT INTO EMPRENDEDOR (
        ESPECIALIDAD_Id_Especialidad, Rol_id_Rol, Nombre, Apellido, Telefono,
        Fecha_Nacimiento, Correo, Ingresos, Dependientes_Eco, RFC, CURP,
        Estado_Civil, Genero, Colonia, CP, Calle, Jornada, No_Control
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sqlEmp, [
      especialidad, rol, nombre, apellido, telefono, fecha_nacimiento, correo,
      ingresos, dependientes, rfc, curp, estado_civil, genero, colonia,
      cp, calle, jornada, no_control
    ]);

    const idEmprendedor = result.insertId;

    // Crear usuario para login
    const sqlUser = `
      INSERT INTO USUARIOS (id_Rol, EMPRENDEDOR_Id_Emprendedor, Usuario, Contrasena)
      VALUES (?, ?, ?, ?)
    `;
    await query(sqlUser, [rol, idEmprendedor, correo, password]);

    res.status(201).json({
      success: true,
      message: "Registro exitoso. Usuario creado como emprendedor."
    });
  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario"
    });
  }
};
