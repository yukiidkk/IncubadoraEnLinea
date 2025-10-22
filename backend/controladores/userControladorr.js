const { validationResult } = require('express-validator');
const User = require('../models/User');
const Role = require('../models/Role');

// Obtener todos los usuarios
exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor.' 
        });
    }
};

// Crear nuevo usuario
exports.createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { name, email, password, roleId, profile } = req.body;

        // Verificar si el email ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'El email ya está registrado.' 
            });
        }

        // Verificar si el rol existe
        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rol no válido.' 
            });
        }

        // Crear usuario
        const user = await User.create({
            name,
            email,
            password,
            role_id: roleId,
            profile
        });

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente.',
            data: user
        });

    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor.' 
        });
    }
};

// ... (los demás métodos siguen la misma lógica de adaptación)