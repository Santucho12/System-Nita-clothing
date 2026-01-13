import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './DashboardSales.css';

export default function DashboardSales() {
  const [dayStats, setDayStats] = useState(null);
  const [monthStats, setMonthStats] = useState(null);
  const [yearStats, setYearStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [bestDays, setBestDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [day, month, year, top, best] = await Promise.all([
          api.get('/ventas/dashboard/day'),
          api.get('/ventas/dashboard/month'),
          api.get('/ventas/dashboard/year'),
          api.get('/ventas/dashboard/top-products?limit=5'),
          api.get('/ventas/dashboard/best-days?year=' + new Date().getFullYear() + '&month=' + (new Date().getMonth() + 1))
        ]);
        setDayStats(day.data.data);
        setMonthStats(month.data.data);
        setYearStats(year.data.data);
        setTopProducts(top.data.data);
        setBestDays(best.data.data);
      } catch (err) {
        setError('Error al cargar dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="dashboard-sales">
      <h2>Dashboard de Ventas</h2>
      {loading ? <div>Cargando...</div> : error ? <div className="error">{error}</div> : (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <h4>Ventas Hoy</h4>
              <div className="stat-value">{dayStats?.total_sales || 0}</div>
              <div className="stat-label">Total: ${dayStats?.total_amount?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="stat-card">
              <h4>Ventas Mes</h4>
              <div className="stat-value">{monthStats?.total_sales || 0}</div>
              <div className="stat-label">Total: ${monthStats?.total_amount?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="stat-card">
              <h4>Ventas Año</h4>
              <div className="stat-value">{yearStats?.total_sales || 0}</div>
              <div className="stat-label">Total: ${yearStats?.total_amount?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
          <div className="dashboard-section">
            <h4>Productos más vendidos (últimos 30 días)</h4>
            <ol>
              {topProducts.map(p => (
                <li key={p.product_id}>{p.product_name} <span style={{color:'#888'}}>({p.quantity_sold} u.)</span></li>
              ))}
            </ol>
          </div>
          <div className="dashboard-section">
            <h4>Mejores días del mes</h4>
            <table className="best-days-table">
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Ventas</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {bestDays.map(d => (
                  <tr key={d.day}>
                    <td>{d.day}</td>
                    <td>{d.total_sales}</td>
                    <td>${d.total_amount?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
