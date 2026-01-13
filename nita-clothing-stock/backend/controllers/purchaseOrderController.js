const PurchaseOrder = require('../models/PurchaseOrder');

const purchaseOrderController = {
  async create(req, res) {
    try {
      const order = await PurchaseOrder.create({ ...req.body, created_by: req.user.id });
      res.status(201).json({ message: 'Orden de compra creada exitosamente', data: order });
    } catch (error) {
      console.error('Error creando orden:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req, res) {
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
      res.json({ data: orders, count: orders.length });
    } catch (error) {
      console.error('Error obteniendo órdenes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const order = await PurchaseOrder.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }
      res.json({ data: order });
    } catch (error) {
      console.error('Error obteniendo orden:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status, received_date } = req.body;
      const order = await PurchaseOrder.updateStatus(req.params.id, status, received_date);
      res.json({ message: 'Estado actualizado exitosamente', data: order });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async receiveOrder(req, res) {
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
      console.error('Error recibiendo orden:', error);
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  },

  async updatePaymentStatus(req, res) {
    try {
      const { payment_status, payment_date } = req.body;
      const order = await PurchaseOrder.updatePaymentStatus(req.params.id, payment_status, payment_date);
      res.json({ message: 'Estado de pago actualizado', data: order });
    } catch (error) {
      console.error('Error actualizando pago:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const order = await PurchaseOrder.update(req.params.id, req.body);
      res.json({ message: 'Orden actualizada exitosamente', data: order });
    } catch (error) {
      console.error('Error actualizando orden:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req, res) {
    try {
      await PurchaseOrder.delete(req.params.id);
      res.json({ message: 'Orden eliminada exitosamente' });
    } catch (error) {
      console.error('Error eliminando orden:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getStats(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };
      const stats = await PurchaseOrder.getStats(filters);
      res.json({ data: stats });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async getPendingPayments(req, res) {
    try {
      const orders = await PurchaseOrder.getPendingPayments();
      res.json({ data: orders });
    } catch (error) {
      console.error('Error obteniendo pagos pendientes:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = purchaseOrderController;
