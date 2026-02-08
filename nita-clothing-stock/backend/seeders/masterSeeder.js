const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const mysqlConfig = require('../config/mysqlConfig');

class MasterSeeder {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (!this.connection) {
      this.connection = await mysql.createConnection(mysqlConfig);
    }
    return this.connection;
  }

  async run() {
    console.log('🌱 Iniciando seeder maestro...\n');

    try {
      await this.connect();
      
      // Limpiar tablas en orden correcto (respetando foreign keys)
      await this.cleanDatabase();
      
      // Ejecutar seeders en orden
      await this.seedUsers();
      await this.seedCategories();
      await this.seedProducts();
      await this.seedProductImages();
      await this.seedCustomers();
      await this.seedSuppliers();
      await this.seedPurchaseOrders();
      await this.seedSales();
      await this.seedReservations();
      await this.seedExchangeReturns();
      await this.seedPromotions();
      await this.seedActivityLogs();

      console.log('\n✅ Seeder completado exitosamente!');
      console.log('📊 Base de datos lista para usar');
      
      await this.showSummary();
      
      await this.connection.end();
      
    } catch (error) {
      console.error('❌ Error en seeder:', error);
      if (this.connection) {
        await this.connection.end();
      }
      throw error;
    }
  }

  async cleanDatabase() {
    console.log('🧹 Limpiando base de datos...');
    
    await this.connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    const tables = [
      'activity_log', 'promotion_products', 'promotion_categories', 'promotions',
      'exchange_return_items', 'exchanges_returns', 'reservations', 'sale_items', 'sales',
      'purchase_order_items', 'purchase_orders', 'suppliers',
      'customers', 'product_images', 'productos', 'categorias', 'usuarios'
    ];
    
    for (const table of tables) {
      try {
        await this.connection.query(`TRUNCATE TABLE ${table}`);
      } catch (error) {
        console.log(`  ⚠️ Tabla ${table} no existe, continuando...`);
      }
    }
    
    await this.connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Base de datos limpia\n');
  }

  async seedUsers() {
    console.log('👥 Creando usuarios...');
    
    const password = await bcrypt.hash('123456', 10);
    
    const users = [
      { nombre: 'admin', email: 'admin@nita.com', password, rol: 'admin' },
      { nombre: 'vendedor1', email: 'vendedor1@nita.com', password, rol: 'vendedor' },
      { nombre: 'vendedor2', email: 'vendedor2@nita.com', password, rol: 'vendedor' },
      { nombre: 'supervisor', email: 'supervisor@nita.com', password, rol: 'supervisor' }
    ];

    for (const user of users) {
      await this.connection.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
        [user.nombre, user.email, user.password, user.rol]
      );
    }
    
    console.log(`✓ ${users.length} usuarios creados`);
  }

  async seedCategories() {
    console.log('🏷️  Creando categorías...');
    
    const categories = [
      { nombre: 'Remeras', descripcion: 'Remeras y camisetas de todo tipo' },
      { nombre: 'Pantalones', descripcion: 'Pantalones, jeans y calzas' },
      { nombre: 'Vestidos', descripcion: 'Vestidos casuales y de fiesta' },
      { nombre: 'Buzos', descripcion: 'Buzos y sudaderas' },
      { nombre: 'Camperas', descripcion: 'Camperas y abrigos' },
      { nombre: 'Faldas', descripcion: 'Faldas largas y cortas' },
      { nombre: 'Shorts', descripcion: 'Shorts y bermudas' },
      { nombre: 'Accesorios', descripcion: 'Carteras, cinturones y más' }
    ];

    for (const cat of categories) {
      await this.connection.query(
        'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
        [cat.nombre, cat.descripcion]
      );
    }
    
    console.log(`✓ ${categories.length} categorías creadas`);
  }

  async seedProducts() {
    console.log('👚 Creando productos...');
    
    const products = [
      // Remeras (categoría 1)
      { nombre: 'Remera Básica Blanca', codigo: 'REM-001', categoria_id: 1, costo: 2500, precio: 5000, stock: 45, stock_minimo: 10, tallas: '2', colores: 'Blanco' },
      { nombre: 'Remera Básica Negra', codigo: 'REM-002', categoria_id: 1, costo: 2500, precio: 5000, stock: 38, stock_minimo: 10, tallas: '2', colores: 'Negro' },
      { nombre: 'Remera Estampada Flores', codigo: 'REM-003', categoria_id: 1, costo: 3000, precio: 6500, stock: 25, stock_minimo: 8, tallas: '3', colores: 'Multicolores' },
      { nombre: 'Remera Overtallas Gris', codigo: 'REM-004', categoria_id: 1, costo: 3500, precio: 7000, stock: 30, stock_minimo: 10, tallas: '3', colores: 'Gris' },
      { nombre: 'Remera Crop Top', codigo: 'REM-005', categoria_id: 1, costo: 2800, precio: 6000, stock: 20, stock_minimo: 8, tallas: '1', colores: 'Rosa' },
      
      // Pantalones (categoría 2)
      { nombre: 'Jean Mom Fit Azul', codigo: 'PAN-001', categoria_id: 2, costo: 8000, precio: 15000, stock: 15, stock_minimo: 5, tallas: '1', colores: 'Azul' },
      { nombre: 'Jean Skinny Negro', codigo: 'PAN-002', categoria_id: 2, costo: 7500, precio: 14000, stock: 18, stock_minimo: 5, tallas: '2', colores: 'Negro' },
      { nombre: 'Pantalón Jogger Beige', codigo: 'PAN-003', categoria_id: 2, costo: 6000, precio: 12000, stock: 22, stock_minimo: 8, tallas: '2', colores: 'Beige' },
      { nombre: 'Jean Wide Leg', codigo: 'PAN-004', categoria_id: 2, costo: 9000, precio: 17000, stock: 12, stock_minimo: 5, tallas: '3', colores: 'Celeste' },
      { nombre: 'Calza Deportiva', codigo: 'PAN-005', categoria_id: 2, costo: 4000, precio: 8000, stock: 35, stock_minimo: 10, tallas: 'Talle único', colores: 'Negro' },
      
      // Vestidos (categoría 3)
      { nombre: 'Vestido Largo Floreado', codigo: 'VES-001', categoria_id: 3, costo: 10000, precio: 22000, stock: 8, stock_minimo: 3, tallas: '2', colores: 'Multicolores' },
      { nombre: 'Vestido Midi Liso', codigo: 'VES-002', categoria_id: 3, costo: 8500, precio: 18000, stock: 10, stock_minimo: 4, tallas: '1', colores: 'Verde' },
      { nombre: 'Vestido Corto Noche', codigo: 'VES-003', categoria_id: 3, costo: 12000, precio: 25000, stock: 6, stock_minimo: 2, tallas: '2', colores: 'Negro' },
      { nombre: 'Vestido Casual Rayas', codigo: 'VES-004', categoria_id: 3, costo: 7000, precio: 15000, stock: 12, stock_minimo: 4, tallas: '3', colores: 'Azul/Blanco' },
      
      // Buzos (categoría 4)
      { nombre: 'Buzo Canguro Overtallas', codigo: 'BUZ-001', categoria_id: 4, costo: 7000, precio: 14000, stock: 20, stock_minimo: 8, tallas: '3', colores: 'Gris' },
      { nombre: 'Buzo Básico Negro', codigo: 'BUZ-002', categoria_id: 4, costo: 6000, precio: 12000, stock: 25, stock_minimo: 10, tallas: '2', colores: 'Negro' },
      { nombre: 'Buzo Estampado', codigo: 'BUZ-003', categoria_id: 4, costo: 7500, precio: 15000, stock: 15, stock_minimo: 6, tallas: '3', colores: 'Beige' },
      
      // Camperas (categoría 5)
      { nombre: 'Campera Jean Clásica', codigo: 'CAM-001', categoria_id: 5, costo: 12000, precio: 25000, stock: 10, stock_minimo: 4, tallas: '2', colores: 'Azul' },
      { nombre: 'Campera Cuero Ecológico', codigo: 'CAM-002', categoria_id: 5, costo: 15000, precio: 32000, stock: 7, stock_minimo: 3, tallas: '3', colores: 'Negro' },
      { nombre: 'Campera Inflable', codigo: 'CAM-003', categoria_id: 5, costo: 10000, precio: 22000, stock: 12, stock_minimo: 5, tallas: '2', colores: 'Rosa' },
      { nombre: 'Campera Bomber', codigo: 'CAM-004', categoria_id: 5, costo: 11000, precio: 24000, stock: 8, stock_minimo: 3, tallas: '1', colores: 'Verde' },
      
      // Faldas (categoría 6)
      { nombre: 'Falda Midi Plisada', codigo: 'FAL-001', categoria_id: 6, costo: 5000, precio: 11000, stock: 14, stock_minimo: 5, tallas: '2', colores: 'Negro' },
      { nombre: 'Falda Mini Jean', codigo: 'FAL-002', categoria_id: 6, costo: 4500, precio: 9500, stock: 18, stock_minimo: 6, tallas: '1', colores: 'Azul' },
      { nombre: 'Falda Larga Bohemia', codigo: 'FAL-003', categoria_id: 6, costo: 6000, precio: 13000, stock: 10, stock_minimo: 4, tallas: '3', colores: 'Floreado' },
      
      // Shorts (categoría 7)
      { nombre: 'Short Jean Roturas', codigo: 'SHO-001', categoria_id: 7, costo: 4000, precio: 8500, stock: 22, stock_minimo: 8, tallas: '1', colores: 'Azul' },
      { nombre: 'Short Deportivo', codigo: 'SHO-002', categoria_id: 7, costo: 3000, precio: 6500, stock: 28, stock_minimo: 10, tallas: '2', colores: 'Negro' },
      { nombre: 'Short Cargo', codigo: 'SHO-003', categoria_id: 7, costo: 4500, precio: 9000, stock: 15, stock_minimo: 6, tallas: '3', colores: 'Beige' },
      
      // Accesorios (categoría 8)
      { nombre: 'Cartera Bandolera', codigo: 'ACC-001', categoria_id: 8, costo: 6000, precio: 13000, stock: 12, stock_minimo: 4, tallas: 'Talle único', colores: 'Negro' },
      { nombre: 'Cinturón Cuero', codigo: 'ACC-002', categoria_id: 8, costo: 2500, precio: 5500, stock: 20, stock_minimo: 8, tallas: 'Talle único', colores: 'Marrón' },
      { nombre: 'Gorro Beanie', codigo: 'ACC-003', categoria_id: 8, costo: 1500, precio: 3500, stock: 30, stock_minimo: 10, tallas: 'Talle único', colores: 'Negro' },
      { nombre: 'Bufanda Tejida', codigo: 'ACC-004', categoria_id: 8, costo: 2000, precio: 4500, stock: 25, stock_minimo: 8, tallas: 'Talle único', colores: 'Gris' }
    ];

    for (const product of products) {
      await this.connection.query(
        `INSERT INTO productos (nombre, codigo, categoria_id, costo, precio, stock, stock_minimo, tallas, colores, descripcion) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.nombre, product.codigo, product.categoria_id, product.costo, 
          product.precio, product.stock, product.stock_minimo, product.tallas, 
          product.colores, `${product.nombre} - tallas ${product.tallas} - colores ${product.colores}`
        ]
      );
    }
    
    console.log(`✓ ${products.length} productos creados`);
  }

  async seedProductImages() {
    console.log('📸 Creando imágenes de productos...');
    
    // Simular 3-4 imágenes por algunos productos
    const imageData = [
      { product_id: 1, url: '/uploads/products/rem-001-1.jpg', is_primary: 1, order_num: 1 },
      { product_id: 1, url: '/uploads/products/rem-001-2.jpg', is_primary: 0, order_num: 2 },
      { product_id: 6, url: '/uploads/products/pan-001-1.jpg', is_primary: 1, order_num: 1 },
      { product_id: 6, url: '/uploads/products/pan-001-2.jpg', is_primary: 0, order_num: 2 },
      { product_id: 11, url: '/uploads/products/ves-001-1.jpg', is_primary: 1, order_num: 1 },
      { product_id: 18, url: '/uploads/products/cam-001-1.jpg', is_primary: 1, order_num: 1 }
    ];

    for (const img of imageData) {
      await this.connection.query(
        'INSERT INTO product_images (product_id, url, is_primary, order_num, uploaded_by) VALUES (?, ?, ?, ?, ?)',
        [img.product_id, img.url, img.is_primary, img.order_num, 1]
      );
    }
    
    console.log(`✓ ${imageData.length} imágenes de productos creadas`);
  }

  async seedCustomers() {
    console.log('👤 Creando clientes...');
    
    const customers = [
      { name: 'María González', email: 'maria.gonzalez@email.com', phone: '1145678901', address: 'Av. Corrientes 1234, CABA' },
      { name: 'Lucía Fernández', email: 'lucia.f@email.com', phone: '1156789012', address: 'Av. Santa Fe 5678, CABA' },
      { name: 'Sofía Martínez', email: 'sofia.m@email.com', phone: '1167890123', address: 'Av. Cabildo 2345, CABA' },
      { name: 'Valentina Rodríguez', email: 'vale.rod@email.com', phone: '1178901234', address: 'Av. Rivadavia 3456, CABA' },
      { name: 'Camila López', email: 'cami.lopez@email.com', phone: '1189012345', address: 'Av. Las Heras 4567, CABA' },
      { name: 'Martina Pérez', email: 'martina.p@email.com', phone: '1190123456', address: 'Av. Callao 5678, CABA' },
      { name: 'Isabella García', email: 'isa.garcia@email.com', phone: '1101234567', address: 'Av. Belgrano 6789, CABA' },
      { name: 'Emma Sánchez', email: 'emma.s@email.com', phone: '1112345678', address: 'Av. Córdoba 7890, CABA' },
      { name: 'Mía Romero', email: 'mia.romero@email.com', phone: '1123456789', address: 'Av. Pueyrredón 8901, CABA' },
      { name: 'Olivia Torres', email: 'oli.torres@email.com', phone: '1134567890', address: 'Av. Libertador 9012, CABA' }
    ];

    for (const customer of customers) {
      await this.connection.query(
        'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
        [customer.name, customer.email, customer.phone, customer.address]
      );
    }

    console.log(`✓ ${customers.length} clientes creados`);
  }

  async seedSuppliers() {
    console.log('🏭 Creando proveedores...');
    
    const suppliers = [
      { name: 'Textil Sur SA', contact_name: 'Roberto Díaz', phone: '1145001100', email: 'ventas@textilsur.com', address: 'Parque Industrial Sur' },
      { name: 'Moda Wholesale', contact_name: 'Laura Benítez', phone: '1145002200', email: 'info@modawholesale.com', address: 'Once, CABA' },
      { name: 'Confecciones del Norte', contact_name: 'Carlos Ruiz', phone: '1145003300', email: 'pedidos@confnorte.com', address: 'Tucumán' },
      { name: 'Importadora Fashion', contact_name: 'Ana Silva', phone: '1145004400', email: 'importaciones@fashion.com', address: 'Flores, CABA' }
    ];

    for (const supplier of suppliers) {
      await this.connection.query(
        'INSERT INTO suppliers (name, contact_name, phone, email, address) VALUES (?, ?, ?, ?, ?)',
        [supplier.name, supplier.contact_name, supplier.phone, supplier.email, supplier.address]
      );
    }

    console.log(`✓ ${suppliers.length} proveedores creados`);
  }

  async seedPurchaseOrders() {
    console.log('📦 Creando órdenes de compra...');
    
    const orders = [
      { supplier_id: 1, created_by: 1, status: 'received', total_amount: 150000, received_date: '2025-12-15' },
      { supplier_id: 2, created_by: 1, status: 'received', total_amount: 220000, received_date: '2025-12-20' },
      { supplier_id: 3, created_by: 1, status: 'pending', total_amount: 180000, received_date: null },
      { supplier_id: 1, created_by: 1, status: 'received', total_amount: 95000, received_date: '2026-01-05' },
      { supplier_id: 4, created_by: 1, status: 'pending', total_amount: 120000, received_date: null }
    ];

    for (const order of orders) {
      // Usar received_date como order_date si existe, si no usar una fecha fija
      const order_date = order.received_date || '2026-01-01';
      const [result] = await this.connection.query(
        'INSERT INTO purchase_orders (supplier_id, created_by, status, total_amount, received_date, order_date) VALUES (?, ?, ?, ?, ?, ?)',
        [order.supplier_id, order.created_by, order.status, order.total_amount, order.received_date, order_date]
      );
      
      // Agregar items a las órdenes
      const items = [
        { product_id: 1, quantity: 20, unit_price: 2500 },
        { product_id: 2, quantity: 15, unit_price: 2500 },
        { product_id: 6, quantity: 10, unit_price: 8000 }
      ];
      
      for (const item of items) {
        // Get product name from productos table
        const [prodRows] = await this.connection.query('SELECT nombre FROM productos WHERE id = ?', [item.product_id]);
        const product_name = prodRows.length > 0 ? prodRows[0].nombre : '';
        await this.connection.query(
          'INSERT INTO purchase_order_items (purchase_order_id, product_id, product_name, quantity, unit_cost, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
          [result.insertId, item.product_id, product_name, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
    }
    
    console.log(`✓ ${orders.length} órdenes de compra creadas`);
  }

  async seedSales() {
    console.log('💰 Creando ventas (esto puede tardar un poco)...');
    
    // Generar ventas de los últimos 90 días para tener buenos gráficos
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    let salesCount = 0;
    const paymentMethods = ['efectivo', 'tarjeta', 'transferencia'];
    
    // Generar entre 3-12 ventas por día
    for (let day = 0; day < 90; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);
      
      // Más ventas en fines de semana
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const salesPerDay = isWeekend ? Math.floor(Math.random() * 8) + 8 : Math.floor(Math.random() * 6) + 4;
      
      for (let sale = 0; sale < salesPerDay; sale++) {
        // Pick a random customer email
        const customerEmails = [
          'maria.gonzalez@email.com', 'lucia.f@email.com', 'sofia.m@email.com', 'vale.rod@email.com',
          'cami.lopez@email.com', 'martina.p@email.com', 'isa.garcia@email.com', 'emma.s@email.com',
          'mia.romero@email.com', 'oli.torres@email.com'
        ];
        const customerEmail = customerEmails[Math.floor(Math.random() * customerEmails.length)];
        const userId = Math.floor(Math.random() * 2) + 2; // vendedor1 o vendedor2
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // Seleccionar 1-4 productos aleatorios
        const numProducts = Math.floor(Math.random() * 4) + 1;
        const selectedProducts = [];
        let subtotal = 0;
        
        for (let i = 0; i < numProducts; i++) {
          const productId = Math.floor(Math.random() * 31) + 1;
          const quantity = Math.floor(Math.random() * 3) + 1;
          
          // Obtener precio del producto
          const [product] = await this.connection.query('SELECT precio FROM productos WHERE id = ?', [productId]);
          if (product.length > 0) {
            const unitPrice = product[0].precio;
            subtotal += unitPrice * quantity;
            selectedProducts.push({ productId, quantity, unitPrice });
          }
        }
        
        if (selectedProducts.length > 0) {
          // Crear venta
          const discount = Math.random() < 0.3 ? Math.floor(Math.random() * 1000) + 500 : 0; // 30% tienen descuento
          const total = subtotal - discount;
          
          // Agregar horas aleatorias (horario comercial 9-20hs)
          const hour = Math.floor(Math.random() * 11) + 9;
          const minute = Math.floor(Math.random() * 60);
          currentDate.setHours(hour, minute, 0, 0);
          
          // Get customer info
          const [custRows] = await this.connection.query('SELECT name, email, phone FROM customers WHERE email = ?', [customerEmail]);
          const customer_name = custRows.length > 0 ? custRows[0].name : '';
          const customer_email = custRows.length > 0 ? custRows[0].email : '';
          const customer_phone = custRows.length > 0 ? custRows[0].phone : '';
          const [saleResult] = await this.connection.query(
            `INSERT INTO sales (customer_name, customer_email, customer_phone, user_id, subtotal, total, payment_method, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
            [customer_name, customer_email, customer_phone, userId, subtotal, total, paymentMethod, currentDate]
          );
          
          // Crear items de venta
          for (const item of selectedProducts) {
            // Get product name from productos table
            const [prodRows] = await this.connection.query('SELECT nombre FROM productos WHERE id = ?', [item.productId]);
            const product_name = prodRows.length > 0 ? prodRows[0].nombre : '';
            await this.connection.query(
              'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
              [saleResult.insertId, item.productId, product_name, item.quantity, item.unitPrice, item.unitPrice * item.quantity]
            );
          }
          
          salesCount++;
        }
      }
    }
    
    console.log(`✓ ${salesCount} ventas creadas (últimos 90 días)`);
  }

  async seedReservations() {
    console.log('📌 Creando reservas...');
    
    const reservations = [
      { customer_email: 'maria.gonzalez@email.com', product_id: 11, quantity: 1, status: 'pending', reservation_date: '2026-01-15', notes: 'Para fiesta de fin de mes' },
      { customer_email: 'sofia.m@email.com', product_id: 18, quantity: 1, status: 'confirmed', reservation_date: '2026-01-20', notes: 'Llamar antes de entregar' },
      { customer_email: 'cami.lopez@email.com', product_id: 6, quantity: 2, status: 'pending', reservation_date: '2026-01-18', notes: 'Separar tallas 28 y 30' },
      { customer_email: 'isa.garcia@email.com', product_id: 19, quantity: 1, status: 'completed', reservation_date: '2026-01-10', notes: 'Ya retirado' }
    ];

    for (const reservation of reservations) {
      // Get customer info
      const [custRows] = await this.connection.query('SELECT name, email, phone FROM customers WHERE email = ?', [reservation.customer_email]);
      const customer_name = custRows.length > 0 ? custRows[0].name : '';
      const customer_email = custRows.length > 0 ? custRows[0].email : '';
      const customer_phone = custRows.length > 0 ? custRows[0].phone : '';
      await this.connection.query(
        'INSERT INTO reservations (customer_name, customer_email, customer_phone, product_id, quantity, status, reservation_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [customer_name, customer_email, customer_phone, reservation.product_id, reservation.quantity, reservation.status, reservation.reservation_date, reservation.notes]
      );
    }

    console.log(`✓ ${reservations.length} reservas creadas`);
  }

  async seedExchangeReturns() {
    console.log('🔄 Creando cambios y devoluciones...');
    
    const exchanges = [
      { original_sale_id: 1, type: 'exchange', notes: 'tallas incorrecto', status: 'completed' },
      { original_sale_id: 5, type: 'return', notes: 'No le gustó', status: 'completed' },
      { original_sale_id: 10, type: 'exchange', notes: 'colores diferente al esperado', status: 'pending' }
    ];

    for (const exchange of exchanges) {
      // Get customer info from sales
      const [saleRows] = await this.connection.query('SELECT customer_name, customer_email, customer_phone FROM sales WHERE id = ?', [exchange.original_sale_id]);
      const customer_name = saleRows.length > 0 ? saleRows[0].customer_name : '';
      const customer_email = saleRows.length > 0 ? saleRows[0].customer_email : '';
      const customer_phone = saleRows.length > 0 ? saleRows[0].customer_phone : '';
      const [result] = await this.connection.query(
        'INSERT INTO exchanges_returns (original_sale_id, type, customer_name, customer_email, customer_phone, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [exchange.original_sale_id, exchange.type, customer_name, customer_email, customer_phone, exchange.notes, exchange.status]
      );
      
      // Agregar items
      await this.connection.query(
        'INSERT INTO exchange_return_items (exchange_return_id, product_id, quantity, new_product_id) VALUES (?, ?, ?, ?)',
        [result.insertId, 1, 1, exchange.type === 'exchange' ? 3 : null]
      );
    }

    console.log(`✓ ${exchanges.length} cambios/devoluciones creados`);
  }

  async seedPromotions() {
    console.log('🏷️  Creando promociones...');
    
    const promotions = [
      { name: '2x1 en Remeras', description: 'Llevá 2 remeras y pagá 1', type: '2x1', discount_type: 'percentage', discount_value: 50, applies_to: 'category', status: 'activa' },
      { name: '20% OFF Pantalones', description: '20% de descuento en todos los pantalones', type: 'discount', discount_type: 'percentage', discount_value: 20, applies_to: 'category', status: 'activa' },
      { name: 'Camperas -$5000', description: '$5000 de descuento en camperas', type: 'discount', discount_type: 'fixed', discount_value: 5000, applies_to: 'category', status: 'activa' },
      { name: 'Outlet Vestidos', description: '30% OFF en vestidos seleccionados', type: 'discount', discount_type: 'percentage', discount_value: 30, applies_to: 'product', status: 'inactiva' }
    ];

    for (let i = 0; i < promotions.length; i++) {
      const promo = promotions[i];
      const [result] = await this.connection.query(
        `INSERT INTO promotions (name, description, type, discount_type, discount_value, applies_to, status, start_date, end_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))`,
        [promo.name, promo.description, promo.type, promo.discount_type, promo.discount_value, promo.applies_to, promo.status]
      );
      
      // Asociar con categorías/productos
      if (i === 0) { // 2x1 remeras
        await this.connection.query('INSERT INTO promotion_categories (promotion_id, category_id) VALUES (?, ?)', [result.insertId, 1]);
      } else if (i === 1) { // 20% pantalones
        await this.connection.query('INSERT INTO promotion_categories (promotion_id, category_id) VALUES (?, ?)', [result.insertId, 2]);
      } else if (i === 2) { // Camperas
        await this.connection.query('INSERT INTO promotion_categories (promotion_id, category_id) VALUES (?, ?)', [result.insertId, 5]);
      } else if (i === 3) { // Vestidos específicos
        await this.connection.query('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)', [result.insertId, 11]);
        await this.connection.query('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)', [result.insertId, 13]);
      }
    }
    
    console.log(`✓ ${promotions.length} promociones creadas`);
  }

  async seedActivityLogs() {
    console.log('📝 Creando logs de actividad...');
    
    const actions = [
      { user_id: 1, action: 'create', table_name: 'productos', record_id: 1, new_value: 'Producto creado: Remera Básica Blanca' },
      { user_id: 1, action: 'update', table_name: 'productos', record_id: 6, new_value: 'Stock actualizado de 10 a 15 unidades' },
      { user_id: 2, action: 'create', table_name: 'sales', record_id: 1, new_value: 'Venta registrada por $15000' },
      { user_id: 3, action: 'create', table_name: 'sales', record_id: 2, new_value: 'Venta registrada por $8500' },
      { user_id: 1, action: 'receive_order', table_name: 'purchase_orders', record_id: 1, new_value: 'Orden de compra recibida - Stock actualizado' },
      { user_id: 4, action: 'update', table_name: 'customers', record_id: 1, new_value: 'Información de cliente actualizada' }
    ];

    for (const log of actions) {
      await this.connection.query(
        'INSERT INTO activity_log (user_id, action, table_name, record_id, new_value) VALUES (?, ?, ?, ?, ?)',
        [log.user_id, log.action, log.table_name, log.record_id, log.new_value]
      );
    }
    
    console.log(`✓ ${actions.length} logs de actividad creados`);
  }

  async showSummary() {
    console.log('\n📊 RESUMEN DE DATOS CREADOS:\n');
    
    const tables = [
      { nombre: 'Usuarios', table: 'usuarios' },
      { nombre: 'Categorías', table: 'categorias' },
      { nombre: 'Productos', table: 'productos' },
      { nombre: 'Imágenes de Productos', table: 'product_images' },
      { nombre: 'Clientes', table: 'customers' },
      { nombre: 'Proveedores', table: 'suppliers' },
      { nombre: 'Órdenes de Compra', table: 'purchase_orders' },
      { nombre: 'Ventas', table: 'sales' },
      { nombre: 'Items de Venta', table: 'sale_items' },
      { nombre: 'Reservas', table: 'reservations' },
      { nombre: 'Cambios/Devoluciones', table: 'exchanges_returns' },
      { nombre: 'Promociones', table: 'promotions' },
      { nombre: 'Logs de Actividad', table: 'activity_log' }
    ];

    for (const { nombre, table } of tables) {
      const [result] = await this.connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${nombre}: ${result[0].count}`);
    }

    console.log('\n🔐 CREDENCIALES DE ACCESO:');
    console.log('  👤 Admin: admin / 123456');
    console.log('  👤 Vendedor: vendedor1 / 123456');
    console.log('  👤 Supervisor: supervisor / 123456');
    
    console.log('\n📈 DATOS GENERADOS:');
    console.log('  ✓ Ventas de los últimos 90 días');
    console.log('  ✓ Múltiples productos en diferentes categorías');
    console.log('  ✓ Clientes con historial de compras');
    console.log('  ✓ Stock con niveles variados');
    console.log('  ✓ Promociones activas e inactivas');
    console.log('  ✓ Reservas pendientes y completadas');
    console.log('  ✓ Órdenes de compra procesadas y pendientes');
    
    console.log('\n🎯 ¡Ahora puedes ver todos los gráficos y reportes con datos reales!');
  }
}

// Ejecutar seeder
const seeder = new MasterSeeder();
seeder.run()
  .then(() => {
    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
