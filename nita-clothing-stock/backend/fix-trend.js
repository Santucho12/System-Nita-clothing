/**
 * Fix reportController.js:
 * 1. Add profit calculation to getSalesTrend endpoint
 * 2. The sales trend SQL needs to join with sale_items to compute profit
 */

const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, 'controllers', 'reportController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

// Fix getSalesTrend to include profit
const oldTrendSQL = `const sql = \`
                SELECT 
                    \${selectDateExpression} as date,
                    COUNT(*) as transactions,
                    COALESCE(SUM(total), 0) as revenue
                FROM sales
                WHERE \${whereClauses.join(' AND ')}
                GROUP BY \${groupByClause}
                ORDER BY \${groupByClause} ASC
                LIMIT 30
            \`;

            const trends = await db.all(sql, params);

            res.json({
                success: true,
                data: trends.map(t => ({
                    date: t.date,
                    transactions: parseInt(t.transactions),
                    revenue: parseFloat(t.revenue)
                }))
            });`;

const newTrendSQL = `const sql = \`
                SELECT 
                    \${selectDateExpression} as date,
                    COUNT(DISTINCT s.id) as transactions,
                    COALESCE(SUM(s.total), 0) as revenue,
                    COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)), 0) as profit
                FROM sales s
                LEFT JOIN sale_items si ON si.sale_id = s.id
                WHERE \${whereClauses.join(' AND ').replace(/status/g, 's.status').replace(/DATE\\(created_at\\)/g, 'DATE(s.created_at)').replace(/created_at\\)/g, 's.created_at)')}
                GROUP BY \${groupByClause.replace(/created_at/g, 's.created_at')}
                ORDER BY \${groupByClause.replace(/created_at/g, 's.created_at')} ASC
                LIMIT 30
            \`;

            const trends = await db.all(sql, params);

            res.json({
                success: true,
                data: trends.map(t => ({
                    date: t.date,
                    transactions: parseInt(t.transactions),
                    revenue: parseFloat(t.revenue),
                    profit: parseFloat(t.profit || 0)
                }))
            });`;

// Actually, the string replace approach with template literals is fragile.
// Let me use a simpler regex approach.

// Instead, let me rewrite the entire getSalesTrend method
const oldMethod = content.match(/static async getSalesTrend\(req, res, next\) \{[\s\S]*?(?=static async getProfitMargins)/);

if (oldMethod) {
    const newMethod = `static async getSalesTrend(req, res, next) {
        try {
            const { startDate, endDate, period } = req.query;
            const db = require('../config/database');

            let groupByClause = 'DATE(s.created_at)';
            let selectDateExpression = 'DATE(s.created_at)';

            if (period === 'week') {
                groupByClause = 'YEARWEEK(s.created_at, 1)';
                selectDateExpression = 'YEARWEEK(s.created_at, 1)';
            } else if (period === 'month') {
                groupByClause = 'DATE_FORMAT(s.created_at, "%Y-%m")';
                selectDateExpression = 'DATE_FORMAT(s.created_at, "%Y-%m")';
            }

            let whereClauses = ['s.status = ?'];
            let params = ['completed'];

            if (startDate) {
                whereClauses.push('DATE(s.created_at) >= ?');
                params.push(startDate);
            }
            if (endDate) {
                whereClauses.push('DATE(s.created_at) <= ?');
                params.push(endDate);
            }

            const sql = \`
                SELECT 
                    \${selectDateExpression} as date,
                    COUNT(DISTINCT s.id) as transactions,
                    COALESCE(SUM(s.total), 0) as revenue,
                    COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)), 0) as profit
                FROM sales s
                LEFT JOIN sale_items si ON si.sale_id = s.id
                WHERE \${whereClauses.join(' AND ')}
                GROUP BY \${groupByClause}
                ORDER BY \${groupByClause} ASC
                LIMIT 30
            \`;

            const trends = await db.all(sql, params);

            res.json({
                success: true,
                data: trends.map(t => ({
                    date: t.date,
                    transactions: parseInt(t.transactions),
                    revenue: parseFloat(t.revenue),
                    profit: parseFloat(t.profit || 0)
                }))
            });
        } catch (error) {
            next(error);
        }
    }

    `;
    
    content = content.replace(oldMethod[0], newMethod);
    fs.writeFileSync(controllerPath, content, 'utf8');
    console.log('✅ reportController.js - getSalesTrend updated with profit field');
} else {
    console.log('❌ Could not find getSalesTrend method');
}
