const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const database = require('../config/database');

async function fixSchema() {
    try {
        await database.connect();
        console.log('Conectado. Intentando agregar columna min_order_amount...');
        try {
            await database.run('ALTER TABLE suppliers ADD COLUMN min_order_amount DECIMAL(10,2) DEFAULT 0');
            console.log('✅ Columna min_order_amount agregada.');
        } catch (e) {
            console.log('⚠️ Columna min_order_amount ya existe o error:', e.message);
        }
        process.exit(0);
    } catch (e) {
        console.error('❌ Error:', e);
        process.exit(1);
    }
}
fixSchema();
