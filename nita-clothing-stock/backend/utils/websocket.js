const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;
const clients = new Map(); // userId -> WebSocket

// Inicializar WebSocket Server
const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('Nueva conexión WebSocket');

    // Autenticar con token
    const token = new URL(req.url, 'http://localhost').searchParams.get('token');
    
    if (!token) {
      ws.close(4001, 'Token no proporcionado');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nita-secret-key');
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      
      // Guardar cliente
      clients.set(decoded.id, ws);
      console.log(`Usuario ${decoded.id} conectado via WebSocket`);

      // Enviar confirmación
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Conectado al servidor de notificaciones',
        userId: decoded.id
      }));

    } catch (error) {
      console.error('Error autenticando WebSocket:', error);
      ws.close(4002, 'Token inválido');
      return;
    }

    // Manejar mensajes del cliente
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('Mensaje recibido:', data);
        
        // Responder al ping
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Error procesando mensaje:', error);
      }
    });

    // Manejar desconexión
    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
        console.log(`Usuario ${ws.userId} desconectado`);
      }
    });

    ws.on('error', (error) => {
      console.error('Error en WebSocket:', error);
    });
  });

  // Heartbeat para mantener conexiones vivas
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        clients.delete(ws.userId);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('WebSocket Server inicializado');
};

// Enviar notificación a un usuario específico
const sendToUser = (userId, notification) => {
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(notification));
    return true;
  }
  return false;
};

// Enviar notificación a todos los usuarios
const broadcast = (notification) => {
  let sent = 0;
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
      sent++;
    }
  });
  return sent;
};

// Enviar notificación por rol
const sendToRole = (role, notification) => {
  let sent = 0;
  clients.forEach((client) => {
    if (client.userRole === role && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
      sent++;
    }
  });
  return sent;
};

// Tipos de notificaciones
const NotificationTypes = {
  NEW_SALE: 'new_sale',
  LOW_STOCK: 'low_stock',
  NO_STOCK: 'no_stock',
  NEW_RESERVATION: 'new_reservation',
  RESERVATION_EXPIRING: 'reservation_expiring',
  NEW_ORDER: 'new_order',
  ORDER_RECEIVED: 'order_received',
  EXCHANGE_RETURN: 'exchange_return',
  NEW_CUSTOMER: 'new_customer',
  SYSTEM_ALERT: 'system_alert'
};

module.exports = {
  initWebSocket,
  sendToUser,
  broadcast,
  sendToRole,
  NotificationTypes,
  getConnectedClients: () => clients.size
};
