/**
 * Test completo de todas las funcionalidades del sistema Nita Clothing con LOGGING DETALLADO
 */

const database = require('./config/database');

const results = { passed: [], failed: [], warnings: [] };

function pass(name) { results.passed.push(name); console.log(`  ✅ ${name}`); }
function fail(name, err) { results.failed.push({ name, error: err }); console.log(`  ❌ ${name}: ${err}`); }
function warn(name, msg) { results.warnings.push({ name, msg }); console.log(`  ⚠️  ${name}: ${msg}`); }

async function testCategories() {
    console.log('\n📂 CATEGORÍAS');
    const Category = require('./models/Category');
    try {
        console.log('[STEP] Creando categoría...');
        const cat = await Category.create({ name: 'Test Category ' + Date.now(), description: 'Test desc' });
        if (cat && cat.id) pass('Crear categoría');
        else { fail('Crear categoría', 'No se obtuvo ID'); return; }

        console.log('[STEP] Listando categorías...');
        const all = await Category.getAll();
        if (Array.isArray(all) && all.length > 0) pass('Listar categorías');
        else fail('Listar categorías', 'Lista vacía o no es array');

        console.log('[STEP] Probando cambio de estado de categoría...');
        await Category.changeStatus(cat.id, 'inactiva');
        const updatedCat = await Category.getById(cat.id);
        if (updatedCat.status === 'inactiva') pass('Cambiar estado categoría');
        else fail('Cambiar estado categoría', `Estado esperado: inactiva, Actual: ${updatedCat.status}`);

        return cat.id;
    } catch (e) {
        fail('Categorías general', e.message);
    }
}

async function testProducts() {
    console.log('\n👕 PRODUCTOS');
    const Product = require('./models/Product');
    const Category = require('./models/Category');
    let testProductId = null;

    try {
        console.log('[STEP] Creando categoría para producto...');
        const cat = await Category.create({ name: 'Productos Test ' + Date.now(), description: 'test' });

        console.log('[STEP] Creando producto...');
        const prod = await Product.create({
            nombre: 'Remera Test ' + Date.now(),
            codigo: 'TEST-' + Date.now(),
            categoria_id: cat.id,
            tallas: 'M',
            colores: 'Negro',
            precio: 5000,
            costo: 2500,
            stock: 10,
            stock_minimo: 2,
            supplier_id: null,
            proveedor: 'Proveedor Test',
            ubicacion: 'Estante A',
            estado: 'disponible'
        });
        if (prod && prod.id) { pass('Crear producto'); testProductId = prod.id; }
        else { fail('Crear producto', 'No se obtuvo ID'); return; }

        console.log('[STEP] Obteniendo último SKU...');
        try {
            const lastSku = await Product.getLastSku();
            pass(`Obtener último SKU: ${lastSku}`);
        } catch (e) {
            fail('Obtener último SKU', e.message);
        }

        console.log('[STEP] Duplicando producto...');
        try {
            const dup = await Product.duplicate(testProductId);
            if (dup && dup.id) {
                pass('Duplicar producto');
                await Product.delete(dup.id);
            }
        } catch (e) {
            fail('Duplicar producto', e.message);
        }

        return { productId: testProductId, categoryId: cat.id };
    } catch (e) {
        fail('Productos general', e.message);
        return { productId: null, categoryId: null };
    }
}

async function testSales(productId) {
    console.log('\n💰 VENTAS');
    const Sale = require('./models/Sale');
    const Product = require('./models/Product');

    try {
        console.log('[STEP] Obteniendo producto para venta...');
        const product = await Product.getById(productId);

        console.log('[STEP] Creando venta...');
        const sale = await Sale.createWithItems({
            subtotal: 10000,
            discount_percent: 0,
            discount_amount: 0,
            total: 10000,
            customer_name: 'Comprador Test',
            payment_method: 'efectivo'
        }, [{
            product_id: productId,
            quantity: 2,
            unit_price: 5000
        }], 'comprador@test.com');

        if (sale && sale.id) pass('Crear venta');
        else { fail('Crear venta', 'No se obtuvo ID'); return; }

        console.log('[STEP] Verificando relación de stock...');
        const productAfter = await Product.getById(productId);
        if (productAfter.stock === 8) pass('Stock descontado (10 -> 8)');
        else fail('Stock no descontado', `Stock actual: ${productAfter.stock}`);

        return sale.id;
    } catch (e) {
        fail('Ventas general', e.message);
    }
}

async function testPurchaseOrders() {
    console.log('\n🛒 ÓRDENES DE COMPRA');
    const PurchaseOrder = require('./models/PurchaseOrder');
    const Supplier = require('./models/Supplier');
    const Product = require('./models/Product');
    const Category = require('./models/Category');

    try {
        console.log('[STEP] Creando proveedor...');
        const sup = await Supplier.create({ name: 'Proveedor OC ' + Date.now() });

        console.log('[STEP] Creando categoría y producto para OC...');
        const cat = await Category.create({ name: 'Cat OC ' + Date.now() });
        const prod = await Product.create({
            nombre: 'Prod OC ' + Date.now(),
            codigo: 'OC-' + Date.now(),
            categoria_id: cat.id,
            precio: 1000,
            costo: 500,
            stock: 0,
            stock_minimo: 5,
            supplier_id: sup.id
        });

        console.log('[STEP] Creando orden de compra...');
        const order = await PurchaseOrder.create({
            supplier_id: sup.id,
            items: [{
                product_id: prod.id,
                product_name: prod.nombre,
                quantity: 50,
                unit_cost: 500
            }],
            subtotal: 25000,
            total_amount: 25000,
            created_by: null
        });

        if (order && order.id) pass('Crear orden de compra');
        else { fail('Crear orden', 'No se obtuvo ID'); return; }

        console.log('[STEP] Recibiendo orden de compra...');
        const received = await PurchaseOrder.receiveOrder(order.id, null);
        if (received.success) pass('Recibir orden de compra');
        else fail('Recibir orden', received.message);

        console.log('[STEP] Verificando stock tras OC...');
        const prodAfter = await Product.getById(prod.id);
        if (prodAfter.stock === 50) pass('Stock actualizado tras OC (0 -> 50)');
        else fail('Stock OC fallo', `Stock actual: ${prodAfter.stock}`);

    } catch (e) {
        fail('Órdenes de compra general', e.message);
        console.error(e);
    }
}

async function main() {
    console.log('--- INICIO DE PRUEBAS DETALLADAS ---\n');
    try {
        await database.connect();

        await testCategories();
        const { productId } = await testProducts();
        if (productId) {
            await testSales(productId);
        }
        await testPurchaseOrders();

        console.log('\n--- RESUMEN ---');
        console.log(`Pasaron: ${results.passed.length}`);
        console.log(`Fallaron: ${results.failed.length}`);
    } catch (e) {
        console.error('Error fatal:', e);
    } finally {
        await database.close();
        process.exit(results.failed.length > 0 ? 1 : 0);
    }
}

main();
