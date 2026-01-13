const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function checkAndFixUser() {
    let conn;
    try {
        // Conectar a MySQL con las mismas credenciales del backend
        conn = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: 'purre1010',
            database: 'nita',
            port: 3306
        });
        
        console.log('✅ Conectado a MySQL');
        
        // Buscar usuario admin
        const [rows] = await conn.execute(
            'SELECT id, nombre, email, rol, activo FROM usuarios WHERE email = ?',
            ['admin@nitaclothing.com']
        );
        
        if (rows.length === 0) {
            console.log('❌ Usuario admin NO existe. Creando...');
            const hash = await bcrypt.hash('admin123', 10);
            await conn.execute(
                'INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)',
                ['Administrador', 'admin@nitaclothing.com', hash, 'admin', 1]
            );
            console.log('✅ Usuario admin creado exitosamente');
            console.log('   Email: admin@nitaclothing.com');
            console.log('   Password: admin123');
        } else {
            console.log('✅ Usuario admin encontrado:');
            console.log('   ID:', rows[0].id);
            console.log('   Nombre:', rows[0].nombre);
            console.log('   Email:', rows[0].email);
            console.log('   Rol:', rows[0].rol);
            console.log('   Activo:', rows[0].activo);
            
            // Verificar password
            const [passRow] = await conn.execute(
                'SELECT password FROM usuarios WHERE email = ?',
                ['admin@nitaclothing.com']
            );
            
            const isValid = await bcrypt.compare('admin123', passRow[0].password);
            console.log('🔑 Password "admin123" es válido:', isValid);
            
            if (!isValid) {
                console.log('⚠️  Password incorrecto! Actualizando...');
                const newHash = await bcrypt.hash('admin123', 10);
                await conn.execute(
                    'UPDATE usuarios SET password = ? WHERE email = ?',
                    [newHash, 'admin@nitaclothing.com']
                );
                console.log('✅ Password actualizado a "admin123"');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n⚠️  La base de datos "nita" no existe.');
            console.log('   Ejecuta: cd nita-clothing-stock/backend && node -e "require(\'./config/initDatabase\')()"');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('\n⚠️  MySQL no está corriendo.');
            console.log('   Ejecuta el archivo START-MYSQL-ADMIN.bat como administrador');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n⚠️  Acceso denegado. Revisa la contraseña de MySQL en mysqlConfig.js');
        }
    } finally {
        if (conn) await conn.end();
    }
}

checkAndFixUser();
