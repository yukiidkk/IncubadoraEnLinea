// backend/controllers/loginController.js
const { query } = require("../config/database");

// Controlador para iniciar sesión
exports.login = async (req, res) => {
  const { correo, password } = req.body; // datos que vienen del frontend

  try {
    // Buscar el usuario por su correo
    const sql = `
      SELECT u.*, r.Nombre_Rol 
      FROM USUARIOS u
      INNER JOIN Rol r ON u.id_Rol = r.id_Rol
      WHERE u.Usuario = ?
    `;
    const users = await query(sql, [correo]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = users[0];

    // Validar contraseña (sin encriptación)
    if (password !== user.Contrasena) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    // Enviar respuesta de éxito
    res.json({
      success: true,
      message: "Inicio de sesión correcto",
      usuario: user.Usuario,
      rol: user.id_Rol,
      tipo: user.Nombre_Rol
    });

  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};
