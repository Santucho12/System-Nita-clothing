# ✅ Implementación: Recepción de Órdenes con Incremento Automático de Stock

## 🎯 Funcionalidad Implementada

### Nuevo Método: `receiveOrder(id, userId)`

**Ubicación**: `backend/models/PurchaseOrder.js`

#### Características:
1. ✅ **Validaciones**:
   - Verifica que la orden existe
   - No permite recibir órdenes ya recibidas
   - No permite recibir órdenes canceladas

2. ✅ **Incremento de Stock**:
   - Itera todos los items de la orden
   - Incrementa stock de cada producto
   - Actualiza costo del producto con el nuevo costo de compra
   - Maneja productos no encontrados (skip con warning)

3. ✅ **Activity Log**:
   - Registra cambio en cada producto (old_value → new_value)
   - Registra recepción de la orden completa
   - Trackea: stock anterior, stock nuevo, cantidad agregada, ID de orden

4. ✅ **Notificaciones en Tiempo Real**:
   - Alerta cuando se reabasteció stock bajo o agotado
   - Notifica orden recibida con detalles (proveedor, monto, items)
   - Usa WebSocket para notificaciones instantáneas

5. ✅ **Respuesta Detallada**:
   ```javascript
   {
     success: true,
     message: "Orden recibida exitosamente. X producto(s) actualizado(s).",
     order: {...},  // Orden actualizada
     stock_updates: [  // Detalle de cambios
       {
         product_id: 1,
         product_name: "Remera Básica",
         old_stock: 5,
         new_stock: 25,
         quantity_added: 20
       }
     ]
   }
   ```

---

## 🔌 Nuevo Endpoint

**POST** `/api/ordenes-compra/:id/receive`

### Autorización:
- Requiere autenticación (JWT)
- Solo roles: `admin`, `supervisor`

### Ejemplo de Uso:
```bash
POST http://localhost:3000/api/ordenes-compra/123/receive
Authorization: Bearer <token>
```

### Respuesta Exitosa:
```json
{
  "success": true,
  "message": "Orden recibida exitosamente. 3 producto(s) actualizado(s).",
  "data": {
    "id": 123,
    "status": "received",
    "received_date": "2026-01-13T...",
    "items": [...]
  },
  "stock_updates": [
    {
      "product_id": 1,
      "product_name": "Producto A",
      "old_stock": 10,
      "new_stock": 30,
      "quantity_added": 20
    }
  ]
}
```

### Errores Posibles:
- `404`: Orden no encontrada
- `400`: Orden ya fue recibida
- `400`: No se puede recibir orden cancelada
- `403`: Sin permisos (no es admin/supervisor)

---

## 📊 Flujo Completo

### 1. Usuario hace click en "Marcar como Recibida"
```javascript
// Frontend
const receiveOrder = async (orderId) => {
  try {
    const response = await api.post(`/ordenes-compra/${orderId}/receive`);
    alert(response.data.message);
    // Mostrar stock_updates en tabla
  } catch (error) {
    alert(error.response?.data?.error || 'Error al recibir orden');
  }
};
```

### 2. Backend procesa la orden
1. Valida estado de la orden
2. Obtiene todos los items
3. Para cada item:
   - Busca el producto
   - Calcula nuevo stock (old + quantity)
   - Actualiza producto en BD
   - Registra en activity_log
   - Agrega a array de cambios
4. Actualiza orden a "received"
5. Registra recepción en activity_log
6. Envía notificaciones WebSocket

### 3. Notificaciones automáticas
- 📦 "Stock Reabastecido" para productos que estaban bajo/sin stock
- ✅ "Orden Recibida" con resumen (proveedor, monto, cantidad items)

---

## 🗃️ Base de Datos

### Tabla `purchase_orders`:
- Columna `status` se actualiza a `'received'`
- Columna `received_date` se establece con fecha/hora actual

### Tabla `products`:
- Columna `stock_quantity` se incrementa
- Columna `cost_price` se actualiza con nuevo costo

### Tabla `activity_log`:
- Múltiples registros:
  - Uno por cada producto actualizado
  - Uno para la orden recibida
- Permite auditoría completa del proceso

