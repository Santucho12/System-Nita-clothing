/**
 * Middleware centralizado para manejo de errores
 * Estandariza la respuesta de error para el frontend
 */
const errorHandler = (err, req, res, next) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    console.error(`[ERROR] ${req.method} ${req.url}:`, {
        message: err.message,
        status: err.status || err.statusCode,
        stack: err.stack
    });

    // Si los encabezados ya fueron enviados, delegar al manejador por defecto de express
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(statusCode).json({
        success: false,
        message: message,
        error: isDevelopment ? err.toString() : 'Ha ocurrido un error en el servidor',
        stack: isDevelopment ? err.stack : undefined
    });
};

module.exports = errorHandler;
