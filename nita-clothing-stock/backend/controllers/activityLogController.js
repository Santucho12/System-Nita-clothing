const ActivityLog = require('../models/ActivityLog');
const { authorizeRole } = require('../middleware/auth');

// Obtener logs con filtros
exports.getLogs = [
  authorizeRole('admin', 'supervisor'),
  async (req, res, next) => {
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
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
];

// Obtener logs de un usuario
exports.getLogsByUser = [
  authorizeRole('admin', 'supervisor'),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;

      const logs = await ActivityLog.findByUser(userId, limit ? parseInt(limit) : 50);
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
];

// Obtener logs de un registro específico
exports.getLogsByRecord = [
  authorizeRole('admin', 'supervisor'),
  async (req, res, next) => {
    try {
      const { table, recordId } = req.params;

      const logs = await ActivityLog.findByRecord(table, recordId);
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }
];

// Obtener estadísticas de actividad
exports.getStats = [
  authorizeRole('admin'),
  async (req, res, next) => {
    try {
      const stats = await ActivityLog.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
];
