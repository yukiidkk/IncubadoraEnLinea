const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

// Generar JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '24h'
    });
};

// Login de usuario
exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Credenciales inválidas.' 
            });
        }

        // Verificar password
        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Credenciales inválidas.' 
            });
        }

        // Verificar si el usuario está activo
        if (!user.isActive) {
            return res.status(400).json({ 
                success: false, 
                message: 'Usuario inactivo.' 
            });
        }

        // Generar token
        const token = generateToken(user.id);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                permissions: user.role.permissions
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor.' 
        });
    }
};

// Obtener usuario actual
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado.' 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                permissions: user.role.permissions,
                profile: user.profile
            }
        });
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor.' 
        });
    }
};