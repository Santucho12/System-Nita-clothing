const mysql = require('mysql2/promise');
async function run() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: 'purre1010',
        database: 'nita'
    });
    const [rows] = await c.query('SELECT id, nombre, imagen_url FROM productos WHERE imagen_url IS NOT NULL AND imagen_url != "" AND imagen_url != "[]"');
    rows.forEach(row => {
        let images = [];
        try {
            const parsed = JSON.parse(row.imagen_url);
            images = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            images = [row.imagen_url];
        }
        images.forEach(img => {
            console.log(`ID: ${row.id}, Path: [${img}], StartsWithSlash: ${img.startsWith('/')}`);
        });
    });
    await c.end();
}
run();
