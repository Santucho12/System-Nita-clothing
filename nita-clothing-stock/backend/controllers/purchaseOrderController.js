const PurchaseOrder = require('../models/PurchaseOrder');

const purchaseOrderController = {
  async create(req, res, next) {
    try {
      const order = await PurchaseOrder.create({ ...req.body, created_by: req.user.id });
      res.status(201).json({
        success: true,
        message: 'Orden de compra creada exitosamente',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req, res, next) {
    try {
      const filters = {
        supplier_id: req.query.supplier_id,
        status: req.query.status,
        payment_status: req.query.payment_status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const orders = await PurchaseOrder.getAll(filters);
      res.json({
        success: true,
        data: orders,
        count: orders.length
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const order = await PurchaseOrder.getById(req.params.id);
      if (!order) {
        const error = new Error('Orden de compra no encontrada');
        error.status = 404;
        throw error;
      }
      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status, received_date } = req.body;
      const order = await PurchaseOrder.updateStatus(req.params.id, status, received_date);
      res.json({
        success: true,
        message: 'Estado actualizado exitosamente',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async receiveOrder(req, res, next) {
    try {
      const orderId = req.params.id;
      const userId = req.user?.id || null;

      const result = await PurchaseOrder.receiveOrder(orderId, userId);

      res.json({
        success: true,
        message: result.message,
        data: result.order,
        stock_updates: result.stock_updates
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePaymentStatus(req, res, next) {
    try {
      const { payment_status, payment_date } = req.body;
      const order = await PurchaseOrder.updatePaymentStatus(req.params.id, payment_status, payment_date);
      res.json({
        success: true,
        message: 'Estado de pago actualizado',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const order = await PurchaseOrder.update(req.params.id, req.body);
      res.json({
        success: true,
        message: 'Orden actualizada exitosamente',
        data: order
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await PurchaseOrder.delete(req.params.id);
      res.json({
        success: true,
        message: 'Orden eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };
      const stats = await PurchaseOrder.getStats(filters);
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  async getPendingPayments(req, res, next) {
    try {
      const orders = await PurchaseOrder.getPendingPayments();
      res.json({
        success: true,
        data: orders
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = purchaseOrderController;
