import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api';
import { reportsService } from '../services/salesService';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { 
  FaHome, FaTshirt, FaDollarSign, FaShoppingCart, FaChartLine, 
  FaTrophy, FaStar, FaPlus, FaSync, FaBox, FaMoneyBillWave,
  FaStore, FaArrowRight, FaTag, FaPalette
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    inventoryValue: 0,
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
      
      // Cargar productos, valor del inventario, estadísticas de ventas y productos más vendidos
      const [productsResponse, inventoryValueResponse, monthlyStatsResponse, topProductsResponse] = await Promise.all([
        productService.getAll(),
        reportsService.getInventoryValue(),
        reportsService.getMonthlyStats(),
        reportsService.getTopProducts(5)
      ]);

      const products = productsResponse.data || [];
      const inventoryData = inventoryValueResponse.data || {};
      const monthlyStats = monthlyStatsResponse.data || {};
      const topProductsData = topProductsResponse.data || [];

      setStats({
        totalProducts: products.length,
        inventoryValue: inventoryData.total_value || 0,
        monthlyRevenue: monthlyStats.total_revenue || 0,
        monthlySales: monthlyStats.total_sales || 0
      });

      setTopProducts(topProductsData);

    } catch (error) {
      toast.error('Error cargando datos del dashboard: ' + error.message);
      console.log('Error cargando datos del dashboard:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '2em', color: '#f73194' }}>⏳</div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
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
            transition: all 0.3s ease;
          }

          .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(247, 49, 148, 0.2) !important;
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
            background: #f73194;
            transition: all 0.3s ease;
          }

          .btn-pink:hover {
            transform: scale(1.1) !important;
            background: #f73194 !important;
          }

          .btn-gray {
            background: #343a40;
            transition: all 0.3s ease;
          }

          .btn-gray:hover {
            transform: scale(1.1) !important;
            background: #23272b !important;
          }

          .product-item {
            transition: all 0.3s ease;
          }

          .product-item:hover {
            transform: translateX(5px);
            background: #ffeef8 !important;
          }
        `}
      </style>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '30px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 10px 0', fontSize: '32px', color: '#333', fontWeight: '600', gap: '12px' }}>
          <FaHome style={{ color: '#f73194', fontSize: '36px' }} />
          Sistema de Gestión Nita Clothing
        </h1>
        <p style={{ margin: 0, fontSize: '16px', color: '#666', fontWeight: '400' }}>Stock, Ventas y Reportes</p>
      </div>

      {/* Estadísticas principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        {/* Total Productos */}
        <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.1s', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6b9d 100%)', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <FaTshirt style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700', color: '#f73194' }}>{stats.totalProducts}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: '500', minHeight: '32px', display: 'flex', alignItems: 'center' }}>Total Productos</p>
          </div>
          <Link 
            to="/products" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(108, 117, 125, 0.14)', borderRadius: '6px', textDecoration: 'none', color: '#f73194', fontWeight: '500', fontSize: '11px', transition: 'all 0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(108, 117, 125, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(108, 117, 125, 0.14)'}
          >
            Ver productos
            <FaArrowRight style={{ fontSize: '10px' }} />
          </Link>
        </div>

        {/* Capital */}
        <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.2s', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6b9d 100%)', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <FaStore style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700', color: '#f73194' }}>${parseFloat(stats.inventoryValue || 0).toFixed(2)}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: '500', minHeight: '32px', display: 'flex', alignItems: 'center' }}>Capital en Ropa</p>
          </div>
          <Link 
            to="/products" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(108, 117, 125, 0.14)', borderRadius: '6px', textDecoration: 'none', color: '#f73194', fontWeight: '500', fontSize: '11px', transition: 'all 0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(108, 117, 125, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(108, 117, 125, 0.14)'}
          >
            Ver inventario
            <FaArrowRight style={{ fontSize: '10px' }} />
          </Link>
        </div>

        {/* Ventas del Mes */}
        <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.3s', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6b9d 100%)', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <FaShoppingCart style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700', color: '#f73194' }}>{stats.monthlySales}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: '500', minHeight: '32px', display: 'flex', alignItems: 'center' }}>Ventas del Mes</p>
          </div>
          <Link 
            to="/reports" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(108, 117, 125, 0.14)', borderRadius: '6px', textDecoration: 'none', color: '#f73194', fontWeight: '500', fontSize: '11px', transition: 'all 0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(108, 117, 125, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(108, 117, 125, 0.14)'}
          >
            Ver ventas
            <FaArrowRight style={{ fontSize: '10px' }} />
          </Link>
        </div>

        {/* Facturación */}
        <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.4s', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6b9d 100%)', width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <FaDollarSign style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700', color: '#f73194' }}>${parseFloat(stats.monthlyRevenue || 0).toFixed(2)}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#666', fontWeight: '500', minHeight: '32px', display: 'flex', alignItems: 'center' }}>Facturación del Mes</p>
          </div>
          <Link 
            to="/reports" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(108, 117, 125, 0.14)', borderRadius: '6px', textDecoration: 'none', color: '#f73194', fontWeight: '500', fontSize: '11px', transition: 'all 0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(108, 117, 125, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(108, 117, 125, 0.14)'}
          >
            Ver reportes
            <FaArrowRight style={{ fontSize: '10px' }} />
          </Link>
        </div>
      </div>

      {/* Productos más vendidos del mes */}
      {topProducts.length > 0 && (
        <div className="top-products-section" style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaTrophy style={{ color: '#f73194', fontSize: '28px' }} />
              Productos Más Vendidos del Mes
            </h2>
            <Link 
              to="/reports" 
              className="btn-gray"
              style={{ padding: '10px 20px', color: 'white', border: 'none', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}
            >
              Ver reportes completos
              <FaChartLine />
            </Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {topProducts.map((product, index) => (
              <div 
                key={product.product_id} 
                className="product-item"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '20px', 
                  background: '#f8f9fa', 
                  borderRadius: '10px',
                  border: '1px solid #e9ecef',
                  gap: '20px'
                }}
              >
                {/* Ranking Badge */}
                <div style={{ 
                  background: index === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : index === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' : 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FaStar style={{ fontSize: '18px', color: 'white' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>#{index + 1}</span>
                  </div>
                </div>

                {/* Producto Info */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>{product.product_name}</h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaPalette style={{ color: '#f73194' }} />
                      {product.color}
                    </span>
                    <span style={{ color: '#ddd' }}>|</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaTag style={{ color: '#f73194' }} />
                      {product.category_name}
                    </span>
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#e3f2fd', color: '#2196F3', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <FaBox />
                      {product.total_quantity} vendidos
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f3e5f5', color: '#f73194', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <FaMoneyBillWave />
                      ${parseFloat(product.total_revenue).toFixed(2)} generados
                    </span>
                  </div>
                </div>

                {/* Acción */}
                <Link 
                  to="/products" 
                  className="btn-pink"
                  style={{ padding: '10px 20px', color: 'white', border: 'none', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}
                >
                  Ver Producto
                  <FaArrowRight />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="quick-actions-section" style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 25px 0', fontSize: '24px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
          <FaChartLine style={{ color: '#f73194', fontSize: '28px' }} />
          Acciones Rápidas
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {/* Nueva Venta */}
          <Link 
            to="/sales" 
            className="action-card"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '30px 20px', 
              background: 'linear-gradient(135deg, #fff5f7 0%, #ffe0e8 100%)', 
              borderRadius: '12px', 
              textDecoration: 'none',
              border: '2px solid #ffcdd2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6b9d 100%)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <FaShoppingCart style={{ fontSize: '32px', color: 'white' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Nueva Venta</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666', textAlign: 'center' }}>Registrar una nueva venta</p>
          </Link>

          {/* Nuevo Producto */}
          <Link 
            to="/products" 
            className="action-card"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '30px 20px', 
              background: 'linear-gradient(135deg, #fff5f7 0%, #ffe0e8 100%)', 
              borderRadius: '12px', 
              textDecoration: 'none',
              border: '2px solid #ffcdd2',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6b9d 100%)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <FaPlus style={{ fontSize: '32px', color: 'white' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Nuevo Producto</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666', textAlign: 'center' }}>Agregar un producto al inventario</p>
          </Link>

          {/* Actualizar Datos */}
          <button 
            className="action-card"
            onClick={loadDashboardData}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '30px 20px', 
              background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', 
              borderRadius: '12px',
              border: '2px solid #bdbdbd',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}
          >
            <div style={{ background: 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <FaSync style={{ fontSize: '32px', color: 'white' }} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#333' }}>Actualizar Datos</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666', textAlign: 'center' }}>Refrescar información del dashboard</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;