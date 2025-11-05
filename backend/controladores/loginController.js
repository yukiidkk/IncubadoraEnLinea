// backend/controladores/loginControlador.js
const { query } = require("../config/database");

exports.login = async (req, res) => {
  const { correo, password } = req.body;

  try {
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

    if (password !== user.contrasena) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta."
      });
    }

    // Enviar respuesta exitosa al frontend
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

  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({
      success: false,
      message: "Error en el servidor al iniciar sesión.",
      error: err.message
    });
  }
};
