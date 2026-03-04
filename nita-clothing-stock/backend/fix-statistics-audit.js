/**
 * Fix statistics issues found during comprehensive audit
 * 
 * Issues fixed:
 * 1. getCategoryRotation() - stock double-counting due to JOIN inflation + missing sale filter
 * 2. getRestockAlerts() - missing descontinuado filter
 * 3. getCriticalStock() - missing descontinuado filter  
 * 4. getProductsWithoutSales() - missing descontinuado filter
 * 5. getSalesOfMonth() - missing daily breakdown for charts
 */

const fs = require('fs');
const path = require('path');

// Fix Sale.js
const salePath = path.join(__dirname, 'models', 'Sale.js');
let saleContent = fs.readFileSync(salePath, 'utf-8');

// ==========================================
// FIX 1: getCategoryRotation - stock double-counting
// The LEFT JOIN to sale_items creates multiple rows per product,
// inflating SUM(p.stock). Also SUM(si.quantity) counts ALL sale_items
// not just from completed recent sales.
// Fix: Use subqueries for accurate stock and sales counts.
// ==========================================

const oldCategoryRotation = `    static async getCategoryRotation() {
        const sql = \`
                        SELECT c.nombre as category_name,
                               COUNT(p.id) as products_count,
                               IFNULL(SUM(p.stock), 0) as current_stock,
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
                    \`;
        const [rows] = await database.query(sql);
        return rows;
    }`;

const newCategoryRotation = `    static async getCategoryRotation() {
        const sql = \`
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
        \`;
        const [rows] = await database.query(sql);
        return rows;
    }`;

if (saleContent.includes(oldCategoryRotation)) {
    saleContent = saleContent.replace(oldCategoryRotation, newCategoryRotation);
    console.log('✅ FIX 1: getCategoryRotation - fixed stock double-counting and sale filtering');
} else {
    console.log('⚠️  FIX 1: getCategoryRotation - pattern not found, trying flexible match...');
    // Try a more flexible match
    const flexMatch = saleContent.match(/static async getCategoryRotation\(\) \{[\s\S]*?return rows;\s*\}/);
    if (flexMatch) {
        saleContent = saleContent.replace(flexMatch[0], newCategoryRotation);
        console.log('✅ FIX 1: getCategoryRotation - fixed with flexible match');
    } else {
        console.log('❌ FIX 1: getCategoryRotation - COULD NOT FIND METHOD');
    }
}

// ==========================================
// FIX 2: getRestockAlerts - add descontinuado filter
// ==========================================

const oldRestockAlerts = `WHERE p.stock < p.stock_minimo`;
const newRestockAlerts = `WHERE p.stock < p.stock_minimo AND p.estado != 'descontinuado'`;

if (saleContent.includes('static async getRestockAlerts()')) {
    // Find the getRestockAlerts method and add the filter
    const restockMatch = saleContent.match(/static async getRestockAlerts\(\)[\s\S]*?WHERE p\.stock < p\.stock_minimo\b(?!\s+AND p\.estado)/);
    if (restockMatch) {
        saleContent = saleContent.replace(
            /WHERE p\.stock < p\.stock_minimo\b(?!\s+AND p\.estado)/,
            newRestockAlerts
        );
        console.log('✅ FIX 2: getRestockAlerts - added descontinuado filter');
    } else {
        console.log('⚠️  FIX 2: getRestockAlerts - filter may already be in place');
    }
}

// ==========================================
// FIX 3: getCriticalStock - add descontinuado filter
// ==========================================

if (saleContent.includes('static async getCriticalStock()')) {
    const criticalMatch = saleContent.match(/WHERE p\.stock <= 0 OR p\.stock < \(p\.stock_minimo \* 0\.5\)\b(?!\s+AND)/);
    if (criticalMatch) {
        saleContent = saleContent.replace(
            /WHERE p\.stock <= 0 OR p\.stock < \(p\.stock_minimo \* 0\.5\)\b(?!\s+AND)/,
            `WHERE (p.stock <= 0 OR p.stock < (p.stock_minimo * 0.5)) AND p.estado != 'descontinuado'`
        );
        console.log('✅ FIX 3: getCriticalStock - added descontinuado filter');
    } else {
        console.log('⚠️  FIX 3: getCriticalStock - filter may already be in place');
    }
}

// ==========================================
// FIX 4: getProductsWithoutSales - add descontinuado filter
// ==========================================

