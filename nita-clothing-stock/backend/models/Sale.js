const SaleItem = require('./SaleItem');
const Customer = require('./Customer');
const database = require('../config/database');

class Sale {

    // Mejores dÃ­as del mes (ventas agrupadas por dÃ­a)
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
            throw new Error(`Error obteniendo mejores dÃ­as del mes: ${error.message}`);
        }
    }

    // Historial de ventas con filtros avanzados y paginaciÃ³n
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
            const sales = await database.all(sql, params);
            // Total para paginaciÃ³n
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
    // Crear una nueva venta con mÃºltiples items (carrito)
    static async createWithItems(saleData, items, customerEmail = null) {
        const database = require('../config/database');
        let connection;
        try {
            // Iniciar transacciÃ³n
            connection = await database.beginTransaction();

            // Validar stock de todos los productos (PASAR CONNECTION)
            for (const item of items) {
                const product = await database.get('SELECT id, nombre, stock FROM productos WHERE id = ? FOR UPDATE', [item.product_id], connection);
                if (!product) throw new Error(`El producto con ID ${item.product_id} no existe`);
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
                }
            }
            // Crear o actualizar cliente si hay email
            if (customerEmail) {
                await Sale.createOrUpdateCustomer(customerEmail, saleData.customer_name, connection);
            }

            // Insertar venta principal con status 'completed'
            // Nota: sale_number se generarÃ¡ a partir del ID insertado para evitar condiciones de carrera
            const sql = `
                                INSERT INTO sales (subtotal, discount_percent, discount_amount, total, customer_name, customer_email, payment_method, status, created_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', NOW())
                            `;

            const saleParams = [
                saleData.subtotal || 0,
                saleData.discount_percent || 0,
                saleData.discount_amount || 0,
                saleData.total || 0,
                saleData.customer_name || 'Consumidor Final',
                customerEmail || null,
                saleData.payment_method || 'efectivo'
            ];

            const result = await database.run(sql, saleParams, connection);
            const sale_id = result.insertId;

            // Generar y actualizar nÃºmero de venta atÃ³micamente basado en el ID real
            const saleNumber = `V-${String(sale_id).padStart(6, '0')}`;
            await database.run('UPDATE sales SET sale_number = ? WHERE id = ?', [saleNumber, sale_id], connection);

            // Insertar items y actualizar stock
            for (const item of items) {
                const product = await database.get('SELECT * FROM productos WHERE id = ?', [item.product_id], connection);
                const subtotal = parseFloat(item.unit_price) * parseInt(item.quantity);
                const profit = (parseFloat(item.unit_price) - parseFloat(product.costo)) * parseInt(item.quantity);

                let productSize = product.tallas;
                const allowedSizes = ['Talle Ãºnico', 'S', 'M', 'L', '36', '38', '40', '42'];
                if (!productSize || productSize === '' || productSize === 'null' || !allowedSizes.includes(productSize)) {
                    productSize = 'Talle Ãºnico';
                }

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
                    }, connection);
                } catch (err) {
                    console.error('[ERROR] SaleItem.create', err);
                    throw err;
                }

                // Actualizar stock y estado atÃ³micamente
                await database.run(
                    'UPDATE productos SET stock = stock - ?, estado = CASE WHEN (stock - ?) <= 0 THEN "sin_stock" ELSE "activo" END, updated_at = NOW() WHERE id = ?',
                    [item.quantity, item.quantity, item.product_id], connection);

                // Consultar nuevo stock y actualizar estado si es necesario
                const updatedProduct = await database.get('SELECT stock FROM productos WHERE id = ?', [item.product_id], connection);
                if (updatedProduct && Number(updatedProduct.stock) === 0) {
                    await database.run("UPDATE productos SET estado = 'sin_stock', updated_at = NOW() WHERE id = ?",
                        [item.product_id], connection);
                }
            }

            // Confirmar transacciÃ³n
            await database.commit(connection);
            return { id: sale_id, ...saleData, items };
        } catch (error) {
            // Revertir cambios si hay error
            if (connection) await database.rollback(connection);
            throw new Error(`Error creando venta: ${error.message}`);
        }
    }

    // RotaciÃ³n de categorÃ­as
    static async getCategoryRotation() {
        const sql = `
            SELECT 
                c.nombre as category_name,
                COALESCE(ps.products_count, 0) as products_count,
                COALESCE(ps.current_stock, 0) as current_stock,
                COALESCE(ss.total_sold, 0) as total_sold,
                CASE WHEN COALESCE(ps.current_stock, 0) > 0 
                     THEN ROUND(COALESCE(ss.total_sold, 0) / ps.current_stock, 2)
                     ELSE 0 END as rotation_rate,
                CASE WHEN COALESCE(ss.total_sold, 0) > 0 
                     THEN ROUND(30 * COALESCE(ps.current_stock, 0) / ss.total_sold, 0)
                     ELSE NULL END as days_to_sell
            FROM categorias c
            LEFT JOIN (
                SELECT categoria_id, 
                       COUNT(*) as products_count, 
                       COALESCE(SUM(stock), 0) as current_stock
                FROM productos
                WHERE estado != 'descontinuado'
                GROUP BY categoria_id
            ) ps ON ps.categoria_id = c.id
            LEFT JOIN (
                SELECT p.categoria_id, 
                       COALESCE(SUM(si.quantity), 0) as total_sold
                FROM sale_items si
                INNER JOIN sales s ON si.sale_id = s.id 
                    AND s.status = 'completed' 
                    AND s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                INNER JOIN productos p ON si.product_id = p.id 
                    AND p.estado != 'descontinuado'
                GROUP BY p.categoria_id
            ) ss ON ss.categoria_id = c.id
            ORDER BY total_sold DESC
        `;
        const [rows] = await database.query(sql);
        return rows;
    }

    // Alertas de reposiciÃ³n (productos bajo mÃ­nimo)
    static async getRestockAlerts() {
        const sql = `
                        SELECT p.id as product_id, p.nombre as product_name, p.stock as current_stock, p.stock_minimo as min_stock,
                               CASE 
                                   WHEN p.stock <= 0 OR p.stock < (p.stock_minimo * 0.5) THEN 'critical'
                                   WHEN p.stock < p.stock_minimo AND p.stock > 0 THEN 'low'
                                   ELSE 'ok'
                               END as status,
                               (
                                   SELECT MAX(s.created_at) FROM sale_items si2
                                   JOIN sales s ON si2.sale_id = s.id
                                   WHERE si2.product_id = p.id
                               ) as last_sale_date,
                               s2.name as supplier
                        FROM productos p
                        LEFT JOIN suppliers s2 ON p.supplier_id = s2.id
                        WHERE p.stock < p.stock_minimo AND p.estado != 'descontinuado'
                    `;
        return await database.all(sql);
    }

    // Productos con stock crÃ­tico
    static async getCriticalStock() {
        const sql = `
                        SELECT p.id as product_id, p.nombre as product_name, p.stock as current_stock, p.stock_minimo as min_stock,
                               'critical' as status,
                               (
                                   SELECT MAX(s.created_at) FROM sale_items si2
                                   JOIN sales s ON si2.sale_id = s.id
                                   WHERE si2.product_id = p.id
                               ) as last_sale_date,
                               s2.name as supplier
                        FROM productos p
                        LEFT JOIN suppliers s2 ON p.supplier_id = s2.id
                        WHERE (p.stock <= 0 OR p.stock < (p.stock_minimo * 0.5)) AND p.estado != 'descontinuado'
                    `;
        return await database.all(sql);
    }
    // Ganancias generales (Netas)
    static async getGeneralProfits() {
        const sql = `
                    SELECT 
                        (SUM((si.unit_price - si.unit_cost) * si.quantity) - IFNULL(s_totals.total_discounts, 0)) as total_profit,
                        (SUM(CASE WHEN DATE_FORMAT(s.created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') 
                                 THEN (si.unit_price - si.unit_cost) * si.quantity 
                                 ELSE 0 END) - IFNULL(s_totals.monthly_discounts, 0)) as monthly_profit,
                        (SUM(CASE WHEN YEAR(s.created_at) = YEAR(NOW()) 
                                 THEN (si.unit_price - si.unit_cost) * si.quantity 
                                 ELSE 0 END) - IFNULL(s_totals.yearly_discounts, 0)) as yearly_profit,
                        AVG((si.unit_price - si.unit_cost) / NULLIF(si.unit_price, 0)) * 100 as avg_profit_margin,
                        SUM(si.unit_cost * si.quantity) as total_cost,
                        CASE WHEN SUM(si.unit_cost * si.quantity) > 0 
                             THEN ((SUM((si.unit_price - si.unit_cost) * si.quantity) - IFNULL(s_totals.total_discounts, 0)) / SUM(si.unit_cost * si.quantity)) * 100 
                             ELSE 0 END as roi
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    CROSS JOIN (
                        SELECT 
                            SUM(discount_amount) as total_discounts,
                            SUM(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') THEN discount_amount ELSE 0 END) as monthly_discounts,
                            SUM(CASE WHEN YEAR(created_at) = YEAR(NOW()) THEN discount_amount ELSE 0 END) as yearly_discounts
                        FROM sales
                        WHERE status = 'completed'
                    ) s_totals
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

    // Ganancia por categorÃ­a
    static async getProfitByCategory() {
        const sql = `
                    SELECT 
                        c.nombre as category_name,
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
    // Productos mÃ¡s vendidos (por cantidad y monto)
    static async getTopSellingProducts({ limit = 10, days = 30 } = {}) {
        const sql = `
                SELECT p.id as product_id, p.nombre as product_name, c.nombre as category, 
                       SUM(si.quantity) as total_quantity,
                       SUM(si.quantity * si.unit_price) as total_revenue,
                       SUM((si.unit_price - si.unit_cost) * si.quantity) as total_profit
                FROM sale_items si
                JOIN productos p ON si.product_id = p.id
                JOIN categorias c ON p.categoria_id = c.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                  AND s.status = 'completed'
                GROUP BY p.id, p.nombre, c.nombre
                ORDER BY total_quantity DESC
                LIMIT ${parseInt(limit)}
            `;
        const [rows] = await database.query(sql, [days]);
        return rows;
    }

    // Productos menos vendidos (por cantidad, Ãºltimos X dÃ­as)
    static async getLeastSellingProducts({ limit = 10, days = 30 } = {}) {
        const sql = `
                SELECT p.id as product_id, p.nombre as product_name, c.nombre as category,
                       p.stock as stock_quantity,
                       IFNULL(SUM(si.quantity), 0) as total_quantity,
                       IFNULL(SUM(si.quantity * si.unit_price), 0) as total_revenue,
                       (SELECT MAX(s2.created_at) FROM sale_items si2 JOIN sales s2 ON si2.sale_id = s2.id WHERE si2.product_id = p.id AND s2.status = 'completed') as last_sale
                FROM productos p
                LEFT JOIN sale_items si ON si.product_id = p.id
                LEFT JOIN sales s ON si.sale_id = s.id 
                         AND s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                         AND s.status = 'completed'
                JOIN categorias c ON p.categoria_id = c.id
                WHERE p.estado != 'descontinuado'
                GROUP BY p.id, p.nombre, c.nombre
                ORDER BY total_quantity ASC, p.nombre ASC
                LIMIT ${parseInt(limit)}
            `;
        const [rows] = await database.query(sql, [days]);
        return rows;
    }

    // Productos sin movimiento (sin ventas en X dÃ­as)
    static async getProductsWithoutSales({ days = 90 } = {}) {
        const sql = `
                SELECT p.id as product_id, p.nombre as product_name, c.nombre as category
                FROM productos p
                JOIN categorias c ON p.categoria_id = c.id
                WHERE p.estado != 'descontinuado' AND p.id NOT IN (
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
                WHERE p.estado != 'descontinuado'
            `;
        const byCategorySql = `
                SELECT c.nombre as category, 
                       SUM(p.stock * p.costo) as investment,
                       100.0 * SUM(p.stock * p.costo) / (SELECT SUM(stock * costo) FROM productos WHERE estado != 'descontinuado') as percentage
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

    // Obtener los productos mÃ¡s vendidos del mes actual
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
            throw new Error(`Error obteniendo productos mÃ¡s vendidos: ${error.message}`);
        }
    }

    // Obtener las categorÃ­as mÃ¡s vendidas del mes actual
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
            throw new Error(`Error obteniendo categorÃ­as mÃ¡s vendidas: ${error.message}`);
        }
    }

    // Obtener estadÃ­sticas mensuales de ventas
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
            throw new Error(`Error obteniendo estadÃ­sticas mensuales: ${error.message}`);
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

    // Cancelar una venta (Soft Delete: cambia estado y restaura stock)
    static async delete(id) {
        let connection;
        try {
            // Iniciar transacciÃ³n
            connection = await database.beginTransaction();

            // Obtener la venta y sus items dentro de la transacciÃ³n
            const saleSql = `SELECT * FROM sales WHERE id = ?`;
            const sale = await database.get(saleSql, [id], connection);

            if (!sale) throw new Error('Venta no encontrada');
            if (sale.status === 'cancelled') throw new Error('La venta ya se encuentra cancelada');

            const itemsSql = `SELECT * FROM sale_items WHERE sale_id = ?`;
            const items = await database.all(itemsSql, [id], connection);

            // Restaurar stock de cada producto vendido
            for (const item of items || []) {
                await database.run(
                    'UPDATE productos SET stock = stock + ?, estado = "activo", updated_at = NOW() WHERE id = ?',
                    [item.quantity, item.product_id],
                    connection
                );
            }

            // En vez de eliminar, actualizamos el estado a 'cancelled'
            await database.run(
                'UPDATE sales SET status = "cancelled", updated_at = NOW() WHERE id = ?',
                [id],
                connection
            );

            // Confirmar transacciÃ³n
            await database.commit(connection);
            return true;
        } catch (error) {
            if (connection) await database.rollback(connection);
            throw new Error(`Error cancelando venta: ${error.message}`);
        }
    }

    // Obtener estadÃ­sticas de ventas del dÃ­a
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
            throw new Error(`Error obteniendo ventas del dÃ­a: ${error.message}`);
        }
    }

    // Obtener estadÃ­sticas de ventas del mes
    static async getSalesOfMonth() {
        try {
            const [rows] = await database.query(`
                SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_amount
                FROM sales
                WHERE YEAR(created_at) = YEAR(NOW())
                  AND MONTH(created_at) = MONTH(NOW())
                  AND status = 'completed'
            `);

            // Daily breakdown for charts
            const [daily] = await database.query(`
                SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as total
                FROM sales
                WHERE YEAR(created_at) = YEAR(NOW())
                  AND MONTH(created_at) = MONTH(NOW())
                  AND status = 'completed'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);

            return { ...rows[0], daily };
        } catch (error) {
            throw new Error(`Error obteniendo ventas del mes: ${error.message}`);
        }
    }

    // Obtener estadÃ­sticas de ventas del aÃ±o
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
            throw new Error(`Error obteniendo ventas del aÃ±o: ${error.message}`);
        }
    }

    // ========== MÃ‰TODOS PARA INTEGRACIÃ“N DE CLIENTES ==========

    /**
     * Crear o actualizar cliente automÃ¡ticamente al registrar venta
     * @param {string} email - Email del cliente
     * @param {string} customerName - Nombre del cliente
     * @param {object} connection - ConexiÃ³n de la transacciÃ³n (opcional)
     */
    static async createOrUpdateCustomer(email, customerName, connection = null) {
        try {
            // Verificar si el cliente ya existe
            const existingCustomer = await Customer.getByEmail(email, connection);

            if (existingCustomer) {
                // Cliente existe: actualizar solo updated_at
                await database.run(
                    'UPDATE customers SET updated_at = NOW() WHERE email = ?',
                    [email],
                    connection
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
                    notes: 'Cliente creado automÃ¡ticamente desde venta'
                }, connection);
            }

            // Actualizar segmentaciÃ³n del cliente
            await Sale.updateCustomerSegment(email, connection);
        } catch (error) {
            // No lanzar error para no romper la venta
            console.error('Error creando/actualizando cliente:', error.message);
        }
    }


    /**
     * Obtener reporte de performance (Best sellers y productos rentables)
     */
    static async getPerformanceReport() {
        try {
            const sql = `
                SELECT p.nombre as name, SUM(si.quantity) as sold, SUM(si.profit) as profit
                FROM sale_items si
                JOIN productos p ON si.product_id = p.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status = 'completed'
                GROUP BY si.product_id
                ORDER BY profit DESC
                LIMIT 15
            `;
            return await database.all(sql);
        } catch (error) {
            throw new Error(`Error in getPerformanceReport: ${error.message}`);
        }
    }

    /**
     * Obtener crecimiento de ventas comparado con el mes anterior
     */
    static async getSalesGrowth() {
        try {
            const sql = `
                SELECT 
                    SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total ELSE 0 END) as current_month,
                    SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) THEN total ELSE 0 END) as last_month
                FROM sales
                WHERE status = 'completed'
            `;
            const result = await database.get(sql);
            const current = parseFloat(result.current_month || 0);
            const last = parseFloat(result.last_month || 0);
            const growth = last > 0 ? ((current - last) / last) * 100 : 100;
            return { current, last, growth: growth.toFixed(2) };
        } catch (error) {
            return { current: 0, last: 0, growth: 0 };
        }
    }

    /**
     * Actualizar segmentaciÃ³n del cliente basado en su historial de compras
     * @param {string} email - Email del cliente
     * @param {object} connection - ConexiÃ³n de la transacciÃ³n (opcional)
     */
    static async updateCustomerSegment(email, connection = null) {
        try {
            // Contar compras en Ãºltimos 90 dÃ­as
            const result = await database.get(`
                SELECT COUNT(*) as purchase_count,
                       MAX(created_at) as last_purchase
                FROM sales
                WHERE customer_email = ?
                  AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            `, [email], connection);

            // Determinar segmento
            let segment = 'new';

            if (result && result.purchase_count >= 5) {
                segment = 'frequent';
            } else if (result && result.purchase_count >= 2) {
                segment = 'occasional';
            } else if (result && result.last_purchase) {
                const daysDiffResult = await database.get(`
                    SELECT DATEDIFF(NOW(), ?) as days_diff
                `, [result.last_purchase], connection);

                if (daysDiffResult && daysDiffResult.days_diff > 90) {
                    segment = 'inactive';
                }
            }

            // Actualizar segmento
            await database.run(
                'UPDATE customers SET segment = ? WHERE email = ?',
                [segment, email],
                connection
            );
        } catch (error) {
            console.error('Error actualizando segmentaciÃ³n:', error.message);
        }
    }

    /**
     * Obtener ventas agrupadas por mÃ©todo de pago (VersiÃ³n Optimizada)
     */
    static async getSalesByPaymentMethod() {
        try {
            const sql = `
                SELECT 
                    payment_method as name, 
                    COUNT(*) as count, 
                    IFNULL(SUM(total), 0) as total,
                    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM sales WHERE status = 'completed'), 1) as value
                FROM sales
                WHERE status = 'completed'
                GROUP BY payment_method
            `;
            const rows = await database.all(sql);
            const colors = { 'efectivo': '#00C49F', 'tarjeta': '#0088FE', 'transferencia': '#FFBB28', 'otro': '#FF8042' };
            return rows.map(r => ({
                ...r,
                name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
                color: colors[r.name] || '#999'
            }));
        } catch (error) {
            throw new Error(`Error en getSalesByPaymentMethod: ${error.message}`);
        }
    }

    /**
     * Reporte de ventas diarias (distribuciÃ³n horaria)
     */
    static async getDailySalesReport() {
        try {
            const sql = `
                SELECT 
                    HOUR(created_at) as hour,
                    COUNT(*) as sales,
                    IFNULL(SUM(total), 0) as revenue
                FROM sales
                WHERE DATE(created_at) = CURDATE() AND status = 'completed'
                GROUP BY HOUR(created_at)
                ORDER BY hour ASC
            `;
            const rows = await database.all(sql);
            const hourly = rows.map(r => ({
                hour: `${String(r.hour).padStart(2, '0')}:00`,
                sales: r.sales,
                revenue: parseFloat(r.revenue)
            }));
            return { hourly };
        } catch (error) {
            throw new Error(`Error en getDailySalesReport: ${error.message}`);
        }
    }
}

module.exports = Sale;


