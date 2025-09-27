const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/saleController');

router.post('/', SaleController.createSale);
router.get('/', SaleController.getAllSales);
router.get('/current-month', SaleController.getCurrentMonthSales);
router.get('/by-date-range', SaleController.getSalesByDateRange);
router.delete('/:id', SaleController.deleteSale);

module.exports = router;
