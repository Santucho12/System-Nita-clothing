const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authMiddleware } = require('../middleware/auth');

// Aplicar autenticación
router.use(authMiddleware);

// Rutas de exportación
router.get('/sales/pdf', exportController.exportSalesPDF);
router.get('/products/pdf', exportController.exportProductsPDF);
router.get('/customers/excel', exportController.exportCustomersExcel);
router.get('/reports/excel', exportController.exportReportsExcel);

module.exports = router;