---

## 🧪 Testing

### Caso 1: Orden Pendiente → Recibida
```javascript
// Estado inicial
Orden ID: 1, Status: "pending"
Producto A: stock = 10
Producto B: stock = 5

// Orden contiene:
- Producto A: 20 unidades @ $100
- Producto B: 15 unidades @ $50

// Después de recibir
Orden ID: 1, Status: "received"
Producto A: stock = 30, cost = $100
Producto B: stock = 20, cost = $50

// Activity logs creados: 3
// Notificaciones enviadas: 2
```

### Caso 2: Orden Ya Recibida
```javascript
// Input
POST /api/ordenes-compra/1/receive

// Output (Error 400)
{
  "success": false,
  "error": "Esta orden ya fue recibida anteriormente"
}
```

### Caso 3: Producto No Existe
```javascript
// Orden contiene producto ID: 999 (no existe)
// Output: Warning en consola, continúa con otros productos
// stock_updates solo incluye productos exitosos
```

---

## 📝 Logs de Ejemplo

### Activity Log - Producto Actualizado:
```json
{
  "user_id": 1,
  "action": "receive_purchase_order",
  "table_name": "products",
  "record_id": 123,
  "old_value": "{\"stock\":10,\"cost\":90}",
  "new_value": "{\"stock\":30,\"cost\":100,\"purchase_order_id\":1,\"quantity_added\":20}",
  "created_at": "2026-01-13T..."
}
```

### Activity Log - Orden Recibida:
```json
{
  "user_id": 1,
  "action": "receive_purchase_order",
  "table_name": "purchase_orders",
  "record_id": 1,
  "old_value": "{\"status\":\"pending\"}",
  "new_value": "{\"status\":\"received\",\"received_date\":\"2026-01-13T...\",\"stock_updates\":[...]}",
  "created_at": "2026-01-13T..."
}
```

---

## 🎨 Frontend (Pendiente)

### Botón en Detalle de Orden:
```jsx
{order.status !== 'received' && order.status !== 'cancelled' && (
  <button 
    onClick={() => handleReceiveOrder(order.id)}
    className="btn-receive"
  >
    ✅ Marcar como Recibida
  </button>
)}
```

### Modal de Confirmación:
```jsx
<Modal show={showConfirm} onClose={() => setShowConfirm(false)}>
  <h3>¿Confirmar recepción de orden?</h3>
  <p>Se incrementará el stock de {order.items.length} producto(s)</p>
  <button onClick={confirmReceive}>Confirmar</button>
</Modal>
```

### Tabla de Stock Updates:
```jsx
{stockUpdates.length > 0 && (
  <div className="stock-updates">
    <h4>Stock Actualizado:</h4>
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Stock Anterior</th>
          <th>Cantidad Agregada</th>
          <th>Stock Nuevo</th>
        </tr>
      </thead>
      <tbody>
        {stockUpdates.map(update => (
          <tr key={update.product_id}>
            <td>{update.product_name}</td>
            <td>{update.old_stock}</td>
            <td>+{update.quantity_added}</td>
            <td><strong>{update.new_stock}</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

---

## ✅ Checklist de Implementación

- [x] Método `receiveOrder` en modelo PurchaseOrder
- [x] Validaciones de estado de orden
- [x] Incremento de stock por producto
- [x] Actualización de costo de producto
- [x] Activity log por producto
- [x] Activity log de orden recibida
- [x] Notificaciones en tiempo real
- [x] Endpoint POST /ordenes-compra/:id/receive
- [x] Autorización (admin/supervisor)
- [x] Manejo de errores
- [x] Respuesta detallada con stock_updates
- [ ] Frontend: Botón "Marcar como Recibida" (PENDIENTE)
- [ ] Frontend: Modal de confirmación (PENDIENTE)
- [ ] Frontend: Tabla de stock updates (PENDIENTE)

---

## 🚀 Estado: BACKEND COMPLETO ✅

La funcionalidad de recepción de órdenes está completamente implementada en el backend. Solo falta agregar los botones y UI en el frontend para usar la funcionalidad.

**Próximo paso**: Crear componente frontend para órdenes de compra con botón de recepción.
