# Reporte de Auditoría Integral - Sistema Nita Clothing (Fase 3)

Este documento detalla los hallazgos tras una revisión exhaustiva de "punta a punta" enfocada en la robustez, seguridad y mantenibilidad del sistema.

## 1. Hallazgos Críticos (Acción Inmediata)

### 🚨 Fallo de Integridad Transaccional en Ventas
Se ha confirmado que el método `Sale.createWithItems` inicia una transacción pero **no propaga la conexión** en todas sus consultas internas (validación de stock, creación de cliente, etc.).
- **Impacto**: Las ventas pueden quedar en estados inconsistentes si ocurre un error a mitad del proceso, ya que el `rollback` no afectará a las consultas ejecutadas fuera de la conexión transaccional.
- **Ubicación**: `backend/models/Sale.js` (Líneas 134, 146, 172, 205).

### 🚨 Inconsistencia en Gestión de Borrado (Hard vs Soft Delete)
- **Productos y Categorías**: Usan `DELETE` real de la base de datos.
- **Impacto**: Se pierde el historial de auditoría y se pueden generar errores de integridad referencial en consultas históricas de venta que apunten a IDs que ya no existen.
- **Recomendación**: Migrar todo a Soft Delete (`status = 'deleted'`).

## 2. Hallazgos de Infraestructura y Backend

### Inconsistencia en Manejo de Errores
Los controladores no tienen un formato estandarizado de respuesta para errores, lo que causa fallos silenciosos o errores inesperados en el frontend al intentar parsear mensajes inexistentes.
- **Propuesta**: Crear un middleware `errorHandler.js` centralizado.

### Gestión Ineficiente de Archivos (Imágenes)
La lógica de eliminación de archivos está duplicada entre modelos y controladores, y no hay un proceso automático para limpiar imágenes "huérfanas" cuando falla una subida o se sobreescribe un producto.

### Redundancia en Lógica de Permisos
Existe una duplicidad entre `auth.js` (JWT) y `roleCheck.js` (RBAC). Ambos middleware intentan gestionar roles pero de forma desconectada.

## 3. Hallazgos de Frontend y UX

### API URL Hardcodeada
El servicio `frontend/src/services/api.js` apunta directamente a `localhost:5000`.
- **Riesgo**: Bloquea el despliegue en entornos de producción.

### Falta de Estado Global Reactivo para Autenticación
El sistema depende de `localStorage.getItem('token')` en lugar de un `AuthContext`.
- **Impacto**: El cambio de estado de sesión no refresca la UI automáticamente, requiriendo recargas de página manuales en algunos casos.

### Redundancia en Servicios
Los servicios de API tienen bloques `try-catch` que replican el comportamiento del interceptor de Axios, aumentando la carga de mantenimiento del código.

## 4. Próximos Pasos Recomendados

1. **Unificación de Transacciones**: Refactorizar `Database.js` para que la propagación de conexiones sea obligatoria en transacciones.
2. **Middleware de Errores Centralizado**: Estandarizar todas las fallas de API.
3. **Implementación Global de Soft Delete**: Asegurar que ningún dato histórico se pierda.
4. **Refactorización de Servicios Frontend**: Limpiar la API y usar variables de entorno para la URL del servidor.
