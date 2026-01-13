const ExchangeReturn = require('../models/ExchangeReturn');
const Sale = require('../models/Sale');

/**
 * Controlador para Cambios y Devoluciones
 * Gestiona el workflow completo: creación, aprobación, rechazo, completado
 */
const exchangeReturnController = {
  /**
   * Crear nuevo cambio o devolución
   * POST /api/cambios-devoluciones
   */
  async create(req, res) {
    try {
      const {
        type,
        original_sale_id,
        customer_name,
        customer_email,
        customer_phone,
        items,
        refund_amount,
        refund_method,
        notes
      } = req.body;

      // Validar campos obligatorios
      if (!type || !original_sale_id || !customer_name || !items || items.length === 0) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios: type, original_sale_id, customer_name, items'
        });
      }

      // Validar que la venta existe
      const sale = await Sale.getById(original_sale_id);
      if (!sale) {
        return res.status(404).json({ error: 'Venta original no encontrada' });
      }

      // Crear el cambio/devolución
      const exchangeReturn = await ExchangeReturn.create({
        type,
        original_sale_id,
        customer_name,
        customer_email: customer_email || sale.customer_email,
        customer_phone: customer_phone || sale.customer_phone,
        items,
        refund_amount: refund_amount || 0,
        refund_method: refund_method || 'efectivo',
        notes: notes || '',
        processed_by: req.user.id,
        status: 'pending'
      });

      res.status(201).json({
        message: 'Cambio/devolución creado exitosamente',
        data: exchangeReturn
      });
    } catch (error) {
      console.error('Error creando cambio/devolución:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener todos los cambios/devoluciones con filtros
   * GET /api/cambios-devoluciones
   */
  async getAll(req, res) {
    try {
      const filters = {
        type: req.query.type,
        status: req.query.status,
        customer_email: req.query.customer_email,
        customer_name: req.query.customer_name,
        original_sale_id: req.query.original_sale_id,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const exchangeReturns = await ExchangeReturn.getAll(filters);

      res.json({
        data: exchangeReturns,
        count: exchangeReturns.length
      });
    } catch (error) {
      console.error('Error obteniendo cambios/devoluciones:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener cambio/devolución por ID
   * GET /api/cambios-devoluciones/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const exchangeReturn = await ExchangeReturn.getById(id);

      if (!exchangeReturn) {
        return res.status(404).json({ error: 'Cambio/devolución no encontrado' });
      }

      res.json({ data: exchangeReturn });
    } catch (error) {
      console.error('Error obteniendo cambio/devolución:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Actualizar estado (aprobar, rechazar, completar, cancelar)
   * PATCH /api/cambios-devoluciones/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, approval_notes } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Falta el campo status' });
      }

      const exchangeReturn = await ExchangeReturn.updateStatus(
        id,
        status,
        req.user.id,
        approval_notes || ''
      );

      res.json({
        message: `Cambio/devolución ${status} exitosamente`,
        data: exchangeReturn
      });
    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Actualizar datos generales
   * PUT /api/cambios-devoluciones/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      const exchangeReturn = await ExchangeReturn.update(id, data);

      res.json({
        message: 'Cambio/devolución actualizado exitosamente',
        data: exchangeReturn
      });
    } catch (error) {
      console.error('Error actualizando cambio/devolución:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Eliminar cambio/devolución
   * DELETE /api/cambios-devoluciones/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      await ExchangeReturn.delete(id);

      res.json({ message: 'Cambio/devolución eliminado exitosamente' });
    } catch (error) {
      console.error('Error eliminando cambio/devolución:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener cambios/devoluciones por venta original
   * GET /api/cambios-devoluciones/venta/:saleId
   */
  async getBySale(req, res) {
    try {
      const { saleId } = req.params;

      const exchangeReturns = await ExchangeReturn.getByOriginalSale(saleId);

      res.json({
        data: exchangeReturns,
        count: exchangeReturns.length
      });
    } catch (error) {
      console.error('Error obteniendo cambios/devoluciones por venta:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener estadísticas de cambios/devoluciones
   * GET /api/cambios-devoluciones/stats
   */
  async getStats(req, res) {
    try {
      const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date
      };

      const stats = await ExchangeReturn.getStats(filters);

      res.json({ data: stats });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener razones más comunes de devolución
   * GET /api/cambios-devoluciones/top-reasons
   */
  async getTopReasons(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const reasons = await ExchangeReturn.getTopReasons(limit);

      res.json({ data: reasons });
    } catch (error) {
      console.error('Error obteniendo razones:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Obtener productos más devueltos
   * GET /api/cambios-devoluciones/top-returned-products
   */
  async getTopReturnedProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const products = await ExchangeReturn.getTopReturnedProducts(limit);

      res.json({ data: products });
    } catch (error) {
      console.error('Error obteniendo productos más devueltos:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = exchangeReturnController;
