const Sale = require('../models/Sale');

class ReportController {
    static async getCategoryRotation(req, res, next) {
        try {
            const data = await Sale.getCategoryRotation();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getRestockAlerts(req, res, next) {
        try {
            const data = await Sale.getRestockAlerts();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getCriticalStock(req, res, next) {
        try {
            const data = await Sale.getCriticalStock();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getGeneralProfits(req, res, next) {
        try {
            const data = await Sale.getGeneralProfits();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getProfitByProduct(req, res, next) {
        try {
            const data = await Sale.getProfitByProduct();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getProfitByCategory(req, res, next) {
        try {
            const data = await Sale.getProfitByCategory();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getTopSellingProducts(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const days = parseInt(req.query.days) || 30;
            const products = await Sale.getTopSellingProducts({ limit, days });
            res.json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async getLeastSellingProducts(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const days = parseInt(req.query.days) || 30;
            const products = await Sale.getLeastSellingProducts({ limit, days });
            res.json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async getProductsWithoutSales(req, res, next) {
        try {
            const days = parseInt(req.query.days) || 90;
            const products = await Sale.getProductsWithoutSales({ days });
            res.json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async getStockInmovilizado(req, res, next) {
        try {
            const data = await Sale.getStockInmovilizado();
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async getMonthlyStats(req, res, next) {
        try {
            const stats = await Sale.getMonthlyStats();
            res.json({
                success: true,
                message: 'Estadísticas mensuales obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTopProductsThisMonth(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const topProducts = await Sale.getTopProductsThisMonth(limit);
            res.json({
                success: true,
                message: 'Productos más vendidos del mes actual',
                data: topProducts
            });
        } catch (error) {
            next(error);
        }
    }

    static async getTopCategoriesThisMonth(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 3;
            const topCategories = await Sale.getTopCategoriesThisMonth(limit);
            res.json({
                success: true,
                message: 'Categorías más vendidas del mes actual',
                data: topCategories
            });
        } catch (error) {
            next(error);
        }
    }

    static async getSalesByPaymentMethod(req, res, next) {
        try {
            const stats = await Sale.getSalesByPaymentMethod();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    static async getDailySalesReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const db = require('../config/database');

            let whereClause = "status = 'completed'";
            let params = [];

            if (startDate && endDate) {
                whereClause += " AND DATE(created_at) BETWEEN ? AND ?";
                params.push(startDate, endDate);
            } else {
                whereClause += " AND DATE(created_at) = CURDATE()";
            }

            const sql = `
                SELECT 
                    HOUR(created_at) as hour,
                    COUNT(*) as sales,
                    IFNULL(SUM(total), 0) as revenue
                FROM sales
                WHERE ${whereClause}
                GROUP BY HOUR(created_at)
                ORDER BY hour ASC
            `;
            const rows = await db.all(sql, params);
            const hourly = rows.map(r => ({
                hour: `${String(r.hour).padStart(2, '0')}:00`,
                sales: r.sales,
                revenue: parseFloat(r.revenue)
            }));
            res.json({ success: true, data: { hourly } });
        } catch (error) {
            next(error);
        }
    }

    static async getPerformanceReport(req, res, next) {
        try {
            const stats = await Sale.getPerformanceReport();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    static async getSalesOfDay(req, res, next) {
        try {
            const stats = await Sale.getSalesOfDay();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    static async getSalesOfMonth(req, res, next) {
        try {
            const stats = await Sale.getSalesOfMonth();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    static async getSalesOfYear(req, res, next) {
        try {
            const stats = await Sale.getSalesOfYear();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    // ==================== NUEVOS ENDPOINTS AVANZADOS ====================

    static async getAdvancedKPIs(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const db = require('../config/database');

            // Ventas totales y transacciones
            const salesStats = await db.get(`
                SELECT 
                    COUNT(*) as totalTransactions,
                    COALESCE(SUM(total), 0) as totalSales,
                    COALESCE(AVG(total), 0) as avgTicket
                FROM sales
                WHERE status = 'completed'
                ${startDate ? 'AND DATE(created_at) >= ?' : ''}
                ${endDate ? 'AND DATE(created_at) <= ?' : ''}
            `, [startDate, endDate].filter(Boolean));

            const itemsStats = await db.get(`
                SELECT COALESCE(SUM(si.quantity), 0) as totalItemsSold
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status = 'completed'
                ${startDate ? 'AND DATE(s.created_at) >= ?' : ''}
                ${endDate ? 'AND DATE(s.created_at) <= ?' : ''}
            `, [startDate, endDate].filter(Boolean));

            // Ganancias netas (Considerando descuentos)
            const profitStats = await db.get(`
                SELECT 
                    (COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)), 0) - IFNULL(MAX(s_discounts.total_discount), 0)) as netProfit,
                    COALESCE(SUM(si.quantity * si.unit_cost), 0) as totalCost
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                CROSS JOIN (
                    SELECT SUM(discount_amount) as total_discount
                    FROM sales
                    WHERE status = 'completed'
                    ${startDate ? 'AND DATE(created_at) >= ?' : ''}
                    ${endDate ? 'AND DATE(created_at) <= ?' : ''}
                ) s_discounts
                WHERE s.status = 'completed'
                ${startDate ? 'AND DATE(s.created_at) >= ?' : ''}
                ${endDate ? 'AND DATE(s.created_at) <= ?' : ''}
            `, [startDate, endDate, startDate, endDate].filter(Boolean));

            // Calcular métricas
            const totalSalesInput = parseFloat(salesStats.totalSales || 0);
            const netProfitInput = parseFloat(profitStats.netProfit || 0);
            const totalCostInput = parseFloat(profitStats.totalCost || 0);
            const profitMarginInput = totalSalesInput > 0 ? (netProfitInput / totalSalesInput) * 100 : 0;
            const roiInput = totalCostInput > 0 ? (netProfitInput / totalCostInput) * 100 : 0;

            // Valor de inventario (Excluyendo eliminados pero incluyendo inactivos con stock)
            const inventoryValueInner = await db.get(`
                SELECT 
                    COALESCE(SUM(stock * costo), 0) as inventoryValue,
                    COUNT(*) as totalSKUs
                FROM productos
                WHERE deleted_at IS NULL AND stock > 0 AND estado = "disponible"
            `);

            // Crecimiento
            let profitGrowthInput = 0;
            if (startDate) {
                const start = new Date(startDate);
                const endRange = endDate ? new Date(endDate) : new Date();
                const diffTime = endRange - start;
                const prevStart = new Date(start - diffTime).toISOString().split('T')[0];
                const prevEnd = start.toISOString().split('T')[0];

                const prevProfitStatsInner = await db.get(`
                    SELECT COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)), 0) as netProfit
                    FROM sale_items si
                    JOIN sales s ON si.sale_id = s.id
                    WHERE s.status = 'completed'
                      AND DATE(s.created_at) >= ? AND DATE(s.created_at) < ?
                `, [prevStart, prevEnd]);

                const prevNetProfitInner = parseFloat(prevProfitStatsInner.netProfit || 0);
                profitGrowthInput = prevNetProfitInner > 0 ? ((netProfitInput - prevNetProfitInner) / prevNetProfitInner) * 100 : 100;
            } else {
                const growthDataInner = await Sale.getSalesGrowth();
                profitGrowthInput = growthDataInner.growth;
            }

            res.json({
                success: true,
                data: {
                    totalSales: totalSalesInput,
                    totalTransactions: parseInt(salesStats.totalTransactions || 0),
                    avgTicket: parseFloat(salesStats.avgTicket || 0),
                    totalProducts: parseInt(itemsStats.totalItemsSold || 0),
                    netProfit: netProfitInput,
                    profitMargin: profitMarginInput,
                    roi: roiInput,
                    inventoryValue: parseFloat(inventoryValueInner.inventoryValue || 0),
                    totalSKUs: parseInt(inventoryValueInner.totalSKUs || 0),
                    profitGrowth: parseFloat(profitGrowthInput)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getSalesTrend(req, res, next) {
        try {
            const { startDate, endDate, period } = req.query;
            const db = require('../config/database');

            let groupByClause = 'DATE(created_at)';
            let selectDateExpression = 'DATE(created_at)';

            if (period === 'week') {
                groupByClause = 'YEARWEEK(created_at, 1)';
                selectDateExpression = 'YEARWEEK(created_at, 1)';
            } else if (period === 'month') {
                groupByClause = 'DATE_FORMAT(created_at, "%Y-%m")';
                selectDateExpression = 'DATE_FORMAT(created_at, "%Y-%m")';
            }

            let whereClauses = ['status = ?'];
            let params = ['completed'];

            if (startDate) {
                whereClauses.push('DATE(created_at) >= ?');
                params.push(startDate);
            }
            if (endDate) {
                whereClauses.push('DATE(created_at) <= ?');
                params.push(endDate);
            }

            const sql = `
                SELECT 
                    ${selectDateExpression} as date,
                    COUNT(*) as transactions,
                    COALESCE(SUM(total), 0) as revenue
                FROM sales
                WHERE ${whereClauses.join(' AND ')}
                GROUP BY ${groupByClause}
                ORDER BY ${groupByClause} ASC
                LIMIT 30
            `;

            const trends = await db.all(sql, params);

            res.json({
                success: true,
                data: trends.map(t => ({
                    date: t.date,
                    transactions: parseInt(t.transactions),
                    revenue: parseFloat(t.revenue)
                }))
            });
        } catch (error) {
            next(error);
        }
    }

    static async getProfitMargins(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const db = require('../config/database');

            const margins = await db.all(`
                SELECT 
                    p.nombre as product,
                    p.precio as sale_price,
                    p.costo as cost_price,
                    ((p.precio - p.costo) / NULLIF(p.precio, 0) * 100) as margin,
                    COALESCE(SUM(si.quantity), 0) as units_sold,
                    COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)), 0) as profit
                FROM productos p
                LEFT JOIN sale_items si ON p.id = si.product_id
                LEFT JOIN sales s ON si.sale_id = s.id AND s.status = 'completed'
                WHERE p.deleted_at IS NULL
                ${startDate ? 'AND DATE(s.created_at) >= ?' : ''}
                ${endDate ? 'AND DATE(s.created_at) <= ?' : ''}
                GROUP BY p.id
                HAVING units_sold > 0
                ORDER BY margin DESC
                LIMIT 20
            `, [startDate, endDate].filter(Boolean));

            res.json({
                success: true,
                data: margins.map(m => ({
                    product: m.product,
                    sale_price: parseFloat(m.sale_price),
                    cost_price: parseFloat(m.cost_price),
                    margin: parseFloat(m.margin),
                    units_sold: parseInt(m.units_sold),
                    profit: parseFloat(m.profit)
                }))
            });
        } catch (error) {
            next(error);
        }
    }

    static async getInventoryHealth(req, res, next) {
        try {
            const db = require('../config/database');

            const health = await db.get(`
                SELECT 
                    COALESCE(SUM(stock * costo), 0) as totalValue,
                    COALESCE(SUM(stock), 0) as totalUnits,
                    COUNT(*) as activeProducts,
                    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStock,
                    SUM(CASE WHEN stock > 0 AND stock <= 5 THEN 1 ELSE 0 END) as lowStock,
                    SUM(CASE WHEN stock > 5 THEN 1 ELSE 0 END) as healthyStock
                FROM productos
                WHERE deleted_at IS NULL
            `);

            res.json({
                success: true,
                data: {
                    totalValue: parseFloat(health.totalValue || 0),
                    totalUnits: parseInt(health.totalUnits || 0),
                    activeProducts: parseInt(health.activeProducts || 0),
                    outOfStock: parseInt(health.outOfStock || 0),
                    lowStock: parseInt(health.lowStock || 0),
                    healthyStock: parseInt(health.healthyStock || 0)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async getInventoryValue(req, res, next) {
        try {
            const database = require('../config/database');

            const result = await database.get(`
                SELECT 
                    IFNULL(SUM(precio * stock), 0) as total_value,
                    IFNULL(SUM(costo * stock), 0) as total_cost,
                    COUNT(*) as total_products,
                    IFNULL(SUM(stock), 0) as total_units
                FROM productos
                WHERE deleted_at IS NULL AND stock > 0 AND estado = "disponible"
            `);

            res.json({
                success: true,
                data: {
                    total_value: parseFloat(result.total_value || 0),
                    total_cost: parseFloat(result.total_cost || 0),
                    total_products: parseInt(result.total_products || 0),
                    total_units: parseInt(result.total_units || 0),
                    potential_profit: parseFloat((result.total_value || 0) - (result.total_cost || 0))
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ReportController;
