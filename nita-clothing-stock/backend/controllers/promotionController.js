const Promotion = require('../models/Promotion');

const Promotion = require('../models/Promotion');

// Obtener todas las promociones
exports.getAllPromotions = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    const promotions = await Promotion.findAll(filters);
    res.json({ success: true, data: promotions });
  } catch (error) {
    next(error);
  }
};

// Obtener promoción por ID
exports.getPromotionById = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      const error = new Error('Promoción no encontrada');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: promotion });
  } catch (error) {
    next(error);
  }
};

// Obtener promociones activas
exports.getActivePromotions = async (req, res, next) => {
  try {
    const promotions = await Promotion.findActive();
    res.json({ success: true, data: promotions });
  } catch (error) {
    next(error);
  }
};

// Crear promoción
exports.createPromotion = async (req, res, next) => {
  try {
    const { name, discount_value, applies_to } = req.body;

    // Validaciones
    if (!name || !discount_value || !applies_to) {
      const error = new Error('Faltan campos requeridos');
      error.status = 400;
      throw error;
    }

    if (discount_value <= 0) {
      const error = new Error('El valor del descuento debe ser mayor a 0');
      error.status = 400;
      throw error;
    }

    const promotion = await Promotion.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Promoción creada exitosamente',
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar promoción
exports.updatePromotion = async (req, res, next) => {
  try {
    const { name, discount_value } = req.body;

    if (!name || !discount_value) {
      const error = new Error('Faltan campos requeridos');
      error.status = 400;
      throw error;
    }

    if (discount_value <= 0) {
      const error = new Error('El valor del descuento debe ser mayor a 0');
      error.status = 400;
      throw error;
    }

    const promotion = await Promotion.update(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Promoción actualizada exitosamente',
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// Cambiar estado de promoción
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['activa', 'pausada', 'finalizada'].includes(status)) {
      const error = new Error('Estado inválido');
      error.status = 400;
      throw error;
    }

    const promotion = await Promotion.updateStatus(req.params.id, status);
    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: promotion
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar promoción
exports.deletePromotion = async (req, res, next) => {
  try {
    await Promotion.delete(req.params.id);
    res.json({ success: true, message: 'Promoción eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

// Obtener promoción aplicable a un producto
exports.getPromotionForProduct = async (req, res, next) => {
  try {
    const { productId, categoryId } = req.query;

    if (!productId || !categoryId) {
      const error = new Error('Se requieren productId y categoryId');
      error.status = 400;
      throw error;
    }

    const promotion = await Promotion.findForProduct(productId, categoryId);
    res.json({ success: true, data: promotion || null });
  } catch (error) {
    next(error);
  }
};
