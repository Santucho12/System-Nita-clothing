require('dotenv').config();
const db = require('./config/database');
const Product = require('./models/Product');

(async () => {
    try {
        // Ver lo que el modelo realmente tiene como método delete
        console.log('=== DEBUG Product.delete ===');
        console.log('Product.delete source:\n', Product.delete.toString());
        
        // Estado antes
        const [antes] = await db.query('SELECT id, nombre, stock, estado FROM productos WHERE id = 127');
        console.log('\nANTES:', JSON.stringify(antes[0]));
        
        // Ejecutar delete del modelo
        console.log('\nEjecutando Product.delete(127)...');
        const result = await Product.delete(127);
        console.log('Resultado:', result);
        
        // Estado después
        const [despues] = await db.query('SELECT id, nombre, stock, estado FROM productos WHERE id = 127');
        console.log('DESPUES:', JSON.stringify(despues[0]));
        
    } catch (err) {
        console.error('ERROR:', err);
    }
    process.exit();
})();
