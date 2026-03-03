
const mysql = require('mysql2/promise');
const mysqlConfig = require('./mysqlConfig');


class Database {
    constructor() {
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = mysql.createPool(mysqlConfig);
            console.log('Conectado exitosamente a la base de datos MySQL');
        }
        return this.pool;
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            console.log('Conexión a la base de datos MySQL cerrada');
        }
    }

    async run(sql, params = [], connection = null) {
        const pool = await this.connect();
        if (connection) {
            const [result] = await connection.execute(sql, params);
            return result;
        } else {
            const [result] = await pool.execute(sql, params);
            return result;
        }
    }

    async beginTransaction() {
        const pool = await this.connect();
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        return connection;
    }

    async commit(connection) {
        await connection.commit();
        await connection.release();
    }

    async rollback(connection) {
        await connection.rollback();
        await connection.release();
    }

    async all(sql, params = [], connection = null) {
        const pool = await this.connect();
        const executor = connection || pool;
        const [rows] = await executor.execute(sql, params);
        return rows;
    }

    async get(sql, params = [], connection = null) {
        const pool = await this.connect();
        const executor = connection || pool;
        if (!executor) throw new Error('Cargando base de datos...');
        const [rows] = await executor.execute(sql, params);
        return rows[0] || null;
    }

    async query(sql, params = [], connection = null) {
        const pool = await this.connect();
        const executor = connection || pool;
        return await executor.execute(sql, params);
    }
}

module.exports = new Database();
