const Sale = require('../models/Sale');

class ReportController {
                static async getCategoryRotation(req, res) {
                    try {
                        const data = await Sale.getCategoryRotation();
                        res.json(data);
                    } catch (error) {
                        res.status(500).json({ message: error.message });
                    }
                }

                static async getRestockAlerts(req, res) {
                    try {
                        const data = await Sale.getRestockAlerts();
                        res.json(data);
                    } catch (error) {
                        res.status(500).json({ message: error.message });
                    }
                }

                static async getCriticalStock(req, res) {
                    try {
                        const data = await Sale.getCriticalStock();
                        res.json(data);
                    } catch (error) {
                        res.status(500).json({ message: error.message });
                    }
                }
            static async getGeneralProfits(req, res) {
                try {
                    const data = await Sale.getGeneralProfits();
                    res.json(data);
                } catch (error) {
                    res.status(500).json({ message: error.message });
                }
            }

            static async getProfitByProduct(req, res) {
                try {
                    const data = await Sale.getProfitByProduct();
                    res.json(data);
                } catch (error) {
                    res.status(500).json({ message: error.message });
                }
            }

            static async getProfitByCategory(req, res) {
                try {
                    const data = await Sale.getProfitByCategory();
                    res.json(data);
                } catch (error) {
                    res.status(500).json({ message: error.message });
                }
            }
        static async getTopSellingProducts(req, res) {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const days = parseInt(req.query.days) || 30;
                const products = await Sale.getTopSellingProducts({ limit, days });
                res.json(products);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }

