const { query } = require("../config/database");

// Crear nuevo rol
exports.crearRol = async (req, res) => {
    const { nombreRol, permisos } = req.body;

    try {
        // Validar que el nombre no esté vacío
        if (!nombreRol || nombreRol.trim() === "") {
            return res.status(400).json({ success: false, message: "El nombre del rol no puede estar vacío" });
        }

        // Validar longitud máxima (30 caracteres)
        if (nombreRol.length > 30) {
            return res.status(400).json({ success: false, message: "El nombre del rol no debe exceder 30 caracteres" });
        }

        // Verificar si el nombre ya existe (ignora mayúsculas/minúsculas)
        const rolExistente = await query("SELECT * FROM ROL WHERE LOWER(nombre_rol) = LOWER(?)", [nombreRol]);
        if (rolExistente.length > 0) {
            return res.status(400).json({ success: false, message: "Ya existe un rol con ese nombre" });
        }

        // Insertar nuevo rol si pasa las validaciones
        await query("INSERT INTO ROL (nombre_rol, permisos) VALUES (?, ?)", [nombreRol, permisos]);
        res.status(201).json({ success: true, message: "Rol creado correctamente" });

    } catch (err) {
        console.error("Error al crear rol:", err);
        res.status(500).json({ success: false, message: "Error al crear rol" });
    }
};


// Actualizar rol (con validaciones)
exports.actualizarRol = async (req, res) => {
    const { id } = req.params;
    const { nombreRol, permisos } = req.body;

    try {
        if (!nombreRol || nombreRol.trim() === "") {
            return res.status(400).json({ success: false, message: "El nombre del rol no puede estar vacío" });
        }

        if (nombreRol.length > 30) {
            return res.status(400).json({ success: false, message: "El nombre del rol no debe exceder 30 caracteres" });
        }

        // Verificar si ya existe otro rol con ese nombre
        const rolExistente = await query(
            "SELECT * FROM ROL WHERE LOWER(nombre_rol) = LOWER(?) AND id_rol != ?",
            [nombreRol, id]
        );
        if (rolExistente.length > 0) {
            return res.status(400).json({ success: false, message: "Ya existe otro rol con ese nombre" });
        }

        await query("UPDATE ROL SET nombre_rol=?, permisos=? WHERE id_rol=?", [nombreRol, permisos, id]);
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
        await query("DELETE FROM ROL WHERE id_rol=?", [id]);
        res.json({ success: true, message: "Rol eliminado correctamente" });
    } catch (err) {
        console.error("Error al eliminar rol:", err);
        res.status(500).json({ success: false, message: "Error al eliminar rol" });
    }
};

// Obtener lista de roles y permisos
exports.obtenerRoles = async (req, res) => {
    try {
        //Obtener la lista de roles (usamos 'rows' como el array de resultados)
        const roles = await query("SELECT * FROM rol"); 
        
        //Obtener la lista de permisos.
        const permisosRows = await query("SELECT DISTINCT permisos FROM ROL WHERE permisos IS NOT NULL AND permisos != ''"); 
        const permisosDisponibles = permisosRows.map(row => row.permisos);

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
            SELECT p.nombre, r.nombre_rol 
            FROM usuarios u 
            INNER JOIN rol r ON u.id_rol = r.id_rol
            INNER JOIN persona p ON u.id_persona = p.id_persona
        `);
        res.json({ success: true, usuarios });
    } catch (err) {
        console.error("Error al obtener usuarios con rol:", err);
        res.status(500).json({ success: false, message: "Error al obtener usuarios con rol" });
    }
};

exports.buscarUsuarioPorNombre = async (req, res) => {
    try {
        const { nombre } = req.query; // Se obtiene ?nombre=valor de la URL
        const usuarios = await query(`
            SELECT p.nombre, r.nombre_rol 
            FROM usuarios u 
            INNER JOIN rol r ON u.id_rol = r.id_rol
            INNER JOIN persona p ON u.id_persona = p.id_persona
            WHERE p.nombre LIKE ?
        `, [`%${nombre}%`]); // Busca coincidencias parciales

        res.json({ success: true, usuarios });
    } catch (err) {
        console.error("Error al buscar usuario:", err);
        res.status(500).json({ success: false, message: "Error al buscar usuario" });
    }
};