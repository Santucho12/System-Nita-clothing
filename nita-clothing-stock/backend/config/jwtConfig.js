/**
 * Configuración centralizada de JWT
 * Todas las importaciones de JWT_SECRET deben usar este módulo
 */

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET no está configurado en las variables de entorno.');
    console.error('   Agrega JWT_SECRET al archivo .env del backend.');
    process.exit(1);
}

const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '8h';

module.exports = { JWT_SECRET, JWT_EXPIRATION };
