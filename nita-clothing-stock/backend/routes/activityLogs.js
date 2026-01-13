const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { authMiddleware } = require('../middleware/auth');

// Aplicar autenticación
router.use(authMiddleware);

// Rutas de logs
router.get('/', activityLogController.getLogs);
router.get('/user/:userId', activityLogController.getLogsByUser);
router.get('/record/:table/:recordId', activityLogController.getLogsByRecord);
router.get('/stats', activityLogController.getStats);

module.exports = router;
