const Supplier = require('../models/Supplier');

const supplierController = {
  // Crear nuevo proveedor
  async create(req, res) {
    try {
      const supplier = await Supplier.create(req.body);
      res.status(201).json({ message: 'Proveedor creado exitosamente', data: supplier });
    } catch (error) {
      console.error('Error creando proveedor:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todos los proveedores
  async getAll(req, res) {
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
      res.json({ data: suppliers, count: suppliers.length });
    } catch (error) {
      console.error('Error obteniendo proveedores:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener proveedor por ID
  async getById(req, res) {
    try {
      const supplier = await Supplier.getById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      res.json({ data: supplier });
    } catch (error) {
      console.error('Error obteniendo proveedor:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar proveedor
  async update(req, res) {
    try {
      const supplier = await Supplier.update(req.params.id, req.body);
      res.json({ message: 'Proveedor actualizado exitosamente', data: supplier });
    } catch (error) {
      console.error('Error actualizando proveedor:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar proveedor
  async delete(req, res) {
    try {
      await Supplier.delete(req.params.id);
      res.json({ message: 'Proveedor eliminado exitosamente' });
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener órdenes de compra de un proveedor
  async getPurchaseOrders(req, res) {
    try {
      const filters = {
        status: req.query.status,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: parseInt(req.query.limit) || 50
      };

      const orders = await Supplier.getPurchaseOrders(req.params.id, filters);
      res.json({ data: orders });
    } catch (error) {
      console.error('Error obteniendo órdenes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener productos de un proveedor
  async getProducts(req, res) {
    try {
      const filters = {
        status: req.query.status,
        name: req.query.name,
        limit: parseInt(req.query.limit) || 50
      };

      const products = await Supplier.getProducts(req.params.id, filters);
      res.json({ data: products });
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener estadísticas de un proveedor
  async getStats(req, res) {
    try {
      const stats = await Supplier.getStats(req.params.id);
      res.json({ data: stats });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener mejores proveedores
  async getTopSuppliers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const suppliers = await Supplier.getTopSuppliers(limit);
      res.json({ data: suppliers });
    } catch (error) {
      console.error('Error obteniendo top proveedores:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener proveedores con pagos pendientes
  async getPendingPayments(req, res) {
    try {
      const suppliers = await Supplier.getSuppliersWithPendingPayments();
      res.json({ data: suppliers });
    } catch (error) {
      console.error('Error obteniendo pagos pendientes:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = supplierController;
