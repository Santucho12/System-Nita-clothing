const database = require('../config/database');

class Sale {
    constructor(product_id, quantity, price_per_unit, total_amount, customer_name = null, payment_method = 'efectivo') {
        this.product_id = product_id;
        this.quantity = quantity;
        this.price_per_unit = price_per_unit;
        this.total_amount = total_amount;
        this.customer_name = customer_name;
        this.payment_method = payment_method;
    }


    // Crear una nueva venta
    static async create(saleData) {
        try {
            const { product_id, quantity, price_per_unit, total_amount, customer_name, payment_method } = saleData;
            // Verificar que el producto existe y tiene stock suficiente
            const product = await database.get(
                'SELECT id, name, quantity FROM products WHERE id = ?',
                [product_id]
            );
            if (!product) {
                throw new Error('El producto especificado no existe');
            }
            if (product.quantity < quantity) {
                throw new Error(`Stock insuficiente. Disponible: ${product.quantity}, Solicitado: ${quantity}`);
            }
            // Iniciar transacción
            await database.run('BEGIN TRANSACTION');
            try {
                // Registrar la venta
                const sql = `
                    INSERT INTO sales (product_id, quantity, price_per_unit, total_amount, customer_name, payment_method, sale_date, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `;
                const result = await database.run(sql, [product_id, quantity, price_per_unit, total_amount, customer_name, payment_method]);
                // Actualizar stock del producto
                await database.run(
                    'UPDATE products SET quantity = quantity - ?, updated_at = datetime("now") WHERE id = ?',
                    [quantity, product_id]
                );
                // Confirmar transacción
                await database.run('COMMIT');
                return {
                    id: result.lastID,
                    product_id,
                    quantity,
                    price_per_unit,
                    total_amount,
                    customer_name,
                    payment_method
                };
            } catch (error) {
                await database.run('ROLLBACK');
                throw error;
            }
        } catch (error) {
            throw new Error(`Error creando venta: ${error.message}`);
        }
    }

    // Obtener los productos más vendidos del mes actual
    static async getTopProductsThisMonth(limit = 5) {
        try {
            const sql = `
                SELECT p.id, p.name, SUM(s.quantity) as total_sold
                FROM sales s
                JOIN products p ON s.product_id = p.id
                WHERE strftime('%Y-%m', s.sale_date) = strftime('%Y-%m', 'now')
                GROUP BY p.id, p.name
                ORDER BY total_sold DESC
                LIMIT ?
            `;
            return await database.all(sql, [limit]);
        } catch (error) {
            throw new Error(`Error obteniendo productos más vendidos: ${error.message}`);
        }
    }

    // Obtener estadísticas mensuales de ventas
    static async getMonthlyStats() {
        try {
            // Ventas totales y monto total del mes actual
            const stats = await database.get(`
                SELECT 
                    COUNT(*) as total_sales,
                    SUM(total_amount) as total_amount
                FROM sales
                WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')
            `);
            return stats;
        } catch (error) {
            throw new Error(`Error obteniendo estadísticas mensuales: ${error.message}`);
        }
    }
}

module.exports = Sale;
