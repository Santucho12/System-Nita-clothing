// Test: Producto tiene Proveedor
// Ejecutar con: node test-producto-proveedor.js


const { makeRequest, login } = require('./test-helpers');

(async function testProductoProveedor() {
	if (!(await login())) return;
	const unique = Date.now();
	// 1. Crear proveedor
	const proveedor = {
		name: `ProvTest_${unique}`,
		contact_name: `Contacto ${unique}`,
		email: `prov${unique}@test.com`,
		phone: '123456789',
		address: 'Calle Falsa 123',
		city: 'Ciudad Test',
		state: 'Estado Test',
		postal_code: '1000',
		country: 'Testland',
		website: null,
		tax_id: `TAX${unique}`,
		payment_terms: 'net_30',
		notes: 'Proveedor de prueba'
	};
	let res = await makeRequest('POST', '/api/proveedores', proveedor);
	if (!(res.status === 201 && res.data.data && res.data.data.id)) return console.error('✗ Error proveedor:', res.data.error || res.data.message);
	const proveedorId = res.data.data.id;
	console.log('✓ Proveedor creado, id:', proveedorId);

	// 2. Crear producto con ese proveedor
	const producto = {
		nombre: `ProdProvTest_${unique}`,
		categoria_id: null,
		tallas: null,
		colores: null,
		precio: 200,
		costo: 100,
		stock: 5,
		stock_minimo: null,
		proveedor: proveedorId,
		ubicacion: null,
		estado: 'activo',
		fecha_ingreso: null,
		imagen_url: null,
		notas: null,
		created_at: null,
		updated_at: null
	};
	res = await makeRequest('POST', '/api/productos', producto);
	if (!(res.status === 201 && res.data.success)) return console.error('✗ Error producto:', res.data.message);
	const productoId = res.data.data.id;
	console.log('✓ Producto creado');

	// 3. Consultar producto y verificar que tiene el proveedor correcto
	res = await makeRequest('GET', `/api/productos/${productoId}`);
	if (res.status === 200 && res.data.data && res.data.data.proveedor == proveedorId) {
		console.log('✓ Relación producto-proveedor verificada');
	} else {
		console.error('✗ Relación producto-proveedor incorrecta');
	}
})();
