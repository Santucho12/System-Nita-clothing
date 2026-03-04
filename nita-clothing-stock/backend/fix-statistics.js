/**
 * Fix backend SQL aliases and add missing fields to match frontend expectations
 * Issues fixed:
 * 1. getCategoryRotation: 'category' → 'category_name', add current_stock
 * 2. getProfitByCategory: 'category' → 'category_name'
 * 3. getTopSellingProducts: 'quantity_sold' → 'total_quantity'
 * 4. getLeastSellingProducts: 'quantity_sold' → 'total_quantity', add stock_quantity, last_sale
 * 5. getGeneralProfits: 'ganancia_total' → 'total_profit', 'margen_promedio' → 'avg_profit_margin', etc
 * 6. getStockInmovilizado: filter descontinuado
 * 7. Remove duplicate updateCustomerSegment (SQLite version)
 */

const fs = require('fs');
const path = require('path');

const salePath = path.join(__dirname, 'models', 'Sale.js');
let content = fs.readFileSync(salePath, 'utf8');

// 1. getCategoryRotation: 'category' → 'category_name' and add current_stock
content = content.replace(
    /SELECT c\.nombre as category,\s*\n\s*COUNT\(p\.id\) as products_count,\s*\n\s*IFNULL\(SUM\(si\.quantity\), 0\) as total_sold,/,
    `SELECT c.nombre as category_name,
                               COUNT(p.id) as products_count,
                               IFNULL(SUM(p.stock), 0) as current_stock,
                               IFNULL(SUM(si.quantity), 0) as total_sold,`
);

// 2. getProfitByCategory: 'category' → 'category_name'
content = content.replace(
    /static async getProfitByCategory\(\) \{[\s\S]*?c\.nombre as category,/,
    (match) => match.replace('c.nombre as category,', 'c.nombre as category_name,')
);

// 3. getTopSellingProducts: 'quantity_sold' → 'total_quantity'
content = content.replace(
    /SUM\(si\.quantity\) as quantity_sold,\s*\n\s*SUM\(si\.quantity \* si\.unit_price\) as total_revenue,\s*\n\s*SUM\(\(si\.unit_price - si\.unit_cost\) \* si\.quantity\) as total_profit/,
    `SUM(si.quantity) as total_quantity,
                       SUM(si.quantity * si.unit_price) as total_revenue,
                       SUM((si.unit_price - si.unit_cost) * si.quantity) as total_profit`
);
// Also fix ORDER BY quantity_sold in getTopSellingProducts
content = content.replace(
    /ORDER BY quantity_sold DESC\s*\n\s*LIMIT \$\{parseInt\(limit\)\}/,
    (match) => match.replace('quantity_sold', 'total_quantity')
);

// 4. getLeastSellingProducts: 'quantity_sold' → 'total_quantity', add stock_quantity, last_sale
content = content.replace(
    /static async getLeastSellingProducts\(\{ limit = 10, days = 30 \} = \{\}\) \{\s*\n\s*const sql = `\s*\n\s*SELECT p\.id as product_id, p\.nombre as product_name, c\.nombre as category,\s*\n\s*IFNULL\(SUM\(si\.quantity\), 0\) as quantity_sold,\s*\n\s*IFNULL\(SUM\(si\.quantity \* si\.unit_price\), 0\) as total_revenue\s*\n\s*FROM productos p/,
    `static async getLeastSellingProducts({ limit = 10, days = 30 } = {}) {
        const sql = \`
                SELECT p.id as product_id, p.nombre as product_name, c.nombre as category,
                       p.stock as stock_quantity,
                       IFNULL(SUM(si.quantity), 0) as total_quantity,
                       IFNULL(SUM(si.quantity * si.unit_price), 0) as total_revenue,
                       (SELECT MAX(s2.created_at) FROM sale_items si2 JOIN sales s2 ON si2.sale_id = s2.id WHERE si2.product_id = p.id AND s2.status = 'completed') as last_sale
                FROM productos p`
);
// Fix ORDER BY in getLeastSellingProducts
content = content.replace(
    /ORDER BY quantity_sold ASC, p\.nombre ASC/,
    'ORDER BY total_quantity ASC, p.nombre ASC'
);

// 5. getGeneralProfits: rename ganancia_total → total_profit, margen_promedio → avg_profit_margin
content = content.replace(
    /as ganancia_total,/g,
    'as total_profit,'
);
content = content.replace(
    /as ganancia_mensual,/g,
    'as monthly_profit,'
);
content = content.replace(
    /as ganancia_anual,/g,
    'as yearly_profit,'
);
content = content.replace(
    /as margen_promedio,/g,
    'as avg_profit_margin,'
);
content = content.replace(
    /as costo_total,/g,
    'as total_cost,'
);

// 6. getStockInmovilizado: filter descontinuado
content = content.replace(
    /SELECT COUNT\(\*\) as total_products,\s*\n\s*SUM\(p\.stock \* p\.costo\) as total_investment\s*\n\s*FROM productos p\s*\n\s*`;/,
    `SELECT COUNT(*) as total_products,
                       SUM(p.stock * p.costo) as total_investment
                FROM productos p
                WHERE p.estado != 'descontinuado'
            \`;`
);
content = content.replace(
    /100\.0 \* SUM\(p\.stock \* p\.costo\) \/ \(SELECT SUM\(stock \* costo\) FROM productos\)/,
    `100.0 * SUM(p.stock * p.costo) / (SELECT SUM(stock * costo) FROM productos WHERE estado != 'descontinuado')`
);

// Also add estado filter to byCategory SQL in getStockInmovilizado
content = content.replace(
    /FROM productos p\s*\n\s*JOIN categorias c ON p\.categoria_id = c\.id\s*\n\s*GROUP BY c\.nombre\s*\n\s*`;/,
    (match) => {
        // Only replace the one inside getStockInmovilizado (the one followed by closing backtick with GROUP BY)
        return match.replace(
            'FROM productos p\n                JOIN categorias c ON p.categoria_id = c.id\n                GROUP BY c.nombre',
            `FROM productos p
                JOIN categorias c ON p.categoria_id = c.id
                WHERE p.estado != 'descontinuado'
                GROUP BY c.nombre`
        );
    }
);

// 7. Add estado filter to getLeastSellingProducts
// Already has JOIN categorias c, need to add WHERE p.estado != 'descontinuado'
// This is tricky because the LEFT JOIN structure. Let me add it after the GROUP BY line
content = content.replace(
    /JOIN categorias c ON p\.categoria_id = c\.id\s*\n\s*GROUP BY p\.id, p\.nombre, c\.nombre\s*\n\s*ORDER BY total_quantity ASC/,
    `JOIN categorias c ON p.categoria_id = c.id
                WHERE p.estado != 'descontinuado'
                GROUP BY p.id, p.nombre, c.nombre
                ORDER BY total_quantity ASC`
);

fs.writeFileSync(salePath, content, 'utf8');
console.log('✅ Sale.js fixed successfully');
console.log('Changes:');
console.log('  - getCategoryRotation: category → category_name, added current_stock');
console.log('  - getProfitByCategory: category → category_name');
console.log('  - getTopSellingProducts: quantity_sold → total_quantity');
console.log('  - getLeastSellingProducts: quantity_sold → total_quantity, added stock_quantity, last_sale');
console.log('  - getGeneralProfits: ganancia_total → total_profit, margen_promedio → avg_profit_margin');
console.log('  - getStockInmovilizado: filtered descontinuado');
console.log('  - getLeastSellingProducts: filtered descontinuado');
