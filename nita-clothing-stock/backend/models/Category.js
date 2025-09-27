const database = require('../config/database');

class Category {
    constructor(name, description = null) {
        this.name = name;
        this.description = description;
    }

    // Crear una nueva categoría
    static async create(categoryData) {
        try {
            const { name, description } = categoryData;
            const sql = `
                INSERT INTO categories (name, description, created_at, updated_at)
                VALUES (?, ?, datetime('now'), datetime('now'))
            `;
            const result = await database.run(sql, [name, description]);
            return { id: result.lastID, name, description };
        } catch (error) {
            throw new Error(`Error creando categoría: ${error.message}`);
        }
    }

    // Obtener todas las categorías
    static async getAll() {
        try {
            const sql = `
                SELECT id, name, description, created_at, updated_at
                FROM categories
                ORDER BY name ASC
            `;
            return await database.all(sql);
        } catch (error) {
            throw new Error(`Error obteniendo categorías: ${error.message}`);
        }
    }

    // Obtener categoría por ID
    static async getById(id) {
        try {
            const sql = `
                SELECT id, name, description, created_at, updated_at
                FROM categories
                WHERE id = ?
            `;
            return await database.get(sql, [id]);
        } catch (error) {
            throw new Error(`Error obteniendo categoría: ${error.message}`);
        }
    }

    // Actualizar categoría
    static async update(id, categoryData) {
        try {
            const { name, description } = categoryData;
            const sql = `
                UPDATE categories
                SET name = ?, description = ?, updated_at = datetime('now')
                WHERE id = ?
            `;
            await database.run(sql, [name, description, id]);
            return { id, name, description };
        } catch (error) {
            throw new Error(`Error actualizando categoría: ${error.message}`);
        }
    }

    // Eliminar categoría
    static async delete(id) {
        try {
            const sql = `DELETE FROM categories WHERE id = ?`;
            await database.run(sql, [id]);
            return true;
        } catch (error) {
            throw new Error(`Error eliminando categoría: ${error.message}`);
        }
    }
}

module.exports = Category;
