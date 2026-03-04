import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import useSortableData from '../hooks/useSortableData';
import { FaHistory, FaCalendarAlt, FaSearch, FaCreditCard, FaDollarSign, FaUser, FaEnvelope, FaFileInvoice, FaPrint, FaFilePdf, FaTimes, FaCheckCircle, FaTimesCircle, FaExchangeAlt, FaChevronLeft, FaChevronRight, FaFilter, FaSortUp, FaSortDown } from 'react-icons/fa';
import { toast } from 'react-toastify';

const defaultFilters = {
  start_date: '',
  end_date: '',
  payment_method: '',
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

  // Hook de ordenado
  const { items: sortedSales, requestSort, sortConfig } = useSortableData(sales, { key: 'created_at', direction: 'descending' });

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

  // Filtrado en vivo con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales({ ...filters, page: 1 });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [filters.start_date, filters.end_date, filters.payment_method, filters.customer_email, filters.sale_number]);

  const handleFilterChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    fetchSales(defaultFilters);
  };

  const handlePageChange = newPage => {
    setFilters(f => ({ ...f, page: newPage }));
    fetchSales({ ...filters, page: newPage });
  };

  const handleShowDetail = async (sale) => {
    try {
      setLoading(true);
      const response = await api.get(`/ventas/${sale.id}`);
      if (response.data.success) {
        setSelectedSale(response.data.data);
      } else {
        setSelectedSale(sale);
      }
    } catch (error) {
      console.error('Error al obtener detalles de venta:', error);
      setSelectedSale(sale);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetail = () => setSelectedSale(null);

  // (handlers antiguos eliminados, solo queda showComingSoonAlert y los nuevos handlers)

  // Alerta genérica para funcionalidades próximas
  const showComingSoonAlert = () => {
    toast.warn('Funcionalidad Próxima a implementar. Esta sección estará disponible próximamente.', {
      position: 'top-center',
      autoClose: 3500,
      style: { fontWeight: '600', fontSize: '16px', color: '#856404', background: '#fffbe6' }
    });
  };

  const handlePrintTicket = () => showComingSoonAlert();
  const handleSendEmail = () => showComingSoonAlert();
  const handleExportPDF = () => showComingSoonAlert();

  const handleCancelSale = async (sale) => {
    if (window.confirm(`¿Estás seguro de que deseas cancelar la venta #${sale.sale_number || sale.id}? Esta acción restaurará el stock de los productos.`)) {
      try {
        setLoading(true);
        const response = await api.delete(`/ventas/${sale.id}`);
        if (response.data.success) {
          toast.success('Venta cancelada exitosamente y stock restaurado.');
          fetchSales();
          setSelectedSale(null);
        }
      } catch (error) {
        toast.error('Error al cancelar la venta: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    }
  };
  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: { bg: '#d4edda', color: '#155724', icon: FaCheckCircle, label: 'Completada' },
      completada: { bg: '#d4edda', color: '#155724', icon: FaCheckCircle, label: 'Completada' },
      cancelled: { bg: '#f8d7da', color: '#721c24', icon: FaTimesCircle, label: 'Cancelada' },
      cancelada: { bg: '#f8d7da', color: '#721c24', icon: FaTimesCircle, label: 'Cancelada' },
      devuelta: { bg: '#fff3cd', color: '#856404', icon: FaExchangeAlt, label: 'Devuelta' }
    };
    const style = statusStyles[status] || statusStyles.completed;
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
      transferencia: '🏦'
    };
    return icons[method] || '💳';
  };

  const totalPages = Math.ceil(total / filters.page_size);

  return (
    <div style={{ padding: '30px', background: 'var(--bg-gradient)', minHeight: '100vh' }}>
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
        <div className="filters-section" style={{ background: 'white', padding: '20px 25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                  <FaCalendarAlt style={{ marginRight: '5px', color: '#f73194' }} />
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '100%', padding: '9px 10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                  <FaCalendarAlt style={{ marginRight: '5px', color: '#f73194' }} />
                  Fecha Fin
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '100%', padding: '9px 10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                  <FaFileInvoice style={{ marginRight: '5px', color: '#f73194' }} />
                  N° Venta
                </label>
                <input
                  type="text"
                  name="sale_number"
                  placeholder="Ej: 00123"
                  value={filters.sale_number}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '100%', padding: '9px 10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                  <FaEnvelope style={{ marginRight: '5px', color: '#f73194' }} />
                  Email Cliente
                </label>
                <input
                  type="text"
                  name="customer_email"
                  placeholder="cliente@ejemplo.com"
                  value={filters.customer_email}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '100%', padding: '9px 10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                  <FaCreditCard style={{ marginRight: '5px', color: '#f73194' }} />
                  Método de Pago
                </label>
                <select
                  name="payment_method"
                  value={filters.payment_method}
                  onChange={handleFilterChange}
                  className="filter-input"
                  style={{ width: '100%', padding: '9px 10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  <option value="">Todos</option>
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                  <option value="transferencia">🏦 Transferencia</option>
                </select>
              </div>
              {(filters.start_date || filters.end_date || filters.payment_method || filters.customer_email || filters.sale_number) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn-secondary"
                  style={{ padding: '9px 18px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', background: '#343a40', whiteSpace: 'nowrap' }}
                >
                  <FaTimes />
                  Limpiar
                </button>
              )}
            </div>
        </div>
      )}

      {!loading && sales.length > 0 && (
        <div className="sales-stats" style={{ marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px 25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: '4px solid #f73194', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: 'linear-gradient(135deg, #f73194 0%, #ff6fb8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FaFileInvoice style={{ fontSize: '20px', color: 'white' }} />
            </div>
            <p style={{ margin: 0, fontSize: '15px', color: '#666', fontWeight: '500' }}>Total Ventas</p>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#333' }}>{total}</p>
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
                    <th onClick={() => requestSort('sale_number')} style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                      N° Venta {sortConfig?.key === 'sale_number' && (sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                    </th>
                    <th onClick={() => requestSort('created_at')} style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                      Fecha {sortConfig?.key === 'created_at' && (sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                    </th>
                    <th onClick={() => requestSort('customer_email')} style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                      Cliente {sortConfig?.key === 'customer_email' && (sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                    </th>
                    <th onClick={() => requestSort('payment_method')} style={{ padding: '16px', textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                      Método {sortConfig?.key === 'payment_method' && (sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                    </th>
                    <th onClick={() => requestSort('total')} style={{ padding: '16px', textAlign: 'right', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                      Total {sortConfig?.key === 'total' && (sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                    </th>
                    <th onClick={() => requestSort('status')} style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                      Estado {sortConfig?.key === 'status' && (sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                    </th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', fontSize: '14px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map((sale, index) => (
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
                        {new Date(sale.created_at).toLocaleDateString('es-AR', {
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
            <div style={{ background: 'linear-gradient(135deg, #f73194 0%, #ff6fb8 100%)', padding: '23px', borderRadius: '16px 16px 0 0', position: 'relative' }}>
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

            <div style={{ padding: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '23px' }}>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #f73194' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha y Hora</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaCalendarAlt style={{ color: '#f73194' }} />
                    {new Date(selectedSale.created_at).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #4CAF50' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</p>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaDollarSign />
                    {formatCurrency(selectedSale.total || 0)}
                  </p>
                </div>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #2196F3' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente</p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUser style={{ color: '#2196F3' }} />
                    {selectedSale.customer_email || 'Sin email'}
                  </p>
                </div>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #FF9800' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método de Pago</p>
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
                {Array.isArray(selectedSale.items) ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                        <th style={{ padding: '8px 0' }}>Producto</th>
                        <th style={{ padding: '8px 0' }}>Cant.</th>
                        <th style={{ padding: '8px 0', textAlign: 'right' }}>Unit.</th>
                        <th style={{ padding: '8px 0', textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px 0' }}>
                            <div style={{ fontWeight: '600' }}>{item.product_name}</div>
                            <div style={{ fontSize: '12px', color: '#777' }}>{item.product_size} | {item.product_color}</div>
                          </td>
                          <td style={{ padding: '10px 0' }}>{item.quantity}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" style={{ padding: '15px 0 5px 0', textAlign: 'right', color: '#666' }}>Sutotal:</td>
                        <td style={{ padding: '15px 0 5px 0', textAlign: 'right', color: '#666' }}>{formatCurrency(selectedSale.subtotal || 0)}</td>
                      </tr>
                      {selectedSale.discount_amount > 0 && (
                        <tr>
                          <td colSpan="3" style={{ padding: '5px 0', textAlign: 'right', color: '#f73194' }}>Descuento ({selectedSale.discount_percent}%):</td>
                          <td style={{ padding: '5px 0', textAlign: 'right', color: '#f73194' }}>-{formatCurrency(selectedSale.discount_amount)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', fontSize: '18px' }}>Total:</td>
                        <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', fontSize: '18px', color: '#4CAF50' }}>{formatCurrency(selectedSale.total || 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                    {selectedSale.items || 'No hay información de productos disponible'}
                  </p>
                )}
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
                  disabled={selectedSale?.status === 'cancelled'}
                  style={{ padding: '14px', background: selectedSale?.status === 'cancelled' ? '#adb5bd' : '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: selectedSale?.status === 'cancelled' ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease', opacity: selectedSale?.status === 'cancelled' ? 0.6 : 1 }}
                  onMouseOver={(e) => { if (selectedSale?.status !== 'cancelled') e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FaTimes />
                  {selectedSale?.status === 'cancelled' ? 'Venta Cancelada' : 'Cancelar Venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
