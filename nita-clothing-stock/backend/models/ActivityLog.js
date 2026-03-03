const db = require('../config/database');

const ActivityLog = {
  // Campos sensibles que no deben guardarse en el log
  SENSITIVE_FIELDS: ['password', 'token', 'secret', 'last_login', 'recovery_token', 'jwt', 'contrasena', 'contraseña'],

  // Filtrar objetos para remover datos sensibles
  maskSensitiveData(obj) {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;

    // Clonar para no afectar el objeto original
    const masked = Array.isArray(obj) ? [...obj] : { ...obj };

    Object.keys(masked).forEach(key => {
      const lowerKey = key.toLowerCase();
      // Verificamos si la clave contiene alguno de los términos sensibles
      if (this.SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        masked[key] = '[HIDDEN/REDACTED]';
      } else if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    });

    return masked;
  },

  // Registrar actividad
  async create(data, connection = null) {
    const { user_id, action, table_name, record_id, old_value, new_value, ip_address } = data;

    // Aplicar máscara de seguridad a los valores antes de guardar
    // Nos aseguramos de manejar casos donde sean ya strings de JSON
    let processedOld = old_value;
    let processedNew = new_value;

    try {
      if (old_value && typeof old_value === 'object') {
        processedOld = this.maskSensitiveData(old_value);
      }
      if (new_value && typeof new_value === 'object') {
        processedNew = this.maskSensitiveData(new_value);
      }
    } catch (e) {
      console.error('[ActivityLog] Error al enmascarar datos:', e.message);
    }

    const query = `
      INSERT INTO activity_log (user_id, action, table_name, record_id, old_value, new_value, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await db.run(query, [
      user_id || null,
      action || null,
      table_name || null,
      record_id || null,
      processedOld ? (typeof processedOld === 'string' ? processedOld : JSON.stringify(processedOld)) : null,
      processedNew ? (typeof processedNew === 'string' ? processedNew : JSON.stringify(processedNew)) : null,
      ip_address || null
    ], connection);

    return result.insertId;
  },

  // Obtener logs con filtros
  async findAll(filters = {}, connection = null) {
    let query = `
      SELECT al.*, u.email as user_email, u.nombre as user_name
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

    return await db.all(query, params, connection);
  },

  // Obtener logs por usuario
  async findByUser(userId, limit = 50, connection = null) {
    const query = `
      SELECT * FROM activity_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    return await db.all(query, [userId, limit], connection);
  },

  // Obtener logs por tabla y registro
  async findByRecord(tableName, recordId, connection = null) {
    const query = `
      SELECT al.*, u.email as user_email, u.nombre as user_name
      FROM activity_log al
      LEFT JOIN usuarios u ON al.user_id = u.id
      WHERE al.table_name = ? AND al.record_id = ?
      ORDER BY al.created_at DESC
    `;
    return await db.all(query, [tableName, recordId], connection);
  },

  // Estadísticas de actividad
  async getStats(connection = null) {
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
    return await db.all(query, [], connection);
  }
};

module.exports = ActivityLog;
