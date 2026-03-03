# Auditoría de Sistema Nita Clothing — Marzo 2026 (v2.0)

Esta auditoría detalla el estado actual del sistema después de las últimas mejoras, identificando áreas críticas que aún requieren atención.

## 🔴 Riesgos Críticos (Integridad de Datos)

### 1. Falta de Transacciones en Ventas
- **Problema**: El método `Sale.createWithItems` realiza múltiples operaciones (crear sección venta, insertar 5-10 items, actualizar stock de cada producto).
- **Riesgo**: Si el sistema falla en el item 3, la venta queda "rota" (el total no coincide con los items registrados o el stock se descuenta solo de algunos productos).
- **Recomendación**: Implementar `START TRANSACTION` / `COMMIT` / `ROLLBACK`.

### 2. Gestión de Imágenes Frágil
- **Problema**: El borrado de imágenes usa `path.basename(img)` y asume que están en `uploads/`. Si se cambia la estructura de carpetas o se usan nombres duplicados en carpetas distintas, puede borrar el archivo equivocado o fallar.

---

## 📊 Mejoras en Reportes y Dashboard

### 3. Simulaciones en Reportes Avanzados (Frontend)
- **Problema**: `AdvancedReports.js` todavía usa `generateAdditionalData()` (Math.random) para la **Distribución Horaria** y **Métodos de Pago**.
- **Acción**: Conectar con los nuevos endpoints del backend (`/api/reportes/daily-sales` y `/api/reportes/payment-methods`).

### 4. Segmentación de Clientes Bloqueada
- **Problema**: El frontend `Customers.js` tiene un botón de Segmentación que muestra un cartel de "Próximamente", pero el backend ya tiene la lógica de segmentación (VIP, Regular, etc.) lista.

### 5. Superposición de Módulos de Reportes
- **Problema**: Existen `Reports.js` (Chart.js) y `AdvancedReports.js` (Recharts). Esto genera confusión y mantenimiento doble de estilos.
- **Acción**: Migrar todo lo útil de `Reports.js` a `AdvancedReports.js` y consolidar.

---

## ⚙️ Deuda Técnica y Rendimiento

### 6. Log de Actividad Voluminoso
- **Problema**: El `activityLogger` guarda el `req.body` completo en cada acción. En una carga masiva de productos con imágenes, esto puede guardar megabytes de texto innecesario en la base de datos.
- **Acción**: Filtrar o limitar el tamaño del log.

### 7. Optimización de Base de Datos
- **Problema**: Faltan índices en columnas de búsqueda frecuente:
  - `ventas.customer_email`
  - `ventas.status`
  - `venta_items.product_id`
- **Impacto**: El historial de ventas se volverá lento cuando existan más de 5000 registros.

---

## 📝 Conclusión
El sistema es funcional y estable para el uso diario, pero para un entorno de alta carga "Producción Real", la implementación de **transacciones** y la **limpieza de simulaciones en el frontend** son los siguientes pasos naturales.
