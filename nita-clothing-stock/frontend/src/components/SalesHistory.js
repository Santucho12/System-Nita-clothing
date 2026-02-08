import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { FaHistory, FaCalendarAlt, FaSearch, FaCreditCard, FaDollarSign, FaUser, FaEnvelope, FaFileInvoice, FaPrint, FaFilePdf, FaTimes, FaCheckCircle, FaTimesCircle, FaExchangeAlt, FaChevronLeft, FaChevronRight, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

const defaultFilters = {
  start_date: '',
  end_date: '',
  payment_method: '',
  status: '',
  customer_email: '',
  sale_number: '',
  page: 1,
  page_size: 20
};

export default function SalesHistory() {
  const [filters, setFilters] = useState(defaultFilters);
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  const fetchSales = async (params = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/ventas/history', { params });
      const { data, total: totalCount } = response.data;
      setSales(data || []);
      setTotal(totalCount || 0);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError('Error al cargar ventas');
      setSales([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchSales({ ...filters, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    fetchSales(defaultFilters);
  };

  const handlePageChange = newPage => {
    setFilters(f => ({ ...f, page: newPage }));
    fetchSales({ ...filters, page: newPage });
  };

  const handleShowDetail = sale => setSelectedSale(sale);
  const handleCloseDetail = () => setSelectedSale(null);

  const handlePrintTicket = (sale) => {
    toast.info('Función de impresión en desarrollo');
  };

  const handleSendEmail = (sale) => {
    toast.info('Función de envío de email en desarrollo');
  };

  const handleCancelSale = (sale) => {
    if (window.confirm('¿Está seguro de cancelar esta venta?')) {
      toast.info('Función de cancelación en desarrollo');
    }
  };

  const handleExportPDF = (sale) => {
    toast.info('Función de exportación a PDF en desarrollo');
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      completada: { bg: '#d4edda', color: '#155724', icon: FaCheckCircle, label: 'Completada' },
      cancelada: { bg: '#f8d7da', color: '#721c24', icon: FaTimesCircle, label: 'Cancelada' },
      devuelta: { bg: '#fff3cd', color: '#856404', icon: FaExchangeAlt, label: 'Devuelta' }
    };
    const style = statusStyles[status] || statusStyles.completada;
    const Icon = style.icon;
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        padding: '6px 14px', 
        borderRadius: '20px', 
        fontSize: '13px', 
        fontWeight: '600', 
        background: style.bg, 
        color: style.color 
      }}>
        <Icon style={{ fontSize: '12px' }} />
        {style.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      efectivo: '💵',
      tarjeta: '💳',
      transferencia: '🏦',
      mixto: '💰'
    };
    return icons[method] || '💳';
  };

  const totalPages = Math.ceil(total / filters.page_size);

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

          .filters-section {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
          }

          .sales-stats {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both;
          }

          .sales-table-container {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s both;
          }

          .btn-pink {
            background: #f73194;
            transition: all 0.3s ease;
          }
          .btn-pink:hover {
            transform: scale(1.1);
          }
          .btn-secondary {
            background: #6c757d;
            transition: all 0.3s ease;
          }
          .btn-secondary:hover {
            transform: scale(1.1);
          }
          .filter-input {
            transition: all 0.3s ease;
          }
          .filter-input:focus {
            border-color: #f73194 !important;
            box-shadow: 0 0 0 3px rgba(247, 49, 148, 0.1) !important;
            outline: none !important;
          }
          .table-row {
            transition: all 0.2s ease;
          }
          .table-row:hover {
            background: #f8f9fa !important;
            transform: translateX(5px);
          }
          .pagination-btn {
            transition: all 0.3s ease;
          }
          .pagination-btn:hover:not(:disabled) {
            transform: scale(1.1);
          }
        `}
      </style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '28px', color: '#333', fontWeight: '600' }}>
          <FaHistory style={{ marginRight: '12px', color: '#f73194', fontSize: '32px' }} />
          Historial de Ventas
        </h1>
        <button 
          className="btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
          style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500', background: '#343a40' }}
        >
          <FaFilter />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {showFilters && (
        <div className="filters-section" style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaSearch style={{ color: '#f73194' }} />
            Filtros de Búsqueda
          </h3>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaCalendarAlt style={{ marginRight: '6px', color: '#f73194' }} />
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '180px', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaCalendarAlt style={{ marginRight: '6px', color: '#f73194' }} />
                  Fecha Fin
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '180px', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaFileInvoice style={{ marginRight: '6px', color: '#f73194' }} />
                  N° Venta
                </label>
                <input
                  type="text"
                  name="sale_number"
                  placeholder="Ej: 00123"
                  value={filters.sale_number}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '150px', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaEnvelope style={{ marginRight: '6px', color: '#f73194' }} />
                  Email Cliente
                </label>
                <input
                  type="email"
                  name="customer_email"
                  placeholder="cliente@ejemplo.com"
                  value={filters.customer_email}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '200px', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaCreditCard style={{ marginRight: '6px', color: '#f73194' }} />
                  Método de Pago
                </label>
                <select
                  name="payment_method"
                  value={filters.payment_method}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '160px', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                >
                  <option value="">Todos</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="mixto">💰 Mixto</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaCheckCircle style={{ marginRight: '6px', color: '#f73194' }} />
                  Estado
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '150px', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                >
                  <option value="">Todos</option>
                  <option value="completada">✓ Completada</option>
                  <option value="cancelada">✗ Cancelada</option>
                  <option value="devuelta">↻ Devuelta</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-secondary"
                style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500', background: '#343a40' }}
              >
                <FaTimes />
                Limpiar
              </button>
              <button
                type="submit"
                className="btn-pink"
                style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500', background: '#f73194' }}
              >
                <FaSearch />
                Buscar
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && sales.length > 0 && (
        <div className="sales-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #f73194' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #f73194 0%, #ff6fb8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaFileInvoice style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Total Ventas</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#333' }}>{total}</p>
              </div>
            </div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #4CAF50' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaDollarSign style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Total Recaudado</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#333' }}>
                  {formatCurrency(sales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0))}
                </p>
              </div>
            </div>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #2196F3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaUser style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Promedio por Venta</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#333' }}>
                  {sales.length > 0 ? formatCurrency(sales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0) / sales.length) : formatCurrency(0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '60px', height: '60px', border: '4px solid #f0f0f0', borderTop: '4px solid #f73194', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }}>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
          <p style={{ fontSize: '18px', color: '#666', margin: 0 }}>Cargando ventas...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
            <FaTimesCircle style={{ fontSize: '60px', color: '#616161' }} />
          </div>
          <h3 style={{ fontSize: '24px', color: '#333', margin: '0 0 12px 0', fontWeight: '600' }}>{error}</h3>
          <p style={{ color: '#666', fontSize: '16px', margin: '0 0 30px 0' }}>Intenta recargar la página o contacta con soporte</p>
          <button 
            onClick={() => fetchSales()}
            className="btn-pink"
            style={{ padding: '14px 28px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: '500', background: '#f73194' }}
          >
            Reintentar
          </button>
        </div>
      ) : sales.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%)', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
            <FaHistory style={{ fontSize: '60px', color: '#f73194' }} />
          </div>
          <h3 style={{ fontSize: '24px', color: '#333', margin: '0 0 12px 0', fontWeight: '600' }}>No hay ventas registradas</h3>
          <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>Las ventas aparecerán aquí una vez que se registren</p>
        </div>
      ) : (
        <>
          <div className="sales-table-container" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6fb8 100%)', color: 'white' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>N° Venta</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Fecha</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Cliente</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px' }}>Método</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>Total</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Estado</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale, index) => (
                    <tr 
                      key={sale.id} 
                      className="table-row"
                      style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? 'white' : '#fafafa' }}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        <FaFileInvoice style={{ marginRight: '8px', color: '#f73194' }} />
                        #{sale.sale_number || sale.id}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#555' }}>
                        <FaCalendarAlt style={{ marginRight: '8px', color: '#999' }} />
                        {new Date(sale.sale_date).toLocaleDateString('es-AR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#555' }}>
                        <FaUser style={{ marginRight: '8px', color: '#999' }} />
                        {sale.customer_email || 'Sin email'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#555' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getPaymentMethodIcon(sale.payment_method)}
                          {sale.payment_method ? sale.payment_method.charAt(0).toUpperCase() + sale.payment_method.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '16px', fontWeight: '700', color: '#4CAF50', textAlign: 'right' }}>
                        {formatCurrency(sale.total || 0)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {getStatusBadge(sale.status || 'completada')}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleShowDetail(sale)}
                          className="btn-pink"
                          style={{ padding: '8px 16px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', background: '#f73194' }}
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #f0f0f0' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                  Mostrando {((filters.page - 1) * filters.page_size) + 1} - {Math.min(filters.page * filters.page_size, total)} de {total} ventas
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 1}
                    className="pagination-btn"
                    style={{ 
                      padding: '8px 12px', 
                      border: '2px solid #e0e0e0', 
                      background: 'white', 
                      borderRadius: '6px', 
                      cursor: filters.page === 1 ? 'not-allowed' : 'pointer',
                      opacity: filters.page === 1 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FaChevronLeft />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (filters.page <= 3) {
                      pageNum = i + 1;
                    } else if (filters.page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = filters.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className="pagination-btn"
                        style={{ 
                          padding: '8px 14px', 
                          border: filters.page === pageNum ? 'none' : '2px solid #e0e0e0', 
                          background: filters.page === pageNum ? '#f73194' : 'white', 
                          color: filters.page === pageNum ? 'white' : '#333',
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          fontWeight: filters.page === pageNum ? '600' : '400',
                          fontSize: '14px'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page === totalPages}
                    className="pagination-btn"
                    style={{ 
                      padding: '8px 12px', 
                      border: '2px solid #e0e0e0', 
                      background: 'white', 
                      borderRadius: '6px', 
                      cursor: filters.page === totalPages ? 'not-allowed' : 'pointer',
                      opacity: filters.page === totalPages ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {selectedSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={handleCloseDetail}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6fb8 100%)', padding: '25px', borderRadius: '16px 16px 0 0', position: 'relative' }}>
              <button
                onClick={handleCloseDetail}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.3)', border: 'none', color: 'white', borderRadius: '50%', width: '36px', height: '36px', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
              >
                <FaTimes />
              </button>
              <h2 style={{ color: 'white', margin: 0, fontSize: '26px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaFileInvoice style={{ fontSize: '28px' }} />
                Detalle de Venta #{selectedSale.sale_number || selectedSale.id}
              </h2>
            </div>

            <div style={{ padding: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                <div style={{ background: '#f8f9fa', padding: '18px', borderRadius: '10px', borderLeft: '4px solid #f73194' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha y Hora</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCalendarAlt style={{ color: '#f73194' }} />
                    {new Date(selectedSale.sale_date).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div style={{ background: '#f8f9fa', padding: '18px', borderRadius: '10px', borderLeft: '4px solid #4CAF50' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</p>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaDollarSign />
                    {formatCurrency(selectedSale.total || 0)}
                  </p>
                </div>
                <div style={{ background: '#f8f9fa', padding: '18px', borderRadius: '10px', borderLeft: '4px solid #2196F3' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUser style={{ color: '#2196F3' }} />
                    {selectedSale.customer_email || 'Sin email'}
                  </p>
                </div>
                <div style={{ background: '#f8f9fa', padding: '18px', borderRadius: '10px', borderLeft: '4px solid #FF9800' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método de Pago</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCreditCard style={{ color: '#FF9800' }} />
                    {getPaymentMethodIcon(selectedSale.payment_method)} {selectedSale.payment_method ? selectedSale.payment_method.charAt(0).toUpperCase() + selectedSale.payment_method.slice(1) : 'N/A'}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</p>
                {getStatusBadge(selectedSale.status || 'completada')}
              </div>

              <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>Productos</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                  {selectedSale.items || 'No hay información de productos disponible'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <button
                  onClick={() => handlePrintTicket(selectedSale)}
                  style={{ padding: '14px', background: '#f73194', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FaPrint />
                  Imprimir Ticket
                </button>
                <button
                  onClick={() => handleSendEmail(selectedSale)}
                  style={{ padding: '14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FaEnvelope />
                  Enviar Email
                </button>
                <button
                  onClick={() => handleExportPDF(selectedSale)}
                  style={{ padding: '14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FaFilePdf />
                  Exportar PDF
                </button>
                <button
                  onClick={() => handleCancelSale(selectedSale)}
                  style={{ padding: '14px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FaTimes />
                  Cancelar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
