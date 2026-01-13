import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import './NotificationBell.css';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, connected } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  const getNotificationIcon = (type) => {
    const icons = {
      'new_sale': '💰',
      'low_stock': '⚠️',
      'no_stock': '❌',
      'new_reservation': '📌',
      'reservation_expiring': '⏰',
      'new_order': '📦',
      'order_received': '✅',
      'exchange_return': '🔄',
      'new_customer': '👤',
      'system_alert': '🔔'
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Ahora';
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now - then) / 1000); // segundos

    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="notification-bell-container">
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setShowPanel(!showPanel)}
        title="Notificaciones"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
        <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}></span>
      </button>

      {showPanel && (
        <>
          <div className="notification-overlay" onClick={() => setShowPanel(false)}></div>
          <div className="notification-panel">
            <div className="notification-header">
              <h3>
                <i className="fas fa-bell"></i> Notificaciones
                {unreadCount > 0 && <span className="count">({unreadCount})</span>}
              </h3>
              <div className="notification-actions">
                {notifications.length > 0 && (
                  <>
                    <button onClick={markAllAsRead} title="Marcar todas como leídas">
                      <i className="fas fa-check-double"></i>
                    </button>
                    <button onClick={clearNotifications} title="Limpiar todas">
                      <i className="fas fa-trash"></i>
                    </button>
                  </>
                )}
                <button onClick={() => setShowPanel(false)} title="Cerrar">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <i className="fas fa-bell-slash"></i>
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <div 
                    key={notification.id || index}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title || 'Notificación'}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {getTimeAgo(notification.timestamp)}
                      </div>
                    </div>
                    {!notification.read && <div className="unread-dot"></div>}
                  </div>
                ))
              )}
            </div>

            <div className="notification-footer">
              <span className={`status-indicator ${connected ? 'online' : 'offline'}`}>
                {connected ? '🟢 Conectado' : '🔴 Desconectado'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
