const Promotion = require('../models/Promotion');

// Obtener todas las promociones
exports.getAllPromotions = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;

    const promotions = await Promotion.findAll(filters);
    res.json(promotions);
  } catch (error) {
    console.error('Error al obtener promociones:', error);
    res.status(500).json({ message: 'Error al obtener promociones', error: error.message });
  }
};

// Obtener promoción por ID
exports.getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: 'Promoción no encontrada' });
    }
    res.json(promotion);
  } catch (error) {
    console.error('Error al obtener promoción:', error);
    res.status(500).json({ message: 'Error al obtener promoción', error: error.message });
  }
};

// Obtener promociones activas
exports.getActivePromotions = async (req, res) => {
  try {
    const promotions = await Promotion.findActive();
    res.json(promotions);
  } catch (error) {
    console.error('Error al obtener promociones activas:', error);
    res.status(500).json({ message: 'Error al obtener promociones activas', error: error.message });
  }
};

// Crear promoción
exports.createPromotion = async (req, res) => {
  try {
    const { name, discount_value, applies_to } = req.body;

    // Validaciones
    if (!name || !discount_value || !applies_to) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    if (discount_value <= 0) {
      return res.status(400).json({ message: 'El valor del descuento debe ser mayor a 0' });
    }

    const promotion = await Promotion.create(req.body);
    res.status(201).json(promotion);
  } catch (error) {
    console.error('Error al crear promoción:', error);
    res.status(500).json({ message: 'Error al crear promoción', error: error.message });
  }
};

// Actualizar promoción
exports.updatePromotion = async (req, res) => {
  try {
    const { name, discount_value } = req.body;

    if (!name || !discount_value) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    if (discount_value <= 0) {
      return res.status(400).json({ message: 'El valor del descuento debe ser mayor a 0' });
    }

    const promotion = await Promotion.update(req.params.id, req.body);
    res.json(promotion);
  } catch (error) {
    console.error('Error al actualizar promoción:', error);
    res.status(500).json({ message: 'Error al actualizar promoción', error: error.message });
  }
};

// Cambiar estado de promoción
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['activa', 'pausada', 'finalizada'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const promotion = await Promotion.updateStatus(req.params.id, status);
    res.json(promotion);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

// Eliminar promoción
exports.deletePromotion = async (req, res) => {
  try {
    await Promotion.delete(req.params.id);
    res.json({ message: 'Promoción eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar promoción:', error);
    res.status(500).json({ message: 'Error al eliminar promoción', error: error.message });
  }
};

// Obtener promoción aplicable a un producto
exports.getPromotionForProduct = async (req, res) => {
  try {
    const { productId, categoryId } = req.query;
    
    if (!productId || !categoryId) {
      return res.status(400).json({ message: 'Se requieren productId y categoryId' });
    }

    const promotion = await Promotion.findForProduct(productId, categoryId);
    res.json(promotion || null);
  } catch (error) {
    console.error('Error al obtener promoción para producto:', error);
    res.status(500).json({ message: 'Error al obtener promoción', error: error.message });
  }
};
