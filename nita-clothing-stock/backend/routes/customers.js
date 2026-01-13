const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', CustomerController.getAllCustomers);
router.get('/segmentacion', CustomerController.getSegmentation);
router.get('/:email', CustomerController.getCustomerByEmail);
router.post('/', CustomerController.createCustomer);
router.put('/:email', CustomerController.updateCustomer);
router.get('/:email/compras', CustomerController.getPurchaseHistory);
router.get('/:email/estadisticas', CustomerController.getStats);

module.exports = router;
