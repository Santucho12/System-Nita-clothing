const database = require('../config/database');

class SaleItem {
    // Crear un nuevo item de venta
    static async create(itemData, connection = null) {
        const { sale_id, product_id, product_name, product_size, product_color, quantity, unit_price, unit_cost, subtotal, profit } = itemData;
        const sql = `
            INSERT INTO sale_items (sale_id, product_id, product_name, product_size, product_color, quantity, unit_price, unit_cost, subtotal, profit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        console.log('[DEBUG] SaleItem.create params:', {
            sale_id, product_id, product_name, product_size, product_color, quantity, unit_price, unit_cost, subtotal, profit
        });
        try {
            await database.run(sql, [sale_id, product_id, product_name, product_size, product_color, quantity, unit_price, unit_cost, subtotal, profit], connection);
        } catch (err) {
            console.error('[ERROR] SaleItem.create SQL:', err);
            throw err;
        }
    }

    // Obtener items de venta por rango de fechas
    static async getItemsByDateRange(startDate, endDate) {
        const sql = `
            SELECT * FROM sale_items WHERE sale_id IN (
                SELECT id FROM sales WHERE sale_date BETWEEN ? AND ?
            )
        `;
        return await database.all(sql, [startDate, endDate]);
    }

    // Obtener items de venta por producto
    static async getItemsByProduct(product_id) {
        const sql = `SELECT * FROM sale_items WHERE product_id = ?`;
        return await database.all(sql, [product_id]);
    }

    // Obtener items de venta por venta
    static async getItemsBySale(sale_id) {
        const sql = `SELECT * FROM sale_items WHERE sale_id = ?`;
        return await database.all(sql, [sale_id]);
    }
}

module.exports = SaleItem;
