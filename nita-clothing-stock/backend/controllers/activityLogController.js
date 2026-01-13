const ActivityLog = require('../models/ActivityLog');
const { requireRole } = require('../middleware/roleCheck');

// Obtener logs con filtros
exports.getLogs = [
  requireRole('admin', 'supervisor'),
  async (req, res) => {
    try {
      const { user_id, action, table_name, date_from, date_to, limit } = req.query;
      
      const filters = {};
      if (user_id) filters.user_id = user_id;
      if (action) filters.action = action;
      if (table_name) filters.table_name = table_name;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;
      if (limit) filters.limit = parseInt(limit);

      const logs = await ActivityLog.findAll(filters);
      res.json(logs);
    } catch (error) {
      console.error('Error obteniendo logs:', error);
      res.status(500).json({ message: 'Error al obtener logs', error: error.message });
    }
  }
];

// Obtener logs de un usuario
exports.getLogsByUser = [
  requireRole('admin', 'supervisor'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      
      const logs = await ActivityLog.findByUser(userId, limit ? parseInt(limit) : 50);
      res.json(logs);
    } catch (error) {
      console.error('Error obteniendo logs del usuario:', error);
      res.status(500).json({ message: 'Error al obtener logs', error: error.message });
    }
  }
];

// Obtener logs de un registro específico
exports.getLogsByRecord = [
  requireRole('admin', 'supervisor'),
  async (req, res) => {
    try {
      const { table, recordId } = req.params;
      
      const logs = await ActivityLog.findByRecord(table, recordId);
      res.json(logs);
    } catch (error) {
      console.error('Error obteniendo logs del registro:', error);
      res.status(500).json({ message: 'Error al obtener logs', error: error.message });
    }
  }
];

// Obtener estadísticas de actividad
exports.getStats = [
  requireRole('admin'),
  async (req, res) => {
    try {
      const stats = await ActivityLog.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
  }
];
