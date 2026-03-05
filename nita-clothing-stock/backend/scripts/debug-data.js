const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');

async function check() {
    try {
        const products = await Product.getAll();
        console.log('Total Products:', products.length);

        if (products.length > 0) {
            console.log('Sample Product Full JSON:');
            console.log(JSON.stringify(products[0], null, 2));
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
