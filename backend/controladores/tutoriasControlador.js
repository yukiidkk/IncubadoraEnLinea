const { query } = require("../config/database");

const obtenerTutores = async (req, res) => {
    try {
        const [db] = await query("SELECT DATABASE() AS db");
        //console.log("➡️ Node está usando la base:", db[0].db);
        const sql = `
            SELECT 
                u.id_usuario,
                CONCAT(p.nombre, ' ', p.apellido) AS nombre_completo
            FROM usuarios u
            JOIN persona p ON u.id_persona = p.id_persona
            JOIN rol r ON u.id_rol = r.id_rol
            WHERE r.nombre_rol = 'Coordinador';
        `;
        const data = await query(sql);
        res.json(data);
    } catch (error) {
        console.error("Error al obtener tutores:", error);
        res.status(500).json({ mensaje: "Error en el servidor" });
    }
};

module.exports = { obtenerTutores };
