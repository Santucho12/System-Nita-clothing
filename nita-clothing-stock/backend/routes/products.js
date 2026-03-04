const express = require('express');
const multer = require('multer');
const path = require('path');
const ProductController = require('../controllers/productController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Subida y gestión de imágenes
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, '../../uploads/products'));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_').replace(/_{2,}/g, '_');
		cb(null, uniqueSuffix + '-' + sanitizedName);
	}
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB máx por imagen

// Todas requieren autenticación
router.use(authMiddleware);

// Listar y buscar productos (todos los autenticados)
router.get('/', ProductController.getAllProducts);
router.get('/search', ProductController.searchProducts);
router.get('/count', ProductController.getCount);
router.get('/stock-bajo', ProductController.getLowStockProducts);

// Obtener el último SKU (DEBE ir antes de /:id)
router.get('/ultimo-sku', ProductController.getLastSku);

router.get('/categoria/:categoryId', ProductController.getProductsByCategory);
router.get('/:id', ProductController.getProductById);

// CRUD con permisos
router.post('/', authorizeRoles('admin', 'supervisor'), upload.array('images', 10), ProductController.createProduct);
router.put('/:id', authorizeRoles('admin', 'supervisor'), upload.array('images', 10), ProductController.updateProduct);
router.patch('/:id/stock', authorizeRoles('admin', 'supervisor'), ProductController.updateStock);
router.delete('/:id', authorizeRoles('admin', 'supervisor'), ProductController.deleteProduct);

// Cambiar estado del producto
router.patch('/:id/status', authorizeRoles('admin', 'supervisor'), ProductController.changeStatus);

// Duplicar producto
router.post('/:id/duplicar', authorizeRoles('admin', 'supervisor'), ProductController.duplicateProduct);

// Endpoints para imágenes
router.post('/:id/imagenes', authorizeRoles('admin', 'supervisor'), upload.array('images', 10), ProductController.uploadImages);
router.delete('/:id/imagenes/:img', authorizeRoles('admin', 'supervisor'), ProductController.deleteImage);

module.exports = router;
