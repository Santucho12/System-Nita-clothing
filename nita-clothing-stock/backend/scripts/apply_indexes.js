const database = require('../config/database');

async function runFixes() {
    try {
        console.log('Aplicando índices de rendimiento...');

        const queries = [
            'ALTER TABLE sales ADD INDEX idx_sales_customer_email (customer_email)',
            'ALTER TABLE sales ADD INDEX idx_sales_status (status)',
            'ALTER TABLE sales ADD INDEX idx_sales_created_at (created_at)',
            'ALTER TABLE sale_items ADD INDEX idx_venta_items_product_id (product_id)',
            'ALTER TABLE sale_items ADD INDEX idx_venta_items_sale_id (sale_id)',
            'ALTER TABLE productos ADD INDEX idx_productos_codigo (codigo)',
            'ALTER TABLE productos ADD INDEX idx_productos_categoria (categoria_id)',
            'ALTER TABLE productos ADD INDEX idx_productos_estado (estado)',
            'ALTER TABLE clientes ADD INDEX idx_clientes_email (email)',
            'ALTER TABLE clientes ADD INDEX idx_clientes_phone (phone)'
        ];

        for (const sql of queries) {
            try {
                await database.run(sql);
                console.log(`Ejecutado: ${sql.substring(0, 50)}...`);
            } catch (err) {
                // Si ya existe el índice, MySQL lanzará error en algunas versiones, 
                // pero usamos IF NOT EXISTS si la versión lo soporta (MariaDB 10.0.8+ o MySQL 8.0.30+).
                // Si falla por "Duplicate key name", lo ignoramos.
                if (err.message.includes('Duplicate key name')) {
                    console.log(`El índice ya existe: ${sql.substring(0, 50)}...`);
                } else {
                    console.error(`Error en query: ${sql}`, err.message);
                }
            }
        }

        console.log('Finalizado.');
        process.exit(0);
    } catch (error) {
        console.error('Error fatal:', error);
        process.exit(1);
    }
}

runFixes();
