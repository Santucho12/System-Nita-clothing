// Middleware para verificar roles y permisos

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

// Verificar si el usuario tiene el rol requerido
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const userRole = req.user.role || 'vendedor';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para realizar esta acción',
        required_role: allowedRoles,
        your_role: userRole
      });
    }

    next();
  };
};

// Verificar permiso específico
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const userRole = req.user.role || 'vendedor';
    const userPermissions = permissions[userRole] || {};
    const resourcePermissions = userPermissions[resource] || [];

    if (!resourcePermissions.includes(action)) {
      return res.status(403).json({ 
        message: `No tienes permiso para ${action} en ${resource}`,
        required_permission: `${resource}:${action}`,
        your_role: userRole
      });
    }

    next();
  };
};

// Verificar si puede ver costos
const canSeeCosts = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const userRole = req.user.role || 'vendedor';
  
  if (userRole === 'vendedor') {
    return res.status(403).json({ 
      message: 'No tienes permiso para ver costos y ganancias' 
    });
  }

  next();
};

// Obtener permisos del usuario
const getUserPermissions = (role) => {
  return permissions[role] || permissions.vendedor;
};

module.exports = {
  requireRole,
  requirePermission,
  canSeeCosts,
  getUserPermissions,
  permissions
};
