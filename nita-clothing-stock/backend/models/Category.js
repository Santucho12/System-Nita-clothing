const database = require('../config/database');

class Category {
    constructor(name, description = null) {
        this.name = name;
        this.description = description;
    }

    // Crear una nueva categoría
    static async create(categoryData, connection = null) {
        let { name, description } = categoryData;
        if (typeof name === 'undefined') name = null;
        if (typeof description === 'undefined') description = null;
        const sql = `
            INSERT INTO categorias (nombre, descripcion, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
        `;
        const result = await database.run(sql, [name, description], connection);
        return { id: result.insertId, name, description };
    }

    // Obtener todas las categorías
    static async getAll(connection = null) {
        const sql = `
            SELECT id, nombre as name, descripcion as description, status, created_at, updated_at
            FROM categorias
            WHERE deleted_at IS NULL
            ORDER BY nombre ASC
        `;
        return await database.all(sql, [], connection);
    }

    // Obtener categoría por ID
    static async getById(id, connection = null) {
        const sql = `
            SELECT id, nombre as name, descripcion as description, status, created_at, updated_at
            FROM categorias
            WHERE id = ? AND deleted_at IS NULL
        `;
        return await database.get(sql, [id], connection);
    }

    // Actualizar categoría
    static async update(id, categoryData, connection = null) {
        const { name, description } = categoryData;
        const sql = `
            UPDATE categorias
            SET nombre = ?, descripcion = ?, updated_at = NOW()
            WHERE id = ? AND deleted_at IS NULL
        `;
        await database.run(sql, [name, description, id], connection);
        return { id, name, description };
    }

    // Eliminar categoría (Soft Delete)
    static async delete(id, connection = null) {
        // Verificar si hay productos activos en esta categoría
        const checkSql = `SELECT COUNT(*) as count FROM productos WHERE categoria_id = ? AND deleted_at IS NULL`;
        const checkResult = await database.get(checkSql, [id], connection);

        if (checkResult && checkResult.count > 0) {
            const error = new Error('No se puede eliminar la categoría porque tiene productos activos vinculados.');
            error.statusCode = 400;
            throw error;
        }

        const sql = `UPDATE categorias SET deleted_at = NOW(), status = 'inactive' WHERE id = ?`;
        await database.run(sql, [id], connection);
        return true;
    }

    // Cambiar estado de la categoría (activa/inactiva)
    static async changeStatus(id, status, connection = null) {
        const sql = `UPDATE categorias SET status = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
        await database.run(sql, [status, id], connection);
        return { id, status };
    }
}

module.exports = Category;
