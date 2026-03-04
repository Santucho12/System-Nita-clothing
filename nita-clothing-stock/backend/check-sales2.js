require('dotenv').config();
const db = require('./config/database');

async function check() {
    const cols = await db.all('DESCRIBE sales');
    console.log('Columns of sales:', JSON.stringify(cols, null, 2));
    
    const sales = await db.all('SELECT * FROM sales ORDER BY id DESC LIMIT 3');
    console.log('\nLast 3 sales:', JSON.stringify(sales, null, 2));

    process.exit(0);
}
check();
