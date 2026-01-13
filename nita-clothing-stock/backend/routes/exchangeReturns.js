const express = require('express');
const router = express.Router();
const exchangeReturnController = require('../controllers/exchangeReturnController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

/**
 * Rutas para Cambios y Devoluciones
 * Todas las rutas requieren autenticación
 */

// Estadísticas (debe ir antes de /:id para evitar conflictos)
router.get('/stats', authMiddleware, exchangeReturnController.getStats);

// Razones más comunes
router.get('/top-reasons', authMiddleware, exchangeReturnController.getTopReasons);

// Productos más devueltos
router.get('/top-returned-products', authMiddleware, exchangeReturnController.getTopReturnedProducts);

// Buscar por venta original
router.get('/venta/:saleId', authMiddleware, exchangeReturnController.getBySale);

// CRUD básico
router.post('/', authMiddleware, exchangeReturnController.create);

router.get('/', authMiddleware, exchangeReturnController.getAll);

router.get('/:id', authMiddleware, exchangeReturnController.getById);

router.put('/:id', authMiddleware, authorizeRoles('admin', 'supervisor'), exchangeReturnController.update);

router.delete('/:id', authMiddleware, authorizeRoles('admin'), exchangeReturnController.delete);

// Actualización de estado (workflow de aprobación)
router.patch('/:id/status', authMiddleware, authorizeRoles('admin', 'supervisor'), exchangeReturnController.updateStatus);

module.exports = router;
