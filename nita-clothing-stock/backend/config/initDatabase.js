const database = require('./database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    try {
        console.log('🚀 Inicializando base de datos MySQL...');
        await database.connect();

        // Crear tablas si no existen
        const createCategoriesTable = `
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await database.run(createCategoriesTable);

        const createProductsTable = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                color VARCHAR(50) NOT NULL,
                quantity INT NOT NULL DEFAULT 0,
                photo_url TEXT,
                category_id INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
            )
        `;
        await database.run(createProductsTable);

        const createSalesTable = `
            CREATE TABLE IF NOT EXISTS sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                quantity INT NOT NULL,
                price_per_unit DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                customer_name VARCHAR(255),
                payment_method VARCHAR(50) DEFAULT 'efectivo',
                sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
            )
        `;
        await database.run(createSalesTable);

        console.log('✅ Base de datos MySQL inicializada correctamente.');
    } catch (error) {
        console.error('❌ Error inicializando la base de datos MySQL:', error.message);
    }
}

module.exports = initDatabase;
