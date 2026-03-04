const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306, user: 'root', password: 'purre1010', database: 'nita'
  });

  // 1. Show current state distribution
  const [before] = await conn.query('SELECT estado, COUNT(*) as cnt FROM productos GROUP BY estado');
  console.log('ANTES:', JSON.stringify(before));

  // 2. Update 'disponible' -> 'activo' (for products with stock > 0)
  const [r1] = await conn.query("UPDATE productos SET estado = 'activo' WHERE estado = 'disponible' AND stock > 0");
  console.log('disponible->activo (stock>0):', r1.affectedRows);

  // 3. Update 'disponible' with stock=0 -> 'sin_stock'
  const [r2] = await conn.query("UPDATE productos SET estado = 'sin_stock' WHERE estado = 'disponible' AND stock = 0");
  console.log('disponible->sin_stock (stock=0):', r2.affectedRows);

  // 4. Update any product with estado='activo' but stock=0 -> 'sin_stock'
  const [r3] = await conn.query("UPDATE productos SET estado = 'sin_stock' WHERE estado = 'activo' AND stock = 0");
  console.log('activo->sin_stock (stock=0):', r3.affectedRows);

  // 5. Update any product with estado='sin_stock' but stock>0 -> 'activo'
  const [r4] = await conn.query("UPDATE productos SET estado = 'activo' WHERE estado = 'sin_stock' AND stock > 0");
  console.log('sin_stock->activo (stock>0):', r4.affectedRows);

  // 6. Alter ENUM to only allow 3 valid states
  await conn.query("ALTER TABLE productos MODIFY COLUMN estado ENUM('activo', 'descontinuado', 'sin_stock') DEFAULT 'activo'");
  console.log('ENUM alterado exitosamente');

  // 7. Show final state distribution
  const [after] = await conn.query('SELECT estado, COUNT(*) as cnt FROM productos GROUP BY estado');
  console.log('DESPUES:', JSON.stringify(after));

  const [total] = await conn.query('SELECT COUNT(*) as total FROM productos');
  console.log('TOTAL productos:', total[0].total);

  const [activos] = await conn.query("SELECT COUNT(*) as total FROM productos WHERE estado = 'activo'");
  console.log('Total ACTIVOS (valor de getCount):', activos[0].total);

  // Verificar coherencia
  const [bugA] = await conn.query("SELECT COUNT(*) as cnt FROM productos WHERE estado = 'activo' AND stock = 0");
  console.log('BUG CHECK - activos con stock=0:', bugA[0].cnt);
  const [bugS] = await conn.query("SELECT COUNT(*) as cnt FROM productos WHERE estado = 'sin_stock' AND stock > 0");
  console.log('BUG CHECK - sin_stock con stock>0:', bugS[0].cnt);

  await conn.end();
  console.log('Migración completada!');
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
