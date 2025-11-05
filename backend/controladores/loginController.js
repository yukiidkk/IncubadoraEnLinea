// backend/controladores/loginControlador.js
const { query } = require("../config/database");

// Controlador para iniciar sesión
exports.login = async (req, res) => {
  const { correo, password } = req.body; // datos que vienen del frontend

  try {
    // Buscar al usuario por el correo (desde persona)
    const sql = `
      SELECT 
        u.id_usuario,
        u.id_rol,
        u.id_especialidad,
        u.contrasena,
        r.nombre_rol,
        p.nombre,
        p.apellido,
        p.correo
      FROM usuarios u
      INNER JOIN persona p ON u.id_persona = p.id_persona
      INNER JOIN rol r ON u.id_rol = r.id_rol
      WHERE p.correo = ?
    `;

    const users = await query(sql, [correo]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado."
      });
    }

    const user = users[0];

    // Validar contraseña (sin encriptación)
    if (password !== user.contrasena) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta."
      });
    }

    // Enviar respuesta exitosa
    return res.json({
      success: true,
      message: "Inicio de sesión correcto.",
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      rol: user.id_rol,
      tipo: user.nombre_rol
    });

    //guardar el id del usuario
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    window.location.href = "proyectos.html"; // redirige a la página de proyectos


  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({
      success: false,
      message: "Error en el servidor al iniciar sesión.",
      error: err.message
    });
  }
};
