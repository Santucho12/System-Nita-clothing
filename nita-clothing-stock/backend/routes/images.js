const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { authMiddleware } = require('../middleware/auth');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// Rutas de imágenes
router.post('/:id/images', imageController.uploadImages);
router.get('/:id/images', imageController.getProductImages);
router.patch('/:productId/images/:id/primary', imageController.setPrimaryImage);
router.delete('/:id/images/:imageId', imageController.deleteImage);

module.exports = router;
