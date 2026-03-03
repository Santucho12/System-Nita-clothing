const Supplier = require('../models/Supplier');

const supplierController = {
  // Crear nuevo proveedor
  async create(req, res, next) {
    try {
      const supplier = await Supplier.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Proveedor creado exitosamente',
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener todos los proveedores
  async getAll(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        name: req.query.name,
        email: req.query.email,
        city: req.query.city,
        country: req.query.country,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const suppliers = await Supplier.getAll(filters);
      res.status(200).json({
        success: true,
        data: suppliers,
        count: suppliers.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener proveedor por ID
  async getById(req, res, next) {
    try {
      const supplier = await Supplier.getById(req.params.id);
      if (!supplier) {
        const error = new Error('Proveedor no encontrado');
        error.status = 404;
        throw error;
      }
      res.status(200).json({
        success: true,
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  },

  // Actualizar proveedor
  async update(req, res, next) {
    try {
      const supplier = await Supplier.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Proveedor actualizado exitosamente',
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  },

  // Eliminar proveedor
  async delete(req, res, next) {
    try {
      await Supplier.delete(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Proveedor eliminado exitosamente (Soft Delete)'
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener órdenes de compra de un proveedor
  async getPurchaseOrders(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: parseInt(req.query.limit) || 50
      };

      const orders = await Supplier.getPurchaseOrders(req.params.id, filters);
      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener productos de un proveedor
  async getProducts(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        name: req.query.name,
        limit: parseInt(req.query.limit) || 50
      };

      const products = await Supplier.getProducts(req.params.id, filters);
      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener estadísticas de un proveedor
  async getStats(req, res, next) {
    try {
      const stats = await Supplier.getStats(req.params.id);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener mejores proveedores
  async getTopSuppliers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const suppliers = await Supplier.getTopSuppliers(limit);
      res.status(200).json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener proveedores con pagos pendientes
  async getPendingPayments(req, res, next) {
    try {
      const suppliers = await Supplier.getSuppliersWithPendingPayments();
      res.status(200).json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = supplierController;
