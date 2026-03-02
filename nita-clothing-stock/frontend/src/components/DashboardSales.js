import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import './DashboardSales.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardSales() {
  const [stats, setStats] = useState({
    day: null,
    month: null,
    year: null,
    topProducts: [],
    bestDays: [],
    trend: [] // Necesitaremos un nuevo endpoint o mapear datos existentes
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [day, month, year, top, trend] = await Promise.all([
          api.get('/ventas/dashboard/day'),
          api.get('/ventas/dashboard/month'),
          api.get('/ventas/dashboard/year'),
          api.get('/ventas/dashboard/top-products?limit=5'),
          api.get('/reportes/sales-trend?period=day') // Usando el endpoint que refactorizamos
        ]);

        setStats({
          day: day.data.data,
          month: month.data.data,
          year: year.data.data,
          topProducts: top.data.data,
          trend: trend.data.data
        });
      } catch (err) {
        setError('Error al cargar dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="loading-spinner">Cargando datos premium...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Análisis de Ventas</h1>
        <p>Resumen detallado del rendimiento de Nita Clothing</p>
      </header>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-header">
            <span>Ventas Hoy</span>
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="metric-main">
            <h3>${stats.day?.total_amount?.toLocaleString() || '0'}</h3>
            <span className="count">{stats.day?.total_sales || 0} transacciones</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-header">
            <span>Ventas Mes</span>
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="metric-main">
            <h3>${stats.month?.total_amount?.toLocaleString() || '0'}</h3>
            <span className="count">{stats.month?.total_sales || 0} transacciones</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-header">
            <span>Promedio Ticket</span>
            <i className="fas fa-ticket-alt"></i>
          </div>
          <div className="metric-main">
            <h3>${(stats.month?.total_amount / (stats.month?.total_sales || 1))?.toFixed(2)}</h3>
            <span className="count">Periodo actual</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-box large">
          <h3>Tendencia de Ingresos (Últimos 30 días)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Ingresos']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1976d2" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-box">
          <h3>Top Productos</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="product_name" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantity_sold" fill="#00C49F" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-box">
          <h3>Distribución por Cantidad</h3>
          <div className="chart-container center-content">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="quantity_sold"
                  nameKey="product_name"
                >
                  {stats.topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
