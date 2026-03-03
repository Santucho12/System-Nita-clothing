const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwtConfig');

// Matriz de permisos por rol (Consolidado de roleCheck.js)
const permissions = {
    admin: {
        productos: ['create', 'read', 'update', 'delete'],
        ventas: ['create', 'read', 'update', 'delete'],
        clientes: ['create', 'read', 'update', 'delete'],
        reportes: ['read'],
        proveedores: ['create', 'read', 'update', 'delete'],
        usuarios: ['create', 'read', 'update', 'delete'],
        configuracion: ['read', 'update'],
        costos: ['read'],
        ganancias: ['read']
    },
    supervisor: {
        productos: ['create', 'read', 'update'],
        ventas: ['create', 'read', 'update'],
        clientes: ['create', 'read', 'update'],
        reportes: ['read'],
        proveedores: ['read'],
        usuarios: ['read'],
        configuracion: ['read'],
        costos: ['read'],
        ganancias: ['read']
    },
    vendedor: {
        productos: ['read'],
        ventas: ['create', 'read'],
        clientes: ['create', 'read', 'update'],
        reportes: [],
        proveedores: [],
        usuarios: [],
        configuracion: [],
        costos: [],
        ganancias: []
    }
};

/**
 * Autenticación vía JWT
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const error = new Error('Token requerido para acceder a este recurso');
        error.status = 401;
        return next(error);
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        const error = new Error('Sesión inválida o expirada');
        error.status = 401;
        next(error);
    }
};

/**
 * Autorización por rol
 */
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            const error = new Error('Usuario no autenticado');
            error.status = 401;
            return next(error);
        }
        const userRole = req.user.role || 'vendedor';
        if (!allowedRoles.includes(userRole)) {
            const error = new Error(`Acceso denegado: Se requiere rol ${allowedRoles.join(' o ')}`);
            error.status = 403;
            return next(error);
        }
        next();
    };
};

/**
 * Autorización por permiso específico
 */
const authorizePermission = (resource, action) => {
    return (req, res, next) => {
        if (!req.user) {
            const error = new Error('Usuario no autenticado');
            error.status = 401;
            return next(error);
        }
        const userRole = req.user.role || 'vendedor';
        const userPermissions = permissions[userRole] || {};
        const resourcePermissions = userPermissions[resource] || [];

        if (!resourcePermissions.includes(action)) {
            const error = new Error(`Acceso denegado: No tienes permiso para ${action} en ${resource}`);
            error.status = 403;
            return next(error);
        }
        next();
    };
};

module.exports = {
    authenticate,
    authorizeRole,
    authorizePermission,
    authMiddleware: authenticate, // Alias para compatibilidad
    authorizeRoles: authorizeRole, // Alias para compatibilidad
    getUserPermissions: (role) => permissions[role] || permissions.vendedor,
    permissions
};
