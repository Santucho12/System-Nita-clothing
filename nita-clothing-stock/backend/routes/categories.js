const express = require('express');
const CategoryController = require('../controllers/categoryController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Todas requieren autenticación
router.use(authMiddleware);

// Listar todas las categorías (cualquier usuario autenticado)
router.get('/', CategoryController.getAllCategories);
// Obtener una categoría
router.get('/:id', CategoryController.getCategoryById);
// Crear categoría (solo admin/supervisor)
router.post('/', authorizeRoles('admin', 'supervisor'), CategoryController.createCategory);
// Actualizar categoría (solo admin/supervisor)
router.put('/:id', authorizeRoles('admin', 'supervisor'), CategoryController.updateCategory);
// Cambiar estado (solo admin/supervisor)
router.patch('/:id/status', authorizeRoles('admin', 'supervisor'), CategoryController.changeCategoryStatus);
// Eliminar categoría (solo admin)
router.delete('/:id', authorizeRoles('admin'), CategoryController.deleteCategory);

module.exports = router;
