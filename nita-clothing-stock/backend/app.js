require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./config/database');

const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Rutas de autenticación
const authRoutes = require('./routes/auth');
// Rutas de categorías
const categoryRoutes = require('./routes/categories');
// Rutas de productos
const productRoutes = require('./routes/products');
// Rutas de ventas
const saleRoutes = require('./routes/sales');
// Rutas de cambios y devoluciones
const exchangeReturnRoutes = require('./routes/exchangeReturns');
// Rutas de clientes
const customerRoutes = require('./routes/customers');
// Rutas de reservas
const reservationRoutes = require('./routes/reservations');
// Rutas de proveedores
const supplierRoutes = require('./routes/suppliers');
// Rutas de órdenes de compra
const purchaseOrderRoutes = require('./routes/purchaseOrders');
// Rutas de imágenes
const imageRoutes = require('./routes/images');
// Rutas de exportación
const exportRoutes = require('./routes/exports');
// Rutas de logs de actividad
const activityLogRoutes = require('./routes/activityLogs');
// Rutas de reportes
const reportRoutes = require('./routes/reports');
// WebSocket
const { initWebSocket } = require('./utils/websocket');
// Idempotencia
const idempotency = require('./middleware/idempotency');

const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'Cache-Control', 'Pragma']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// DEBUG: Log de TODAS las requests HTTP con status de respuesta
app.use((req, res, next) => {
    console.log(`[HTTP] --> ${req.method} ${req.originalUrl}`);
    const originalJson = res.json.bind(res);
    res.json = function(body) {
        console.log(`[HTTP] <-- ${req.method} ${req.originalUrl} [${res.statusCode}]`, JSON.stringify(body).substring(0, 200));
        return originalJson(body);
    };
    next();
});

// Middleware de idempotencia (después de bodyParser para interceptar post-data)
app.use(idempotency);

// Middleware para Content Security Policy que permita fuentes externas y conexiones al frontend
const cspHeader = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob:; connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:3002 http://localhost:5000 ws://localhost:5000;";
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', cspHeader);
    next();
});

// Servir archivos estáticos de /uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Prefijo para rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/categorias', categoryRoutes);
app.use('/api/productos', productRoutes);

app.use('/api/ventas', saleRoutes);
app.use('/api/cambios-devoluciones', exchangeReturnRoutes);
app.use('/api/clientes', customerRoutes);
app.use('/api/reservas', reservationRoutes);
app.use('/api/proveedores', supplierRoutes);
app.use('/api/ordenes-compra', purchaseOrderRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/reportes', reportRoutes);

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

const errorHandler = require('./middleware/errorHandler');

// ... (existing routes)

// Middleware para rutas no encontradas (404)
app.use((req, res, next) => {
    const error = new Error('Endpoint no encontrado');
    error.status = 404;
    next(error);
});

// Middleware global de manejo de errores (DEBE ser el último)
app.use(errorHandler);

// Función para inicializar el servidor
async function startServer() {
    try {
        // Conectar a la base de datos
        console.log('🔌 Conectando a la base de datos...');
        await database.connect();
        console.log('✅ Base de datos conectada exitosamente');

        // Verificar seguridad del entorno
        if (!process.env.JWT_SECRET) {
            console.warn('⚠️  [SEGURIDAD] JWT_SECRET no detectado. El sistema es vulnerable en producción.');
        }

        // Iniciar el servidor
        const server = app.listen(PORT, () => {
            console.log('🚀 =========================================');
            console.log(`🛍️  NITA CLOTHING - SISTEMA DE STOCK`);
            console.log('🚀 =========================================');
            console.log(`🌐 Servidor ejecutándose en: http://localhost:${PORT}`);
            console.log(`📊 API Endpoints: http://localhost:${PORT}/api`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
            console.log(`🔔 WebSocket: ws://localhost:${PORT}/ws`);
            console.log('🚀 =========================================');
            console.log('');
            console.log('📋 Endpoints principales:');
            console.log(`   📂 Categorías: http://localhost:${PORT}/api/categorias`);
            console.log(`   👕 Productos:  http://localhost:${PORT}/api/productos`);
            console.log('');
            console.log('💡 Tip: Usa Postman para probar los endpoints');
            console.log('📖 Los ejemplos de requests están en los archivos de rutas');
        });

        // Inicializar WebSocket
        initWebSocket(server);
        console.log('✅ WebSocket Server inicializado');

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