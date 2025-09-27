
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./config/database');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta de salud del servidor
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Ruta por defecto - información del API
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🛍️ Bienvenido al Sistema de Stock de Nita Clothing',
        description: 'API REST para gestión de inventario de ropa femenina',
        version: '1.0.0',
        endpoints: {
            info: 'GET /api - Información de todos los endpoints',
            health: 'GET /health - Estado del servidor',
            categorias: 'GET /api/categorias - Gestión de categorías',
            productos: 'GET /api/productos - Gestión de productos',
            ventas: 'GET /api/ventas - Gestión de ventas',
            reportes: 'GET /api/reportes - Reportes y estadísticas'
        },
        developer: 'Sistema creado para Nita Clothing',
        timestamp: new Date().toISOString()
    });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.originalUrl,
        method: req.method,
        suggestion: 'Visita /api para ver todos los endpoints disponibles'
    });
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    
    res.status(err.status || 500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// Función para inicializar el servidor
async function startServer() {
    try {
        // Conectar a la base de datos
        console.log('🔌 Conectando a la base de datos...');
        await database.connect();
        console.log('✅ Base de datos conectada exitosamente');

        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log('🚀 =========================================');
            console.log(`🛍️  NITA CLOTHING - SISTEMA DE STOCK`);
            console.log('🚀 =========================================');
            console.log(`🌐 Servidor ejecutándose en: http://localhost:${PORT}`);
            console.log(`📊 API Endpoints: http://localhost:${PORT}/api`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
            console.log('🚀 =========================================');
            console.log('');
            console.log('📋 Endpoints principales:');
            console.log(`   📂 Categorías: http://localhost:${PORT}/api/categorias`);
            console.log(`   👕 Productos:  http://localhost:${PORT}/api/productos`);
            console.log('');
            console.log('💡 Tip: Usa Postman para probar los endpoints');
            console.log('📖 Los ejemplos de requests están en los archivos de rutas');
        });

    } catch (error) {
        console.error('❌ Error iniciando el servidor:', error.message);
        process.exit(1);
    }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    try {
        await database.close();
        console.log('✅ Base de datos desconectada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cerrando la base de datos:', error.message);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Cerrando servidor...');
    try {
        await database.close();
        console.log('✅ Base de datos desconectada');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cerrando la base de datos:', error.message);
        process.exit(1);
    }
});

// Iniciar el servidor
startServer();

module.exports = app;