const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const auth = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(auth);

// Rutas de promociones
router.get('/', promotionController.getAllPromotions);
router.get('/active', promotionController.getActivePromotions);
router.get('/for-product', promotionController.getPromotionForProduct);
router.get('/:id', promotionController.getPromotionById);
router.post('/', promotionController.createPromotion);
router.put('/:id', promotionController.updatePromotion);
router.patch('/:id/status', promotionController.updateStatus);
router.delete('/:id', promotionController.deletePromotion);

module.exports = router;
