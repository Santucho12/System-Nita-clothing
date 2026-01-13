const SaleItem = require('./SaleItem');
const database = require('../config/database');

class Sale {

    // Mejores días del mes (ventas agrupadas por día)
    static async getBestDaysOfMonth(year, month) {
        try {
            const sql = `
                SELECT date(sale_date) as day, COUNT(*) as total_sales, SUM(total) as total_amount
                FROM sales
                WHERE strftime('%Y', sale_date) = ? AND strftime('%m', sale_date) = ?
                GROUP BY day
                ORDER BY total_amount DESC
            `;
            return await database.all(sql, [String(year), String(month).padStart(2, '0')]);
        } catch (error) {
            throw new Error(`Error obteniendo mejores días del mes: ${error.message}`);
        }
    }

        // Historial de ventas con filtros avanzados y paginación
        static async getSalesHistory(filters) {
            try {
                let where = [];
                let params = [];
                if (filters.start_date && filters.end_date) {
                    where.push('date(s.sale_date) BETWEEN date(?) AND date(?)');
                    params.push(filters.start_date, filters.end_date);
                } else if (filters.month && filters.year) {
                    where.push(`strftime('%Y-%m', s.sale_date) = ?`);
                    params.push(`${filters.year}-${String(filters.month).padStart(2, '0')}`);
                } else if (filters.year) {
                    where.push(`strftime('%Y', s.sale_date) = ?`);
                    params.push(filters.year);
                }
                if (filters.payment_method) {
                    where.push('s.payment_method = ?');
                    params.push(filters.payment_method);
                }
                if (filters.status) {
                    where.push('s.status = ?');
                    params.push(filters.status);
                }
                if (filters.seller_id) {
                    where.push('s.seller_id = ?');
                    params.push(filters.seller_id);
                }
                if (filters.customer_email) {
                    where.push('s.customer_email = ?');
                    params.push(filters.customer_email);
                }
                if (filters.sale_number) {
                    where.push('s.sale_number LIKE ?');
                    params.push(`%${filters.sale_number}%`);
                }
                const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
                const page = filters.page || 1;
                const pageSize = filters.page_size || 20;
                const offset = (page - 1) * pageSize;
                // Consulta principal
                const sql = `
                    SELECT s.*, (
                        SELECT GROUP_CONCAT(product_name || ' x' || quantity, ', ')
                        FROM sale_items si WHERE si.sale_id = s.id
                    ) as items
                    FROM sales s
                    ${whereClause}
                    ORDER BY s.sale_date DESC
                    LIMIT ? OFFSET ?
                `;
                const sales = await database.all(sql, [...params, pageSize, offset]);
                // Total para paginación
                const countSql = `SELECT COUNT(*) as total FROM sales s ${whereClause}`;
                const totalRow = await database.get(countSql, params);
                return {
                    data: sales,
                    total: totalRow.total,
                    page,
                    page_size: pageSize
                };
            } catch (error) {
                throw new Error(`Error obteniendo historial de ventas: ${error.message}`);
            }
        }
    // Actualizar estado de la venta
    static async updateStatus(id, status) {
        try {
            const sql = `UPDATE sales SET status = ?, updated_at = datetime('now') WHERE id = ?`;
            await database.run(sql, [status, id]);
            return true;
        } catch (error) {
            throw new Error(`Error actualizando estado de venta: ${error.message}`);
        }
    }

