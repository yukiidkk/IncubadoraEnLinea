const { query } = require("../config/database");

// Función que simula la obtención de permisos disponibles para el select.
// En un sistema real, esto podría venir de otra tabla de la DB.
//const PERMISOS_DISPONIBLES = ['Administrador', 'Usuario'];

//Crear nuevo rol
exports.crearRol = async (req, res) => {
    const { nombreRol, permisos } = req.body;
    try {
        await query("INSERT INTO ROL (Nombre_Rol, Permisos) VALUES (?, ?)", [
            nombreRol,
            permisos
        ]);
        res.status(201).json({ success: true, message: "Rol creado correctamente" });
    } catch (err) {
        console.error("Error al crear rol:", err);
        res.status(500).json({ success: false, message: "Error al crear rol" });
    }
};

//Actualizar rol
exports.actualizarRol = async (req, res) => {
    const { id } = req.params;
    const { nombreRol, permisos } = req.body;
    try {
        await query("UPDATE ROL SET Nombre_Rol=?, Permisos=? WHERE id_Rol=?", [
            nombreRol,
            permisos,
            id
        ]);
        res.json({ success: true, message: "Rol actualizado correctamente" });
    } catch (err) {
        console.error("Error al actualizar rol:", err);
        res.status(500).json({ success: false, message: "Error al actualizar rol" });
    }
};

//Eliminar rol
exports.eliminarRol = async (req, res) => {
    const { id } = req.params;
    try {
        await query("DELETE FROM ROL WHERE id_Rol=?", [id]);
        res.json({ success: true, message: "Rol eliminado correctamente" });
    } catch (err) {
        console.error("Error al eliminar rol:", err);
        res.status(500).json({ success: false, message: "Error al eliminar rol" });
    }
};

// Obtener lista de roles y permisos
exports.obtenerRoles = async (req, res) => {
    try {
        // 1. Obtener la lista de roles (usamos 'rows' como el array de resultados)
        const roles = await query("SELECT * FROM ROL"); 
        
        // 2. Obtener la lista ÚNICA de permisos. Renombramos a 'permisosRows'.
        //    'permisosRows' será el array que contiene los objetos { Permisos: 'valor' }
        const permisosRows = await query("SELECT DISTINCT Permisos FROM ROL WHERE Permisos IS NOT NULL AND Permisos != ''"); 
        
        // 3. Ahora usamos .map() en el array correcto: 'permisosRows'
        const permisosDisponibles = permisosRows.map(row => row.Permisos);

        res.json({ 
            success: true, 
            roles: roles,
            permisosDisponibles: permisosDisponibles
        });
    } catch (err) {
        console.error("Error al obtener roles:", err);
        res.status(500).json({ success: false, message: "Error al obtener roles" });
    }
};

// Obtener usuarios con su rol
exports.obtenerUsuariosConRol = async (req, res) => {
    try {
        const usuarios = await query(`
            SELECT u.Usuario, r.Nombre_Rol 
            FROM usuarios u 
            INNER JOIN rol r ON u.id_Rol = r.id_Rol
        `);
        res.json({ success: true, usuarios });
    } catch (err) {
        console.error("Error al obtener usuarios con rol:", err);
        res.status(500).json({ success: false, message: "Error al obtener usuarios con rol" });
    }
};

// Buscar usuarios por nombre
exports.buscarUsuarioPorNombre = async (req, res) => {
    try {
        const { nombre } = req.query; // Se obtiene ?nombre=valor de la URL
        const usuarios = await query(`
            SELECT u.Usuario, r.Nombre_Rol 
            FROM usuarios u 
            INNER JOIN rol r ON u.id_Rol = r.id_Rol
            WHERE u.Usuario LIKE ?
        `, [`%${nombre}%`]); // Busca coincidencias parciales

        res.json({ success: true, usuarios });
    } catch (err) {
        console.error("Error al buscar usuario:", err);
        res.status(500).json({ success: false, message: "Error al buscar usuario" });
    }
};