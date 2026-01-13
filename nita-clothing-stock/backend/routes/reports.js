// Estadísticas de stock
router.get('/rotacion-categorias', ReportController.getCategoryRotation);
router.get('/alertas-reposicion', ReportController.getRestockAlerts);
router.get('/stock-critico', ReportController.getCriticalStock);
// Ganancias y rentabilidad
router.get('/ganancias-generales', ReportController.getGeneralProfits);
router.get('/ganancia-por-producto', ReportController.getProfitByProduct);
router.get('/ganancia-por-categoria', ReportController.getProfitByCategory);
const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.get('/monthly-stats', ReportController.getMonthlyStats);
router.get('/top-products', ReportController.getTopProductsThisMonth);
router.get('/payment-methods', ReportController.getSalesByPaymentMethod);
router.get('/daily-sales', ReportController.getDailySalesReport);
router.get('/performance', ReportController.getPerformanceReport);

// Reportes avanzados
router.get('/productos-mas-vendidos', ReportController.getTopSellingProducts);
router.get('/productos-menos-vendidos', ReportController.getLeastSellingProducts);
router.get('/productos-sin-movimiento', ReportController.getProductsWithoutSales);
router.get('/stock-inmovilizado', ReportController.getStockInmovilizado);
router.get('/ventas-dia', auth(['admin', 'vendedor']), ReportController.getSalesOfDay);
router.get('/ventas-mes', auth(['admin', 'vendedor']), ReportController.getSalesOfMonth);
router.get('/ventas-anio', auth(['admin', 'vendedor']), ReportController.getSalesOfYear);

// Nuevos endpoints avanzados
router.get('/kpis-avanzados', auth(['admin', 'vendedor']), ReportController.getAdvancedKPIs);
router.get('/tendencia-ventas', auth(['admin', 'vendedor']), ReportController.getSalesTrend);
router.get('/margenes-rentabilidad', auth(['admin', 'vendedor']), ReportController.getProfitMargins);
router.get('/salud-inventario', auth(['admin', 'vendedor']), ReportController.getInventoryHealth);

module.exports = router;
