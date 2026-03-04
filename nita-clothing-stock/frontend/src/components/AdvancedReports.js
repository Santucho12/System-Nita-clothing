import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber } from '../utils/formatters';
import useSortableData from '../hooks/useSortableData';
import {
  FaChartBar,
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
  FaTags,
  FaSort,
  FaSortUp,
  FaSortDown
} from 'react-icons/fa';
import { format, subDays, parseISO } from 'date-fns';
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
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  // Estados de datos
  const [kpis, setKpis] = useState({});
  const [salesTrend, setSalesTrend] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [hourlyDistribution, setHourlyDistribution] = useState([]);
  const [weekdaySales, setWeekdaySales] = useState([]);
  const [profitMargins, setProfitMargins] = useState([]);
  const [inventoryHealth, setInventoryHealth] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [customerAnalysis, setCustomerAnalysis] = useState([]);
  const [categoryRotation, setCategoryRotation] = useState([]);

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
        topCategoriesRes,
        categoryRes,
        profitRes,
        inventoryRes,
        paymentRes,
        dailySalesRes,
        rotationRes,
        weekdayRes
      ] = await Promise.all([
        axios.get(`${API_URL}/reportes/kpis-avanzados`, {
          params: dateRange,
          headers
        }),
        axios.get(`${API_URL}/reportes/tendencia-ventas`, {
          params: { ...dateRange, period: selectedPeriod },
          headers
        }),
        axios.get(`${API_URL}/reportes/top-categorias-vendidas`, { params: dateRange, headers }),
        axios.get(`${API_URL}/reportes/ganancia-por-categoria`, { params: dateRange, headers }),
        axios.get(`${API_URL}/reportes/margenes-rentabilidad`, { params: dateRange, headers }),
        axios.get(`${API_URL}/reportes/salud-inventario`, { headers }),
        axios.get(`${API_URL}/reportes/payment-methods`, { params: dateRange, headers }),
        axios.get(`${API_URL}/reportes/daily-sales`, { params: dateRange, headers }),
        axios.get(`${API_URL}/reportes/rotacion-categorias`, { headers }),
        axios.get(`${API_URL}/reportes/sales-by-weekday`, { params: dateRange, headers })
      ]);

      setKpis(kpisRes.data.data || {});
      setSalesTrend(salesTrendRes.data.data || []);
      setTopCategories(topCategoriesRes.data.data || []);
      setCategoryPerformance(categoryRes.data.data || []);
      setProfitMargins(profitRes.data.data || []);
      setInventoryHealth(inventoryRes.data.data || []);
      setPaymentMethods(paymentRes.data.data || []);
      setCategoryRotation(rotationRes.data.data || []);
      setWeekdaySales(weekdayRes.data.data || []);

      // Adaptar datos de distribución horaria si vienen del reporte diario
      if (dailySalesRes.data.data) {
        // Asumiendo que el backend podría proveer horas en el futuro, 
        // por ahora usamos los datos de ventas diarias como tendencia si no hay horas específicas.
        // O si el backend ya provee horas (revisar reportController), usarlas.
        setHourlyDistribution(dailySalesRes.data.data.hourly || []);
      }


    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error cargando reportes avanzados');
    } finally {
      setLoading(false);
    }
  };



  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    const now = new Date();

    let startDate, endDate;
    endDate = format(now, 'yyyy-MM-dd');

    switch (period) {
      case 'today':
        startDate = format(now, 'yyyy-MM-dd');
        break;
      case 'week': {
        // Lunes de la semana actual
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Domingo=0, Lunes=1
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek - 1));
        startDate = format(monday, 'yyyy-MM-dd');
        break;
      }
      case 'month': {
        // Primer día del mes actual
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = format(firstDay, 'yyyy-MM-dd');
        break;
      }
      case 'quarter': {
        // Primer día del trimestre actual
        const currentMonth = now.getMonth();
        const quarterStartMonth = currentMonth - (currentMonth % 3);
        const firstDayQuarter = new Date(now.getFullYear(), quarterStartMonth, 1);
        startDate = format(firstDayQuarter, 'yyyy-MM-dd');
        break;
      }
      case 'year': {
        // Primer día del año actual
        const firstDayYear = new Date(now.getFullYear(), 0, 1);
        startDate = format(firstDayYear, 'yyyy-MM-dd');
        break;
      }
      default:
        startDate = format(now, 'yyyy-MM-dd');
        break;
    }
    setDateRange({ startDate, endDate });
  };

  const exportReport = (format) => {
    toast.info(`Exportando reporte en formato ${format}...`);
    // Implementar lógica de exportación
  };

  // Componentes de KPIs
  const KPICard = ({ title, value, subtitle, icon: Icon, color }) => (
    <div className="kpi-card" style={{ borderTop: `4px solid ${color}`, background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="kpi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div className="kpi-icon" style={{ background: `${color}20`, color, width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
          <Icon />
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
    <div className="advanced-reports-container" style={{ padding: '30px', background: 'var(--bg-gradient)', minHeight: '100vh' }}>
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
          <FaTags /> Categorías
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

      </div>

      {/* Vista General */}
      {activeView === 'overview' && (
        <div className="view-content">
          {/* KPIs Principales - Fila superior: 3 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
            <div style={{ animationDelay: '0.3s' }}>
              <KPICard
                title="Facturación Total"
                value={formatCurrency(kpis.totalSales || 0)}
                subtitle="Ingresos del período"
                icon={FaShoppingCart}
                color="#f73194"
              />
            </div>
            <div style={{ animationDelay: '0.4s' }}>
              <KPICard
                title="Ganancia Neta"
                value={formatCurrency(kpis.netProfit || 0)}
                subtitle={<span style={{ color: '#2196F3', fontSize: '16px', fontWeight: '700' }}>Margen: {formatNumber(kpis.profitMargin || 0, 2)}%</span>}
                icon={FaChartLine}
                color="#2196F3"
              />
            </div>
            <div style={{ animationDelay: '0.5s' }}>
              <KPICard
                title="Ticket Promedio"
                value={formatCurrency(kpis.avgTicket || 0)}
                subtitle="Por transacción"
                icon={FaReceipt}
                color="#FF9800"
              />
            </div>
          </div>
          {/* KPIs - Fila inferior: 2 cards más anchas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '30px' }}>
            <div style={{ animationDelay: '0.25s' }}>
              <KPICard
                title="Cantidad de Ventas"
                value={(kpis.totalTransactions || 0).toLocaleString()}
                subtitle="Ventas realizadas"
                icon={FaReceipt}
                color="#00BCD4"
              />
            </div>
            <div style={{ animationDelay: '0.6s' }}>
              <KPICard
                title="Productos Vendidos"
                value={(kpis.totalProducts || 0).toLocaleString()}
                subtitle="Unidades totales"
                icon={FaBoxes}
                color="#9C27B0"
              />
            </div>
          </div>

          {/* KPIs Fijos - No dependen de la fecha */}
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#999', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              📌 Valores fijos — no dependen del período seleccionado
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '30px' }}>
            <div style={{ animationDelay: '0.7s' }}>
              <KPICard
                title="Total de Productos"
                value={(kpis.totalSKUs || 0).toLocaleString()}
                subtitle="Productos registrados"
                icon={FaBox}
                color="#4CAF50"
              />
            </div>
            <div style={{ animationDelay: '0.8s' }}>
              <KPICard
                title="Capital en Ropa"
                value={formatCurrency(kpis.inventoryValueSale || 0)}
                subtitle="Stock × Precio"
                icon={FaDollarSign}
                color="#f73194"
              />
            </div>
            <div style={{ animationDelay: '0.9s' }}>
              <KPICard
                title="Gasto en Ropa"
                value={formatCurrency(kpis.inventoryValue || 0)}
                subtitle="Stock × Costo"
                icon={FaDollarSign}
                color="#FF5722"
              />
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
            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #9C27B0', animationDelay: '1.3s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Formas de Pago</h3>
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

            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #4CAF50', animationDelay: '1.5s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Días de Venta</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={weekdaySales}>
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
            <h2 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>📦 Análisis de Categorías</h2>
          </div>

          <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #FF9800', animationDelay: '0.5s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>Categorías Más Vendidas</h3>
              </div>
              <div className="products-ranking">
                {topCategories.slice(0, 10).map((cat, index) => (
                  <div key={index} className="ranking-item">
                    <div className="ranking-position">
                      <span className={`position ${index < 3 ? 'top' : ''}`}>
                        {index + 1}
                      </span>
                    </div>
                    <div className="ranking-details">
                      <h4>{cat.category_name}</h4>
                      <div className="ranking-stats">
                        <span><FaDollarSign /> ${(cat.total_revenue || 0).toLocaleString()}</span>
                        <span><FaBox /> {cat.total_quantity} und.</span>
                        <span><FaReceipt /> {cat.total_sales} ventas</span>
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
            <div className="chart-card large" style={{ gridColumn: '1 / -1', background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #FF9800', animationDelay: '0.3s' }}>
              <div className="chart-header" style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '600' }}>ROI (Porcentaje de Ganancia) por Categoría</h3>
              </div>
              <div className="roi-list">
                {categoryPerformance.filter(cat => cat.total_cost > 0).map((cat, index) => {
                  const roi = (cat.total_profit / cat.total_cost) * 100;
                  return (
                  <div key={index} className="roi-item">
                    <div className="roi-info">
                      <span className="cat-name">{cat.category_name}</span>
                      <span className="roi-value">{roi.toFixed(2)}%</span>
                    </div>
                    <div className="roi-bar">
                      <div
                        className="roi-fill"
                        style={{
                          width: `${Math.min(roi, 100)}%`,
                          background: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

export default AdvancedReports;
