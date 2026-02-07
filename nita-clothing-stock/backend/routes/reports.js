const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// Estadísticas de stock
router.get('/rotacion-categorias', ReportController.getCategoryRotation);
router.get('/alertas-reposicion', ReportController.getRestockAlerts);
router.get('/stock-critico', ReportController.getCriticalStock);
// Ganancias y rentabilidad
router.get('/ganancias-generales', ReportController.getGeneralProfits);
router.get('/ganancia-por-producto', ReportController.getProfitByProduct);
router.get('/ganancia-por-categoria', ReportController.getProfitByCategory);

router.get('/monthly-stats', ReportController.getMonthlyStats);
router.get('/top-products', ReportController.getTopProductsThisMonth);
router.get('/top-categories', ReportController.getTopCategoriesThisMonth);
router.get('/payment-methods', ReportController.getSalesByPaymentMethod);
router.get('/daily-sales', ReportController.getDailySalesReport);
router.get('/performance', ReportController.getPerformanceReport);

// Reportes avanzados
router.get('/productos-mas-vendidos', ReportController.getTopSellingProducts);
router.get('/productos-menos-vendidos', ReportController.getLeastSellingProducts);
router.get('/productos-sin-movimiento', ReportController.getProductsWithoutSales);
router.get('/stock-inmovilizado', ReportController.getStockInmovilizado);
router.get('/ventas-dia', authorizeRoles('admin', 'vendedor'), ReportController.getSalesOfDay);
router.get('/ventas-mes', authorizeRoles('admin', 'vendedor'), ReportController.getSalesOfMonth);
router.get('/ventas-anio', authorizeRoles('admin', 'vendedor'), ReportController.getSalesOfYear);

// Valor del inventario (Capital en Ropa)
router.get('/inventory-value', authorizeRoles('admin', 'vendedor'), ReportController.getInventoryValue);

// Nuevos endpoints avanzados
router.get('/kpis-avanzados', authorizeRoles('admin', 'vendedor'), ReportController.getAdvancedKPIs);
router.get('/tendencia-ventas', authorizeRoles('admin', 'vendedor'), ReportController.getSalesTrend);
router.get('/margenes-rentabilidad', authorizeRoles('admin', 'vendedor'), ReportController.getProfitMargins);
router.get('/salud-inventario', authorizeRoles('admin', 'vendedor'), ReportController.getInventoryHealth);

module.exports = router;