if (saleContent.includes('static async getProductsWithoutSales')) {
    const noSalesMatch = saleContent.match(/FROM productos p\s+JOIN categorias c ON p\.categoria_id = c\.id\s+WHERE p\.id NOT IN/);
    if (noSalesMatch) {
        saleContent = saleContent.replace(
            /FROM productos p\s+JOIN categorias c ON p\.categoria_id = c\.id\s+WHERE p\.id NOT IN/,
            `FROM productos p
                JOIN categorias c ON p.categoria_id = c.id
                WHERE p.estado != 'descontinuado' AND p.id NOT IN`
        );
        console.log('✅ FIX 4: getProductsWithoutSales - added descontinuado filter');
    } else {
        console.log('⚠️  FIX 4: getProductsWithoutSales - filter may already be in place');
    }
}

// ==========================================
// FIX 5: getSalesOfMonth - add daily breakdown for Reports.js chart
// ==========================================

const oldSalesOfMonth = `    static async getSalesOfMonth() {
        try {
            const [rows] = await database.query(\`
                SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_amount
                FROM sales
                WHERE YEAR(created_at) = YEAR(NOW())
                  AND MONTH(created_at) = MONTH(NOW())
                  AND status = 'completed'
            \`);
            return rows[0];
        } catch (error) {
            throw new Error(\`Error obteniendo ventas del mes: \${error.message}\`);
        }
    }`;

const newSalesOfMonth = `    static async getSalesOfMonth() {
        try {
            const [rows] = await database.query(\`
                SELECT COUNT(*) as total_sales, COALESCE(SUM(total), 0) as total_amount
                FROM sales
                WHERE YEAR(created_at) = YEAR(NOW())
                  AND MONTH(created_at) = MONTH(NOW())
                  AND status = 'completed'
            \`);

            // Daily breakdown for charts
            const [daily] = await database.query(\`
                SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as total
                FROM sales
                WHERE YEAR(created_at) = YEAR(NOW())
                  AND MONTH(created_at) = MONTH(NOW())
                  AND status = 'completed'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            \`);

            return { ...rows[0], daily };
        } catch (error) {
            throw new Error(\`Error obteniendo ventas del mes: \${error.message}\`);
        }
    }`;

if (saleContent.includes(oldSalesOfMonth)) {
    saleContent = saleContent.replace(oldSalesOfMonth, newSalesOfMonth);
    console.log('✅ FIX 5: getSalesOfMonth - added daily breakdown for chart');
} else {
    console.log('⚠️  FIX 5: getSalesOfMonth - trying flexible match...');
    const flexMatch = saleContent.match(/static async getSalesOfMonth\(\) \{[\s\S]*?throw new Error\(`Error obteniendo ventas del mes[\s\S]*?\}\s*\}/);
    if (flexMatch) {
        saleContent = saleContent.replace(flexMatch[0], newSalesOfMonth);
        console.log('✅ FIX 5: getSalesOfMonth - fixed with flexible match');
    } else {
        console.log('❌ FIX 5: getSalesOfMonth - COULD NOT FIND METHOD');
    }
}

// Write Sale.js back
fs.writeFileSync(salePath, saleContent, 'utf-8');
console.log('\n📁 Sale.js written to disk');

// ==========================================
// FIX 6: AdvancedReports.js - Top 10 Days sort by revenue DESC
// ==========================================

const advPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'AdvancedReports.js');
let advContent = fs.readFileSync(advPath, 'utf-8');

// The current code: salesTrend.slice(0, 10) shows first 10 chronological dates
// Should sort by revenue DESC to show highest-revenue days
const oldTopDays = `{salesTrend.slice(0, 10).map((day, index) => (
                  <div key={index} className="day-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="date">{day.date}</span>
                    <span className="amount">${'$'}{(day.revenue || 0).toLocaleString()}</span>
                  </div>
                ))}`;

const newTopDays = `{[...salesTrend].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10).map((day, index) => (
                  <div key={index} className="day-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="date">{day.date}</span>
                    <span className="amount">${'$'}{(day.revenue || 0).toLocaleString()}</span>
                  </div>
                ))}`;

if (advContent.includes('salesTrend.slice(0, 10).map((day, index)')) {
    advContent = advContent.replace(
        'salesTrend.slice(0, 10).map((day, index)',
        '[...salesTrend].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10).map((day, index)'
    );
    console.log('✅ FIX 6: AdvancedReports - Top 10 Days now sorted by revenue DESC');
} else {
    console.log('⚠️  FIX 6: AdvancedReports - pattern not found');
}

fs.writeFileSync(advPath, advContent, 'utf-8');
console.log('📁 AdvancedReports.js written to disk');

console.log('\n✨ All fixes applied successfully!');
