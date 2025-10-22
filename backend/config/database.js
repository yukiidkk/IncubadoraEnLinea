const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Incubadora_bd',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(' Conectado a MySQL correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error(' Error conectando a MySQL:', error.message);
        return false;
    }
};

// Función para ejecutar consultas
const query = async (sql, params = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error en consulta MySQL:', error);
        throw error;
    }
};

// Función para obtener una conexión
const getConnection = async () => {
    return await pool.getConnection();
};

module.exports = {
    pool,
    testConnection,
    query,
    getConnection
};