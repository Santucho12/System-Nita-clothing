const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth'); // Added authorizeRoles

router.use(authMiddleware);

router.get('/', CustomerController.getAllCustomers);
router.get('/segmentacion', authMiddleware, CustomerController.getSegmentation); // Added authMiddleware
router.get('/:email', authMiddleware, CustomerController.getCustomerByEmail); // Added authMiddleware
router.post('/', CustomerController.createCustomer);
router.put('/:email', CustomerController.updateCustomer);
router.delete('/:email', authMiddleware, authorizeRoles('admin'), CustomerController.deleteCustomer); // Added DELETE route
router.get('/:email/compras', CustomerController.getPurchaseHistory);
router.get('/:email/estadisticas', CustomerController.getStats);

module.exports = router;
