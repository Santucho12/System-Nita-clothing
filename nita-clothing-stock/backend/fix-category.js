const fs = require('fs');

const content = `const database = require('../config/database');

class Category {
    constructor(name, description = null) {
        this.name = name;
        this.description = description;
    }

    // Crear una nueva categoria
    static async create(categoryData, connection = null) {
        let { name, description } = categoryData;
        if (typeof name === 'undefined') name = null;
        if (typeof description === 'undefined') description = null;
        const sql = \`
            INSERT INTO categorias (nombre, descripcion, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
        \`;
        const result = await database.run(sql, [name, description], connection);
        return { id: result.insertId, name, description };
    }

    // Obtener todas las categorias
    static async getAll(connection = null) {
        const sql = \`
            SELECT id, nombre as name, descripcion as description, status, created_at, updated_at
            FROM categorias
            WHERE deleted_at IS NULL
            ORDER BY nombre ASC
        \`;
        return await database.all(sql, [], connection);
    }

    // Obtener categoria por ID
    static async getById(id, connection = null) {
        const sql = \`
            SELECT id, nombre as name, descripcion as description, status, created_at, updated_at
            FROM categorias
            WHERE id = ? AND deleted_at IS NULL
        \`;
        return await database.get(sql, [id], connection);
    }

    // Actualizar categoria
    static async update(id, categoryData, connection = null) {
        const { name, description } = categoryData;
        const sql = \`
            UPDATE categorias
            SET nombre = ?, descripcion = ?, updated_at = NOW()
            WHERE id = ? AND deleted_at IS NULL
        \`;
        await database.run(sql, [name, description, id], connection);
        return { id, name, description };
    }

    // Contar productos activos en una categoria
    static async countActiveProducts(id, connection = null) {
        const sql = \`SELECT COUNT(*) as count FROM productos WHERE categoria_id = ? AND estado != 'descontinuado'\`;
        const result = await database.get(sql, [id], connection);
        return result ? result.count : 0;
    }

    // Eliminar categoria (Soft Delete)
    static async delete(id, connection = null) {
        // Verificar si hay productos activos/sin_stock en esta categoria
        const productCount = await Category.countActiveProducts(id, connection);

        if (productCount > 0) {
            const error = new Error(\`No se puede eliminar la categoría porque tiene \${productCount} producto(s) asignado(s). Reasigná o eliminá los productos primero.\`);
            error.statusCode = 400;
            throw error;
        }

        const sql = \`UPDATE categorias SET deleted_at = NOW(), status = 'inactive' WHERE id = ?\`;
        await database.run(sql, [id], connection);
        return true;
    }

    // Cambiar estado de la categoria (activa/inactiva)
    static async changeStatus(id, status, connection = null) {
        // Si se intenta desactivar, verificar que no tenga productos asignados
        if (status === 'inactiva') {
            const productCount = await Category.countActiveProducts(id, connection);
            if (productCount > 0) {
                const error = new Error(\`No se puede desactivar la categoría porque tiene \${productCount} producto(s) asignado(s). Reasigná o eliminá los productos primero.\`);
                error.statusCode = 400;
                throw error;
            }
        }

        const sql = \`UPDATE categorias SET status = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL\`;
        await database.run(sql, [status, id], connection);
        return { id, status };
    }
}

module.exports = Category;
`;

fs.writeFileSync('models/Category.js', content, 'utf8');
console.log('✅ Category.js reescrito exitosamente');
console.log('Tamaño:', fs.statSync('models/Category.js').size, 'bytes');
