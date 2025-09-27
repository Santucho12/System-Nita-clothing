
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

    async run(sql, params = []) {
        const pool = await this.connect();
        const [result] = await pool.execute(sql, params);
        return result;
    }

    async all(sql, params = []) {
        const pool = await this.connect();
        const [rows] = await pool.execute(sql, params);
        return rows;
    }

    async get(sql, params = []) {
        const pool = await this.connect();
        const [rows] = await pool.execute(sql, params);
        return rows[0] || null;
    }
}

module.exports = new Database();
