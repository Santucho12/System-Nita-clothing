const db = require('../config/database');

const ActivityLog = {
  // Registrar actividad
  async create(data) {
    const { user_id, action, table_name, record_id, old_value, new_value, ip_address } = data;
    
    const query = `
      INSERT INTO activity_log (user_id, action, table_name, record_id, old_value, new_value, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await db.run(query, [
      user_id,
      action,
      table_name,
      record_id || null,
      old_value ? JSON.stringify(old_value) : null,
      new_value ? JSON.stringify(new_value) : null,
      ip_address || null
    ]);
    
    return result.lastID;
  },

  // Obtener logs con filtros
  async findAll(filters = {}) {
    let query = `
      SELECT al.*, u.email as user_email, u.full_name as user_name
      FROM activity_log al
      LEFT JOIN usuarios u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.action) {
      query += ' AND al.action = ?';
      params.push(filters.action);
    }

    if (filters.table_name) {
      query += ' AND al.table_name = ?';
      params.push(filters.table_name);
    }

    if (filters.date_from) {
      query += ' AND DATE(al.created_at) >= ?';
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ' AND DATE(al.created_at) <= ?';
      params.push(filters.date_to);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(filters.limit || 100);

    return await db.all(query, params);
  },

  // Obtener logs por usuario
  async findByUser(userId, limit = 50) {
    const query = `
      SELECT * FROM activity_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return await db.all(query, [userId, limit]);
  },

  // Obtener logs por tabla y registro
  async findByRecord(tableName, recordId) {
    const query = `
      SELECT al.*, u.email as user_email, u.full_name as user_name
      FROM activity_log al
      LEFT JOIN usuarios u ON al.user_id = u.id
      WHERE al.table_name = ? AND al.record_id = ?
      ORDER BY al.created_at DESC
    `;
    return await db.all(query, [tableName, recordId]);
  },

  // Estadísticas de actividad
  async getStats() {
    const query = `
      SELECT 
        action,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM activity_log
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY action, DATE(created_at)
      ORDER BY date DESC, count DESC
    `;
    return await db.all(query, []);
  }
};

module.exports = ActivityLog;
