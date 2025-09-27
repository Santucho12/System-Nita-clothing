const database = require('../config/database');

class Product {
    constructor(name, color, quantity, photo_url, category_id) {
        this.name = name;
        this.color = color;
        this.quantity = quantity;
        this.photo_url = photo_url;
        this.category_id = category_id;
    }

    // Crear un nuevo producto
    static async create(productData) {
        try {
            const { name, color, quantity, photo_url, category_id } = productData;
            // Verificar que la categoría existe
            const categoryExists = await database.get(
                'SELECT id FROM categories WHERE id = ?',
                [category_id]
            );
            if (!categoryExists) {
                throw new Error('La categoría especificada no existe');
            }
            const sql = `
                INSERT INTO products (name, color, quantity, photo_url, category_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `;
            const result = await database.run(sql, [name, color, quantity, photo_url, category_id]);
            return {
                id: result.lastID,
                name,
                color,
                quantity,
                photo_url,
                category_id
            };
        } catch (error) {
            throw new Error(`Error creando producto: ${error.message}`);
        }
    }

    // Obtener todos los productos
    static async getAll() {
        try {
            const sql = `
                SELECT p.*, c.name as category_name
                FROM products p
                JOIN categories c ON p.category_id = c.id
                ORDER BY p.name ASC
            `;
            return await database.all(sql);
        } catch (error) {
            throw new Error(`Error obteniendo productos: ${error.message}`);
        }
    }

    // ...otros métodos...
}

module.exports = Product;
// Permitir acceso a la instancia de base de datos desde el controlador
Product.database = database;
