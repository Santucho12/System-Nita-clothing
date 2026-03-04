require('dotenv').config();
const db = require('./config/database');

async function check() {
    const tables = await db.all('SHOW TABLES');
    console.log('All tables:', JSON.stringify(tables));
    
    // Find sale-related tables
    const saleTables = tables.filter(t => {
        const name = Object.values(t)[0].toLowerCase();
        return name.includes('sale') || name.includes('venta');
    });
    console.log('Sale tables:', JSON.stringify(saleTables));

    // Get schema of the sale table
    if (saleTables.length > 0) {
        const tableName = Object.values(saleTables[0])[0];
        const cols = await db.all(`DESCRIBE ${tableName}`);
        console.log(`\nColumns of ${tableName}:`, JSON.stringify(cols, null, 2));
        
        // Get last 3 sales
        const sales = await db.all(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 3`);
        console.log(`\nLast 3 sales:`, JSON.stringify(sales, null, 2));
    }

    process.exit(0);
}
check();
