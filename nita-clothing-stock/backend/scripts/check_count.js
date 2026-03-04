const mysql = require('mysql2/promise');
(async () => {
    const c = await mysql.createConnection({host:'127.0.0.1',port:3306,user:'root',password:'purre1010',database:'nita'});
    const [r1] = await c.query("SELECT COUNT(*) AS total FROM productos WHERE estado = 'activo'");
    console.log('getCount devolveria:', r1[0].total);
    const [r2] = await c.query('SELECT estado, COUNT(*) as cnt FROM productos GROUP BY estado');
    console.log('Por estado:', JSON.stringify(r2));
    const [r3] = await c.query('SELECT COUNT(*) as total FROM productos');
    console.log('Total productos:', r3[0].total);
    await c.end();
})().catch(e=>console.error(e.message));
