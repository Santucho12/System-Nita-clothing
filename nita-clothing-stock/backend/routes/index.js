const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de Nita Clothing - Sistema de Gestión de Stock',
        version: '1.0.0',
        endpoints: {
            categorias: {
                'GET /api/categorias': 'Obtener todas las categorías',
                'GET /api/categorias/:id': 'Obtener categoría por ID',
                'POST /api/categorias': 'Crear nueva categoría',
                'PUT /api/categorias/:id': 'Actualizar categoría',
                'DELETE /api/categorias/:id': 'Eliminar categoría'
            },
            productos: {
                'GET /api/productos': 'Obtener todos los productos',
                'GET /api/productos/:id': 'Obtener producto por ID',
                'GET /api/productos/categoria/:categoryId': 'Obtener productos por categoría',
                'GET /api/productos/search?q=term': 'Buscar productos',
                'GET /api/productos/stock-bajo?min=number': 'Productos con stock bajo',
                'POST /api/productos': 'Crear nuevo producto',
                'PUT /api/productos/:id': 'Actualizar producto',
                'PATCH /api/productos/:id/stock': 'Actualizar solo stock',
                'DELETE /api/productos/:id': 'Eliminar producto'
            },
            ventas: {
                'GET /api/ventas': 'Obtener todas las ventas',
                'GET /api/ventas/current-month': 'Ventas del mes actual',
                'GET /api/ventas/by-date-range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD': 'Ventas por rango de fechas',
                'POST /api/ventas': 'Registrar nueva venta',
                'DELETE /api/ventas/:id': 'Eliminar venta (restaura stock)'
            },
            reportes: {
                'GET /api/reportes/monthly-stats': 'Estadísticas del mes actual',
                'GET /api/reportes/top-products?limit=10': 'Productos más vendidos',
                'GET /api/reportes/payment-methods?year=YYYY&month=MM': 'Ventas por método de pago',
                'GET /api/reportes/daily-sales?year=YYYY&month=MM': 'Ventas diarias del mes',
                'GET /api/reportes/performance': 'Reporte de rendimiento vs mes anterior'
            }
        },
        documentation: 'Ver comentarios en archivos de rutas para ejemplos de Postman'
    });
});

module.exports = router;
