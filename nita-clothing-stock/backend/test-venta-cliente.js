// Test: Venta pertenece a Cliente (adaptado a modelo con sale_items)
// Ejecutar con: node test-venta-cliente.js

const { makeRequest, login } = require('./test-helpers');

(async function testVentaCliente() {
	if (!(await login())) return;
	const unique = Date.now();
	// 1. Crear cliente
	const cliente = {
		email: `cliente${unique}@test.com`,
		name: `Cliente Test ${unique}`,
		phone: '123456789',
		birth_date: '1990-01-01',
		address: 'Calle Cliente 123',
		city: 'Ciudad Test',
		province: 'Provincia Test',
		postal_code: '1000',
		notes: 'Cliente de prueba'
	};
	let res = await makeRequest('POST', '/api/clientes', cliente);
	if (!(res.status === 201 && res.data.success && res.data.data && res.data.data.email)) {
		console.error('✗ Error cliente:', res.data.message);
		console.log('DEBUG cliente response:', res);
		return;
	}
	const clienteEmail = res.data.data.email;
	console.log('✓ Cliente creado:', clienteEmail);

	// 2. Crear producto
	const producto = {
		nombre: `ProdVentaTest_${unique}`,
		categoria_id: null,
		tallas: null,
		colores: null,
		precio: 150,
		costo: 80,
		stock: 20,
		stock_minimo: null,
		proveedor: null,
		ubicacion: null,
		estado: 'activo',
		fecha_ingreso: null,
		imagen_url: null,
		notas: null,
		created_at: null,
		updated_at: null
	};
	res = await makeRequest('POST', '/api/productos', producto);
	if (!(res.status === 201 && res.data.success)) {
		console.error('✗ Error producto:', res.data.message);
		console.log('DEBUG producto response:', res);
		return;
	}
	const productoId = res.data.data.id;
	console.log('✓ Producto creado:', productoId);

	// 3. Registrar venta con ese cliente y producto (nuevo modelo)
	const venta = {
		customer_name: cliente.name,
		customer_email: cliente.email,
		payment_method: 'efectivo',
		subtotal: 300,
		discount_percent: 0,
		discount_amount: 0,
		total: 300,
		items: [
			{
				product_id: productoId,
				quantity: 2,
				unit_price: 150
			}
		]
	};
	res = await makeRequest('POST', '/api/ventas', venta);
	if (!(res.status === 201 && res.data.success && res.data.data && res.data.data.id)) {
		console.error('✗ Error venta:', res.data.message);
		console.log('DEBUG venta response:', res);
		return;
	}
	const ventaId = res.data.data.id;
	console.log('✓ Venta creada:', ventaId);

	// 4. Consultar venta y verificar que tiene el cliente correcto
	res = await makeRequest('GET', `/api/ventas/${ventaId}`);
	if (res.status === 200 && res.data.data && res.data.data.customer_email === cliente.email) {
		console.log('✓ Relación venta-cliente verificada');
	} else {
		console.error('✗ Relación venta-cliente incorrecta');
		console.log('DEBUG consulta venta response:', res);
	}
})();
