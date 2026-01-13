const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Estadísticas (antes de /:id)
router.get('/stats', authMiddleware, purchaseOrderController.getStats);
router.get('/pending-payments', authMiddleware, purchaseOrderController.getPendingPayments);

// CRUD básico
router.post('/', authMiddleware, authorizeRoles('admin', 'supervisor'), purchaseOrderController.create);
router.get('/', authMiddleware, purchaseOrderController.getAll);
router.get('/:id', authMiddleware, purchaseOrderController.getById);
router.put('/:id', authMiddleware, authorizeRoles('admin', 'supervisor'), purchaseOrderController.update);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), purchaseOrderController.delete);

// Actualización de estados
router.patch('/:id/status', authMiddleware, authorizeRoles('admin', 'supervisor'), purchaseOrderController.updateStatus);
router.patch('/:id/payment-status', authMiddleware, authorizeRoles('admin', 'supervisor'), purchaseOrderController.updatePaymentStatus);

// Recibir orden (incrementa stock automáticamente)
router.post('/:id/receive', authMiddleware, authorizeRoles('admin', 'supervisor'), purchaseOrderController.receiveOrder);

module.exports = router;
