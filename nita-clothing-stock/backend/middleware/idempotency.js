const db = require('../config/database');

/**
 * Middleware para manejar idempotencia en requests de mutación
 * Requiere el header 'Idempotency-Key'
 */
const idempotency = async (req, res, next) => {
    // Solo aplicar a métodos que mutan datos
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return next();
    }

    const key = req.headers['idempotency-key'];
    if (!key) {
        return next(); // Si no hay key, procedemos normal (opcional: forzarlo)
    }

    try {
        // Verificar si la key ya existe
        const [rows] = await db.query(
            'SELECT response_status, response_body FROM idempotency_keys WHERE idempotency_key = ?',
            [key]
        );

        if (rows.length > 0) {
            const cached = rows[0];
            console.log(`[IDEMPOTENCY] Retornando respuesta cacheada para key: ${key}`);
            return res.status(cached.response_status).json(JSON.parse(cached.response_body));
        }

        // Si no existe, interceptamos la respuesta para guardarla
        const originalSend = res.send;
        res.send = function (body) {
            const responseBody = body;
            const responseStatus = res.statusCode;

            // Guardar en segundo plano para no bloquear al cliente
            db.query(
                'INSERT INTO idempotency_keys (idempotency_key, user_id, response_status, response_body, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))',
                [key, req.user ? req.user.id : null, responseStatus, responseBody]
            ).catch(err => console.error('[IDEMPOTENCY] Error guardando key:', err));

            return originalSend.call(this, body);
        };

        next();
    } catch (error) {
        console.error('[IDEMPOTENCY] Error middleware:', error);
        next();
    }
};

module.exports = idempotency;
