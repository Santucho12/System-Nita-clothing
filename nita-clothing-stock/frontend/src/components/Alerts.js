import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Alerts.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Alerts = () => {
  const [alerts, setAlerts] = useState({
    lowStock: [],
    outOfStock: [],
    expiringReservations: [],
    noMovement: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lowStock');

  useEffect(() => {
    loadAlerts();
    // Refrescar cada 5 minutos
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [lowStockRes, outOfStockRes, reservationsRes, noMovementRes] = await Promise.all([
        axios.get(`${API_URL}/productos/stock-bajo`, { headers }),
        axios.get(`${API_URL}/productos/sin-stock`, { headers }),
        axios.get(`${API_URL}/reservas/proximas-vencer`, { headers }),
        axios.get(`${API_URL}/reportes/productos-sin-movimiento?days=60`, { headers })
      ]);

      setAlerts({
        lowStock: lowStockRes.data.data || [],
        outOfStock: outOfStockRes.data.data || [],
        expiringReservations: reservationsRes.data.data || [],
        noMovement: noMovementRes.data.data || []
      });
    } catch (error) {
      console.error('Error cargando alertas:', error);
      toast.error('Error cargando alertas');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAlerts = () => {
    return (
      alerts.lowStock.length +
      alerts.outOfStock.length +
      alerts.expiringReservations.length +
      alerts.noMovement.length
    );
  };

  const getAlertIcon = (type) => {
    const icons = {
      lowStock: '⚠️',
      outOfStock: '🔴',
      expiringReservations: '⏰',
      noMovement: '📦'
    };
    return icons[type] || '⚠️';
  };

  const getAlertTitle = (type) => {
    const titles = {
      lowStock: 'Stock Bajo',
      outOfStock: 'Sin Stock',
      expiringReservations: 'Reservas por Vencer',
      noMovement: 'Sin Movimiento (60 días)'
    };
    return titles[type] || '';
  };

  if (loading) {
    return (
      <div className="alerts-container">
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i> Cargando alertas...
        </div>
      </div>
    );
  }

  const totalAlerts = getTotalAlerts();

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h1>
          <i className="fas fa-bell"></i> Alertas del Sistema
        </h1>
        <div className="alerts-summary">
          <span className={`alert-count ${totalAlerts > 0 ? 'active' : ''}`}>
            {totalAlerts} {totalAlerts === 1 ? 'alerta' : 'alertas'}
          </span>
          <button onClick={loadAlerts} className="btn-refresh">
            <i className="fas fa-sync-alt"></i> Actualizar
          </button>
        </div>
      </div>

      <div className="alerts-tabs">
        <button
          className={activeTab === 'lowStock' ? 'active' : ''}
          onClick={() => setActiveTab('lowStock')}
        >
          {getAlertIcon('lowStock')} Stock Bajo
          {alerts.lowStock.length > 0 && <span className="badge">{alerts.lowStock.length}</span>}
        </button>
        <button
          className={activeTab === 'outOfStock' ? 'active' : ''}
          onClick={() => setActiveTab('outOfStock')}
        >
          {getAlertIcon('outOfStock')} Sin Stock
          {alerts.outOfStock.length > 0 && <span className="badge">{alerts.outOfStock.length}</span>}
        </button>
        <button
          className={activeTab === 'expiringReservations' ? 'active' : ''}
          onClick={() => setActiveTab('expiringReservations')}
        >
          {getAlertIcon('expiringReservations')} Reservas
          {alerts.expiringReservations.length > 0 && <span className="badge">{alerts.expiringReservations.length}</span>}
        </button>
        <button
          className={activeTab === 'noMovement' ? 'active' : ''}
          onClick={() => setActiveTab('noMovement')}
        >
          {getAlertIcon('noMovement')} Sin Movimiento
          {alerts.noMovement.length > 0 && <span className="badge">{alerts.noMovement.length}</span>}
        </button>
      </div>

      <div className="alerts-content">
        {activeTab === 'lowStock' && (
          <div className="alert-section">
            <h2>⚠️ Productos con Stock Bajo</h2>
            {alerts.lowStock.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>No hay productos con stock bajo</p>
              </div>
            ) : (
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.lowStock.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <span className="text-muted">{product.size} - {product.color}</span>
                      </td>
                      <td>{product.category_name}</td>
                      <td className="text-warning">
                        <strong>{product.stock_quantity}</strong>
                      </td>
                      <td>{product.min_stock}</td>
                      <td>
                        <span className="status-badge warning">Bajo</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'outOfStock' && (
          <div className="alert-section">
            <h2>🔴 Productos Sin Stock</h2>
            {alerts.outOfStock.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>No hay productos sin stock</p>
              </div>
            ) : (
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Última Venta</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.outOfStock.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <span className="text-muted">{product.size} - {product.color}</span>
                      </td>
                      <td>{product.category_name}</td>
                      <td className="text-danger">
                        <strong>0</strong>
                      </td>
                      <td>{product.last_sale ? new Date(product.last_sale).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className="status-badge danger">Sin Stock</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'expiringReservations' && (
          <div className="alert-section">
            <h2>⏰ Reservas Próximas a Vencer</h2>
            {alerts.expiringReservations.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>No hay reservas próximas a vencer</p>
              </div>
            ) : (
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>Reserva #</th>
                    <th>Cliente</th>
                    <th>Fecha Vencimiento</th>
                    <th>Monto Restante</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.expiringReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td><strong>{reservation.reservation_number}</strong></td>
                      <td>
                        {reservation.customer_name}
                        <br />
                        <span className="text-muted">{reservation.customer_email}</span>
                      </td>
                      <td className="text-warning">
                        <strong>{new Date(reservation.expiration_date).toLocaleDateString()}</strong>
                      </td>
                      <td>${parseFloat(reservation.remaining_amount).toFixed(2)}</td>
                      <td>
                        <span className="status-badge warning">Por Vencer</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'noMovement' && (
          <div className="alert-section">
            <h2>📦 Productos Sin Movimiento (60 días)</h2>
            {alerts.noMovement.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>Todos los productos tienen movimiento reciente</p>
              </div>
            ) : (
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Valor en Stock</th>
                    <th>Última Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.noMovement.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <br />
                        <span className="text-muted">{product.size} - {product.color}</span>
                      </td>
                      <td>{product.category_name}</td>
                      <td>{product.stock_quantity}</td>
                      <td>${(product.stock_quantity * product.sale_price).toFixed(2)}</td>
                      <td>{product.last_sale ? new Date(product.last_sale).toLocaleDateString() : 'Sin ventas'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
