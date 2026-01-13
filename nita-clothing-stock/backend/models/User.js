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

    static async create(userData) {
        try {
            const { username, email, password, full_name, role, status } = userData;
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = `
                INSERT INTO usuarios (nombre, email, password, rol, activo)
                VALUES (?, ?, ?, ?, ?)
            `;
            const result = await database.run(sql, [username || full_name, email, hashedPassword, role, status === 'activo']);
            return { id: result.insertId, username: username || full_name, email, full_name, role, status };
        } catch (error) {
            throw new Error(`Error creando usuario: ${error.message}`);
        }
    }

    static async findByEmail(email) {
        try {
            const sql = `SELECT id, nombre as username, email, password, rol as role, activo as status, created_at, updated_at FROM usuarios WHERE email = ?`;
            const user = await database.get(sql, [email]);
            if (user) {
                user.status = user.status ? 'activo' : 'inactivo';
            }
            return user;
        } catch (error) {
            throw new Error(`Error buscando usuario: ${error.message}`);
        }
    }

    static async findById(id) {
        try {
            const sql = `SELECT id, nombre as username, email, password, rol as role, activo as status, created_at, updated_at FROM usuarios WHERE id = ?`;
            const user = await database.get(sql, [id]);
            if (user) {
                user.status = user.status ? 'activo' : 'inactivo';
            }
            return user;
        } catch (error) {
            throw new Error(`Error buscando usuario: ${error.message}`);
        }
    }

    static async getAll() {
        try {
            const sql = `SELECT id, nombre as username, email, rol as role, activo as status, created_at, updated_at FROM usuarios`;
            const users = await database.all(sql);
            return users.map(user => ({
                ...user,
                status: user.status ? 'activo' : 'inactivo'
            }));
        } catch (error) {
            throw new Error(`Error obteniendo usuarios: ${error.message}`);
        }
    }

    static async update(id, userData) {
        try {
            const { username, email, full_name, role, status } = userData;
            const sql = `
                UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ? WHERE id = ?
            `;
            await database.run(sql, [username || full_name, email, role, status === 'activo', id]);
            return { id, username: username || full_name, email, full_name, role, status };
        } catch (error) {
            throw new Error(`Error actualizando usuario: ${error.message}`);
        }
    }

    static async setStatus(id, status) {
        try {
            const sql = `UPDATE usuarios SET activo = ? WHERE id = ?`;
            await database.run(sql, [status === 'activo', id]);
            return true;
        } catch (error) {
            throw new Error(`Error cambiando estado de usuario: ${error.message}`);
        }
    }

    static async updateLastLogin(id) {
        try {
            const sql = `UPDATE usuarios SET last_login = NOW() WHERE id = ?`;
            await database.run(sql, [id]);
            return true;
        } catch (error) {
            throw new Error(`Error actualizando último login: ${error.message}`);
        }
    }

    static async updatePassword(id, hashedPassword) {
        try {
            const sql = `UPDATE usuarios SET password = ? WHERE id = ?`;
            await database.run(sql, [hashedPassword, id]);
            return true;
        } catch (error) {
            throw new Error(`Error actualizando contraseña: ${error.message}`);
        }
    }
}

module.exports = User;
