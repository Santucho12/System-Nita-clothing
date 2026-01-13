const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/saleController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Todas requieren autenticación
router.use(authMiddleware);

// Registrar venta (vendedor, supervisor, admin)
router.post('/', authorizeRoles('admin', 'supervisor', 'vendedor'), SaleController.createSale);

// Listar ventas
router.get('/', SaleController.getAllSales);

// Ventas del mes actual
router.get('/current-month', SaleController.getCurrentMonthSales);

// Ventas por rango de fechas
router.get('/by-date-range', SaleController.getSalesByDateRange);

// Historial de ventas con filtros avanzados
router.get('/history', SaleController.getSalesHistory);

// Dashboard de ventas y reportes
router.get('/dashboard/day', SaleController.getSalesOfDay);
router.get('/dashboard/month', SaleController.getSalesOfMonth);
router.get('/dashboard/year', SaleController.getSalesOfYear);
router.get('/dashboard/top-products', SaleController.getTopSellingProducts);
router.get('/dashboard/best-days', SaleController.getBestDaysOfMonth);

// Detalle de venta
router.get('/:id', SaleController.getSaleById);

// Cancelar venta (solo admin)
router.delete('/:id', authorizeRoles('admin'), SaleController.deleteSale);

module.exports = router;
