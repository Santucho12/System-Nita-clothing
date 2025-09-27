const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');

router.get('/monthly-stats', ReportController.getMonthlyStats);
router.get('/top-products', ReportController.getTopProductsThisMonth);
router.get('/payment-methods', ReportController.getSalesByPaymentMethod);
router.get('/daily-sales', ReportController.getDailySalesReport);
router.get('/performance', ReportController.getPerformanceReport);

module.exports = router;
