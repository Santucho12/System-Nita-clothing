const database = require('../config/database');

async function checkTables() {
    try {
        console.log('Obteniendo tablas...');
        const tables = await database.all('SHOW TABLES');
        console.log('Tablas encontradas:', JSON.stringify(tables, null, 2));

        // También ver columnas de 'sales' para estar seguros
        const salesCols = await database.all('DESCRIBE sales');
        console.log('Columnas de sales:', JSON.stringify(salesCols, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTables();
