require('dotenv').config();
const db = require('./config/database');

(async () => {
    try {
        console.log('=== MIGRACION FINAL: Sistema de 3 estados ===\n');

        // 1. Asegurar que el ENUM tiene los 3 estados
        console.log('1. Verificando ENUM...');
        await db.query("ALTER TABLE productos MODIFY COLUMN estado ENUM('activo', 'descontinuado', 'sin_stock') DEFAULT 'activo'");
        console.log('   ENUM actualizado correctamente.\n');

        // 2. Los que tienen deleted_at -> descontinuado, stock=0
        console.log('2. Migrando productos con deleted_at a descontinuado...');
        const [r1] = await db.query("UPDATE productos SET estado = 'descontinuado', stock = 0 WHERE deleted_at IS NOT NULL");
        console.log(`   ${r1.affectedRows} productos migrados a descontinuado.\n`);

        // 3. Limpiar deleted_at (ya no se usa)
        console.log('3. Limpiando campo deleted_at...');
        const [r2] = await db.query("UPDATE productos SET deleted_at = NULL WHERE deleted_at IS NOT NULL");
        console.log(`   ${r2.affectedRows} filas limpiadas.\n`);

        // 4. Normalizar 'disponible' -> 'activo' o 'sin_stock'
        console.log('4. Normalizando estado "disponible"...');
        const [r3] = await db.query("UPDATE productos SET estado = 'activo' WHERE estado = 'disponible' AND stock > 0");
        console.log(`   ${r3.affectedRows} productos disponible -> activo.`);
        const [r4] = await db.query("UPDATE productos SET estado = 'sin_stock' WHERE estado = 'disponible' AND stock <= 0");
        console.log(`   ${r4.affectedRows} productos disponible -> sin_stock.\n`);

        // 5. Sincronizar estado con stock para los que no son descontinuados
        console.log('5. Sincronizando estado con stock...');
        const [r5] = await db.query("UPDATE productos SET estado = 'activo' WHERE estado = 'sin_stock' AND stock > 0");
        console.log(`   ${r5.affectedRows} productos sin_stock con stock>0 -> activo.`);
        const [r6] = await db.query("UPDATE productos SET estado = 'sin_stock' WHERE estado = 'activo' AND stock <= 0");
        console.log(`   ${r6.affectedRows} productos activo con stock=0 -> sin_stock.\n`);

        // 6. Resultado final
        const [final] = await db.query('SELECT estado, COUNT(*) as cantidad FROM productos GROUP BY estado ORDER BY estado');
        console.log('=== RESULTADO FINAL ===');
        let total = 0;
        for (const row of final) {
            console.log(`   ${row.estado}: ${row.cantidad}`);
            total += row.cantidad;
        }
        console.log(`   TOTAL: ${total}`);

    } catch (err) {
        console.error('ERROR:', err.message);
    }
    process.exit();
})();
