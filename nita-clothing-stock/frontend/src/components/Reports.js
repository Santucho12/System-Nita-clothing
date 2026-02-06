import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaChartBar, 
  FaChartLine, 
  FaBox, 
  FaDollarSign, 
  FaTags, 
  FaCalendarDay, 
  FaCalendarWeek, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaPercentage 
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import './Reports.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [categoriesData, setCategoriesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, [activeTab]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'sales') {
        const [dayRes, monthRes, yearRes] = await Promise.all([
          axios.get(`${API_URL}/reportes/ventas-dia`, { headers }),
          axios.get(`${API_URL}/reportes/ventas-mes`, { headers }),
          axios.get(`${API_URL}/reportes/ventas-anio`, { headers })
        ]);
        
        setSalesData({
          day: dayRes.data,
          month: monthRes.data,
          year: yearRes.data
        });
      } else if (activeTab === 'products') {
        const [topRes, lowRes] = await Promise.all([
          axios.get(`${API_URL}/reportes/productos-mas-vendidos?limit=10`, { headers }),
          axios.get(`${API_URL}/reportes/productos-menos-vendidos?days=30`, { headers })
        ]);
        
        setProductsData({
          top: topRes.data.data || [],
          low: lowRes.data.data || []
        });
      } else if (activeTab === 'profits') {
        const [generalRes, byProductRes, byCategoryRes] = await Promise.all([
          axios.get(`${API_URL}/reportes/ganancias-generales`, { headers }),
          axios.get(`${API_URL}/reportes/ganancia-por-producto`, { headers }),
          axios.get(`${API_URL}/reportes/ganancia-por-categoria`, { headers })
        ]);
        
        setProfitData({
          general: generalRes.data.data || {},
          byProduct: byProductRes.data.data || [],
          byCategory: byCategoryRes.data.data || []
        });
      } else if (activeTab === 'categories') {
        const res = await axios.get(`${API_URL}/reportes/rotacion-categorias`, { headers });
        setCategoriesData(res.data.data || []);
      }
    } catch (error) {
      toast.error('Error cargando reportes: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getSalesChartData = () => {
    if (!salesData?.month?.daily) return null;
    
    return {
      labels: salesData.month.daily.map(d => new Date(d.date).getDate()),
      datasets: [
        {
          label: 'Ventas Diarias',
          data: salesData.month.daily.map(d => d.total),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.3
        }
      ]
    };
  };

  const getTopProductsChartData = () => {
    if (!productsData?.top || productsData.top.length === 0) return null;
    
    return {
      labels: productsData.top.map(p => p.product_name || 'Sin nombre'),
      datasets: [
        {
          label: 'Unidades Vendidas',
          data: productsData.top.map(p => p.total_quantity || 0),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)',
            'rgba(83, 102, 255, 0.7)',
            'rgba(255, 99, 255, 0.7)',
            'rgba(99, 255, 132, 0.7)'
          ],
        }
      ]
    };
  };

  const getProfitByCategoryChartData = () => {
    if (!profitData?.byCategory || profitData.byCategory.length === 0) return null;
    
    return {
      labels: profitData.byCategory.map(c => c.category_name || 'Sin categoría'),
      datasets: [
        {
          label: 'Ganancia por Categoría ($)',
          data: profitData.byCategory.map(c => parseFloat(c.total_profit || 0)),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)'
          ],
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="reports-container" style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
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

          .report-header {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          .tabs {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
          }

          .stat-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.3s ease;
          }

          .chart-container {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.3s ease;
          }

          .stat-card:hover, .chart-container:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(247, 49, 148, 0.2) !important;
          }
        `}
      </style>
      <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '28px', color: '#333', fontWeight: '600' }}>
          <FaChartBar style={{ marginRight: '12px', color: '#f73194', fontSize: '32px' }} />
          Reportes y Estadísticas
        </h1>
        <button 
          className="btn-advanced-dashboard"
          onClick={() => navigate('/reports/advanced')}
          style={{
            padding: '12px 24px',
            background: '#f73194',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(247, 49, 148, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 4px 12px rgba(247, 49, 148, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 8px rgba(247, 49, 148, 0.3)';
          }}
        >
          <FaChartLine />
          Estadisticas premium
        </button>
      </div>
      
      <div className="tabs" style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexWrap: 'wrap' }}>
        <button 
          className={activeTab === 'sales' ? 'active' : ''} 
          onClick={() => setActiveTab('sales')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeTab === 'sales' ? '#f73194' : '#f5f5f5', color: activeTab === 'sales' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeTab !== 'sales') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeTab !== 'sales') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaChartLine /> Ventas
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''} 
          onClick={() => setActiveTab('products')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeTab === 'products' ? '#f73194' : '#f5f5f5', color: activeTab === 'products' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeTab !== 'products') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeTab !== 'products') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaBox /> Productos
        </button>
        <button 
          className={activeTab === 'profits' ? 'active' : ''} 
          onClick={() => setActiveTab('profits')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeTab === 'profits' ? '#f73194' : '#f5f5f5', color: activeTab === 'profits' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeTab !== 'profits') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeTab !== 'profits') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaDollarSign /> Ganancias
        </button>
        <button 
          className={activeTab === 'categories' ? 'active' : ''} 
          onClick={() => setActiveTab('categories')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeTab === 'categories' ? '#f73194' : '#f5f5f5', color: activeTab === 'categories' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeTab !== 'categories') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeTab !== 'categories') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaTags /> Categorías
        </button>
      </div>

      {loading ? (
        <div className="loading" style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '16px' }}>
          <div style={{ fontSize: '48px', color: '#f73194', marginBottom: '20px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Cargando reportes...</p>
        </div>
      ) : (
        <div className="reports-content">
          {activeTab === 'sales' && salesData && (
            <div className="sales-report">
              <h2 style={{ margin: '0 0 25px 0', fontSize: '24px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f73194' }}>📈</span> Reporte de Ventas
              </h2>
              
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #4CAF50', animationDelay: '0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#999', fontWeight: '500' }}>Hoy</h3>
                      <p className="amount" style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>${parseFloat(salesData.day?.total || 0).toLocaleString()}</p>
                      <span className="stat-detail" style={{ fontSize: '13px', color: '#666' }}>{salesData.day?.count || 0} ventas</span>
                    </div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white' }}>
                      <FaCalendarDay />
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #2196F3', animationDelay: '0.4s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#999', fontWeight: '500' }}>Este Mes</h3>
                      <p className="amount" style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>${parseFloat(salesData.month?.total || 0).toLocaleString()}</p>
                      <span className="stat-detail" style={{ fontSize: '13px', color: '#666' }}>{salesData.month?.count || 0} ventas</span>
                    </div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white' }}>
                      <FaCalendarWeek />
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #FF9800', animationDelay: '0.5s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#999', fontWeight: '500' }}>Este Año</h3>
                      <p className="amount" style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>${parseFloat(salesData.year?.total || 0).toLocaleString()}</p>
                      <span className="stat-detail" style={{ fontSize: '13px', color: '#666' }}>{salesData.year?.count || 0} ventas</span>
                    </div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white' }}>
                      <FaCalendarAlt />
                    </div>
                  </div>
                </div>
              </div>

              {getSalesChartData() && (
                <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.6s' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333', fontWeight: '600' }}>Ventas Diarias del Mes</h3>
                  <div style={{ height: '300px' }}>
                    <Line data={getSalesChartData()} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && productsData && (
            <div className="products-report">
              <h2 style={{ margin: '0 0 25px 0', fontSize: '24px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f73194' }}>📦</span> Análisis de Productos
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.3s' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#4CAF50' }}>🔝</span> Productos Más Vendidos
                  </h3>
                  {productsData.top.length > 0 ? (
                    <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>#</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Producto</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Vendidos</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsData.top.map((product, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{index + 1}</td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{product.product_name}</td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{product.total_quantity}</td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#4CAF50', fontWeight: '600' }}>${parseFloat(product.total_revenue).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="empty-message" style={{ textAlign: 'center', color: '#999', padding: '40px', fontSize: '15px' }}>No hay datos disponibles</p>
                  )}
                </div>

                <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.4s' }}>
                  {getTopProductsChartData() && (
                    <>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333', fontWeight: '600' }}>Gráfico de Productos</h3>
                      <div style={{ height: '350px' }}>
                        <Bar data={getTopProductsChartData()} options={chartOptions} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="chart-container" style={{ marginTop: '20px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.5s' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#FF5722' }}>📉</span> Productos de Baja Rotación
                </h3>
                {productsData.low.length > 0 ? (
                  <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Producto</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Stock Actual</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Último Movimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsData.low.map((product, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{product.name}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{product.stock_quantity}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#999' }}>{product.last_sale ? new Date(product.last_sale).toLocaleDateString() : 'Sin movimiento'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-message" style={{ textAlign: 'center', color: '#999', padding: '40px', fontSize: '15px' }}>Todos los productos tienen buena rotación</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profits' && profitData && (
            <div className="profits-report">
              <h2 style={{ margin: '0 0 25px 0', fontSize: '24px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f73194' }}>💰</span> Análisis de Ganancias
              </h2>
              
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #4CAF50', animationDelay: '0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#999', fontWeight: '500' }}>Ganancia Total</h3>
                      <p className="amount" style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>${parseFloat(profitData.general?.total_profit || 0).toLocaleString()}</p>
                    </div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white' }}>
                      <FaMoneyBillWave />
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #2196F3', animationDelay: '0.4s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#999', fontWeight: '500' }}>Margen Promedio</h3>
                      <p className="amount" style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{parseFloat(profitData.general?.avg_profit_margin || 0).toFixed(1)}%</p>
                    </div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white' }}>
                      <FaPercentage />
                    </div>
                  </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #FF9800', animationDelay: '0.5s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#999', fontWeight: '500' }}>ROI</h3>
                      <p className="amount" style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#333' }}>{parseFloat(profitData.general?.roi || 0).toFixed(1)}%</p>
                    </div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'white' }}>
                      <FaChartLine />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.6s' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#333', fontWeight: '600' }}>Top 10 Productos por Ganancia</h3>
                  {profitData.byProduct && profitData.byProduct.length > 0 ? (
                    <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Producto</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Ganancia</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Margen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profitData.byProduct.slice(0, 10).map((product, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{product.product_name}</td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#4CAF50', fontWeight: '600' }}>${parseFloat(product.total_profit).toLocaleString()}</td>
                            <td style={{ padding: '12px', fontSize: '14px', color: '#2196F3', fontWeight: '600' }}>{parseFloat(product.profit_margin).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="empty-message" style={{ textAlign: 'center', color: '#999', padding: '40px', fontSize: '15px' }}>No hay datos disponibles</p>
                  )}
                </div>

                <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.7s' }}>
                  {getProfitByCategoryChartData() && (
                    <>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333', fontWeight: '600' }}>Ganancias por Categoría</h3>
                      <div style={{ height: '350px' }}>
                        <Pie data={getProfitByCategoryChartData()} options={chartOptions} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && categoriesData && (
            <div className="categories-report">
              <h2 style={{ margin: '0 0 25px 0', fontSize: '24px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#f73194' }}>🏷️</span> Rotación de Categorías
              </h2>
              
              {categoriesData.length > 0 ? (
                <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.3s' }}>
                  <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Categoría</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Total Vendido</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Stock Actual</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Rotación</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Días para Vender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesData.map((cat, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#333', fontWeight: '600' }}>{cat.category_name}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#4CAF50', fontWeight: '600' }}>${parseFloat(cat.total_sold).toLocaleString()}</td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>{cat.current_stock}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 12px', 
                              borderRadius: '12px', 
                              fontSize: '13px', 
                              fontWeight: '600',
                              background: cat.rotation_rate > 5 ? '#E8F5E9' : cat.rotation_rate > 2 ? '#FFF3E0' : '#FFEBEE',
                              color: cat.rotation_rate > 5 ? '#4CAF50' : cat.rotation_rate > 2 ? '#FF9800' : '#F44336'
                            }}>
                              {parseFloat(cat.rotation_rate).toFixed(1)}x
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '14px', color: '#999' }}>{cat.days_to_sell || 'N/A'} días</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="chart-container" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.3s' }}>
                  <p className="empty-message" style={{ textAlign: 'center', color: '#999', padding: '40px', fontSize: '15px' }}>No hay datos de categorías disponibles</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;
