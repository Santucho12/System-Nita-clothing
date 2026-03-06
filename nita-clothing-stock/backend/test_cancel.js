require('dotenv').config();
const fs = require('fs');
const Sale = require('./models/Sale');
const database = require('./config/database');
const Product = require('./models/Product');
const ProductController = require('./controllers/productController');
const ReportController = require('./controllers/reportController');

let logs = "";
function log(msg) {
    logs += msg + "\n";
    console.log(msg);
}

async function checkStats() {
    const pCount1 = await Product.getCount();

    // Ventas del mes
    const kpis1 = await database.get(`SELECT COUNT(*) as totalTransactions FROM sales WHERE status = 'completed'`);

    // Capital
    const cap1 = await database.get(`SELECT IFNULL(SUM(precio * stock), 0) as total_value FROM productos WHERE estado != 'descontinuado' AND stock > 0 AND estado = "activo"`);

    return { pCount: pCount1, totalSales: kpis1.totalTransactions, capital: cap1.total_value, stats: await database.get('SELECT stock, estado FROM productos WHERE id = 1') };
}

async function testCancel() {
    try {
        const saleData = {
            subtotal: 1000,
            discount_percent: 0,
            discount_amount: 0,
            total: 1000,
            customer_name: 'Test',
            customer_email: 'test@test.com',
            payment_method: 'efectivo',
        };

        // Force product 1 to have exactly 1 stock
        await database.run("UPDATE productos SET stock = 1, estado = 'activo' WHERE id = 1");

        log("Stats before sale:");
        log(JSON.stringify(await checkStats()));

        const items = [
            { product_id: 1, quantity: 1, unit_price: 1000 }
        ];

        log("Creating sale...");
        const sale = await Sale.createWithItems(saleData, items);

        log("Stats after sale:");
        log(JSON.stringify(await checkStats()));

        log("Cancelling sale ID: " + sale.id);
        await Sale.delete(sale.id);

        log("Stats after cancel:");
        log(JSON.stringify(await checkStats()));

        fs.writeFileSync('output_test.json', logs);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

testCancel();