        static async getLeastSellingProducts(req, res) {
            try {
                const limit = parseInt(req.query.limit) || 10;
                const days = parseInt(req.query.days) || 30;
                const products = await Sale.getLeastSellingProducts({ limit, days });
                res.json(products);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }

        static async getProductsWithoutSales(req, res) {
            try {
                const days = parseInt(req.query.days) || 90;
                const products = await Sale.getProductsWithoutSales({ days });
                res.json(products);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }

        static async getStockInmovilizado(req, res) {
            try {
                const data = await Sale.getStockInmovilizado();
                res.json(data);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }
    static async getMonthlyStats(req, res) {
        try {
            const stats = await Sale.getMonthlyStats();
            res.status(200).json({
                success: true,
                message: 'Estadísticas mensuales obtenidas exitosamente',
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async getTopProductsThisMonth(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const topProducts = await Sale.getTopProductsThisMonth(limit);
            res.status(200).json({
                success: true,
                message: 'Productos más vendidos del mes actual',
                data: topProducts
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async getTopCategoriesThisMonth(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 3;
            const topCategories = await Sale.getTopCategoriesThisMonth(limit);
            res.status(200).json({
                success: true,
                message: 'Categorías más vendidas del mes actual',
                data: topCategories
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async getSalesByPaymentMethod(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    static async getDailySalesReport(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    static async getPerformanceReport(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    static async getSalesOfDay(req, res) {
        try {
            const stats = await Sale.getSalesOfDay();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getSalesOfMonth(req, res) {
        try {
            const stats = await Sale.getSalesOfMonth();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    static async getSalesOfYear(req, res) {
        try {
            const stats = await Sale.getSalesOfYear();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // ==================== NUEVOS ENDPOINTS AVANZADOS ====================

    static async getAdvancedKPIs(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const db = require('../config/database');
            
            // Ventas totales y transacciones
            const [salesStats] = await db.query(`
                SELECT 
                    COUNT(*) as totalTransactions,
                    COALESCE(SUM(total), 0) as totalSales,
                    COALESCE(AVG(total), 0) as avgTicket,
                    COALESCE(SUM(subtotal), 0) as totalProducts
                FROM sales
                WHERE status = 'completed'
                ${startDate ? 'AND DATE(created_at) >= ?' : ''}
                ${endDate ? 'AND DATE(created_at) <= ?' : ''}
            `, [startDate, endDate].filter(Boolean));

            // Ganancias netas
            const [profitStats] = await db.query(`
                SELECT 
                    COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)), 0) as netProfit,
                    COALESCE(SUM(si.quantity * si.unit_cost), 0) as totalCost
                FROM sale_items si
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status = 'completed'
                ${startDate ? 'AND DATE(s.created_at) >= ?' : ''}
                ${endDate ? 'AND DATE(s.created_at) <= ?' : ''}
            `, [startDate, endDate].filter(Boolean));

            // Calcular métricas
            const totalSales = parseFloat(salesStats[0].totalSales || 0);
            const netProfit = parseFloat(profitStats[0].netProfit || 0);
            const totalCost = parseFloat(profitStats[0].totalCost || 0);
            const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
            const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

            // Valor de inventario
            const [inventoryValue] = await db.query(`
                SELECT 
                    COALESCE(SUM(stock * costo), 0) as inventoryValue,
                    COUNT(*) as totalSKUs
                FROM productos
                WHERE stock > 0
            `);

            res.json({
                success: true,
                data: {
                    totalSales,
                    totalTransactions: parseInt(salesStats[0].totalTransactions || 0),
                    avgTicket: parseFloat(salesStats[0].avgTicket || 0),
                    totalProducts: parseInt(salesStats[0].totalProducts || 0),
                    netProfit,
                    profitMargin,
                    roi,
                    inventoryValue: parseFloat(inventoryValue[0].inventoryValue || 0),
                    totalSKUs: parseInt(inventoryValue[0].totalSKUs || 0),
                    salesGrowth: 12.5,  // Simulated
                    profitGrowth: 8.3,  // Simulated
                    ticketGrowth: 5.2,  // Simulated
                    productsGrowth: 15.7, // Simulated
                    roiGrowth: 3.4       // Simulated
                }
            });
        } catch (error) {
            console.error('Error en getAdvancedKPIs:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getSalesTrend(req, res) {
        try {
            const { startDate, endDate, period } = req.query;
            const db = require('../config/database');
            
            let groupByClause = 'DATE(created_at)';
            let selectDateExpression = 'DATE(created_at)';
            
            if (period === 'week') {
                groupByClause = 'YEARWEEK(created_at, 1)';
                selectDateExpression = 'CONCAT("Semana ", WEEK(created_at, 1))';
            } else if (period === 'month') {
                groupByClause = 'DATE_FORMAT(created_at, "%Y-%m")';
                selectDateExpression = 'DATE_FORMAT(created_at, "%Y-%m")';
            }

            // Construir WHERE dinámicamente
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
                    COALESCE(SUM(total), 0) as revenue,
                    COALESCE(SUM((SELECT SUM(si.quantity * (si.unit_price - si.unit_cost)) 
                                  FROM sale_items si 
                                  WHERE si.sale_id = sales.id)), 0) as profit
                FROM sales
                WHERE ${whereClauses.join(' AND ')}
                GROUP BY ${groupByClause}
                ORDER BY ${groupByClause} ASC
                LIMIT 30
            `;

            const [trends] = await db.query(sql, params);

            res.json({
                success: true,
                data: trends.map(t => ({
                    date: t.date,
                    transactions: parseInt(t.transactions),
                    revenue: parseFloat(t.revenue),
                    profit: parseFloat(t.profit)
                }))
            });
        } catch (error) {
            console.error('Error en getSalesTrend:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getProfitMargins(req, res) {
        try {
            const { startDate, endDate } = req.query;
            const db = require('../config/database');
            
            const [margins] = await db.query(`
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
            console.error('Error en getProfitMargins:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getInventoryHealth(req, res) {
        try {
            const db = require('../config/database');
            
            const [health] = await db.query(`
                SELECT 
                    COALESCE(SUM(stock * costo), 0) as totalValue,
                    COALESCE(SUM(stock), 0) as totalUnits,
                    COUNT(*) as activeProducts,
                    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as outOfStock,
                    SUM(CASE WHEN stock > 0 AND stock <= 5 THEN 1 ELSE 0 END) as lowStock,
                    SUM(CASE WHEN stock > 5 THEN 1 ELSE 0 END) as healthyStock
                FROM productos
            `);

            res.json({
                success: true,
                data: {
                    totalValue: parseFloat(health[0].totalValue || 0),
                    totalUnits: parseInt(health[0].totalUnits || 0),
                    activeProducts: parseInt(health[0].activeProducts || 0),
                    outOfStock: parseInt(health[0].outOfStock || 0),
                    lowStock: parseInt(health[0].lowStock || 0),
                    healthyStock: parseInt(health[0].healthyStock || 0)
                }
            });
        } catch (error) {
            console.error('Error en getInventoryHealth:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Obtener valor total del inventario (Capital en Ropa)
     * Calcula: Σ(precio_venta × stock) de productos activos
     */
    static async getInventoryValue(req, res) {
        try {
            const database = require('../config/database');
            
            const result = await database.get(`
                SELECT 
                    IFNULL(SUM(precio * stock), 0) as total_value,
                    IFNULL(SUM(costo * stock), 0) as total_cost,
                    COUNT(*) as total_products,
                    SUM(stock) as total_units
                FROM productos
                WHERE estado = 'disponible'
            `);

            res.status(200).json({
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
            console.error('Error en getInventoryValue:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = ReportController;
