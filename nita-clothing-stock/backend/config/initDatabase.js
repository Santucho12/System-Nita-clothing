const database = require('./database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
    try {
        console.log('🚀 Inicializando base de datos MySQL...');
        await database.connect();

        // ========== TABLA DE USUARIOS ==========
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                rol ENUM('admin', 'supervisor', 'vendedor') DEFAULT 'vendedor',
                activo BOOLEAN DEFAULT TRUE,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await database.run(createUsersTable);

        // ========== TABLA DE CATEGORÍAS ==========
        const createCategoriesTable = `
            CREATE TABLE IF NOT EXISTS categorias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL UNIQUE,
                descripcion TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await database.run(createCategoriesTable);

        // ========== TABLA DE PRODUCTOS ==========
        const createProductsTable = `
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(200) NOT NULL,
                descripcion TEXT,
                codigo VARCHAR(100) UNIQUE,
                categoria_id INT,
                precio DECIMAL(10,2) NOT NULL DEFAULT 0,
                costo DECIMAL(10,2) DEFAULT 0,
                stock INT NOT NULL DEFAULT 0,
                stock_minimo INT DEFAULT 0,
                tallas VARCHAR(255),
                colores VARCHAR(255),
                proveedor VARCHAR(255),
                ubicacion VARCHAR(255),
                estado ENUM('activo', 'inactivo', 'descontinuado') DEFAULT 'activo',
                fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
                imagen_url TEXT,
                notas TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
            )
        `;
        await database.run(createProductsTable);

        // ========== TABLA DE VENTAS ==========
        const createSalesTable = `
            CREATE TABLE IF NOT EXISTS sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(255),
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                payment_method ENUM('efectivo', 'tarjeta', 'transferencia', 'otro') DEFAULT 'efectivo',
                subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
                discount_type ENUM('percentage', 'amount') DEFAULT 'amount',
                discount_value DECIMAL(10,2) DEFAULT 0,
                discount_amount DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) NOT NULL DEFAULT 0,
                total_cost DECIMAL(10,2) DEFAULT 0,
                total_profit DECIMAL(10,2) DEFAULT 0,
                status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
                notes TEXT,
                user_id INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
                INDEX idx_created_at (created_at),
                INDEX idx_customer_email (customer_email),
                INDEX idx_status (status)
            )
        `;
        await database.run(createSalesTable);

        // ========== TABLA DE ITEMS DE VENTA ==========
        const createSaleItemsTable = `
            CREATE TABLE IF NOT EXISTS sale_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sale_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(200) NOT NULL,
                product_code VARCHAR(100),
                size VARCHAR(50),
                color VARCHAR(50),
                quantity INT NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                unit_cost DECIMAL(10,2) DEFAULT 0,
                subtotal DECIMAL(10,2) NOT NULL,
                profit DECIMAL(10,2) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE RESTRICT,
                INDEX idx_sale_id (sale_id),
                INDEX idx_product_id (product_id)
            )
        `;
        await database.run(createSaleItemsTable);

        // ========== TABLA DE CLIENTES ==========
        const createCustomersTable = `
            CREATE TABLE IF NOT EXISTS customers (
                email VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                postal_code VARCHAR(20),
                notes TEXT,
                segment ENUM('frequent', 'occasional', 'new', 'inactive') DEFAULT 'new',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_segment (segment),
                INDEX idx_name (name)
            )
        `;
        await database.run(createCustomersTable);

        // ========== TABLA DE RESERVAS ==========
        const createReservationsTable = `
            CREATE TABLE IF NOT EXISTS reservations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                product_id INT NOT NULL,
                product_name VARCHAR(200),
                quantity INT NOT NULL,
                reservation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                expiration_date DATETIME,
                status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'expired') DEFAULT 'pending',
                notes TEXT,
                confirmed_by INT,
                confirmed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE RESTRICT,
                FOREIGN KEY (confirmed_by) REFERENCES usuarios(id) ON DELETE SET NULL,
                INDEX idx_status (status),
                INDEX idx_customer_email (customer_email),
                INDEX idx_expiration_date (expiration_date)
            )
        `;
        await database.run(createReservationsTable);

        // ========== TABLA DE CAMBIOS Y DEVOLUCIONES ==========
        const createExchangeReturnsTable = `
            CREATE TABLE IF NOT EXISTS exchanges_returns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('exchange', 'return') NOT NULL,
                original_sale_id INT NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255),
                customer_phone VARCHAR(50),
                status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
                refund_amount DECIMAL(10,2) DEFAULT 0,
                refund_method ENUM('efectivo', 'tarjeta', 'transferencia', 'credito_tienda') DEFAULT 'efectivo',
                notes TEXT,
                approval_notes TEXT,
                processed_by INT,
                processed_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (original_sale_id) REFERENCES sales(id) ON DELETE RESTRICT,
                FOREIGN KEY (processed_by) REFERENCES usuarios(id) ON DELETE SET NULL,
                INDEX idx_status (status),
                INDEX idx_type (type),
                INDEX idx_original_sale (original_sale_id),
                INDEX idx_customer_email (customer_email)
            )
        `;
        await database.run(createExchangeReturnsTable);

        // ========== TABLA DE ITEMS DE CAMBIO/DEVOLUCIÓN ==========
        const createExchangeReturnItemsTable = `
            CREATE TABLE IF NOT EXISTS exchange_return_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                exchange_return_id INT NOT NULL,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                reason ENUM('defecto', 'talla_incorrecta', 'color_incorrecto', 'no_satisfecho', 'otro') NOT NULL,
                reason_notes TEXT,
                new_product_id INT,
                new_quantity INT DEFAULT 0,
                unit_price DECIMAL(10,2) DEFAULT 0,
                subtotal DECIMAL(10,2) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (exchange_return_id) REFERENCES exchanges_returns(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE RESTRICT,
                FOREIGN KEY (new_product_id) REFERENCES productos(id) ON DELETE RESTRICT,
                INDEX idx_exchange_return (exchange_return_id),
                INDEX idx_product (product_id),
                INDEX idx_reason (reason)
            )
        `;
        await database.run(createExchangeReturnItemsTable);

        // ========== TABLA DE PROVEEDORES ==========
        const createSuppliersTable = `
            CREATE TABLE IF NOT EXISTS suppliers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                phone VARCHAR(50),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                postal_code VARCHAR(20),
                country VARCHAR(100),
                website VARCHAR(255),
                tax_id VARCHAR(100) UNIQUE,
                payment_terms ENUM('net_15', 'net_30', 'net_45', 'net_60', 'immediate', 'other') DEFAULT 'net_30',
                notes TEXT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_name (name)
            )
        `;
        await database.run(createSuppliersTable);

        // ========== TABLA DE ÓRDENES DE COMPRA ==========
        const createPurchaseOrdersTable = `
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                supplier_id INT NOT NULL,
                order_date DATE NOT NULL,
                expected_delivery_date DATE,
                received_date DATE,
                subtotal DECIMAL(10,2) DEFAULT 0,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                shipping_cost DECIMAL(10,2) DEFAULT 0,
                total_amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'confirmed', 'shipped', 'received', 'cancelled') DEFAULT 'pending',
                payment_status ENUM('pending', 'partial', 'paid', 'overdue') DEFAULT 'pending',
                payment_method ENUM('efectivo', 'transferencia', 'cheque', 'credito', 'otro') DEFAULT 'transferencia',
                payment_date DATE,
                notes TEXT,
                created_by INT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
                FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
                INDEX idx_status (status),
                INDEX idx_payment_status (payment_status),
                INDEX idx_supplier (supplier_id),
                INDEX idx_order_date (order_date)
            )
        `;
        await database.run(createPurchaseOrdersTable);

        // ========== TABLA DE ITEMS DE ORDEN DE COMPRA ==========
        const createPurchaseOrderItemsTable = `
            CREATE TABLE IF NOT EXISTS purchase_order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                purchase_order_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(200) NOT NULL,
                quantity INT NOT NULL,
                unit_cost DECIMAL(10,2) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES productos(id) ON DELETE RESTRICT,
                INDEX idx_purchase_order (purchase_order_id),
                INDEX idx_product (product_id)
            )
        `;
        await database.run(createPurchaseOrderItemsTable);

        // Agregar campo supplier_id a productos si no existe
        try {
            await database.run(
                'ALTER TABLE productos ADD COLUMN supplier_id INT DEFAULT NULL, ADD FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL'
            );
        } catch (error) {
            // La columna ya existe, ignorar error
        }

        console.log('✅ Todas las tablas creadas correctamente.');

        // ======= BLOQUE ACTIVADO: Creación automática de usuario admin =======
        const adminExists = await database.get('SELECT id FROM usuarios WHERE email = ?', ['admin@nitaclothing.com']);
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await database.run(
                'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)',
                ['Administrador', 'admin@nitaclothing.com', hashedPassword, 'admin', true]
            );
            console.log('✅ Usuario admin creado: admin@nitaclothing.com / admin123');
        }
        // ======= FIN BLOQUE ACTIVADO =======

        console.log('✅ Base de datos MySQL inicializada correctamente.');
    } catch (error) {
        console.error('❌ Error inicializando la base de datos MySQL:', error.message);
        throw error;
    }
}

module.exports = initDatabase;
