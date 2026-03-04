require('dotenv').config();
const db = require('./config/database');

(async () => {
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM productos WHERE Field IN ('estado','deleted_at')");
        console.log('COLUMNAS:');
        cols.forEach(c => console.log(`  ${c.Field}: ${c.Type} | Default: ${c.Default}`));

        const [estados] = await db.query('SELECT estado, COUNT(*) as c FROM productos GROUP BY estado');
        console.log('\nESTADOS:', JSON.stringify(estados));

        const [del] = await db.query('SELECT COUNT(*) as c FROM productos WHERE deleted_at IS NOT NULL');
        console.log('CON deleted_at:', del[0].c);

        const [total] = await db.query('SELECT COUNT(*) as c FROM productos');
        console.log('TOTAL productos:', total[0].c);

        const [activos] = await db.query("SELECT COUNT(*) as c FROM productos WHERE estado = 'activo' AND deleted_at IS NULL");
        console.log('Activos (sin deleted):', activos[0].c);
    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit();
})();
