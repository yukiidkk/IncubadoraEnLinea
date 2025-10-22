const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const initDB = async () => {
    let connection;
    
    try {
        // Conectar sin especificar base de datos primero
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('Conectado a MySQL servidor');

        // Crear base de datos si no existe
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'Incubadora_bd'}`);
        console.log('Base de datos creada/verificada');

        // Usar la base de datos
        await connection.execute(`USE ${process.env.DB_NAME || 'Incubadora_bd'}`);

        // Crear tabla de roles
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                permissions JSON,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Tabla roles creada/verificada');

        // Crear tabla de usuarios
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role_id INT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                profile JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id)
            )
        `);
        console.log('Tabla users creada/verificada');

        // Insertar roles por defecto
        const roles = [
            {
                name: 'administrador',
                permissions: JSON.stringify([
                    'gestion_usuarios',
                    'gestion_roles',
                    'gestion_tutorias',
                    'ver_reportes',
                    'gestion_proyectos',
                    'gestion_eventos'
                ]),
                description: 'Administrador del sistema con todos los permisos'
            },
            {
                name: 'coordinador',
                permissions: JSON.stringify([
                    'gestion_tutorias',
                    'ver_reportes',
                    'gestion_proyectos',
                    'gestion_eventos'
                ]),
                description: 'Coordinador de tutorías'
            },
            {
                name: 'tutor',
                permissions: JSON.stringify(['gestion_tutorias']),
                description: 'Tutor académico'
            },
            {
                name: 'estudiante',
                permissions: JSON.stringify([]),
                description: 'Estudiante emprendedor'
            }
        ];

        for (const role of roles) {
            await connection.execute(
                'INSERT IGNORE INTO roles (name, permissions, description) VALUES (?, ?, ?)',
                [role.name, role.permissions, role.description]
            );
        }
        console.log('Roles iniciales insertados');

        // Crear usuario administrador por defecto
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const [adminRole] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['administrador']);
        
        if (adminRole.length > 0) {
            await connection.execute(
                'INSERT IGNORE INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
                ['Administrador', 'admin@its.com', hashedPassword, adminRole[0].id]
            );
            console.log('Usuario administrador creado (email: admin@its.com, password: admin123)');
        }

        console.log('✅ Base de datos inicializada correctamente');

    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
        process.exit();
    }
};

initDB();