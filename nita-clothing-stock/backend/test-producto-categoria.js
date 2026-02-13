
// Test: Producto pertenece a Categoría
// Ejecutar con: node test-producto-categoria.js

const { makeRequest, login } = require('./test-helpers');

(async function testProductoCategoria() {
	if (!(await login())) return;
	const unique = Date.now();
	// 1. Crear categoría
	const categoria = {
		name: `CatTest_${unique}`,
		description: `Categoría test ${unique}`
	};
	let res = await makeRequest('POST', '/api/categorias', categoria);
	console.log('Respuesta creación categoría:', res);
	if (!(res.status === 201 && res.data.success)) return console.error('✗ Error categoría:', res.data.message);
	console.log('Respuesta data de categoría:', res.data.data);
	const categoriaId = res.data.data && (res.data.data.id || res.data.data.ID || res.data.data.Id);
	console.log('✓ Categoría creada, id:', categoriaId);

	// 2. Crear producto con esa categoría
	const producto = {
		nombre: `ProdTest_${unique}`,
		categoria_id: categoriaId,
		tallas: null,
		colores: null,
		precio: 100,
		costo: 50,
		stock: 10,
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
	console.log('Producto a crear:', producto);
	res = await makeRequest('POST', '/api/productos', producto);
	if (!(res.status === 201 && res.data.success)) return console.error('✗ Error producto:', res.data.message);
	const productoId = res.data.data.id;
	console.log('✓ Producto creado');

	// 3. Consultar producto y verificar que tiene la categoría correcta
	res = await makeRequest('GET', `/api/productos/${productoId}`);
	if (res.status === 200 && res.data.data && res.data.data.categoria_id === categoriaId) {
		console.log('✓ Relación producto-categoría verificada');
	} else {
		console.error('✗ Relación producto-categoría incorrecta');
	}
})();
