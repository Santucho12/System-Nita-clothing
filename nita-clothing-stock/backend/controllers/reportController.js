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
                    COALESCE(SUM(items_total), 0) as totalProducts
                FROM sales
                WHERE status = 'completada'
                ${startDate ? 'AND DATE(created_at) >= ?' : ''}
                ${endDate ? 'AND DATE(created_at) <= ?' : ''}
            `, [startDate, endDate].filter(Boolean));

            // Ganancias netas
            const [profitStats] = await db.query(`
                SELECT 
                    COALESCE(SUM(si.quantity * (si.unit_price - p.cost_price)), 0) as netProfit,
                    COALESCE(SUM(si.quantity * p.cost_price), 0) as totalCost
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.status = 'completada'
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
                    COALESCE(SUM(stock_quantity * cost_price), 0) as inventoryValue,
                    COUNT(*) as totalSKUs
                FROM products
                WHERE stock_quantity > 0
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
            
            let groupBy = 'DATE(created_at)';
            let dateFormat = '%Y-%m-%d';
            
            if (period === 'week') {
                groupBy = 'YEARWEEK(created_at, 1)';
                dateFormat = 'Semana %v';
            } else if (period === 'month') {
                groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
                dateFormat = '%Y-%m';
            }

            const [trends] = await db.query(`
                SELECT 
                    DATE_FORMAT(created_at, ?) as date,
                    COUNT(*) as transactions,
                    COALESCE(SUM(total), 0) as revenue,
                    COALESCE(SUM(total - (SELECT SUM(si.quantity * p.cost_price) 
                                          FROM sale_items si 
                                          JOIN products p ON si.product_id = p.id 
                                          WHERE si.sale_id = sales.id)), 0) as profit
                FROM sales
                WHERE status = 'completada'
                ${startDate ? 'AND DATE(created_at) >= ?' : ''}
                ${endDate ? 'AND DATE(created_at) <= ?' : ''}
                GROUP BY ${groupBy}
                ORDER BY created_at ASC
                LIMIT 30
            `, [dateFormat, startDate, endDate].filter((v, i) => i === 0 || v));

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
                    p.name as product,
                    p.sale_price,
                    p.cost_price,
                    ((p.sale_price - p.cost_price) / p.sale_price * 100) as margin,
                    COALESCE(SUM(si.quantity), 0) as units_sold,
                    COALESCE(SUM(si.quantity * (si.unit_price - p.cost_price)), 0) as profit
                FROM products p
                LEFT JOIN sale_items si ON p.id = si.product_id
                LEFT JOIN sales s ON si.sale_id = s.id AND s.status = 'completada'
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
                    COALESCE(SUM(stock_quantity * cost_price), 0) as totalValue,
                    COALESCE(SUM(stock_quantity), 0) as totalUnits,
                    COUNT(*) as activeProducts,
                    SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) as outOfStock,
                    SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= min_stock THEN 1 ELSE 0 END) as lowStock,
                    SUM(CASE WHEN stock_quantity > min_stock THEN 1 ELSE 0 END) as healthyStock
                FROM products
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
                    IFNULL(SUM(sale_price * quantity), 0) as total_value,
                    IFNULL(SUM(cost_price * quantity), 0) as total_cost,
                    COUNT(*) as total_products,
                    SUM(quantity) as total_units
                FROM products
                WHERE status = 'activo'
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
