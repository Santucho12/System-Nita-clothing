import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api';
import { reportsService } from '../services/salesService';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { formatCurrency, formatInteger, formatNumber } from '../utils/formatters';
import {
  FaHome, FaTshirt, FaDollarSign, FaShoppingCart, FaChartLine, FaChartBar,
  FaTrophy, FaStar, FaPlus, FaSync, FaBox, FaMoneyBillWave,
  FaStore, FaArrowRight, FaTag, FaPalette, FaChevronRight, FaBolt, FaUsers
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    inventoryValue: 0,
    monthlyRevenue: 0,
    monthlySales: 0
  });
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar conteo de productos, valor del inventario, estadísticas de ventas y categorías más vendidas

      // Calcular rango del mes actual
      const now = new Date();
      const startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
      const endDate = format(now, 'yyyy-MM-dd');

      const [productsCountResponse, inventoryValueResponse, kpisResponse, topCategoriesResponse] = await Promise.all([
        productService.getCount(),
        reportsService.getInventoryValue(),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reportes/kpis-avanzados`, {
          params: { startDate, endDate },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        reportsService.getTopCategories(3, startDate, endDate)
      ]);

      const productsCount = productsCountResponse.count || 0;
      const inventoryData = inventoryValueResponse.data || {};
      const kpis = kpisResponse.data.data || {};
      const topCategoriesData = topCategoriesResponse.data || [];

      setStats({
        totalProducts: productsCount,
        inventoryValue: inventoryData.total_value || 0,
        monthlyRevenue: kpis.totalSales || 0,
        monthlySales: kpis.totalTransactions || 0
      });

      setTopCategories(topCategoriesData);

    } catch (error) {
      toast.error('Error cargando datos del dashboard: ' + error.message);
      console.log('Error cargando datos del dashboard:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    <div style={{ textAlign: 'center', padding: '100px 40px', background: 'var(--bg-secondary)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '50px', height: '50px', border: '5px solid var(--accent-pink-light)', borderTopColor: 'var(--accent-pink)', borderRadius: '50%', animation: 'spin 1.2s linear infinite' }}></div>
      <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '18px' }}>Cargando dashboard...</p>
    </div>
  }

  return (
    <div style={{ padding: '20px 30px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes perspective3DFlip {
            0% {
              opacity: 0;
              transform: perspective(1000px) rotateY(-15deg) rotateX(10deg);
            }
            100% {
              opacity: 1;
              transform: perspective(1000px) rotateY(0deg) rotateX(0deg);
            }
          }

          .page-header {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          .stat-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: var(--bg-card);
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: var(--shadow-sm) !important;
            height: 250px; /* Altura reducida */
            padding: 0 !important; /* Elimina el borde blanco del CSS externo */
          }

          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          }

          .stat-card-body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 3; /* Ocupa el 75% */
            background: var(--bg-card);
            padding: 10px 10px 4px 10px;
          }

          .stat-icon-wrapper {
            background: var(--accent-pink-light);
            width: 38px;
            height: 38px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
          }

          .stat-value {
            margin: 0 0 2px 0;
            font-size: 24px;
            font-weight: 800;
            color: var(--accent-pink);
          }

          .stat-label {
            margin: 0;
            font-size: 11px;
            color: var(--text-muted);
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .stat-card-footer {
            background: var(--bg-tertiary);
            border-top: 1px solid var(--border-color);
            flex: 1; /* Ocupa el 25% exacto */
            display: flex;
            width: 100%;
          }

          .stat-footer-link {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
            color: var(--accent-pink);
            font-weight: 700;
            font-size: 13px;
            width: 100%;
            height: 100%;
            transition: background 0.2s ease;
          }

          .stat-footer-link:hover {
            background: var(--bg-hover);
          }

          .top-products-section {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both;
          }

          .quick-actions-section {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both;
          }

          .action-card {
            transition: all 0.3s ease;
          }

          .action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.15) !important;
          }

          .btn-pink {
            background: var(--accent-pink);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 12px !important;
          }

          .btn-pink:hover {
            background: var(--accent-pink-dark, #d6237c) !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px var(--accent-pink-light);
          }

          .btn-gray {
            background: var(--bg-tertiary);
            color: var(--text-secondary) !important;
            border: 1px solid var(--border-color) !important;
            transition: all 0.3s ease;
            border-radius: 12px !important;
          }

          .btn-gray:hover {
            background: var(--bg-hover) !important;
            border-color: var(--border-color) !important;
            color: var(--text-primary) !important;
            transform: translateY(-2px);
          }

          .product-item {
            transition: all 0.3s ease;
          }

          .product-item:hover {
            transform: translateX(5px);
            background: var(--bg-hover) !important;
          }
        `}
      </style>

      {/* Header Premium - Estética Stack Vertical */}
      <div className="page-header" style={{
        marginBottom: '40px',
        background: 'var(--bg-card)',
        padding: '20px 40px',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'left',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '20px',
        marginTop: '-20px'
      }}>
        {/* Fila 1: Badge + Fecha */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--accent-pink-light)',
            color: 'var(--accent-pink)',
            padding: '6px 16px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: '800',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaChartBar style={{ fontSize: '14px' }} />
            SISTEMA ACTIVO
          </div>
          <span style={{ color: 'var(--border-color)', fontSize: '18px' }}>•</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {/* Fila 2: Saludo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{
            margin: 0,
            fontSize: '42px',
            color: 'var(--text-heading)',
            fontWeight: '850',
            letterSpacing: '-0.02em'
          }}>
            Hola, <span style={{ color: 'var(--accent-pink)' }}>Nita Clothing</span> <span style={{ display: 'inline-block', animation: 'waveHand 2.5s infinite', transformOrigin: '70% 70%' }}>👋</span>
          </h1>
        </div>

        {/* Fila 3: Subtítulo */}
        <p style={{
          margin: 0,
          fontSize: '17px',
          color: 'var(--text-muted)',
          fontWeight: '500',
          maxWidth: '850px',
          lineHeight: '1.5'
        }}>
          Aquí tienes el resumen administrativo de tu tienda de ropa.
        </p>

        <style>
          {`
            @keyframes waveHand {
              0% { transform: rotate( 0.0deg) }
              10% { transform: rotate(14.0deg) }
              20% { transform: rotate(-8.0deg) }
              30% { transform: rotate(14.0deg) }
              40% { transform: rotate(-4.0deg) }
              50% { transform: rotate(10.0deg) }
              60% { transform: rotate( 0.0deg) }
              100% { transform: rotate( 0.0deg) }
            }
          `}
        </style>
      </div>

      {/* Estadísticas principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {/* Total Productos */}
        <div className="stat-card" style={{ animationDelay: '0.1s' }}>
          <div className="stat-card-body">
            <div className="stat-icon-wrapper">
              <FaTshirt style={{ fontSize: '20px', color: 'var(--accent-pink)' }} />
            </div>
            <h3 className="stat-value">{stats.totalProducts}</h3>
            <p className="stat-label">TOTAL PRODUCTOS</p>
          </div>
          <div className="stat-card-footer">
            <Link to="/products" className="stat-footer-link">
              Ver productos
              <FaArrowRight style={{ fontSize: '10px' }} />
            </Link>
          </div>
        </div>

        {/* Capital */}
        <div className="stat-card" style={{ animationDelay: '0.2s' }}>
          <div className="stat-card-body">
            <div className="stat-icon-wrapper">
              <FaStore style={{ fontSize: '20px', color: 'var(--accent-pink)' }} />
            </div>
            <h3 className="stat-value">{formatCurrency(stats.inventoryValue || 0)}</h3>
            <p className="stat-label">CAPITAL EN ROPA</p>
          </div>
          <div className="stat-card-footer">
            <Link to="/products" className="stat-footer-link">
              Ver stock
              <FaArrowRight style={{ fontSize: '10px' }} />
            </Link>
          </div>
        </div>

        {/* Ventas del Mes */}
        <div className="stat-card" style={{ animationDelay: '0.3s' }}>
          <div className="stat-card-body">
            <div className="stat-icon-wrapper">
              <FaShoppingCart style={{ fontSize: '20px', color: 'var(--accent-pink)' }} />
            </div>
            <h3 className="stat-value">{formatInteger(stats.monthlySales)}</h3>
            <p className="stat-label">VENTAS DEL MES</p>
          </div>
          <div className="stat-card-footer">
            <Link to="/sales/history" className="stat-footer-link">
              Ver ventas
              <FaArrowRight style={{ fontSize: '10px' }} />
            </Link>
          </div>
        </div>

        {/* Facturación */}
        <div className="stat-card" style={{ animationDelay: '0.4s' }}>
          <div className="stat-card-body">
            <div className="stat-icon-wrapper">
              <FaDollarSign style={{ fontSize: '20px', color: 'var(--accent-pink)' }} />
            </div>
            <h3 className="stat-value">{formatCurrency(stats.monthlyRevenue || 0)}</h3>
            <p className="stat-label">FACTURACIÓN DEL MES</p>
          </div>
          <div className="stat-card-footer">
            <Link to="/reports/advanced" className="stat-footer-link">
              Ver estadísticas
              <FaArrowRight style={{ fontSize: '10px' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* Categorías más vendidas del mes */}
      {topCategories.length > 0 && (
        <div className="top-categories-section" style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px 30px', boxShadow: 'var(--shadow)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '10px', borderBottom: '2px solid var(--border-color)' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaTrophy style={{ color: 'var(--accent-pink)', fontSize: '28px' }} />
              Categorías Más Vendidas del Mes
            </h2>
            <Link
              to="/reports/advanced"
              className="btn-gray"
              style={{ padding: '6px 24px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '700' }}
            >
              Ver reportes completos
              <FaChartLine style={{ fontSize: '16px' }} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {topCategories.map((category, index) => (
              <div
                key={category.category_id}
                className="category-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  gap: '20px'
                }}
              >
                {/* Ranking Badge */}
                <div style={{
                  background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' : 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FaStar style={{ fontSize: '18px', color: index === 2 ? '#1E88E5' : 'white' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: index === 2 ? '#1E88E5' : 'white' }}>#{index + 1}</span>
                  </div>
                </div>

                {/* Categoría Info */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: 'var(--text-heading)' }}>{category.category_name}</h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaTshirt style={{ color: 'var(--accent-pink)' }} />
                      {category.products_count} Modelos
                    </span>
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <FaBox />
                      {formatInteger(category.total_quantity)}  Productos vendidos
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--accent-pink-light)', color: 'var(--accent-pink)', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <FaMoneyBillWave />
                      {formatCurrency(category.total_revenue)} generados
                    </span>
                  </div>
                </div>

                {/* Acción */}
                <Link
                  to="/categories"
                  className="btn-pink"
                  style={{
                    padding: '7px 24px',
                    color: 'white',
                    border: 'none',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    fontWeight: '750',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px var(--accent-pink-light)'
                  }}
                >
                  Ver Categoría
                  <FaArrowRight style={{ fontSize: '12px' }} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="quick-actions-section" style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '20px 30px', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ margin: '0 0 25px 0', fontSize: '24px', fontWeight: '600', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '2px solid var(--border-color)' }}>
          <FaBolt style={{ color: '#f59e0b', fontSize: '28px' }} />
          Acciones Rápidas
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Nueva Venta */}
          <Link
            to="/sales/register"
            className="action-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '17px 28px',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              gap: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{
              background: 'var(--accent-pink-light)',
              width: '56px', height: '56px', borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px var(--accent-pink-light)'
            }}>
              <FaShoppingCart style={{ fontSize: '24px', color: 'var(--accent-pink)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '850', color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>Nueva Venta</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', lineHeight: '1.4' }}>Registrar una venta ahora</p>
            </div>
            <FaChevronRight style={{ color: '#cbd5e1', fontSize: '14px' }} />
          </Link>

          {/* Nuevo Producto */}
          <Link
            to="/products"
            className="action-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '17px 28px',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              gap: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{
              background: 'var(--accent-pink-light)',
              width: '56px', height: '56px', borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px var(--accent-pink-light)'
            }}>
              <FaPlus style={{ fontSize: '24px', color: 'var(--accent-pink)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '850', color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>Nuevo Producto</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', lineHeight: '1.4' }}>Agregar producto al stock</p>
            </div>
            <FaChevronRight style={{ color: '#cbd5e1', fontSize: '14px' }} />
          </Link>

          {/* Clientes */}
          <Link
            to="/customers"
            className="action-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '17px 28px',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              textDecoration: 'none',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              gap: '20px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{
              background: 'var(--accent-pink-light)',
              width: '56px', height: '56px', borderRadius: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px var(--accent-pink-light)'
            }}>
              <FaUsers style={{ fontSize: '24px', color: 'var(--accent-pink)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '850', color: 'var(--text-heading)', letterSpacing: '-0.01em' }}>Clientes</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', lineHeight: '1.4' }}>Base de datos de clientes</p>
            </div>
            <FaChevronRight style={{ color: '#cbd5e1', fontSize: '14px' }} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;