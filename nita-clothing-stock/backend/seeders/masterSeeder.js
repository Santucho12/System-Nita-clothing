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
      await this.seedSuppliers();
      await this.seedProducts();
      await this.seedCustomers();
      await this.seedSales();
      await this.seedReservations();
      await this.seedExchangeReturns();

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
      'activity_log', 'exchange_return_items', 'exchanges_returns', 'reservations', 
      'sale_items', 'sales', 'purchase_order_items', 'purchase_orders', 
      'suppliers', 'customers', 'productos', 'categorias', 'usuarios'
    ];
    
    for (const table of tables) {
      try {
        await this.connection.query(`TRUNCATE TABLE ${table}`);
      } catch (error) {
        // Silencioso si la tabla no existe
      }
    }
    
    await this.connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Base de datos limpia\n');
  }

  async seedUsers() {
    console.log('👥 Creando usuarios...');
    
    const password = await bcrypt.hash('admin123', 10);
    
    const users = [
      { nombre: 'Administrador', email: 'admin@nitaclothing.com', password, rol: 'admin' },
      { nombre: 'Vendedor 1', email: 'vendedor1@nitaclothing.com', password, rol: 'vendedor' },
      { nombre: 'Supervisor', email: 'supervisor@nitaclothing.com', password, rol: 'supervisor' }
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
      { nombre: 'Remeras', descripcion: 'Remeras, tops y musculosas' },
      { nombre: 'Pantalones', descripcion: 'Jeans, calzas y shorts' },
      { nombre: 'Vestidos', descripcion: 'Vestidos casuales y de fiesta' },
      { nombre: 'Abrigos', descripcion: 'Buzos, camperas y saquitos' },
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

  async seedSuppliers() {
    console.log('🏭 Creando proveedores...');
    
    const suppliers = [
      { name: 'Nita Mayorista', contact_name: 'Ana', email: 'mayorista@nita.com', phone: '1122334455' },
      { name: 'Textil Flores', contact_name: 'Juan', email: 'flores@textil.com', phone: '1199887766' }
    ];

    for (const s of suppliers) {
      await this.connection.query(
        'INSERT INTO suppliers (name, contact_name, email, phone) VALUES (?, ?, ?, ?)',
        [s.name, s.contact_name, s.email, s.phone]
      );
    }
    console.log('✓ Proveedores creados');
  }

  async seedProducts() {
    console.log('👚 Creando productos con SKUs correlativos...');
    
    const products = [
      { nombre: 'Crop Top Infinito', categoria_id: 1, costo: 25000, precio: 45000, stock: 15, stock_minimo: 5, tallas: 'S, M, L', colores: 'Negro, Blanco', image: '/uploads/products/crop-top.jpg' },
      { nombre: 'Remera Basic Nita', categoria_id: 1, costo: 12000, precio: 22000, stock: 30, stock_minimo: 10, tallas: '1, 2, 3', colores: 'Gris, Beige', image: '/uploads/products/remera-basic.jpg' },
      { nombre: 'Jean Mom Blue', categoria_id: 2, costo: 35000, precio: 68000, stock: 12, stock_minimo: 3, tallas: '36, 38, 40', colores: 'Azul', image: '/uploads/products/jean-mom.jpg' },
      { nombre: 'Vestido Gala Night', categoria_id: 3, costo: 45000, precio: 95000, stock: 8, stock_minimo: 2, tallas: 'M, L', colores: 'Rojo, Negro', image: '/uploads/products/vestido.jpg' },
      { nombre: 'Buzo Oversize Hoodie', categoria_id: 4, costo: 28000, precio: 52000, stock: 20, stock_minimo: 5, tallas: 'Talle Único', colores: 'Verde, Lila', image: '/uploads/products/buzo.jpg' },
      { nombre: 'Short de Lino', categoria_id: 2, costo: 15000, precio: 32000, stock: 25, stock_minimo: 5, tallas: 'S, M', colores: 'Crudo', image: '/uploads/products/short.jpg' },
      { nombre: 'Campera Puffer Black', categoria_id: 4, costo: 55000, precio: 110000, stock: 5, stock_minimo: 2, tallas: 'M, L', colores: 'Negro', image: '/uploads/products/puffer.jpg' },
      { nombre: 'Cinto Nita Cuero', categoria_id: 5, costo: 8000, precio: 18000, stock: 50, stock_minimo: 10, tallas: 'Único', colores: 'Marrón, Negro', image: '/uploads/products/cinto.jpg' }
    ];

    let skuCounter = 1;
    for (const p of products) {
      const images = p.image ? JSON.stringify([p.image]) : '[]';
      await this.connection.query(
        `INSERT INTO productos (nombre, codigo, categoria_id, costo, precio, stock, stock_minimo, tallas, colores, imagen_url, supplier_id, estado) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'activo')`,
        [p.nombre, String(skuCounter++), p.categoria_id, p.costo, p.precio, p.stock, p.stock_minimo, p.tallas, p.colores, images]
      );
    }
    
    console.log(`✓ ${products.length} productos creados con SKUs correlativos`);
  }

  async seedCustomers() {
    console.log('👤 Creando clientes...');
    
    const customers = [
      { name: 'María Gómez', email: 'maria@gmail.com', phone: '1122334455' },
      { name: 'Carla Rodríguez', email: 'carla@hotmail.com', phone: '1155667788' }
    ];

    for (const c of customers) {
      await this.connection.query(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [c.name, c.email, c.phone]
      );
    }
    console.log('✓ Clientes creados');
  }

  async seedSales() {
    console.log('💰 Creando ventas históricas...');
    
    // Crear ventas de los últimos 30 días
    for (let i = 1; i <= 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const [result] = await this.connection.query(
            'INSERT INTO sales (sale_number, customer_name, customer_email, total, subtotal, payment_method, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [`V-${1000 + i}`, 'María Gómez', 'maria@gmail.com', 45000, 45000, 'efectivo', 'completed', date]
        );

        await this.connection.query(
            'INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
            [result.insertId, 1, 'Crop Top Infinito', 1, 45000, 45000]
        );
    }
    console.log('✓ Ventas creadas');
  }

  async seedReservations() {
    console.log('📌 Creando reservas...');
    await this.connection.query(
        'INSERT INTO reservations (customer_name, customer_email, product_id, quantity, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
        ['Carla Rodríguez', 'carla@hotmail.com', 3, 1, 'pending', 'Retira el sábado']
    );
    console.log('✓ Reservas creadas');
  }

  async seedExchangeReturns() {
    console.log('🔄 Creando cambios...');
    const [result] = await this.connection.query(
        'INSERT INTO exchanges_returns (type, original_sale_id, customer_name, status, notes) VALUES (?, ?, ?, ?, ?)',
        ['exchange', 1, 'María Gómez', 'completed', 'Cambio por talle']
    );

    await this.connection.query(
        'INSERT INTO exchange_return_items (exchange_return_id, product_id, quantity, reason) VALUES (?, ?, ?, ?)',
        [result.insertId, 1, 1, 'talla_incorrecta']
    );
    console.log('✓ Cambios creados');
  }

  async showSummary() {
    console.log('\n📊 RESUMEN DE DATOS CREADOS:');
    const tables = ['usuarios', 'categorias', 'productos', 'customers', 'sales', 'reservations'];
    for (const table of tables) {
        const [result] = await this.connection.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${result[0].count}`);
    }
  }
}

// Ejecutar seeder
const seeder = new MasterSeeder();
seeder.run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
