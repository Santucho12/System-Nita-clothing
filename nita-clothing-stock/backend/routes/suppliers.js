const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Estadísticas y reports (antes de /:id)
router.get('/top', authMiddleware, supplierController.getTopSuppliers);
router.get('/pending-payments', authMiddleware, supplierController.getPendingPayments);

// CRUD básico
router.post('/', authMiddleware, authorizeRoles('admin', 'supervisor'), supplierController.create);
router.get('/', authMiddleware, supplierController.getAll);
router.get('/:id', authMiddleware, supplierController.getById);
router.put('/:id', authMiddleware, authorizeRoles('admin', 'supervisor'), supplierController.update);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), supplierController.delete);

// Relaciones
router.get('/:id/purchase-orders', authMiddleware, supplierController.getPurchaseOrders);
router.get('/:id/products', authMiddleware, supplierController.getProducts);
router.get('/:id/stats', authMiddleware, supplierController.getStats);

module.exports = router;
