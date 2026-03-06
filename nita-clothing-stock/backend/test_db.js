require('dotenv').config();
const db = require('./config/database');
const fs = require('fs');
async function run() {
    try {
        const salesStats = await db.get(`
        SELECT 
            COUNT(*) as totalTransactions,
            COALESCE(SUM(total), 0) as totalSales,
            COALESCE(SUM(subtotal), 0) as totalSubtotal
        FROM sales
        WHERE status = 'completed'
    `);

        const itemsStats = await db.get(`
        SELECT 
            COALESCE(SUM(si.quantity * si.unit_price), 0) as total_revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'completed'
    `);

        const thisMonthCat = await db.all(`
          SELECT 
              c.nombre as category_name,
              SUM(si.quantity * si.unit_price) as total_revenue,
              SUM(si.quantity) as total_quantity
          FROM sale_items si
          JOIN productos p ON si.product_id = p.id
          JOIN categorias c ON p.categoria_id = c.id
          JOIN sales s ON si.sale_id = s.id
          WHERE DATE_FORMAT(s.created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
            AND s.status = 'completed'
          GROUP BY c.id, c.nombre
          ORDER BY total_quantity DESC
    `);

        const salesMonthStats = await db.get(`
        SELECT 
            COUNT(*) as totalTransactions,
            COALESCE(SUM(total), 0) as totalSales
        FROM sales
        WHERE status = 'completed' AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
    `);

        fs.writeFileSync('result.json', JSON.stringify({
            salesStats,
            itemsStats,
            salesMonthStats,
            thisMonthCat
        }, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