                        // Obtener ventas por rango de fechas
                        static async getSalesByDateRange(startDate, endDate) {
                            try {
                                const sql = `
                                    SELECT s.*, (
                                        SELECT GROUP_CONCAT(product_name || ' x' || quantity, ', ')
                                        FROM sale_items si WHERE si.sale_id = s.id
                                    ) as items
                                    FROM sales s
                                    WHERE date(sale_date) BETWEEN date(?) AND date(?)
                                    ORDER BY s.sale_date DESC
                                `;
                                return await database.all(sql, [startDate, endDate]);
                            } catch (error) {
                                throw new Error(`Error obteniendo ventas por rango: ${error.message}`);
                            }
                        }
                    // Crear una nueva venta con múltiples items (carrito)
                    static async createWithItems(saleData, items) {
                        const database = require('../config/database');
                        try {
                            // Validar stock de todos los productos
                            for (const item of items) {
                                const product = await database.get('SELECT id, name, quantity FROM products WHERE id = ?', [item.product_id]);
                                if (!product) throw new Error(`El producto con ID ${item.product_id} no existe`);
                                if (product.quantity < item.quantity) {
                                    throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.quantity}, Solicitado: ${item.quantity}`);
                                }
                            }
                            // Iniciar transacción
                            await database.run('BEGIN TRANSACTION');
                            try {
                                // Insertar venta principal
                                const sql = `
                                    INSERT INTO sales (subtotal, discount_percent, discount_amount, total, customer_name, payment_method, sale_date, created_at)
                                    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                                `;
                                const result = await database.run(sql, [
                                    saleData.subtotal,
                                    saleData.discount_percent,
                                    saleData.discount_amount,
                                    saleData.total,
                                    saleData.customer_name,
                                    saleData.payment_method
                                ]);
                                const sale_id = result.lastID;
                                // Insertar items y actualizar stock
                                for (const item of items) {
                                    // Obtener info de producto
                                    const product = await database.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
                                    const subtotal = parseFloat(item.unit_price) * parseInt(item.quantity);
                                    const profit = (parseFloat(item.unit_price) - parseFloat(product.cost_price)) * parseInt(item.quantity);
                                    await SaleItem.create({
                                        sale_id,
                                        product_id: item.product_id,
                                        product_name: product.name,
                                        product_size: product.size,
                                        product_color: product.color,
                                        quantity: item.quantity,
                                        unit_price: item.unit_price,
                                        unit_cost: product.cost_price,
                                        subtotal,
                                        profit
                                    });
                                    // Actualizar stock
                                    await database.run('UPDATE products SET quantity = quantity - ?, updated_at = datetime("now") WHERE id = ?', [item.quantity, item.product_id]);
                                }
                                await database.run('COMMIT');
                                return { id: sale_id, ...saleData, items };
                            } catch (err) {
                                await database.run('ROLLBACK');
                                throw err;
                            }
                        } catch (error) {
                            throw new Error(`Error creando venta: ${error.message}`);
                        }
                    }
                // Rotación de categorías
                static async getCategoryRotation() {
                    const sql = `
                        SELECT c.name as category,
                               COUNT(p.id) as products_count,
                               IFNULL(SUM(si.quantity), 0) as total_sold,
                               CASE WHEN AVG(p.quantity) > 0 THEN IFNULL(SUM(si.quantity), 0) / AVG(p.quantity) ELSE 0 END as rotation_rate,
                               CASE WHEN IFNULL(SUM(si.quantity), 0) > 0 THEN AVG(p.quantity) / (IFNULL(SUM(si.quantity), 0) / 30.0) ELSE NULL END as days_to_sell
                        FROM categories c
                        LEFT JOIN products p ON p.category_id = c.id
                        LEFT JOIN sale_items si ON si.product_id = p.id
                        GROUP BY c.name
                    `;
                    return await database.all(sql);
                }

                // Alertas de reposición (productos bajo mínimo)
                static async getRestockAlerts() {
                    const sql = `
                        SELECT p.id as product_id, p.name as product_name, p.quantity as current_stock, p.min_stock,
                               CASE 
                                   WHEN p.quantity <= 0 OR p.quantity < (p.min_stock * 0.5) THEN 'critical'
                                   WHEN p.quantity < p.min_stock AND p.quantity > 0 THEN 'low'
                                   ELSE 'ok'
                               END as status,
                               (
                                   SELECT MAX(s.sale_date) FROM sale_items si2
                                   JOIN sales s ON si2.sale_id = s.id
                                   WHERE si2.product_id = p.id
                               ) as last_sale_date,
                               s2.name as supplier
                        FROM products p
                        LEFT JOIN suppliers s2 ON p.supplier_id = s2.id
                        WHERE p.quantity < p.min_stock
                    `;
                    return await database.all(sql);
                }

                // Productos con stock crítico
                static async getCriticalStock() {
                    const sql = `
                        SELECT p.id as product_id, p.name as product_name, p.quantity as current_stock, p.min_stock,
                               'critical' as status,
                               (
                                   SELECT MAX(s.sale_date) FROM sale_items si2
                                   JOIN sales s ON si2.sale_id = s.id
                                   WHERE si2.product_id = p.id
                               ) as last_sale_date,
                               s2.name as supplier
                        FROM products p
                        LEFT JOIN suppliers s2 ON p.supplier_id = s2.id
                        WHERE p.quantity <= 0 OR p.quantity < (p.min_stock * 0.5)
                    `;
                    return await database.all(sql);
                }
            // Ganancias generales
            static async getGeneralProfits() {
                const sql = `
                    SELECT 
                        SUM(si.profit) as ganancia_total,
                        SUM(CASE WHEN strftime('%Y-%m', s.sale_date) = strftime('%Y-%m', 'now') THEN si.profit ELSE 0 END) as ganancia_mensual,
                        SUM(CASE WHEN strftime('%Y', s.sale_date) = strftime('%Y', 'now') THEN si.profit ELSE 0 END) as ganancia_anual,
                        AVG((si.profit * 1.0) / NULLIF(si.subtotal, 0)) as margen_promedio,
                        SUM(si.unit_cost * si.quantity) as costo_total,
                        CASE WHEN SUM(si.unit_cost * si.quantity) > 0 THEN SUM(si.profit) / SUM(si.unit_cost * si.quantity) ELSE 0 END as roi
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                `;
                return await database.get(sql);
            }

            // Ganancia por producto
            static async getProfitByProduct() {
                const sql = `
                    SELECT 
                        p.id as product_id,
                        p.name as product_name,
                        SUM(si.quantity) as units_sold,
                        SUM(si.subtotal) as total_revenue,
                        SUM(si.unit_cost * si.quantity) as total_cost,
                        SUM(si.profit) as total_profit,
                        CASE WHEN SUM(si.subtotal) > 0 THEN SUM(si.profit) / SUM(si.subtotal) ELSE 0 END as profit_margin
                    FROM sale_items si
                    JOIN products p ON si.product_id = p.id
                    GROUP BY p.id, p.name
                    ORDER BY total_profit DESC
                `;
                return await database.all(sql);
            }

            // Ganancia por categoría
            static async getProfitByCategory() {
                const sql = `
                    SELECT 
                        c.name as category,
                        SUM(si.subtotal) as total_revenue,
                        SUM(si.unit_cost * si.quantity) as total_cost,
                        SUM(si.profit) as total_profit,
                        CASE WHEN SUM(si.subtotal) > 0 THEN SUM(si.profit) / SUM(si.subtotal) ELSE 0 END as profit_margin
                    FROM sale_items si
                    JOIN products p ON si.product_id = p.id
                    JOIN categories c ON p.category_id = c.id
                    GROUP BY c.name
                    ORDER BY total_profit DESC
                `;
                return await database.all(sql);
            }
        // Productos más vendidos (por cantidad y monto)
        static async getTopSellingProducts({ limit = 10, days = 30 } = {}) {
            const sql = `
                SELECT p.id as product_id, p.name as product_name, c.name as category, 
                       SUM(si.quantity) as quantity_sold, 
                       SUM(si.subtotal) as total_revenue, 
                       SUM(si.profit) as total_profit
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.sale_date >= datetime('now', ?)
                GROUP BY p.id, p.name, c.name
                ORDER BY quantity_sold DESC
                LIMIT ?
            `;
            // days negativo para SQLite, ej: '-30 days'
            return await database.all(sql, [`-${days} days`, limit]);
        }

        // Productos menos vendidos (por cantidad, últimos X días)
        static async getLeastSellingProducts({ limit = 10, days = 30 } = {}) {
            const sql = `
                SELECT p.id as product_id, p.name as product_name, c.name as category,
                       IFNULL(SUM(si.quantity), 0) as quantity_sold,
                       IFNULL(SUM(si.subtotal), 0) as total_revenue
                FROM products p
                LEFT JOIN sale_items si ON si.product_id = p.id
                LEFT JOIN sales s ON si.sale_id = s.id AND s.sale_date >= datetime('now', ?)
                JOIN categories c ON p.category_id = c.id
                GROUP BY p.id, p.name, c.name
                ORDER BY quantity_sold ASC, p.name ASC
                LIMIT ?
            `;
            return await database.all(sql, [`-${days} days`, limit]);
        }

        // Productos sin movimiento (sin ventas en X días)
        static async getProductsWithoutSales({ days = 90 } = {}) {
            const sql = `
                SELECT p.id as product_id, p.name as product_name, c.name as category
                FROM products p
                JOIN categories c ON p.category_id = c.id
                WHERE p.id NOT IN (
                    SELECT DISTINCT si.product_id
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    WHERE s.sale_date >= datetime('now', ?)
                )
            `;
            return await database.all(sql, [`-${days} days`]);
        }

        // Stock inmovilizado (valor de stock sin vender)
        static async getStockInmovilizado() {
            const sql = `
                SELECT COUNT(*) as total_products,
                       SUM(p.quantity * p.cost_price) as total_investment
                FROM products p
            `;
            const byCategorySql = `
                SELECT c.name as category, 
                       SUM(p.quantity * p.cost_price) as investment,
                       100.0 * SUM(p.quantity * p.cost_price) / (SELECT SUM(quantity * cost_price) FROM products) as percentage
                FROM products p
                JOIN categories c ON p.category_id = c.id
                GROUP BY c.name
            `;
            const total = await database.get(sql);
            const byCategory = await database.all(byCategorySql);
            return { ...total, by_category: byCategory };
        }
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

    // Obtener todas las ventas
    static async getAll() {
        try {
            const sql = `
                SELECT s.*, p.name as product_name
                FROM sales s
                JOIN products p ON s.product_id = p.id
                ORDER BY s.sale_date DESC
            `;
            return await database.all(sql);
        } catch (error) {
            throw new Error(`Error obteniendo ventas: ${error.message}`);
        }
    }

    // Obtener detalle de una venta por ID
    static async getById(id) {
        try {
            const sql = `
                SELECT s.*, p.name as product_name
                FROM sales s
                JOIN products p ON s.product_id = p.id
                WHERE s.id = ?
            `;
            return await database.get(sql, [id]);
        } catch (error) {
            throw new Error(`Error obteniendo venta: ${error.message}`);
        }
    }

    // Cancelar o restaurar una venta
    static async delete(id) {
        try {
            // Obtener la venta para restaurar stock
            const sale = await Sale.getById(id);
            if (!sale) throw new Error('Venta no encontrada');
            await database.run('BEGIN TRANSACTION');
            try {
                // Restaurar stock
                await database.run(
                    'UPDATE products SET quantity = quantity + ? WHERE id = ?',
                    [sale.quantity, sale.product_id]
                );
                // Eliminar venta
                await database.run('DELETE FROM sales WHERE id = ?', [id]);
                await database.run('COMMIT');
                return true;
            } catch (error) {
                await database.run('ROLLBACK');
                throw error;
            }
        } catch (error) {
            throw new Error(`Error eliminando venta: ${error.message}`);
        }
    }

    // Obtener estadísticas de ventas del día
    static async getSalesOfDay() {
        try {
            const stats = await database.get(`
                SELECT COUNT(*) as total_sales, SUM(total_amount) as total_amount
                FROM sales
                WHERE date(sale_date) = date('now')
            `);
            return stats;
        } catch (error) {
            throw new Error(`Error obteniendo ventas del día: ${error.message}`);
        }
    }

    // Obtener estadísticas de ventas del mes
    static async getSalesOfMonth() {
        try {
            const stats = await database.get(`
                SELECT COUNT(*) as total_sales, SUM(total_amount) as total_amount
                FROM sales
                WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')
            `);
            return stats;
        } catch (error) {
            throw new Error(`Error obteniendo ventas del mes: ${error.message}`);
        }
    }

    // Obtener estadísticas de ventas del año
    static async getSalesOfYear() {
        try {
            const stats = await database.get(`
                SELECT COUNT(*) as total_sales, SUM(total_amount) as total_amount
                FROM sales
                WHERE strftime('%Y', sale_date) = strftime('%Y', 'now')
            `);
            return stats;
        } catch (error) {
            throw new Error(`Error obteniendo ventas del año: ${error.message}`);
        }
    }
}

module.exports = Sale;
