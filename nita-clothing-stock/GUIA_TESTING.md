# GUÍA DE TESTING - SISTEMA NITA CLOTHING

## 🧪 LISTA DE PRUEBAS MANUALES

### PREPARACIÓN
1. **Backend corriendo**: http://localhost:3000
2. **Frontend corriendo**: http://localhost:3001
3. **MySQL activo**: Base de datos 'nita' con datos de prueba
4. **Usuario de prueba**: admin@nitaclothing.com / admin123

---

## 📋 TESTS POR MÓDULO

### 1. AUTENTICACIÓN
- [ ] Login exitoso con credenciales correctas
- [ ] Login fallido con credenciales incorrectas
- [ ] Token persiste después de refresh
- [ ] Logout funciona y elimina token
- [ ] Rutas protegidas redirigen a login sin token

**Resultado esperado**: Sistema de autenticación funcional y seguro

---

### 2. CATEGORÍAS
- [ ] Ver lista de categorías
- [ ] Crear nueva categoría
- [ ] Editar categoría existente
- [ ] Eliminar categoría (solo si no tiene productos)
- [ ] Buscar categorías por nombre
- [ ] Validación: nombre requerido

**Resultado esperado**: CRUD completo funcional

---

### 3. PRODUCTOS
- [ ] Ver lista de productos con paginación
- [ ] Crear producto nuevo con todos los campos
- [ ] Editar producto existente
- [ ] Eliminar producto
- [ ] Buscar por SKU, nombre, categoría
- [ ] Filtrar por categoría, stock, estado
- [ ] **Exportar a Excel** - verificar que descarga archivo .xlsx
- [ ] Validaciones: SKU único, precios positivos

**Resultado esperado**: Gestión completa de productos + exportación

---

### 4. VENTAS - REGISTRO
- [ ] Seleccionar producto y agregar al carrito
- [ ] Modificar cantidad de producto
- [ ] Eliminar producto del carrito
- [ ] Aplicar descuento manual
- [ ] Seleccionar método de pago
- [ ] Completar venta
- [ ] Verificar actualización de stock después de venta
- [ ] Imprimir recibo

**Resultado esperado**: Flujo completo de venta funcional

---

### 5. VENTAS - HISTORIAL
- [ ] Ver lista de todas las ventas
- [ ] Filtrar por fecha (desde/hasta)
- [ ] Filtrar por método de pago
- [ ] Ver detalles de una venta específica
- [ ] Buscar venta por cliente

**Resultado esperado**: Historial accesible y filtrable

---

### 6. CLIENTES
- [ ] Ver lista de clientes
- [ ] Crear nuevo cliente
- [ ] Editar cliente existente
- [ ] Eliminar cliente
- [ ] Buscar por nombre/email/teléfono
- [ ] Ver historial de compras del cliente
- [ ] Validación: email válido, teléfono formato correcto

**Resultado esperado**: Gestión completa de clientes

---

### 7. RESERVAS
- [ ] Crear nueva reserva
- [ ] Seleccionar cliente existente
- [ ] Agregar productos a la reserva
- [ ] Establecer fecha de expiración
- [ ] Ver lista de reservas con filtros de estado
- [ ] **Convertir reserva a venta**
- [ ] Cancelar reserva
- [ ] Verificar que reservas próximas a vencer aparecen en Alertas

**Resultado esperado**: Sistema de reservas completo con conversión a venta

---

### 8. CAMBIOS Y DEVOLUCIONES
- [ ] Crear cambio/devolución
- [ ] Seleccionar venta original
- [ ] Elegir tipo (cambio, devolución, garantía)
- [ ] Agregar motivo
- [ ] Calcular reembolso
- [ ] Aprobar/rechazar cambio
- [ ] Completar cambio (actualiza stock)
- [ ] Ver historial con filtros

**Resultado esperado**: Gestión de cambios funcional

---

### 9. PROVEEDORES ⭐
- [ ] Ver lista de proveedores en grid
- [ ] Crear nuevo proveedor
- [ ] Editar proveedor
- [ ] Eliminar proveedor
- [ ] Buscar por nombre
- [ ] Cambiar estado (activo/inactivo)
- [ ] Validación: campos obligatorios

**Resultado esperado**: CRUD completo de proveedores

---

### 10. ÓRDENES DE COMPRA ⭐
- [ ] Crear nueva orden
- [ ] Seleccionar proveedor
- [ ] Agregar productos con cantidades y precios
- [ ] Guardar orden (estado: pendiente)
- [ ] Ver lista de órdenes con filtros
- [ ] Ver detalles de orden
- [ ] **Recibir orden** → verificar actualización de stock
- [ ] Cancelar orden
- [ ] Buscar órdenes por proveedor

