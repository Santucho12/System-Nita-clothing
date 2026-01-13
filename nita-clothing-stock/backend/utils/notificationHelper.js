const { broadcast, sendToUser, sendToRole, NotificationTypes } = require('../utils/websocket');

// Notificar nueva venta
exports.notifyNewSale = (saleData) => {
  const notification = {
    id: `sale-${saleData.id}-${Date.now()}`,
    type: NotificationTypes.NEW_SALE,
    title: '💰 Nueva Venta',
    message: `Venta #${saleData.sale_number} por $${parseFloat(saleData.total).toFixed(2)}`,
    data: saleData,
    timestamp: new Date().toISOString()
  };
  
  // Enviar a admins y supervisores
  sendToRole('admin', notification);
  sendToRole('supervisor', notification);
};

// Notificar stock bajo
exports.notifyLowStock = (product) => {
  const notification = {
    id: `stock-low-${product.id}-${Date.now()}`,
    type: NotificationTypes.LOW_STOCK,
    title: '⚠️ Stock Bajo',
    message: `${product.nombre} tiene solo ${product.cantidad} unidades`,
    data: product,
    timestamp: new Date().toISOString()
  };
  
  sendToRole('admin', notification);
  sendToRole('supervisor', notification);
};

// Notificar sin stock
exports.notifyNoStock = (product) => {
  const notification = {
    id: `stock-none-${product.id}-${Date.now()}`,
    type: NotificationTypes.NO_STOCK,
    title: '❌ Sin Stock',
    message: `${product.nombre} se quedó sin stock`,
    data: product,
    timestamp: new Date().toISOString()
  };
  
  broadcast(notification);
};

// Notificar nueva reserva
exports.notifyNewReservation = (reservation) => {
  const notification = {
    id: `reservation-${reservation.id}-${Date.now()}`,
    type: NotificationTypes.NEW_RESERVATION,
    title: '📌 Nueva Reserva',
    message: `Reserva creada para ${reservation.customer_email}`,
    data: reservation,
    timestamp: new Date().toISOString()
  };
  
  sendToRole('admin', notification);
  sendToRole('supervisor', notification);
};

// Notificar reserva por vencer
exports.notifyReservationExpiring = (reservation) => {
  const notification = {
    id: `reservation-exp-${reservation.id}-${Date.now()}`,
    type: NotificationTypes.RESERVATION_EXPIRING,
    title: '⏰ Reserva por Vencer',
    message: `Reserva #${reservation.id} vence pronto`,
    data: reservation,
    timestamp: new Date().toISOString()
  };
  
  broadcast(notification);
};

// Notificar nueva orden de compra
exports.notifyNewOrder = (order) => {
  const notification = {
    id: `order-${order.id}-${Date.now()}`,
    type: NotificationTypes.NEW_ORDER,
    title: '📦 Nueva Orden de Compra',
    message: `Orden #${order.order_number} creada por $${parseFloat(order.total).toFixed(2)}`,
    data: order,
    timestamp: new Date().toISOString()
  };
  
  sendToRole('admin', notification);
  sendToRole('supervisor', notification);
};

// Notificar orden recibida
exports.notifyOrderReceived = (order) => {
  const notification = {
    id: `order-received-${order.id}-${Date.now()}`,
    type: NotificationTypes.ORDER_RECEIVED,
    title: '✅ Orden Recibida',
    message: `Orden #${order.order_number} fue recibida`,
    data: order,
    timestamp: new Date().toISOString()
  };
  
  broadcast(notification);
};

// Notificar cambio/devolución
exports.notifyExchangeReturn = (exchangeReturn) => {
  const notification = {
    id: `exchange-${exchangeReturn.id}-${Date.now()}`,
    type: NotificationTypes.EXCHANGE_RETURN,
    title: '🔄 Cambio/Devolución',
    message: `${exchangeReturn.type === 'exchange' ? 'Cambio' : 'Devolución'} registrado`,
    data: exchangeReturn,
    timestamp: new Date().toISOString()
  };
  
  sendToRole('admin', notification);
  sendToRole('supervisor', notification);
};

// Notificar nuevo cliente
exports.notifyNewCustomer = (customer) => {
  const notification = {
    id: `customer-${customer.id}-${Date.now()}`,
    type: NotificationTypes.NEW_CUSTOMER,
    title: '👤 Nuevo Cliente',
    message: `Cliente registrado: ${customer.name || customer.email}`,
    data: customer,
    timestamp: new Date().toISOString()
  };
  
  sendToRole('admin', notification);
};

// Notificar alerta del sistema
exports.notifySystemAlert = (title, message, data = null) => {
  const notification = {
    id: `system-${Date.now()}`,
    type: NotificationTypes.SYSTEM_ALERT,
    title: title || '🔔 Alerta del Sistema',
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  broadcast(notification);
};

module.exports = exports;
