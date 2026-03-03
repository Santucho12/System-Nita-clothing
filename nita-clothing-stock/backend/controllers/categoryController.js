const Category = require('../models/Category');

class CategoryController {
    static async getAllCategories(req, res, next) {
        try {
            const categories = await Category.getAll();
            res.status(200).json({
                success: true,
                message: 'Categorías obtenidas exitosamente',
                data: categories
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCategoryById(req, res, next) {
        try {
            const { id } = req.params;
            const category = await Category.getById(id);
            if (!category) {
                const error = new Error('Categoría no encontrada');
                error.status = 404;
                throw error;
            }
            res.status(200).json({
                success: true,
                message: 'Categoría obtenida exitosamente',
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    static async createCategory(req, res, next) {
        try {
            const { name, description } = req.body;
            const newCategory = await Category.create({ name, description });
            res.status(201).json({
                success: true,
                message: 'Categoría creada exitosamente',
                data: newCategory
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateCategory(req, res, next) {
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
            next(error);
        }
    }

    static async deleteCategory(req, res, next) {
        try {
            const { id } = req.params;
            await Category.delete(id);
            res.status(200).json({
                success: true,
                message: 'Categoría eliminada exitosamente (Soft Delete)'
            });
        } catch (error) {
            next(error);
        }
    }

    static async changeCategoryStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!['activa', 'inactiva'].includes(status)) {
                const error = new Error('Estado inválido');
                error.status = 400;
                throw error;
            }
            const result = await Category.changeStatus(id, status);
            res.status(200).json({ success: true, message: 'Estado de categoría actualizado', data: result });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CategoryController;