**Resultado esperado**: Sistema completo de compras con actualización automática de stock

---

### 11. REPORTES ⭐
#### Tab: Ventas
- [ ] Ver gráfico de línea con ventas diarias del mes
- [ ] Verificar stats: ventas del día, mes, año
- [ ] Verificar total de transacciones
- [ ] Verificar ticket promedio

#### Tab: Productos
- [ ] Ver gráfico de barras con top 10 productos vendidos
- [ ] Ver tabla de top 5 con mayor ganancia
- [ ] Ver productos con bajo stock

#### Tab: Ganancias
- [ ] Ver estadísticas de márgenes
- [ ] Verificar ROI
- [ ] Verificar total de ganancias

#### Tab: Categorías
- [ ] Ver gráfico de pastel con distribución de ganancias
- [ ] Ver tasas de rotación por categoría

**Resultado esperado**: Todos los gráficos cargando correctamente con datos reales

---

### 12. ALERTAS ⭐
#### Tab: Stock Bajo
- [ ] Ver productos con cantidad < stock_mínimo
- [ ] Click navega al producto

#### Tab: Sin Stock
- [ ] Ver productos con cantidad = 0
- [ ] Verificar indicador de cantidad

#### Tab: Reservas por Vencer
- [ ] Ver reservas que expiran en 48 horas
- [ ] Verificar countdown de horas

#### Tab: Sin Movimiento
- [ ] Ver productos sin ventas en 60 días
- [ ] Verificar días sin movimiento

#### General
- [ ] Verificar auto-refresh cada 5 minutos
- [ ] Verificar contador total animado
- [ ] Verificar badges de cantidad

**Resultado esperado**: Sistema de alertas funcional con auto-refresh

---

### 13. BÚSQUEDA GLOBAL ⭐
- [ ] Escribir en buscador (navbar)
- [ ] Verificar debounce (espera 300ms)
- [ ] Buscar producto por nombre → debe aparecer en sección "Productos"
- [ ] Buscar venta por ID → debe aparecer en sección "Ventas"
- [ ] Buscar cliente por nombre → debe aparecer en sección "Clientes"
- [ ] Buscar proveedor → debe aparecer en sección "Proveedores"
- [ ] Click en resultado navega correctamente
- [ ] Verificar indicador de carga
- [ ] Verificar contador de resultados

**Resultado esperado**: Búsqueda universal funcional con navegación

---

### 14. TEMA OSCURO ⭐
- [ ] Click en botón de toggle (sol/luna)
- [ ] Verificar cambio de tema inmediato
- [ ] Verificar que se aplica a TODOS los componentes:
  - [ ] Navigation
  - [ ] Dashboard
  - [ ] Productos
  - [ ] Ventas
  - [ ] Clientes
  - [ ] Reservas
  - [ ] Cambios
  - [ ] Proveedores
  - [ ] Órdenes
  - [ ] Reportes (incluye gráficos)
  - [ ] Alertas
  - [ ] Promociones
- [ ] Refresh página → tema persiste
- [ ] Verificar contraste legible en ambos temas
- [ ] Verificar transiciones suaves

**Resultado esperado**: Dark mode funcional con persistencia

---

### 15. EXPORTACIÓN EXCEL ⭐
- [ ] Ir a Productos
- [ ] Click en botón "Exportar Excel"
- [ ] Verificar descarga de archivo .xlsx
- [ ] Abrir archivo en Excel/LibreOffice
- [ ] Verificar columnas: SKU, Nombre, Categoría, Talla, Color, Stock, Precios, Estado
- [ ] Verificar datos correctos
- [ ] Verificar formato de números y monedas

**Resultado esperado**: Exportación funcional con datos formateados

---

### 16. PROMOCIONES ⭐
#### Crear Promoción
- [ ] Click en "Nueva Promoción"
- [ ] Ingresar nombre y descripción
- [ ] Seleccionar tipo de descuento (% o fijo)
- [ ] Ingresar valor del descuento
- [ ] Seleccionar aplica a (todos/categorías/productos)
- [ ] Si categorías: seleccionar categorías
- [ ] Si productos: seleccionar productos
- [ ] Establecer fechas inicio/fin (opcional)
- [ ] Guardar promoción

