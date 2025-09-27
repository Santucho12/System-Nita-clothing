import React, { useState, useEffect } from 'react';
import { reportsService } from '../services/salesService';
import { toast } from 'react-toastify';
import './Reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [dailySales, setDailySales] = useState([]);
  const [performanceReport, setPerformanceReport] = useState({});
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      
      const [
        monthlyStatsResponse,
        topProductsResponse,
        paymentMethodsResponse,
        dailySalesResponse,
        performanceResponse
      ] = await Promise.all([
        reportsService.getMonthlyStats(),
        reportsService.getTopProducts(10),
        reportsService.getSalesByPaymentMethod(filters.year, filters.month),
        reportsService.getDailySalesReport(filters.year, filters.month),
        reportsService.getPerformanceReport()
      ]);

      setMonthlyStats(monthlyStatsResponse.data || {});
      setTopProducts(topProductsResponse.data || []);
      setPaymentMethods(paymentMethodsResponse.data || []);
      setDailySales(dailySalesResponse.data || []);
      setPerformanceReport(performanceResponse.data || {});

    } catch (error) {
      toast.error('Error cargando reportes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    try {
      const [paymentMethodsResponse, dailySalesResponse] = await Promise.all([
        reportsService.getSalesByPaymentMethod(newFilters.year, newFilters.month),
        reportsService.getDailySalesReport(newFilters.year, newFilters.month)
      ]);

      setPaymentMethods(paymentMethodsResponse.data || []);
      setDailySales(dailySalesResponse.data || []);
    } catch (error) {
      toast.error('Error actualizando filtros: ' + error.message);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatPercentage = (value) => {
    if (value === 'N/A') return 'N/A';
    return `${parseFloat(value).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-chart-bar"></i>
          Reportes y Estadísticas
        </h1>
        <p>Análisis detallado de ventas y rendimiento del negocio</p>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <h3>Filtros de Fecha</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="year">Año:</label>
            <select 
              id="year"
              value={filters.year}
              onChange={(e) => handleFilterChange({ ...filters, year: parseInt(e.target.value) })}
            >
              {[2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="month">Mes:</label>
            <select 
              id="month"
              value={filters.month}
              onChange={(e) => handleFilterChange({ ...filters, month: parseInt(e.target.value) })}
            >
              {[
                { value: 1, label: 'Enero' },
                { value: 2, label: 'Febrero' },
                { value: 3, label: 'Marzo' },
                { value: 4, label: 'Abril' },
                { value: 5, label: 'Mayo' },
                { value: 6, label: 'Junio' },
                { value: 7, label: 'Julio' },
                { value: 8, label: 'Agosto' },
                { value: 9, label: 'Septiembre' },
                { value: 10, label: 'Octubre' },
                { value: 11, label: 'Noviembre' },
                { value: 12, label: 'Diciembre' }
              ].map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={loadReportsData}>
            <i className="fas fa-sync-alt"></i>
            Actualizar
          </button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="summary-section">
        <h2>
          <i className="fas fa-chart-line"></i>
          Resumen del Mes Actual
        </h2>
        <div className="summary-grid">
          <div className="summary-card revenue">
            <div className="summary-icon">
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="summary-content">
              <h3>{formatCurrency(monthlyStats.total_revenue)}</h3>
              <p>Ingresos Totales</p>
            </div>
          </div>
          <div className="summary-card sales">
            <div className="summary-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="summary-content">
              <h3>{monthlyStats.total_sales || 0}</h3>
              <p>Ventas Realizadas</p>
            </div>
          </div>
          <div className="summary-card items">
            <div className="summary-icon">
              <i className="fas fa-box"></i>
            </div>
            <div className="summary-content">
              <h3>{monthlyStats.total_items_sold || 0}</h3>
              <p>Productos Vendidos</p>
            </div>
          </div>
          <div className="summary-card average">
            <div className="summary-icon">
              <i className="fas fa-chart-bar"></i>
            </div>
            <div className="summary-content">
              <h3>{formatCurrency(monthlyStats.average_sale)}</h3>
              <p>Venta Promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparación con Mes Anterior */}
      {performanceReport.growth && (
        <div className="performance-section">
          <h2>
            <i className="fas fa-trending-up"></i>
            Comparación vs Mes Anterior
          </h2>
          <div className="performance-grid">
            <div className="performance-card">
              <h4>Crecimiento en Ingresos</h4>
              <div className={`growth-indicator ${parseFloat(performanceReport.growth.revenue_growth_percentage) >= 0 ? 'positive' : 'negative'}`}>
                <i className={`fas fa-arrow-${parseFloat(performanceReport.growth.revenue_growth_percentage) >= 0 ? 'up' : 'down'}`}></i>
                {formatPercentage(performanceReport.growth.revenue_growth_percentage)}
              </div>
            </div>
            <div className="performance-card">
              <h4>Crecimiento en Ventas</h4>
              <div className={`growth-indicator ${parseFloat(performanceReport.growth.sales_growth_percentage) >= 0 ? 'positive' : 'negative'}`}>
                <i className={`fas fa-arrow-${parseFloat(performanceReport.growth.sales_growth_percentage) >= 0 ? 'up' : 'down'}`}></i>
                {formatPercentage(performanceReport.growth.sales_growth_percentage)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Productos Más Vendidos */}
      {topProducts.length > 0 && (
        <div className="top-products-section">
          <h2>
            <i className="fas fa-trophy"></i>
            Productos Más Vendidos del Mes
          </h2>
          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Ranking</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Cantidad Vendida</th>
                  <th>Ingresos Generados</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={product.product_id}>
                    <td>
                      <span className="ranking">#{index + 1}</span>
                    </td>
                    <td>
                      <div className="product-info">
                        <strong>{product.product_name}</strong>
                        <small>Color: {product.color}</small>
                      </div>
                    </td>
                    <td>{product.category_name}</td>
                    <td>{product.total_quantity} unidades</td>
                    <td className="revenue">{formatCurrency(product.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ventas por Método de Pago */}
      {paymentMethods.length > 0 && (
        <div className="payment-methods-section">
          <h2>
            <i className="fas fa-credit-card"></i>
            Ventas por Método de Pago
          </h2>
          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Método de Pago</th>
                  <th>Transacciones</th>
                  <th>Ingresos Totales</th>
                  <th>Venta Promedio</th>
                  <th>Venta Min/Max</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map((method, index) => (
                  <tr key={index}>
                    <td>
                      <div className="payment-method">
                        <i className={`fas fa-${method.payment_method === 'efectivo' ? 'money-bill' : 'credit-card'}`}></i>
                        {method.payment_method.charAt(0).toUpperCase() + method.payment_method.slice(1)}
                      </div>
                    </td>
                    <td>{method.transaction_count}</td>
                    <td className="revenue">{formatCurrency(method.total_revenue)}</td>
                    <td>{formatCurrency(method.average_sale)}</td>
                    <td>
                      <small>{formatCurrency(method.min_sale)} - {formatCurrency(method.max_sale)}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ventas Diarias */}
      {dailySales.length > 0 && (
        <div className="daily-sales-section">
          <h2>
            <i className="fas fa-calendar-alt"></i>
            Ventas Diarias del Mes
          </h2>
          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Transacciones</th>
                  <th>Productos Vendidos</th>
                  <th>Ingresos del Día</th>
                  <th>Promedio por Transacción</th>
                </tr>
              </thead>
              <tbody>
                {dailySales.map((day, index) => (
                  <tr key={index}>
                    <td>{new Date(day.date).toLocaleDateString('es-ES')}</td>
                    <td>{day.transactions}</td>
                    <td>{day.items_sold}</td>
                    <td className="revenue">{formatCurrency(day.revenue)}</td>
                    <td>{formatCurrency(day.avg_transaction)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;