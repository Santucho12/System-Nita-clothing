const SaleItem = require('./SaleItem');
const Customer = require('./Customer');
const database = require('../config/database');

class Sale {

    // Mejores días del mes (ventas agrupadas por día)
    static async getBestDaysOfMonth(year, month) {
        try {
            const sql = `
                SELECT DATE(created_at) as day, COUNT(*) as total_sales, SUM(total) as total_amount
                FROM sales
                WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
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
                            // LOG TEMPORAL PARA DEBUG
                            // eslint-disable-next-line no-console

            try {
                let where = [];
                let params = [];
                if (filters.start_date && filters.end_date) {
                    where.push('DATE(s.created_at) BETWEEN DATE(?) AND DATE(?)');
                    params.push(filters.start_date, filters.end_date);
                } else if (filters.month && filters.year) {
                    where.push('DATE_FORMAT(s.created_at, "%Y-%m") = ?');
                    params.push(`${filters.year}-${String(filters.month).padStart(2, '0')}`);
                } else if (filters.year) {
                    where.push('YEAR(s.created_at) = ?');
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
                if (filters.customer_email && typeof filters.customer_email === 'string' && filters.customer_email.trim() !== '') {
                    where.push('LOWER(s.customer_email) LIKE ? AND s.customer_email IS NOT NULL AND s.customer_email != ""');
                    params.push(`%${filters.customer_email.toLowerCase().trim()}%`);
                }
                if (filters.customer_name) {
                    where.push('s.customer_name LIKE ?');
                    params.push(`%${filters.customer_name}%`);
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
                        SELECT GROUP_CONCAT(CONCAT(si.product_name, ' x', si.quantity) SEPARATOR ', ')
                        FROM sale_items si WHERE si.sale_id = s.id
                    ) as items
                    FROM sales s
                    ${whereClause}
                    ORDER BY s.created_at DESC
                    LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
                `;
                console.log('SQL HISTORIAL:', sql);
                console.log('PARAMS HISTORIAL:', params);
                const sales = await database.all(sql, params);
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
            const sql = `UPDATE sales SET status = ?, updated_at = NOW() WHERE id = ?`;
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
                    SELECT GROUP_CONCAT(CONCAT(si.product_name, ' x', si.quantity) SEPARATOR ', ')
                    FROM sale_items si WHERE si.sale_id = s.id
                ) as items
                FROM sales s
                WHERE DATE(s.created_at) BETWEEN DATE(?) AND DATE(?)
                ORDER BY s.created_at DESC
            `;
            return await database.all(sql, [startDate, endDate]);
        } catch (error) {
            throw new Error(`Error obteniendo ventas por rango: ${error.message}`);
        }
    }
                    // Crear una nueva venta con múltiples items (carrito)
                    static async createWithItems(saleData, items, customerEmail = null) {
                        const database = require('../config/database');
                        try {
                            // Validar stock de todos los productos
                            for (const item of items) {
                                const product = await database.get('SELECT id, nombre, stock FROM productos WHERE id = ?', [item.product_id]);
                                if (!product) throw new Error(`El producto con ID ${item.product_id} no existe`);
                                if (product.stock < item.quantity) {
                                    throw new Error(`Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
                                }
                            }
                            // Crear o actualizar cliente si hay email
                            if (customerEmail) {
                                await Sale.createOrUpdateCustomer(customerEmail, saleData.customer_name);
                            }

                            // Insertar venta principal
                            const sql = `
                                INSERT INTO sales (subtotal, discount_percent, discount_amount, total, customer_name, customer_email, payment_method, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                            `;
                            const result = await database.run(sql, [
                                saleData.subtotal,
                                saleData.discount_percent,
                                saleData.discount_amount,
                                saleData.total,
                                saleData.customer_name,
                                customerEmail || null,
                                saleData.payment_method
                            ]);
                            const sale_id = result.insertId || result.lastID;
                            // Insertar items y actualizar stock
                            for (const item of items) {
                                // Obtener info de producto
                                const product = await database.get('SELECT * FROM productos WHERE id = ?', [item.product_id]);
                                const subtotal = parseFloat(item.unit_price) * parseInt(item.quantity);
                                const profit = (parseFloat(item.unit_price) - parseFloat(product.costo)) * parseInt(item.quantity);
                                let productSize = product.tallas;
                                if (!productSize || productSize === '' || productSize === 'null') {
                                    productSize = 'Único';
                                }
                                // Logging detallado para debug
                                console.log('[DEBUG] SaleItem.create', {
                                    sale_id,
                                    product_id: item.product_id,
                                    product_name: product.nombre,
                                    size: productSize,
                                    color: product.colores || null,
                                    quantity: item.quantity,
                                    unit_price: item.unit_price,
                                    unit_cost: product.costo,
                                    subtotal,
                                    profit
                                });
                                try {
                                    await SaleItem.create({
                                        sale_id,
                                        product_id: item.product_id,
                                        product_name: product.nombre,
                                        product_size: productSize,
                                        product_color: product.colores || null,
                                        quantity: item.quantity,
                                        unit_price: item.unit_price,
                                        unit_cost: product.costo,
                                        subtotal,
                                        profit
                                    });
                                } catch (err) {
                                    console.error('[ERROR] SaleItem.create', err);
                                    throw err;
                                }
                                // Actualizar stock
                                await database.run('UPDATE productos SET stock = stock - ?, updated_at = NOW() WHERE id = ?', [item.quantity, item.product_id]);
                            }
                            return { id: sale_id, ...saleData, items };
                        } catch (error) {
                            throw new Error(`Error creando venta: ${error.message}`);
                        }
                    }
                // Rotación de categorías
                static async getCategoryRotation() {
                    const sql = `
                        SELECT c.nombre as category,
                               COUNT(p.id) as products_count,
                               IFNULL(SUM(si.quantity), 0) as total_sold,
                               CASE WHEN AVG(p.stock) > 0 
                                    THEN IFNULL(SUM(si.quantity), 0) / AVG(p.stock) 
                                    ELSE 0 END as rotation_rate,
                               CASE WHEN IFNULL(SUM(si.quantity), 0) > 0 
                                    THEN AVG(p.stock) / (IFNULL(SUM(si.quantity), 0) / 30.0) 
                                    ELSE NULL END as days_to_sell
                        FROM categorias c
                        LEFT JOIN productos p ON p.categoria_id = c.id
                        LEFT JOIN sale_items si ON si.product_id = p.id
                        GROUP BY c.nombre
                    `;
                    const [rows] = await database.query(sql);
                    return rows;
                }

                // Alertas de reposición (productos bajo mínimo)
                static async getRestockAlerts() {
                    const sql = `
                        SELECT p.id as product_id, p.nombre as product_name, p.stock as current_stock, p.stock_min as min_stock,
                               CASE 
                                   WHEN p.stock <= 0 OR p.stock < (p.stock_min * 0.5) THEN 'critical'
                                   WHEN p.stock < p.stock_min AND p.stock > 0 THEN 'low'
                                   ELSE 'ok'
                               END as status,
                               (
                                   SELECT MAX(s.created_at) FROM sale_items si2
                                   JOIN sales s ON si2.sale_id = s.id
                                   WHERE si2.product_id = p.id
                               ) as last_sale_date,
                               s2.nombre as supplier
                        FROM productos p
                        LEFT JOIN proveedores s2 ON p.proveedor_id = s2.id
                        WHERE p.stock < p.stock_min
                    `;
                    return await database.all(sql);
                }

                // Productos con stock crítico
                static async getCriticalStock() {
                    const sql = `
                        SELECT p.id as product_id, p.nombre as product_name, p.stock as current_stock, p.stock_min as min_stock,
                               'critical' as status,
                               (
                                   SELECT MAX(s.created_at) FROM sale_items si2
                                   JOIN sales s ON si2.sale_id = s.id
                                   WHERE si2.product_id = p.id
                               ) as last_sale_date,
                               s2.nombre as supplier
                        FROM productos p
                        LEFT JOIN proveedores s2 ON p.proveedor_id = s2.id
                        WHERE p.stock <= 0 OR p.stock < (p.stock_min * 0.5)
                    `;
                    return await database.all(sql);
                }
            // Ganancias generales
            static async getGeneralProfits() {
                const sql = `
                    SELECT 
                        SUM((si.unit_price - si.unit_cost) * si.quantity) as ganancia_total,
                        SUM(CASE WHEN DATE_FORMAT(s.created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') 
                                 THEN (si.unit_price - si.unit_cost) * si.quantity 
                                 ELSE 0 END) as ganancia_mensual,
                        SUM(CASE WHEN YEAR(s.created_at) = YEAR(NOW()) 
                                 THEN (si.unit_price - si.unit_cost) * si.quantity 
                                 ELSE 0 END) as ganancia_anual,
                        AVG((si.unit_price - si.unit_cost) / NULLIF(si.unit_price, 0)) * 100 as margen_promedio,
                        SUM(si.unit_cost * si.quantity) as costo_total,
                        CASE WHEN SUM(si.unit_cost * si.quantity) > 0 
                             THEN (SUM((si.unit_price - si.unit_cost) * si.quantity) / SUM(si.unit_cost * si.quantity)) * 100 
                             ELSE 0 END as roi
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    WHERE s.status = 'completed'
                `;
                const [rows] = await database.query(sql);
                return rows[0];
            }

            // Ganancia por producto
            static async getProfitByProduct() {
                const sql = `
                    SELECT 
                        p.id as product_id,
                        p.nombre as product_name,
                        SUM(si.quantity) as units_sold,
                        SUM(si.quantity * si.unit_price) as total_revenue,
                        SUM(si.unit_cost * si.quantity) as total_cost,
                        SUM((si.unit_price - si.unit_cost) * si.quantity) as total_profit,
                        CASE WHEN SUM(si.quantity * si.unit_price) > 0 
                             THEN (SUM((si.unit_price - si.unit_cost) * si.quantity) / SUM(si.quantity * si.unit_price)) * 100 
                             ELSE 0 END as profit_margin
                    FROM sale_items si
                    JOIN productos p ON si.product_id = p.id
                    GROUP BY p.id, p.nombre
                    ORDER BY total_profit DESC
                `;
                const [rows] = await database.query(sql);
                return rows;
            }

            // Ganancia por categoría
            static async getProfitByCategory() {
                const sql = `
                    SELECT 
                        c.nombre as category,
                        SUM(si.quantity * si.unit_price) as total_revenue,
                        SUM(si.unit_cost * si.quantity) as total_cost,
                        SUM((si.unit_price - si.unit_cost) * si.quantity) as total_profit,
                        CASE WHEN SUM(si.quantity * si.unit_price) > 0 
                             THEN (SUM((si.unit_price - si.unit_cost) * si.quantity) / SUM(si.quantity * si.unit_price)) * 100 
                             ELSE 0 END as profit_margin
                    FROM sale_items si
                    JOIN productos p ON si.product_id = p.id
                    JOIN categorias c ON p.categoria_id = c.id
                    GROUP BY c.nombre
                    ORDER BY total_profit DESC
                `;
                const [rows] = await database.query(sql);
                return rows;
            }
        // Productos más vendidos (por cantidad y monto)
        static async getTopSellingProducts({ limit = 10, days = 30 } = {}) {
            const sql = `
                SELECT p.id as product_id, p.nombre as product_name, c.nombre as category, 
                       SUM(si.quantity) as quantity_sold, 
                       SUM(si.quantity * si.unit_price) as total_revenue, 
                       SUM((si.unit_price - si.unit_cost) * si.quantity) as total_profit
                FROM sale_items si
                JOIN productos p ON si.product_id = p.id
                JOIN categorias c ON p.categoria_id = c.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                  AND s.status = 'completed'
                GROUP BY p.id, p.nombre, c.nombre
                ORDER BY quantity_sold DESC
                LIMIT ${parseInt(limit)}
            `;
            const [rows] = await database.query(sql, [days]);
            return rows;
        }

        // Productos menos vendidos (por cantidad, últimos X días)
        static async getLeastSellingProducts({ limit = 10, days = 30 } = {}) {
            const sql = `
                SELECT p.id as product_id, p.nombre as product_name, c.nombre as category,
                       IFNULL(SUM(si.quantity), 0) as quantity_sold,
                       IFNULL(SUM(si.quantity * si.unit_price), 0) as total_revenue
                FROM productos p
                LEFT JOIN sale_items si ON si.product_id = p.id
                LEFT JOIN sales s ON si.sale_id = s.id 
                         AND s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                         AND s.status = 'completed'
                JOIN categorias c ON p.categoria_id = c.id
                GROUP BY p.id, p.nombre, c.nombre
                ORDER BY quantity_sold ASC, p.nombre ASC
                LIMIT ${parseInt(limit)}
            `;
            const [rows] = await database.query(sql, [days]);
            return rows;
        }

        // Productos sin movimiento (sin ventas en X días)
        static async getProductsWithoutSales({ days = 90 } = {}) {
            const sql = `
                SELECT p.id as product_id, p.nombre as product_name, c.nombre as category
                FROM productos p
                JOIN categorias c ON p.categoria_id = c.id
                WHERE p.id NOT IN (
                    SELECT DISTINCT si.product_id
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                      AND s.status = 'completed'
                )
            `;
            const [rows] = await database.query(sql, [days]);
            return rows;
        }

        // Stock inmovilizado (valor de stock sin vender)
        static async getStockInmovilizado() {
            const sql = `
                SELECT COUNT(*) as total_products,
                       SUM(p.stock * p.costo) as total_investment
                FROM productos p
            `;
            const byCategorySql = `
                SELECT c.nombre as category, 
                       SUM(p.stock * p.costo) as investment,
                       100.0 * SUM(p.stock * p.costo) / (SELECT SUM(stock * costo) FROM productos) as percentage
                FROM productos p
                JOIN categorias c ON p.categoria_id = c.id
                GROUP BY c.nombre
            `;
            const total = await database.get(sql);
            const byCategory = await database.all(byCategorySql);
            return { ...total, by_category: byCategory };
        }

    // Crear una nueva venta (redirigir a createWithItems)
    static async create(saleData) {
        // Para compatibilidad, espera saleData: { items: [...], ... }
        if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
            throw new Error('Debe proveer al menos un item para la venta');
        }
        return await Sale.createWithItems(saleData, saleData.items, saleData.customer_email || null);
    }

    // Obtener los productos más vendidos del mes actual
    static async getTopProductsThisMonth(limit = 5) {
        try {
            const sql = `
                SELECT 
                    p.id as product_id, 
                    p.nombre as product_name, 
                    p.colores as color,
                    c.nombre as category_name,
                    SUM(si.quantity) as total_quantity,
                    SUM(si.quantity * si.unit_price) as total_revenue
                FROM sale_items si
                JOIN productos p ON si.product_id = p.id
                LEFT JOIN categorias c ON p.categoria_id = c.id
                JOIN sales s ON si.sale_id = s.id
                WHERE DATE_FORMAT(s.created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                  AND s.status = 'completed'
                GROUP BY p.id, p.nombre, p.colores, c.nombre
                ORDER BY total_quantity DESC
                LIMIT ${parseInt(limit)}
            `;
            const [rows] = await database.query(sql);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo productos más vendidos: ${error.message}`);
        }
    }

    // Obtener las categorías más vendidas del mes actual
    static async getTopCategoriesThisMonth(limit = 3) {
        try {
            const sql = `
                SELECT 
                    c.id as category_id, 
                    c.nombre as category_name,
                    c.descripcion as category_description,
                    COUNT(DISTINCT si.product_id) as products_count,
                    SUM(si.quantity) as total_quantity,
                    SUM(si.quantity * si.unit_price) as total_revenue
                FROM sale_items si
                JOIN productos p ON si.product_id = p.id
                JOIN categorias c ON p.categoria_id = c.id
                JOIN sales s ON si.sale_id = s.id
                WHERE DATE_FORMAT(s.created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                  AND s.status = 'completed'
                GROUP BY c.id, c.nombre, c.descripcion
                ORDER BY total_quantity DESC
                LIMIT ${parseInt(limit)}
            `;
            const [rows] = await database.query(sql);
            return rows;
        } catch (error) {
            throw new Error(`Error obteniendo categorías más vendidas: ${error.message}`);
        }
    }

    // Obtener estadísticas mensuales de ventas
    static async getMonthlyStats() {
        try {
            // Ventas totales y monto total del mes actual
            const [rows] = await database.query(`
                SELECT 
                    COUNT(*) as total_sales,
                    IFNULL(SUM(total), 0) as total_revenue
                FROM sales
                WHERE DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
                  AND status = 'completed'
            `);
            return rows[0];
        } catch (error) {
            throw new Error(`Error obteniendo estadísticas mensuales: ${error.message}`);
        }
    }

    // Obtener todas las ventas (nuevo modelo, sin JOIN con productos)
    static async getAll() {
        try {
            const sql = `SELECT * FROM sales ORDER BY created_at DESC`;
            return await database.all(sql);
        } catch (error) {
            throw new Error(`Error obteniendo ventas: ${error.message}`);
        }
    }

    // Obtener detalle de una venta por ID (nuevo modelo: incluye items)
    static async getById(id) {
        try {
            // Obtener la venta principal
            const saleSql = `SELECT * FROM sales WHERE id = ?`;
            const sale = await database.get(saleSql, [id]);
            if (!sale) return null;
            // Obtener los items asociados a la venta
            const itemsSql = `SELECT * FROM sale_items WHERE sale_id = ?`;
            const items = await database.all(itemsSql, [id]);
            return { ...sale, items };
        } catch (error) {
            throw new Error(`Error obteniendo venta: ${error.message}`);
        }
    }

    // Cancelar o restaurar una venta (nuevo modelo: restaura stock de todos los items)
    static async delete(id) {
        try {
            // Obtener la venta y sus items
            const sale = await Sale.getById(id);
            if (!sale) throw new Error('Venta no encontrada');
            // Restaurar stock de cada producto vendido
            for (const item of sale.items || []) {
                await database.run(
                    'UPDATE productos SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }
            // Eliminar items y venta
            await database.run('DELETE FROM sale_items WHERE sale_id = ?', [id]);
            await database.run('DELETE FROM sales WHERE id = ?', [id]);
            return true;
        } catch (error) {
            throw new Error(`Error eliminando venta: ${error.message}`);
        }
    }

    // Obtener estadísticas de ventas del día
    static async getSalesOfDay() {
        try {
            const [rows] = await database.query(`
                SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_amount
                FROM sales
                WHERE DATE(created_at) = CURDATE()
                  AND status = 'completed'
            `);
            return rows[0];
        } catch (error) {
            throw new Error(`Error obteniendo ventas del día: ${error.message}`);
        }
    }

    // Obtener estadísticas de ventas del mes
    static async getSalesOfMonth() {
        try {
            const [rows] = await database.query(`
                SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_amount
                FROM sales
                WHERE YEAR(created_at) = YEAR(NOW())
                  AND MONTH(created_at) = MONTH(NOW())
                  AND status = 'completed'
            `);
            return rows[0];
        } catch (error) {
            throw new Error(`Error obteniendo ventas del mes: ${error.message}`);
        }
    }

    // Obtener estadísticas de ventas del año
    static async getSalesOfYear() {
        try {
            const [rows] = await database.query(`
                SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_amount
                FROM sales
                WHERE YEAR(created_at) = YEAR(NOW())
                  AND status = 'completed'
            `);
            return rows[0];
        } catch (error) {
            throw new Error(`Error obteniendo ventas del año: ${error.message}`);
        }
    }

    // ========== MÉTODOS PARA INTEGRACIÓN DE CLIENTES ==========

    /**
     * Crear o actualizar cliente automáticamente al registrar venta
     * @param {string} email - Email del cliente
     * @param {string} customerName - Nombre del cliente
     */
    static async createOrUpdateCustomer(email, customerName) {
        try {
            // Verificar si el cliente ya existe
            const existingCustomer = await Customer.getByEmail(email);

            if (existingCustomer) {
                // Cliente existe: actualizar solo updated_at
                await database.run(
                    'UPDATE customers SET updated_at = datetime("now") WHERE email = ?',
                    [email]
                );
            } else {
                // Cliente nuevo: crear registro
                await Customer.create({
                    email,
                    name: customerName || 'Cliente',
                    phone: null,
                    birth_date: null,
                    address: null,
                    city: null,
                    province: null,
                    postal_code: null,
                    notes: 'Cliente creado automáticamente desde venta'
                });
            }

            // Actualizar segmentación del cliente
            await Sale.updateCustomerSegment(email);
        } catch (error) {
            // No lanzar error para no romper la venta
            console.error('Error creando/actualizando cliente:', error.message);
        }
    }

    /**
     * Actualizar segmentación del cliente basado en su historial de compras
     * @param {string} email - Email del cliente
     */
    static async updateCustomerSegment(email) {
        try {
            // Contar compras en últimos 90 días
            const result = await database.get(`
                SELECT COUNT(*) as purchase_count,
                       MAX(sale_date) as last_purchase
                FROM sales
                WHERE customer_email = ?
                  AND sale_date >= date('now', '-90 days')
            `, [email]);

            // Determinar segmento
            let segment = 'new';
            
            if (result.purchase_count >= 5) {
                segment = 'frequent';
            } else if (result.purchase_count >= 2) {
                segment = 'occasional';
            } else if (result.last_purchase) {
                const daysSinceLastPurchase = await database.get(`
                    SELECT julianday('now') - julianday(?) as days_diff
                `, [result.last_purchase]);
                
                if (daysSinceLastPurchase && daysSinceLastPurchase.days_diff > 90) {
                    segment = 'inactive';
                }
            }

            // Actualizar segmento
            await database.run(
                'UPDATE customers SET segment = ? WHERE email = ?',
                [segment, email]
            );
        } catch (error) {
            console.error('Error actualizando segmentación:', error.message);
        }
    }
}

module.exports = Sale;
