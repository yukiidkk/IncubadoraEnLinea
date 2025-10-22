const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Obtener todos los usuarios con información del rol
    static async findAll() {
        return await query(`
            SELECT u.*, r.name as role_name, r.permissions 
            FROM users u 
            INNER JOIN roles r ON u.role_id = r.id 
            ORDER BY u.name
        `);
    }

    // Buscar usuario por ID
    static async findById(id) {
        const results = await query(`
            SELECT u.*, r.name as role_name, r.permissions 
            FROM users u 
            INNER JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ?
        `, [id]);
        
        if (results[0]) {
            return this.parseUser(results[0]);
        }
        return null;
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        const results = await query(`
            SELECT u.*, r.name as role_name, r.permissions 
            FROM users u 
            INNER JOIN roles r ON u.role_id = r.id 
            WHERE u.email = ?
        `, [email]);
        
        if (results[0]) {
            return this.parseUser(results[0]);
        }
        return null;
    }

    // Crear nuevo usuario
    static async create(userData) {
        const { name, email, password, role_id, profile } = userData;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await query(
            'INSERT INTO users (name, email, password, role_id, profile) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role_id, JSON.stringify(profile || {})]
        );
        
        return this.findById(result.insertId);
    }

    // Actualizar usuario
    static async update(id, userData) {
        const { name, email, role_id, profile, is_active } = userData;
        
        const updates = [];
        const params = [];
        
        if (name) { updates.push('name = ?'); params.push(name); }
        if (email) { updates.push('email = ?'); params.push(email); }
        if (role_id) { updates.push('role_id = ?'); params.push(role_id); }
        if (profile) { updates.push('profile = ?'); params.push(JSON.stringify(profile)); }
        if (typeof is_active === 'boolean') { updates.push('is_active = ?'); params.push(is_active); }
        
        if (updates.length > 0) {
            params.push(id);
            await query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                params
            );
        }
        
        return this.findById(id);
    }

    // Actualizar password
    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    // "Eliminar" usuario (soft delete)
    static async softDelete(id) {
        await query('UPDATE users SET is_active = FALSE WHERE id = ?', [id]);
    }

    // Comparar password
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Parsear usuario desde la base de datos
    static parseUser(dbUser) {
        return {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            password: dbUser.password,
            role: {
                id: dbUser.role_id,
                name: dbUser.role_name,
                permissions: typeof dbUser.permissions === 'string' 
                    ? JSON.parse(dbUser.permissions) 
                    : dbUser.permissions
            },
            isActive: dbUser.is_active,
            profile: typeof dbUser.profile === 'string' 
                ? JSON.parse(dbUser.profile) 
                : dbUser.profile,
            createdAt: dbUser.created_at,
            updatedAt: dbUser.updated_at
        };
    }
}

module.exports = User;