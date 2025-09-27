import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api';
import { reportsService } from '../services/salesService';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    monthlyRevenue: 0,
    monthlySales: 0
  });
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar productos, categorías, estadísticas de ventas y productos más vendidos
      const [productsResponse, categoriesResponse, monthlyStatsResponse, topProductsResponse] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
        reportsService.getMonthlyStats(),
        reportsService.getTopProducts(5)
      ]);

      const products = productsResponse.data || [];
      const categories = categoriesResponse.data || [];
      const monthlyStats = monthlyStatsResponse.data || {};
      const topProductsData = topProductsResponse.data || [];

      setStats({
        totalProducts: products.length,
        totalCategories: categories.length,
        monthlyRevenue: monthlyStats.total_revenue || 0,
        monthlySales: monthlyStats.total_sales || 0
      });

      setTopProducts(topProductsData);

    } catch (error) {
      toast.error('Error cargando datos del dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>
          Sistema de gestion de stock,ventas y reportes
        </h1>
        <p>Nita clothing</p>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products" style={{background: 'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto', fontSize: 32}}>
            <span role="img" aria-label="camiseta">🧥</span>
          </div>
          <div className="stat-content">
            <h3>{stats.totalProducts}</h3>
            <p>Total Productos</p>
          </div>
          <Link to="/products" className="stat-link">
            Ver productos <span role="img" aria-label="flecha">➡️</span>
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon categories" style={{background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto', fontSize: 32}}>
            <span role="img" aria-label="capital">🏦</span>
          </div>
          <div className="stat-content">
            <h3>{stats.totalCategories}</h3>
            <p>Capital en ropa del negocio</p>
          </div>
          <Link to="/categories" className="stat-link">
            Ver capital <span role="img" aria-label="flecha">➡️</span>
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon sales" style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto', fontSize: 32}}>
            <span role="img" aria-label="ventas">🛒</span>
          </div>
          <div className="stat-content">
            <h3>{stats.monthlySales}</h3>
            <p>Ventas del Mes</p>
          </div>
          <Link to="/reports" className="stat-link">
            Ver ventas <span role="img" aria-label="flecha">➡️</span>
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto', fontSize: 32}}>
            <span role="img" aria-label="facturacion">💸</span>
          </div>
          <div className="stat-content">
            <h3>${parseFloat(stats.monthlyRevenue || 0).toFixed(2)}</h3>
            <p>Facturación del Mes</p>
          </div>
          <Link to="/reports" className="stat-link">
            Ver reportes <span role="img" aria-label="flecha">➡️</span>
          </Link>
        </div>
      </div>

      {/* Productos más vendidos del mes */}
      {topProducts.length > 0 && (
        <div className="alerts-section">
          <div className="section-header">
            <h2>
              <i className="fas fa-trophy"></i>
              Productos Más Vendidos del Mes
            </h2>
            <Link to="/reports" className="btn btn-secondary">
              Ver reportes completos
            </Link>
          </div>
          
          <div className="alerts-list">
            {topProducts.map((product, index) => (
              <div key={product.product_id} className="alert-item">
                <div className="alert-icon top-product">
                  <i className="fas fa-star"></i>
                  <span className="rank">#{index + 1}</span>
                </div>
                <div className="alert-content">
                  <h4>{product.product_name}</h4>
                  <p>Color: {product.color} | Categoría: {product.category_name}</p>
                  <div className="sales-stats">
                    <span className="sales-badge quantity">
                      {product.total_quantity} vendidos
                    </span>
                    <span className="sales-badge revenue">
                      ${parseFloat(product.total_revenue).toFixed(2)} generados
                    </span>
                  </div>
                </div>
                <div className="alert-actions">
                  <Link 
                    to="/products" 
                    className="btn btn-sm btn-primary"
                  >
                    Ver Producto
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="quick-actions">
        <h2>
          <i className="fas fa-bolt"></i>
          Acciones Rápidas
        </h2>
        
        <div className="actions-grid">
          <Link to="/sales" className="action-card">
            <div style={{background: '#f9e79f', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto', fontSize: 18}}>
              <span role="img" aria-label="venta">💸</span>
            </div>
            <h3>Nueva Venta</h3>
            <p>Registrar una nueva venta</p>
          </Link>

          

          <Link to="/products" className="action-card">
            <div style={{background: '#d4efdf', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto', fontSize: 18}}>
              <span role="img" aria-label="nuevo producto">➕</span>
            </div>
            <h3>Nuevo Producto</h3>
            <p>Agregar un producto al inventario</p>
          </Link>

          <button 
            className="action-card clickable" 
            onClick={loadDashboardData}
            style={{minHeight: 60}}
          >
            <div style={{background: '#f5b7b1', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto', fontSize: 18}}>
              <span role="img" aria-label="actualizar">🔄</span>
            </div>
            <h3>Actualizar Datos</h3>
            <p>Refrescar información del dashboard</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;