#### Gestión
- [ ] Ver promoción en grid con card
- [ ] Verificar badge de estado (activa/pausada/finalizada)
- [ ] Ver descuento formateado (% o $)
- [ ] Ver aplicación (todos/X categorías/X productos)
- [ ] Ver fechas de vigencia

#### Edición y Estados
- [ ] Editar promoción
- [ ] Pausar promoción activa
- [ ] Reactivar promoción pausada
- [ ] Eliminar promoción
- [ ] Finalizar promoción

#### Filtros
- [ ] Buscar por nombre
- [ ] Filtrar por estado (activa/pausada/finalizada)

**Resultado esperado**: Sistema completo de promociones funcional

---

## 🎨 TESTS DE UI/UX

### Responsive
- [ ] Abrir en Chrome DevTools
- [ ] Probar en Mobile (375px)
- [ ] Probar en Tablet (768px)
- [ ] Probar en Desktop (1024px, 1440px)
- [ ] Verificar Navigation en móvil
- [ ] Verificar grids se adaptan
- [ ] Verificar modales en móvil (95vw)
- [ ] Verificar tablas con scroll horizontal
- [ ] Verificar botones touch-friendly

### Cross-Browser
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (si disponible)

### Accesibilidad
- [ ] Navegación con Tab
- [ ] Contraste de colores (WCAG AA)
- [ ] Tooltips en botones
- [ ] Aria-labels presentes

---

## ⚡ TESTS DE PERFORMANCE

### Carga Inicial
- [ ] Frontend carga en < 3 segundos
- [ ] Backend responde en < 500ms
- [ ] No hay errores en consola

### Operaciones
- [ ] Búsqueda responde rápido (< 1s)
- [ ] Filtros actualizan instantáneamente
- [ ] Gráficos cargan sin delay visible
- [ ] Exportar Excel termina en < 2s
- [ ] Auto-refresh de alertas no interrumpe UX

### Optimización
- [ ] Verificar Network tab (cargas innecesarias)
- [ ] Verificar bundle size
- [ ] Lighthouse score > 80

---

## 🔒 TESTS DE SEGURIDAD

### Autenticación
- [ ] Token expira correctamente
- [ ] Rutas protegidas sin token redirigen
- [ ] Headers Authorization presentes
- [ ] Password hasheada en DB (no plain text)

### Validaciones
- [ ] Validaciones frontend funcionan
- [ ] Validaciones backend funcionan
- [ ] SQL injection protegido (prepared statements)
- [ ] XSS protegido

---

## 📝 CHECKLIST FINAL

### Funcionalidad
- [ ] ✅ Todos los CRUDs funcionan
- [ ] ✅ Flujo de venta completo
- [ ] ✅ Flujo de reserva a venta
- [ ] ✅ Flujo de orden de compra
- [ ] ✅ Aplicación de promociones
- [ ] ✅ Exportación funcional
- [ ] ✅ Búsqueda global funcional
- [ ] ✅ Alertas actualizándose
- [ ] ✅ Tema persiste

### UI/UX
- [ ] ✅ Diseño consistente
- [ ] ✅ Responsive en todos los tamaños
- [ ] ✅ Sin errores de layout
- [ ] ✅ Transiciones suaves
- [ ] ✅ Iconos apropiados

### Datos
- [ ] ✅ Datos persisten correctamente
- [ ] ✅ Relaciones DB funcionan
- [ ] ✅ No hay pérdida de datos
- [ ] ✅ Cálculos correctos

---

## 🎯 CRITERIOS DE ÉXITO

El sistema está listo para producción cuando:
1. ✅ Todos los módulos funcionan sin errores críticos
2. ✅ Responsive funciona en móviles reales
3. ✅ Performance aceptable (< 3s carga)
4. ✅ No hay vulnerabilidades críticas
5. ✅ Datos se guardan correctamente
6. ✅ UX es fluida y sin bloqueos

---

## 🐛 REPORTE DE BUGS

Si encuentras bugs, documentar:
- **Módulo**: ¿Dónde ocurrió?
- **Acción**: ¿Qué estabas haciendo?
- **Esperado**: ¿Qué debería pasar?
- **Obtenido**: ¿Qué pasó realmente?
- **Consola**: Errores en consola del navegador
- **Reproducible**: ¿Ocurre siempre?

---

## ✅ ESTADO ACTUAL

**Sistema al 95% de completitud**

Pendiente:
- 5% de testing exhaustivo con datos reales
- Optimizaciones finales
- Deployment en servidor de producción

**¡Casi terminado! 🚀**
