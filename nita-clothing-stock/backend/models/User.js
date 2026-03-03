const database = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    constructor(username, email, password, full_name, role = 'vendedor', status = 'activo') {
        this.username = username;
        this.email = email;
        this.password = password;
        this.full_name = full_name;
        this.role = role;
        this.status = status;
    }

    static async create(userData, connection = null) {
        const { username, email, password, full_name, role, status } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `
            INSERT INTO usuarios (nombre, email, password, rol, activo)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await database.run(sql, [username || full_name, email, hashedPassword, role, status === 'activo'], connection);
        return { id: result.insertId, username: username || full_name, email, full_name, role, status };
    }

    static async findByEmail(email, connection = null) {
        const sql = `SELECT id, nombre as username, email, password, rol as role, activo as status, created_at, updated_at FROM usuarios WHERE email = ?`;
        const user = await database.get(sql, [email], connection);
        if (user) {
            user.status = user.status ? 'activo' : 'inactivo';
        }
        return user;
    }

    static async findById(id, connection = null) {
        const sql = `SELECT id, nombre as username, email, password, rol as role, activo as status, created_at, updated_at FROM usuarios WHERE id = ?`;
        const user = await database.get(sql, [id], connection);
        if (user) {
            user.status = user.status ? 'activo' : 'inactivo';
        }
        return user;
    }

    static async getAll(connection = null) {
        const sql = `SELECT id, nombre as username, email, rol as role, activo as status, created_at, updated_at FROM usuarios`;
        const users = await database.all(sql, [], connection);
        return users.map(user => ({
            ...user,
            status: user.status ? 'activo' : 'inactivo'
        }));
    }

    static async update(id, userData, connection = null) {
        const { username, email, full_name, role, status } = userData;
        const sql = `
            UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ? WHERE id = ?
        `;
        await database.run(sql, [username || full_name, email, role, status === 'activo', id], connection);
        return { id, username: username || full_name, email, full_name, role, status };
    }

    static async setStatus(id, status, connection = null) {
        const sql = `UPDATE usuarios SET activo = ? WHERE id = ?`;
        await database.run(sql, [status === 'activo', id], connection);
        return true;
    }

    static async updateLastLogin(id, connection = null) {
        const sql = `UPDATE usuarios SET last_login = NOW() WHERE id = ?`;
        await database.run(sql, [id], connection);
        return true;
    }

    static async updatePassword(id, hashedPassword, connection = null) {
        const sql = `UPDATE usuarios SET password = ? WHERE id = ?`;
        await database.run(sql, [hashedPassword, id], connection);
        return true;
    }
}

module.exports = User;
