const { query } = require("../config/database");

// Registro de nuevos usuarios (rol por defecto = emprendedor)
exports.registro = async (req, res) => {
  const {
    nombre,
    apellido,
    telefono,
    fecha_nacimiento,
    correo,
    password,
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
    especialidad
  } = req.body;

  try {
  const rol = 2;

  // Validar correo repetido
  const checkCorreo = await query(
    "SELECT id_persona FROM persona WHERE correo = ?",
    [correo]
  );

  if (checkCorreo.length > 0) {
    return res.status(400).json({
      success: false,
      message: "El correo ya está registrado. Usa otro diferente."
    });
  }

  // Asegurar valores nulos si vienen indefinidos
  const safe = v => (v === undefined || v === '' ? null : v);

  const sqlPersona = `
    INSERT INTO persona (
      id_especialidad, id_rol, nombre, apellido, telefono, fecha_nacimiento,
      correo, ingresos, dependientes_eco, rfc, curp,
      estado_civil, genero, colonia, cp, calle, jornada, no_control
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await query(sqlPersona, [
    safe(especialidad), rol, safe(nombre), safe(apellido), safe(telefono),
    safe(fecha_nacimiento), safe(correo), safe(ingresos), safe(dependientes_eco),
    safe(rfc), safe(curp), safe(estado_civil), safe(genero), safe(colonia),
    safe(cp), safe(calle), safe(jornada), safe(no_control)
  ]);

  const id_persona = result.insertId;

  const sqlUsuario = `
    INSERT INTO usuarios (id_persona, id_rol, id_especialidad, contrasena)
    VALUES (?, ?, ?, ?)
  `;

  await query(sqlUsuario, [id_persona, rol, safe(especialidad), safe(password)]);

  res.status(201).json({
    success: true,
    message: "Registro exitoso. Usuario creado como emprendedor."
  });

} catch (err) {
  console.error("Error en registro:", err);
  res.status(500).json({
    success: false,
    message: "Error al registrar usuario",
    error: err.message
  });
}

  
};
