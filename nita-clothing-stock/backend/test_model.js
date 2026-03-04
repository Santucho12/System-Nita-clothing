require('dotenv').config();
const Product = require('./models/Product');
const database = require('./config/database');

async function testCreate() {
    try {
        await database.connect();
        console.log('--- TEST INICIALIZADO ---');

        const testData = {
            nombre: 'Producto de Prueba Antigravity',
            codigo: 'TEST-SKU-' + Date.now(),
            categoria_id: 3,
            supplier_id: 2,
            precio: 1000,
            costo: 500,
            stock: 10,
            imagen_url: JSON.stringify(['/uploads/products/test-image.png']),
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        console.log('Datos a insertar:', JSON.stringify(testData, null, 2));
        const result = await Product.create(testData);
        console.log('Resultado de inserción:', result);

        // Verificar directamente en la DB
        const [rows] = await require('./config/database').query(
            'SELECT id, nombre, imagen_url FROM productos WHERE id = ?',
            [result.id]
        );
        console.log('Verificación en DB:', rows[0]);

        process.exit(0);
    } catch (error) {
        console.error('Error en el test:', error);
        process.exit(1);
    }
}

testCreate();
