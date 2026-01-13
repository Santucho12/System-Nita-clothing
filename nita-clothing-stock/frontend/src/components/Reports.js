import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
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
    <div className="reports-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📊 Reportes y Estadísticas</h1>
        <button 
          className="btn-advanced-dashboard"
          onClick={() => navigate('/reports/advanced')}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
          }}
        >
          <i className="fas fa-chart-line"></i>
          Dashboard Ejecutivo
        </button>
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === 'sales' ? 'active' : ''} 
          onClick={() => setActiveTab('sales')}
        >
          <i className="fas fa-chart-line"></i> Ventas
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''} 
          onClick={() => setActiveTab('products')}
        >
          <i className="fas fa-box"></i> Productos
        </button>
        <button 
          className={activeTab === 'profits' ? 'active' : ''} 
          onClick={() => setActiveTab('profits')}
        >
          <i className="fas fa-dollar-sign"></i> Ganancias
        </button>
        <button 
          className={activeTab === 'categories' ? 'active' : ''} 
          onClick={() => setActiveTab('categories')}
        >
          <i className="fas fa-tags"></i> Categorías
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i> Cargando reportes...
        </div>
      ) : (
        <div className="reports-content">
          {activeTab === 'sales' && salesData && (
            <div className="sales-report">
              <h2>📈 Reporte de Ventas</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#4CAF50' }}>
                    <i className="fas fa-calendar-day"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Hoy</h3>
                    <p className="amount">${parseFloat(salesData.day?.total || 0).toLocaleString()}</p>
                    <span className="stat-detail">{salesData.day?.count || 0} ventas</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#2196F3' }}>
                    <i className="fas fa-calendar-week"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Este Mes</h3>
                    <p className="amount">${parseFloat(salesData.month?.total || 0).toLocaleString()}</p>
                    <span className="stat-detail">{salesData.month?.count || 0} ventas</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#FF9800' }}>
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Este Año</h3>
                    <p className="amount">${parseFloat(salesData.year?.total || 0).toLocaleString()}</p>
                    <span className="stat-detail">{salesData.year?.count || 0} ventas</span>
                  </div>
                </div>
              </div>

              {getSalesChartData() && (
                <div className="chart-container" style={{ height: '300px', marginTop: '30px' }}>
                  <h3>Ventas Diarias del Mes</h3>
                  <Line data={getSalesChartData()} options={chartOptions} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && productsData && (
            <div className="products-report">
              <h2>📦 Análisis de Productos</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                <div>
                  <h3>🔝 Productos Más Vendidos</h3>
                  {productsData.top.length > 0 ? (
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Producto</th>
                          <th>Vendidos</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsData.top.map((product, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{product.product_name}</td>
                            <td>{product.total_quantity}</td>
                            <td>${parseFloat(product.total_revenue).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="empty-message">No hay datos disponibles</p>
                  )}
                </div>

                <div>
                  {getTopProductsChartData() && (
                    <div className="chart-container" style={{ height: '350px' }}>
                      <Bar data={getTopProductsChartData()} options={chartOptions} />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '30px' }}>
                <h3>📉 Productos de Baja Rotación</h3>
                {productsData.low.length > 0 ? (
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Stock Actual</th>
                        <th>Último Movimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsData.low.map((product, index) => (
                        <tr key={index}>
                          <td>{product.name}</td>
                          <td>{product.stock_quantity}</td>
                          <td>{product.last_sale ? new Date(product.last_sale).toLocaleDateString() : 'Sin movimiento'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-message">Todos los productos tienen buena rotación</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profits' && profitData && (
            <div className="profits-report">
              <h2>💰 Análisis de Ganancias</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#4CAF50' }}>
                    <i className="fas fa-money-bill-wave"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Ganancia Total</h3>
                    <p className="amount">${parseFloat(profitData.general?.total_profit || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#2196F3' }}>
                    <i className="fas fa-percentage"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Margen Promedio</h3>
                    <p className="amount">{parseFloat(profitData.general?.avg_profit_margin || 0).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#FF9800' }}>
                    <i className="fas fa-chart-line"></i>
                  </div>
                  <div className="stat-info">
                    <h3>ROI</h3>
                    <p className="amount">{parseFloat(profitData.general?.roi || 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
                <div>
                  <h3>💎 Top Productos por Ganancia</h3>
                  {profitData.byProduct.length > 0 ? (
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Ganancia</th>
                          <th>Margen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profitData.byProduct.slice(0, 10).map((product, index) => (
                          <tr key={index}>
                            <td>{product.product_name}</td>
                            <td>${parseFloat(product.total_profit).toLocaleString()}</td>
                            <td>{parseFloat(product.profit_margin).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="empty-message">No hay datos disponibles</p>
                  )}
                </div>

                <div>
                  {getProfitByCategoryChartData() && (
                    <div className="chart-container" style={{ height: '350px' }}>
                      <h3>Ganancias por Categoría</h3>
                      <Pie data={getProfitByCategoryChartData()} options={chartOptions} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && categoriesData && (
            <div className="categories-report">
              <h2>🏷️ Rotación de Categorías</h2>
              
              {categoriesData.length > 0 ? (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Total Vendido</th>
                      <th>Stock Actual</th>
                      <th>Rotación</th>
                      <th>Días para Vender</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesData.map((cat, index) => (
                      <tr key={index}>
                        <td>{cat.category_name}</td>
                        <td>${parseFloat(cat.total_sold).toLocaleString()}</td>
                        <td>{cat.current_stock}</td>
                        <td>
                          <span className={`badge ${cat.rotation_rate > 5 ? 'success' : cat.rotation_rate > 2 ? 'warning' : 'danger'}`}>
                            {parseFloat(cat.rotation_rate).toFixed(1)}x
                          </span>
                        </td>
                        <td>{cat.days_to_sell || 'N/A'} días</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="empty-message">No hay datos de categorías disponibles</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;
