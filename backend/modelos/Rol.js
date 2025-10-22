const { query } = require('../config/database');

class Role {
    // Obtener todos los roles
    static async findAll() {
        return await query('SELECT * FROM roles ORDER BY name');
    }

    // Buscar rol por ID
    static async findById(id) {
        const results = await query('SELECT * FROM roles WHERE id = ?', [id]);
        return results[0] || null;
    }

    // Buscar rol por nombre
    static async findByName(name) {
        const results = await query('SELECT * FROM roles WHERE name = ?', [name]);
        return results[0] || null;
    }

    // Crear nuevo rol
    static async create(roleData) {
        const { name, permissions, description } = roleData;
        const result = await query(
            'INSERT INTO roles (name, permissions, description) VALUES (?, ?, ?)',
            [name, JSON.stringify(permissions), description]
        );
        return this.findById(result.insertId);
    }

    // Actualizar rol
    static async update(id, roleData) {
        const { name, permissions, description } = roleData;
        await query(
            'UPDATE roles SET name = ?, permissions = ?, description = ? WHERE id = ?',
            [name, JSON.stringify(permissions), description, id]
        );
        return this.findById(id);
    }

    // Eliminar rol
    static async delete(id) {
        return await query('DELETE FROM roles WHERE id = ?', [id]);
    }
}

module.exports = Role;