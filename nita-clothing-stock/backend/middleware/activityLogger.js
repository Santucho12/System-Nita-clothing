const ActivityLog = require('../models/ActivityLog');

// Middleware para registrar actividades automáticamente
const logActivity = (action, tableName) => {
  return async (req, res, next) => {
    // Guardar el método original de res.json
    const originalJson = res.json.bind(res);

    // Override res.json para capturar la respuesta
    res.json = function (data) {
      // Solo registrar si fue exitoso
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Función para truncar valores largos (ej: imágenes en base64)
        const truncate = (val) => {
          if (!val) return null;
          const str = typeof val === 'string' ? val : JSON.stringify(val);
          return str.length > 1000 ? str.substring(0, 1000) + '... (truncado)' : str;
        };

        const logData = {
          user_id: req.user?.id || null,
          action: action || req.method,
          table_name: tableName || req.baseUrl.split('/').pop(),
          record_id: data?.id || req.params?.id || null,
          old_value: truncate(req.body?.old_value),
          new_value: truncate(req.body || data),
          ip_address: req.ip || req.connection.remoteAddress
        };

        // Registrar de forma asíncrona sin bloquear la respuesta
        ActivityLog.create(logData).catch(err => {
          console.error('Error logging activity:', err);
        });
      }

      // Llamar al json original
      return originalJson(data);
    };

    next();
  };
};

// Helper para registrar manualmente
const logManual = async (req, action, tableName, recordId, oldValue, newValue) => {
  try {
    await ActivityLog.create({
      user_id: req.user?.id || null,
      action,
      table_name: tableName,
      record_id: recordId,
      old_value: oldValue,
      new_value: newValue,
      ip_address: req.ip || req.connection.remoteAddress
    });
  } catch (error) {
    console.error('Error logging activity manually:', error);
  }
};

module.exports = { logActivity, logManual };
