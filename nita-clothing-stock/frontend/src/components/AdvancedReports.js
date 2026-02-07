import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaChartBar, 
  FaArrowUp, 
  FaArrowDown, 
  FaMinus, 
  FaFilePdf, 
  FaFileExcel, 
  FaTachometerAlt, 
  FaShoppingCart, 
  FaBox, 
  FaDollarSign, 
  FaWarehouse, 
  FaCrown, 
  FaMedal, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaChartLine,
  FaReceipt,
  FaBoxes,
  FaPercent,
  FaBoxOpen,
  FaTags
} from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter, ScatterChart, ZAxis
} from 'recharts';
import './AdvancedReports.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

function AdvancedReports() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  
  // Estados de datos
  const [kpis, setKpis] = useState({});
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [hourlyDistribution, setHourlyDistribution] = useState([]);
  const [profitMargins, setProfitMargins] = useState([]);
  const [inventoryHealth, setInventoryHealth] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [customerAnalysis, setCustomerAnalysis] = useState([]);

  useEffect(() => {
    fetchAllReports();
  }, [dateRange, selectedPeriod]);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch paralelo de todos los reportes
      const [
        kpisRes,
        salesTrendRes,
        topProductsRes,
        categoryRes,
        profitRes,
        inventoryRes
      ] = await Promise.all([
        axios.get(`${API_URL}/reportes/kpis-avanzados`, { 
          params: dateRange, 
          headers 
        }),
        axios.get(`${API_URL}/reportes/tendencia-ventas`, { 
          params: { ...dateRange, period: selectedPeriod }, 
          headers 
        }),
        axios.get(`${API_URL}/reportes/productos-mas-vendidos?limit=15`, { headers }),
        axios.get(`${API_URL}/reportes/ganancia-por-categoria`, { headers }),
        axios.get(`${API_URL}/reportes/margenes-rentabilidad`, { params: dateRange, headers }),
        axios.get(`${API_URL}/reportes/salud-inventario`, { headers })
      ]);

      setKpis(kpisRes.data.data || {});
      setSalesTrend(salesTrendRes.data.data || []);
      setTopProducts(topProductsRes.data.data || []);
      setCategoryPerformance(categoryRes.data.data || []);
      setProfitMargins(profitRes.data.data || []);
      setInventoryHealth(inventoryRes.data.data || []);

      // Generar datos adicionales
      generateAdditionalData();
      
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error cargando reportes avanzados');
    } finally {
      setLoading(false);
    }
  };

  const generateAdditionalData = () => {
    // Simulación de distribución horaria
    const hours = Array.from({ length: 12 }, (_, i) => ({
      hour: `${i + 9}:00`,
      sales: Math.floor(Math.random() * 15) + 5,
      revenue: Math.floor(Math.random() * 50000) + 10000
    }));
    setHourlyDistribution(hours);

    // Simulación de métodos de pago
    const payments = [
      { name: 'Efectivo', value: 45, color: '#00C49F' },
      { name: 'Tarjeta', value: 35, color: '#0088FE' },
      { name: 'Transferencia', value: 15, color: '#FFBB28' },
      { name: 'Otros', value: 5, color: '#FF8042' }
    ];
    setPaymentMethods(payments);
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const now = new Date();
    
    switch(period) {
      case 'today':
        setDateRange({
          startDate: format(now, 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        });
        break;
      case 'week':
        setDateRange({
          startDate: format(subDays(now, 7), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        });
        break;
      case 'month':
        setDateRange({
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd')
        });
        break;
      case 'quarter':
        setDateRange({
          startDate: format(subMonths(now, 3), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        });
        break;
      case 'year':
        setDateRange({
          startDate: format(startOfYear(now), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        });
        break;
      default:
        break;
    }
  };

  const exportReport = (format) => {
    toast.info(`Exportando reporte en formato ${format}...`);
    // Implementar lógica de exportación
  };

  // Componentes de KPIs
  const KPICard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
    <div className="kpi-card" style={{ borderTop: `4px solid ${color}`, background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div className="kpi-icon" style={{ background: `${color}20`, color, width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
          <Icon />
        </div>
        <div className="kpi-trend">
          {trend > 0 ? (
            <span className="trend-up" style={{ color: '#4CAF50', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaArrowUp /> {trend}%
            </span>
          ) : trend < 0 ? (
            <span className="trend-down" style={{ color: '#F44336', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaArrowDown /> {Math.abs(trend)}%
            </span>
          ) : (
            <span className="trend-neutral" style={{ color: '#999', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FaMinus /> 0%
            </span>
          )}
        </div>
      </div>
      <h3 className="kpi-title" style={{ fontSize: '14px', color: '#666', margin: '0 0 8px 0', fontWeight: '500' }}>{title}</h3>
      <div className="kpi-value" style={{ fontSize: '28px', color: '#333', fontWeight: '700', margin: '0 0 8px 0' }}>{value}</div>
      <div className="kpi-subtitle" style={{ fontSize: '13px', color: '#999', margin: 0 }}>{subtitle}</div>
    </div>
  );

  // Custom Tooltip para gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? 
                entry.value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : 
                entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '16px', margin: '30px' }}>
        <div style={{ fontSize: '48px', color: '#f73194', marginBottom: '20px' }}>⏳</div>
        <p style={{ fontSize: '18px', color: '#666' }}>Cargando reportes ejecutivos...</p>
      </div>
    );
  }

  return (
    <div className="advanced-reports-container" style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
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

          .dashboard-header {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          .view-tabs {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
          }

          .kpi-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.3s ease;
          }

          .chart-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.3s ease;
          }

          .kpi-card:hover, .chart-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(247, 49, 148, 0.2) !important;
          }

          .btn-pink {
            background: #f73194;
            transition: all 0.3s ease;
          }
          .btn-pink:hover {
            transform: scale(1.1) !important;
            background: #f73194 !important;
          }
        `}
      </style>
      {/* Header del Dashboard */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="header-left">
          <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '28px', color: '#333', fontWeight: '600' }}>
            <FaChartBar style={{ marginRight: '12px', color: '#f73194', fontSize: '32px' }} />
            Reportes y Estadísticas
          </h1>
          <p className="subtitle" style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>Análisis integral del negocio</p>
        </div>
        
        <div className="header-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div className="period-selector" style={{ display: 'flex', gap: '8px', background: '#f5f5f5', padding: '4px', borderRadius: '8px' }}>
            {['today', 'week', 'month', 'quarter', 'year'].map(period => (
              <button
                key={period}
                className={selectedPeriod === period ? 'btn-pink' : ''}
                onClick={() => handlePeriodChange(period)}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: selectedPeriod === period ? '#f73194' : 'transparent', color: selectedPeriod === period ? 'white' : '#666', transition: 'all 0.3s ease' }}
                onMouseOver={(e) => { if (selectedPeriod !== period) e.currentTarget.style.background = '#e0e0e0'; }}
                onMouseOut={(e) => { if (selectedPeriod !== period) e.currentTarget.style.background = 'transparent'; }}
              >
                {period === 'today' && 'Hoy'}
                {period === 'week' && 'Semana'}
                {period === 'month' && 'Mes'}
                {period === 'quarter' && 'Trimestre'}
                {period === 'year' && 'Año'}
              </button>
            ))}
          </div>
          
          <div className="export-buttons" style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => exportReport('pdf')} className="btn-export" style={{ padding: '10px 18px', background: '#f73194', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s ease' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <FaFilePdf /> PDF
            </button>
            <button onClick={() => exportReport('excel')} className="btn-export" style={{ padding: '10px 18px', background: '#f73194', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s ease' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Navegación de vistas */}
      <div className="view-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexWrap: 'wrap' }}>
        <button 
          className={activeView === 'overview' ? 'btn-pink' : ''}
          onClick={() => setActiveView('overview')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeView === 'overview' ? '#f73194' : '#f5f5f5', color: activeView === 'overview' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeView !== 'overview') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeView !== 'overview') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaTachometerAlt /> General
        </button>
        <button 
          className={activeView === 'sales' ? 'btn-pink' : ''}
          onClick={() => setActiveView('sales')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeView === 'sales' ? '#f73194' : '#f5f5f5', color: activeView === 'sales' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeView !== 'sales') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeView !== 'sales') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaShoppingCart /> Ventas
        </button>
        <button 
          className={activeView === 'products' ? 'btn-pink' : ''}
          onClick={() => setActiveView('products')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeView === 'products' ? '#f73194' : '#f5f5f5', color: activeView === 'products' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeView !== 'products') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeView !== 'products') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaBox /> Productos
        </button>
        <button 
          className={activeView === 'profits' ? 'btn-pink' : ''}
          onClick={() => setActiveView('profits')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeView === 'profits' ? '#f73194' : '#f5f5f5', color: activeView === 'profits' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeView !== 'profits') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeView !== 'profits') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaDollarSign /> Rentabilidad
        </button>
        <button 
          className={activeView === 'inventory' ? 'btn-pink' : ''}
          onClick={() => setActiveView('inventory')}
          style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: activeView === 'inventory' ? '#f73194' : '#f5f5f5', color: activeView === 'inventory' ? 'white' : '#666', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease' }}
          onMouseOver={(e) => { if (activeView !== 'inventory') { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
          onMouseOut={(e) => { if (activeView !== 'inventory') { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'scale(1)'; } }}
        >
          <FaWarehouse /> Inventario
        </button>
      </div>

      {/* Vista General */}
      {activeView === 'overview' && (
        <div className="view-content">
          {/* KPIs Principales */}
          <div className="kpis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px', marginBottom: '30px' }}>
            <div style={{ animationDelay: '0.3s' }}>
              <KPICard
                title="Ventas Totales"
                value={`$${(kpis.totalSales || 0).toLocaleString()}`}
                subtitle={`${kpis.totalTransactions || 0} transacciones`}
                icon={FaShoppingCart}
                color="#f73194"
                trend={kpis.salesGrowth || 0}
              />
            </div>
            <div style={{ animationDelay: '0.4s' }}>
              <KPICard
                title="Ganancia Neta"
                value={`$${(kpis.netProfit || 0).toLocaleString()}`}
                subtitle={`Margen: ${(kpis.profitMargin || 0).toFixed(1)}%`}
                icon={FaChartLine}
                color="#2196F3"
                trend={kpis.profitGrowth || 0}
              />
            </div>
            <div style={{ animationDelay: '0.5s' }}>
              <KPICard
                title="Ticket Promedio"
                value={`$${(kpis.avgTicket || 0).toLocaleString()}`}
                subtitle="Por transacción"
                icon={FaReceipt}
                color="#FF9800"
                trend={kpis.ticketGrowth || 0}
              />
            </div>
            <div style={{ animationDelay: '0.6s' }}>
              <KPICard
                title="Productos Vendidos"
                value={(kpis.totalProducts || 0).toLocaleString()}
                subtitle="Unidades totales"
                icon={FaBoxes}
                color="#9C27B0"
                trend={kpis.productsGrowth || 0}
              />
            </div>
            <div style={{ animationDelay: '0.7s' }}>
              <KPICard
                title="Valor Inventario"
                value={`$${(kpis.inventoryValue || 0).toLocaleString()}`}
                subtitle={`${kpis.totalSKUs || 0} productos diferentes`}
                icon={FaWarehouse}
                color="#00BCD4"
                trend={0}
              />
            </div>
            <div style={{ animationDelay: '0.8s' }}>
              <KPICard
                title="ROI"
                value={`${(kpis.roi || 0).toFixed(1)}%`}
                subtitle="Retorno de inversión"
                icon={FaPercent}
                color="#4CAF50"
                trend={kpis.roiGrowth || 0}
              />
            </div>
          </div>

          {/* Gráficos principales */}
          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
            {/* Tendencia de Ventas */}
            <div className="chart-card large" style={{ gridColumn: '1 / -1', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #f73194', animationDelay: '0.9s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>📈 Tendencia de Ventas e Ingresos</h3>
                <div className="chart-legend" style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}><i className="dot" style={{background: '#4CAF50', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block'}}></i> Ingresos</span>
                  <span style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}><i className="dot" style={{background: '#2196F3', width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block'}}></i> Ganancias</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis yAxisId="left" stroke="#666" />
                  <YAxis yAxisId="right" orientation="right" stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#4CAF5020" stroke="#4CAF50" strokeWidth={2} name="Ingresos" />
                  <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#2196F3" strokeWidth={3} name="Ganancias" dot={{ r: 4 }} />
                  <Bar yAxisId="left" dataKey="transactions" fill="#82ca9d" name="Transacciones" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Top Productos */}
            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #f73194', animationDelay: '1.0s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>🏆 Productos Más Vendidos</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#666" />
                  <YAxis dataKey="product_name" type="category" width={150} stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_revenue" name="Ingresos" radius={[0, 8, 8, 0]}>
                    {topProducts.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Categorías Performance */}
            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #2196F3', animationDelay: '1.1s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>🏷️ Rendimiento por Categoría</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryPerformance}
                    dataKey="total_profit"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Distribución Horaria */}
            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #FF9800', animationDelay: '1.2s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>🕐 Distribución de Ventas por Hora</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Ventas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Métodos de Pago */}
            <div className="chart-card small">
              <div className="chart-header">
                <h3>💳 Métodos de Pago</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    label
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Análisis Comparativo Mensual */}
            <div className="chart-card large">
              <div className="chart-header">
                <h3>📊 Comparativa Mensual (Últimos 6 meses)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="sales" fill="#4CAF50" name="Ventas" />
                  <Bar dataKey="profit" fill="#2196F3" name="Ganancias" />
                  <Bar dataKey="costs" fill="#FF9800" name="Costos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Ventas Detallada */}
      {activeView === 'sales' && (
        <div className="view-content">
          <div className="section-header" style={{ marginBottom: '24px', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.25s' }}>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>📊 Análisis Detallado de Ventas</h2>
          </div>
          
          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
            <div className="chart-card large" style={{ gridColumn: '1 / -1', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #4CAF50', animationDelay: '0.3s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Evolución de Ventas Diarias</h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={3} name="Ingresos" dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="transactions" stroke="#2196F3" strokeWidth={2} name="Transacciones" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #9C27B0', animationDelay: '1.3s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Ventas por Forma de Pago</h3>
              </div>
              <div className="payment-breakdown">
                {paymentMethods.map((method, index) => (
                  <div key={index} className="payment-item">
                    <div className="payment-info">
                      <span className="payment-name">{method.name}</span>
                      <span className="payment-percentage">{method.value}%</span>
                    </div>
                    <div className="payment-bar">
                      <div 
                        className="payment-fill" 
                        style={{ width: `${method.value}%`, background: method.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #00BCD4', animationDelay: '1.4s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Top 10 Días de Mayor Venta</h3>
              </div>
              <div className="top-days-list">
                {salesTrend.slice(0, 10).map((day, index) => (
                  <div key={index} className="day-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="date">{day.date}</span>
                    <span className="amount">${(day.revenue || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #4CAF50', animationDelay: '1.5s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Patrón Semanal</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { day: 'Lun', value: 85 },
                  { day: 'Mar', value: 75 },
                  { day: 'Mié', value: 90 },
                  { day: 'Jue', value: 80 },
                  { day: 'Vie', value: 95 },
                  { day: 'Sáb', value: 100 },
                  { day: 'Dom', value: 60 }
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="day" />
                  <PolarRadiusAxis />
                  <Radar name="Ventas" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Productos */}
      {activeView === 'products' && (
        <div className="view-content">
          <div className="section-header" style={{ marginBottom: '24px', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.25s' }}>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>📦 Análisis de Productos</h2>
          </div>
          
          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
            <div className="chart-card large" style={{ gridColumn: '1 / -1', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #f73194', animationDelay: '0.3s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Top 15 Productos por Ingreso</h3>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProducts.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={120} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total_revenue" name="Ingresos" radius={[8, 8, 0, 0]}>
                    {topProducts.slice(0, 15).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #2196F3', animationDelay: '0.4s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Productos: Unidades vs Ingresos</h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="total_quantity" name="Unidades" />
                  <YAxis dataKey="total_revenue" name="Ingresos" />
                  <ZAxis range={[100, 1000]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Productos" data={topProducts} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #FF9800', animationDelay: '0.5s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Ranking de Productos</h3>
              </div>
              <div className="products-ranking">
                {topProducts.slice(0, 10).map((product, index) => (
                  <div key={index} className="ranking-item">
                    <div className="ranking-position">
                      <span className={`position ${index < 3 ? 'top' : ''}`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="ranking-details">
                      <h4>{product.product_name}</h4>
                      <div className="ranking-stats">
                        <span><FaDollarSign /> ${(product.total_revenue || 0).toLocaleString()}</span>
                        <span><FaBox /> {product.total_quantity} und.</span>
                      </div>
                    </div>
                    <div className="ranking-badge">
                      {index === 0 && <FaCrown className="gold" />}
                      {index === 1 && <FaMedal className="silver" />}
                      {index === 2 && <FaMedal className="bronze" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Rentabilidad */}
      {activeView === 'profits' && (
        <div className="view-content">
          <div className="section-header" style={{ marginBottom: '24px', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.25s' }}>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>💰 Análisis de Rentabilidad</h2>
          </div>
          
          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
            <div className="chart-card large" style={{ gridColumn: '1 / -1', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #4CAF50', animationDelay: '0.3s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Márgenes de Ganancia por Categoría</h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category_name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total_profit" fill="#4CAF50" name="Ganancia" />
                  <Line yAxisId="right" type="monotone" dataKey="profit_margin" stroke="#FF9800" strokeWidth={3} name="Margen %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #2196F3', animationDelay: '0.4s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Distribución de Ganancias</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryPerformance}
                    dataKey="total_profit"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category_name, percent }) => 
                      `${category_name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #FF9800', animationDelay: '0.5s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>ROI por Categoría</h3>
              </div>
              <div className="roi-list">
                {categoryPerformance.map((cat, index) => (
                  <div key={index} className="roi-item">
                    <div className="roi-info">
                      <span className="cat-name">{cat.category_name}</span>
                      <span className="roi-value">{((cat.total_profit / cat.total_cost) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="roi-bar">
                      <div 
                        className="roi-fill" 
                        style={{ 
                          width: `${Math.min(((cat.total_profit / cat.total_cost) * 100), 100)}%`,
                          background: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #9C27B0', animationDelay: '0.6s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Top Productos por Margen</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={profitMargins.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="product" type="category" width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="margin" fill="#00C49F" name="Margen %" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Inventario */}
      {activeView === 'inventory' && (
        <div className="view-content">
          <div className="section-header" style={{ marginBottom: '24px', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', animationDelay: '0.25s' }}>
            <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>📦 Salud del Inventario</h2>
          </div>
          
          <div className="kpis-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px', marginBottom: '30px' }}>
            <KPICard
              title="Valor Total Inventario"
              value={`$${(inventoryHealth.totalValue || 0).toLocaleString()}`}
              subtitle="Valor en stock"
              icon={FaBoxOpen}
              color="#00BCD4"
              trend={0}
            />
            <KPICard
              title="Stock Total"
              value={(inventoryHealth.totalUnits || 0).toLocaleString()}
              subtitle="Unidades disponibles"
              icon={FaBoxes}
              color="#4CAF50"
              trend={0}
            />
            <KPICard
              title="Productos Activos"
              value={inventoryHealth.activeProducts || 0}
              subtitle="SKUs diferentes"
              icon={FaTags}
              color="#FF9800"
              trend={0}
            />
            <KPICard
              title="Stock Bajo"
              value={inventoryHealth.lowStock || 0}
              subtitle="Productos críticos"
              icon={FaExclamationTriangle}
              color="#F44336"
              trend={0}
            />
          </div>

          <div className="charts-grid">
            <div className="chart-card large">
              <div className="chart-header">
                <h3>Estado del Stock por Categoría</h3>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category_name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="current_stock" fill="#4CAF50" name="Stock Actual" />
                  <Bar dataKey="min_stock" fill="#FF9800" name="Stock Mínimo" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #2196F3', animationDelay: '0.4s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Rotación de Inventario</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category_name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="rotation_rate" fill="#2196F3" name="Rotación" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #FF5252', animationDelay: '0.5s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Alertas de Stock</h3>
              </div>
              <div className="stock-alerts">
                <div className="alert-item critical">
                  <FaTimesCircle />
                  <div>
                    <h4>Sin Stock</h4>
                    <p>{inventoryHealth.outOfStock || 0} productos</p>
                  </div>
                </div>
                <div className="alert-item warning">
                  <FaExclamationTriangle />
                  <div>
                    <h4>Stock Bajo</h4>
                    <p>{inventoryHealth.lowStock || 0} productos</p>
                  </div>
                </div>
                <div className="alert-item success">
                  <FaCheckCircle />
                  <div>
                    <h4>Stock OK</h4>
                    <p>{inventoryHealth.healthyStock || 0} productos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedReports;
