const database = require('../config/database');

async function runFinalIndexes() {
    try {
        console.log('Aplicando índices finales...');

        const queries = [
            'ALTER TABLE customers ADD INDEX IF NOT EXISTS idx_customers_email (email)',
            'ALTER TABLE customers ADD INDEX IF NOT EXISTS idx_customers_phone (phone)',
            'ALTER TABLE customers ADD INDEX IF NOT EXISTS idx_customers_name (name)'
        ];

        for (const sql of queries) {
            try {
                // Ajuste para MariaDB/MySQL 8+ que soporta IF NOT EXISTS o manejo manual
                const standardSql = sql.replace(' IF NOT EXISTS', '');
                await database.run(standardSql);
                console.log(`Ejecutado: ${standardSql}`);
            } catch (err) {
                if (err.message.includes('Duplicate key name')) {
                    console.log(`El índice ya existe: ${sql}`);
                } else {
                    console.error(`Error en query: ${sql}`, err.message);
                }
            }
        }

        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

runFinalIndexes();
