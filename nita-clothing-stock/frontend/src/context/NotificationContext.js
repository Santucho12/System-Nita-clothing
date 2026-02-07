import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Conectar WebSocket
  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const websocket = new WebSocket(`ws://localhost:5000/ws?token=${token}`);

    websocket.onopen = () => {
      console.log('✅ WebSocket conectado');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 Notificación recibida:', data);

        if (data.type !== 'connected' && data.type !== 'pong') {
          // Agregar notificación
          setNotifications(prev => [data, ...prev].slice(0, 50)); // Máximo 50
          setUnreadCount(prev => prev + 1);

          // Mostrar notificación del navegador
          if (Notification.permission === 'granted') {
            new Notification(data.title || 'Nueva notificación', {
              body: data.message,
              icon: '/logo192.png',
              tag: data.id
            });
          }

          // Reproducir sonido (opcional)
          playNotificationSound();
        }
      } catch (error) {
        console.error('Error procesando notificación:', error);
      }
    };

    websocket.onclose = () => {
      console.log('❌ WebSocket desconectado');
      setConnected(false);
      // Reintentar conexión en 5 segundos
      setTimeout(connect, 5000);
    };

    websocket.onerror = (error) => {
      console.error('Error en WebSocket:', error);
    };

    setWs(websocket);

    // Cleanup
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  useEffect(() => {
    // Pedir permiso para notificaciones
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Conectar WebSocket
    const cleanup = connect();

    return cleanup;
  }, [connect]);

  // Heartbeat (mantener conexión viva)
  useEffect(() => {
    if (!ws || !connected) return;

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [ws, connected]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignorar errores
    } catch (error) {
      // Ignorar si no hay sonido
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    connected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
