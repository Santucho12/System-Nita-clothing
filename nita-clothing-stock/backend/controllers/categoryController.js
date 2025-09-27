const Category = require('../models/Category');

class CategoryController {
    static async getAllCategories(req, res) {
        try {
            const categories = await Category.getAll();
            res.status(200).json({
                success: true,
                message: 'Categorías obtenidas exitosamente',
                data: categories
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const category = await Category.getById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Categoría obtenida exitosamente',
                data: category
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async createCategory(req, res) {
        try {
            const { name, description } = req.body;
            const newCategory = await Category.create({ name, description });
            res.status(201).json({
                success: true,
                message: 'Categoría creada exitosamente',
                data: newCategory
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, description } = req.body;
            const updatedCategory = await Category.update(id, { name, description });
            res.status(200).json({
                success: true,
                message: 'Categoría actualizada exitosamente',
                data: updatedCategory
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static async deleteCategory(req, res) {
        try {
            const { id } = req.params;
            await Category.delete(id);
            res.status(200).json({
                success: true,
                message: 'Categoría eliminada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = CategoryController;
