const Product = require('../models/Product');

class ProductController {
    static async getAllProducts(req, res) {
        try {
            const products = await Product.getAll();
            res.status(200).json({
                success: true,
                message: 'Productos obtenidos exitosamente',
                data: products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async searchProducts(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ success: false, message: 'Falta el parámetro de búsqueda' });
            }
            const sql = `SELECT * FROM products WHERE name LIKE ? OR color LIKE ? ORDER BY name ASC`;
            const products = await Product.database.all(sql, [`%${q}%`, `%${q}%`]);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getLowStockProducts(req, res) {
        try {
            const min = parseInt(req.query.min) || 10;
            const sql = `SELECT * FROM products WHERE quantity <= ? ORDER BY quantity ASC`;
            const products = await Product.database.all(sql, [min]);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const sql = `SELECT * FROM products WHERE category_id = ? ORDER BY name ASC`;
            const products = await Product.database.all(sql, [categoryId]);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getProductById(req, res) {
        try {
            const { id } = req.params;
            const sql = `SELECT * FROM products WHERE id = ?`;
            const product = await Product.database.get(sql, [id]);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }
            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async createProduct(req, res) {
        try {
            const newProduct = await Product.create(req.body);
            res.status(201).json({ success: true, data: newProduct });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async updateProduct(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    static async updateStock(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    static async deleteProduct(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    // ...otros métodos (searchProducts, getLowStockProducts, getProductsByCategory, getProductById, createProduct, updateProduct, updateStock, deleteProduct)...
}

module.exports = ProductController;
