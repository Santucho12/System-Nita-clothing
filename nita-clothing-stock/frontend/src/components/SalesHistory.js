import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import useSortableData from '../hooks/useSortableData';
import {
  FaHistory, FaCalendarAlt, FaCreditCard, FaDollarSign,
  FaUser, FaEnvelope, FaFileInvoice, FaPrint, FaFilePdf,
  FaTimes, FaCheckCircle, FaTimesCircle, FaExchangeAlt,
  FaChevronLeft, FaChevronRight, FaFilter, FaSortUp, FaSortDown,
  FaHardHat, FaHashtag
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import './SalesHistory.css';
import PremiumModal from './PremiumModal';
import './PremiumModal.css';

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
  const [showComingSoon, setShowComingSoon] = useState(false);

  const [premiumModal, setPremiumModal] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    onConfirm: () => { },
    inputValue: '',
    onInputChange: (val) => setPremiumModal(prev => ({ ...prev, inputValue: val }))
  });

  // Configuración de tipos para el ordenado
  const sortOptions = React.useMemo(() => ({
    key: 'created_at',
    direction: 'descending',
    keyTypes: {
      id: 'number',
      total: 'number',
      created_at: 'date',
      sale_number: 'number'
    }
  }), []);

  const { items: sortedSales, requestSort, sortConfig } = useSortableData(sales, sortOptions);

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
      setError('Error al recibir los datos de ventas');
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
        // Aseguramos que el ID se mantenga aunque el backend no lo devuelva en el detail
        setSelectedSale({ ...response.data.data, id: sale.id });
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

  const handlePrintTicket = () => setShowComingSoon(true);
  const handleSendEmail = () => setShowComingSoon(true);
  const handleExportPDF = () => setShowComingSoon(true);

  const handleCancelSale = (sale) => {
    if (!sale || !sale.id) {
      toast.error('No se pudo identificar la venta a cancelar');
      return;
    }
    const saleId = sale.id;

    setPremiumModal({
      show: true,
      type: 'danger',
      title: 'Cancelar Venta',
      message: `¿Estás seguro de que deseas cancelar la venta #${saleId}?.`,
      confirmText: 'Cancelar Venta',
      cancelText: 'Cerrar',
      onConfirm: async () => {
        try {
          setLoading(true);
          const response = await api.delete(`/ventas/${saleId}`);
          if (response.data.success) {
            toast.success('Venta cancelada exitosamente.');
            fetchSales();
            setSelectedSale(null);
          } else {
            toast.error(response.data.message || 'Error al cancelar la venta');
          }
          setPremiumModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          console.error('Error al cancelar venta:', error);
          toast.error('Error al cancelar la venta. Por favor, intente de nuevo.');
          setPremiumModal(prev => ({ ...prev, show: false }));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    const s = (status || 'completada').toLowerCase();
    let className = 'status-completed';
    let label = 'Completada';
    let Icon = FaCheckCircle;

    if (s === 'cancelada' || s === 'cancelled') {
      className = 'status-cancelled';
      label = 'Cancelada';
      Icon = FaTimesCircle;
    } else if (s === 'devuelta') {
      className = 'status-returned';
      label = 'Devuelta';
      Icon = FaExchangeAlt;
    }

    return (
      <span className={`premium-status-badge ${className}`}>
        <Icon /> {label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const m = (method || '').toLowerCase();
    if (m === 'efectivo') return '💵';
    if (m === 'tarjeta') return '💳';
    if (m === 'transferencia') return '🏦';
    return '💎';
  };

  const totalPages = Math.ceil(total / filters.page_size);

  return (
    <div className="sales-history-container">
      {/* ═══════ HERO HEADER ═══════ */}
      <div className="products-hero" style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '28px 36px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            background: 'var(--accent-pink-light)',
            padding: '14px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaHistory style={{ color: 'var(--accent-pink)', fontSize: '26px' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Historial de Ventas
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
              {total} venta{total !== 1 ? 's' : ''} registradas en el sistema
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '11px 22px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
          >
            <FaFilter />
            {showFilters ? 'Ocultar Filtros' : 'Filtrar Datos'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="products-filters-bar" style={{
          background: 'var(--bg-card)',
          borderRadius: '20px',
          padding: '20px 28px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div className="filter-grid" style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 125px', position: 'relative' }}>
              <FaCalendarAlt style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#f73194', fontSize: '14px', zIndex: 1, pointerEvents: 'none' }} />
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="nita-filter-select"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <div style={{ flex: '1 1 125px', position: 'relative' }}>
              <FaCalendarAlt style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#f73194', fontSize: '14px', zIndex: 1, pointerEvents: 'none' }} />
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="nita-filter-select"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <div style={{ flex: '1 1 120px', position: 'relative' }}>
              <FaHashtag style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#f73194', fontSize: '14px', zIndex: 1, pointerEvents: 'none' }} />
              <input
                type="text"
                name="sale_number"
                placeholder="N° Venta"
                value={filters.sale_number}
                onChange={handleFilterChange}
                className="nita-search-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <div style={{ flex: '2.5 1 180px', position: 'relative' }}>
              <FaEnvelope style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-pink)', fontSize: '14px', zIndex: 1, pointerEvents: 'none' }} />
              <input
                type="text"
                name="customer_email"
                placeholder="Email del cliente..."
                value={filters.customer_email}
                onChange={handleFilterChange}
                className="nita-search-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <div style={{ flex: '1.5 1 160px', position: 'relative' }}>
              <FaCreditCard style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#f73194', fontSize: '14px', zIndex: 1, pointerEvents: 'none' }} />
              <select
                name="payment_method"
                value={filters.payment_method}
                onChange={handleFilterChange}
                className="nita-filter-select"
                style={{ paddingLeft: '40px' }}
              >
                <option value="">Método de Pago</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Débito">Débito</option>
              </select>
            </div>
            {Object.values(filters).some(v => v !== '' && typeof v === 'string' && v !== defaultFilters.page_size && v !== defaultFilters.page) && (
              <button
                onClick={handleClearFilters}
                className="clear-filters-chip"
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <FaTimes />
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="full-width-stat-card">
        <div className="stat-icon-box">
          <FaFileInvoice />
        </div>
        <div className="stat-info-info">
          <span className="stat-label-text">Total Ventas</span>
          <span className="stat-value-text">{total}</span>
        </div>
      </div>

      {loading && !selectedSale ? (
        <div className="loading-premium animate-fade-in">
          <div className="spinner-premium"></div>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Recuperando movimientos...</p>
        </div>
      ) : error ? (
        <div className="loading-premium animate-fade-in">
          <FaTimesCircle style={{ fontSize: '60px', color: '#c62828', marginBottom: '20px' }} />
          <h3>{error}</h3>
          <button onClick={() => fetchSales()} className="action-btn btn-primary-action" style={{ marginTop: '20px' }}>Reintentar</button>
        </div>
      ) : sales.length === 0 ? (
        <div className="loading-premium animate-fade-in">
          <div style={{ background: 'rgba(247, 49, 148, 0.1)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <FaHistory style={{ fontSize: '40px', color: '#f73194' }} />
          </div>
          <h3>Historial Vacío</h3>
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron ventas con los filtros actuales.</p>
        </div>
      ) : (
        <div className="table-premium-container">
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>N° Venta</th>
                  <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>Fecha</th>
                  <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>Cliente</th>
                  <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>Pago</th>
                  <th onClick={() => requestSort('total')} style={{ cursor: 'pointer', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      Total {sortConfig?.key === 'total' && (sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                    </div>
                  </th>
                  <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>Estado</th>
                  <th style={{ textAlign: 'center', verticalAlign: 'middle' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {sortedSales.map((sale) => (
                  <tr key={sale.id} className="table-row-item">
                    <td style={{ fontWeight: '700', color: 'var(--accent-pink)', textAlign: 'center', verticalAlign: 'middle' }}>#{sale.id}</td>
                    <td style={{ fontSize: '13px', padding: '12px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontWeight: '800', color: 'var(--accent-pink)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.02em' }}>
                          {new Date(sale.created_at).toLocaleDateString('es-ES', { weekday: 'long' })}
                        </span>
                        <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '14px' }}>
                          {new Date(sale.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', opacity: 0.8, textAlign: 'center', verticalAlign: 'middle' }}>{sale.customer_email || 'Particular'}</td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        {getPaymentMethodIcon(sale.payment_method)}
                        {sale.payment_method}
                      </span>
                    </td>
                    <td style={{ fontWeight: '800', color: 'var(--accent-pink)', textAlign: 'center', verticalAlign: 'middle' }}>
                      {formatCurrency(sale.total)}
                    </td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{getStatusBadge(sale.status)}</td>
                    <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button onClick={() => handleShowDetail(sale)} className="premium-btn premium-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Página {filters.page} de {totalPages}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button disabled={filters.page === 1} onClick={() => handlePageChange(filters.page - 1)} className="page-btn"><FaChevronLeft /></button>
                {[...Array(totalPages)].map((_, i) => (
                  (i + 1 === 1 || i + 1 === totalPages || Math.abs(i + 1 - filters.page) <= 1) && (
                    <button key={i} onClick={() => handlePageChange(i + 1)} className={`page-btn ${filters.page === i + 1 ? 'active' : ''}`}>
                      {i + 1}
                    </button>
                  )
                ))}
                <button disabled={filters.page === totalPages} onClick={() => handlePageChange(filters.page + 1)} className="page-btn"><FaChevronRight /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedSale && (
        <div className="modal-premium-overlay" onClick={handleCloseDetail}>
          <div className="modal-premium-content" onClick={e => e.stopPropagation()}>
            <div className="modal-premium-header">
              <button onClick={handleCloseDetail} style={{ position: 'absolute', right: '20px', top: '20px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', color: 'var(--text-primary)', padding: '10px', cursor: 'pointer' }}>
                <FaTimes />
              </button>
              <h2><FaFileInvoice /> Venta #{selectedSale.id}</h2>
            </div>

            <div className="modal-premium-body">
              <div className="detail-card-grid">
                <div className="info-premium-box">
                  <span className="info-label">Fecha del Movimiento</span>
                  <span className="info-value">{new Date(selectedSale.created_at).toLocaleString()}</span>
                </div>
                <div className="info-premium-box" style={{ borderLeftColor: '#4CAF50' }}>
                  <span className="info-label">Medio de Pago</span>
                  <span className="info-value">{getPaymentMethodIcon(selectedSale.payment_method)} {selectedSale.payment_method}</span>
                </div>
                <div className="info-premium-box" style={{ borderLeftColor: '#2196F3' }}>
                  <span className="info-label">Cliente Asociado</span>
                  <span className="info-value">{selectedSale.customer_email || 'Sin Registrar'}</span>
                </div>
                <div className="info-premium-box" style={{ borderLeftColor: '#f73194' }}>
                  <span className="info-label">Estado Actual</span>
                  <div style={{ marginTop: '5px' }}>{getStatusBadge(selectedSale.status)}</div>
                </div>
              </div>

              <div className="modal-table-container">
                <h4 style={{ margin: '0 0 15px 0', textTransform: 'uppercase', fontSize: '13px', letterSpacing: '1px' }}>Productos en esta venta</h4>
                <table className="modal-product-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ textAlign: 'center' }}>Cant.</th>
                      <th style={{ textAlign: 'right' }}>Precio</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(selectedSale.items) ? selectedSale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>Talle: {item.product_size} | Color: {item.product_color}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No hay detalles de items</td></tr>
                    )}
                  </tbody>
                </table>

                <div className="total-summary-section">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedSale.subtotal || 0)}</span>
                  </div>
                  {selectedSale.discount_amount > 0 && (
                    <div className="summary-row" style={{ color: '#f73194' }}>
                      <span>Descuento ({selectedSale.discount_percent}%):</span>
                      <span>-{formatCurrency(selectedSale.discount_amount)}</span>
                    </div>
                  )}
                  <div className="total-premium-row" style={{ color: 'var(--accent-pink)' }}>
                    {formatCurrency(selectedSale.total || 0)}
                  </div>
                </div>
              </div>

              <div className="modal-actions-grid">
                <button onClick={handlePrintTicket} className="action-btn btn-primary-action"><FaPrint /> Imprimir</button>
                <button onClick={handleSendEmail} className="action-btn btn-secondary-action"><FaEnvelope /> Correo</button>
                <button onClick={handleExportPDF} className="action-btn btn-secondary-action"><FaFilePdf /> PDF</button>
                <button
                  onClick={() => handleCancelSale(selectedSale)}
                  disabled={selectedSale?.status === 'cancelled' || selectedSale?.status === 'cancelada'}
                  className="action-btn btn-danger-action"
                >
                  <FaTimes /> Cancelar Venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showComingSoon && (
        <div className="modal-premium-overlay" onClick={() => setShowComingSoon(false)}>
          <div className="modal-premium-content" style={{ maxWidth: '450px', textAlign: 'center', padding: '40px' }} onClick={e => e.stopPropagation()}>
            <div style={{ margin: '0 auto 20px', background: 'rgba(247, 49, 148, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaHardHat style={{ fontSize: '40px', color: '#f73194' }} />
            </div>
            <h2 style={{ marginBottom: '15px', color: 'var(--text-heading)', fontSize: '24px', fontWeight: '800' }}>Funcionalidad Próxima a implementar</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '15px', lineHeight: '1.6' }}>
              Estamos trabajando para que las opciones de <strong>Impresión, Envío de Correo y Exportación PDF</strong> estén disponibles muy pronto.
            </p>
            <button className="action-btn btn-primary-action" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowComingSoon(false)}>
              Entendido
            </button>
          </div>
        </div>
      )}
      <PremiumModal
        show={premiumModal.show}
        type={premiumModal.type}
        title={premiumModal.title}
        message={premiumModal.message}
        inputValue={premiumModal.inputValue}
        onInputChange={premiumModal.onInputChange}
        onConfirm={premiumModal.onConfirm}
        onCancel={() => setPremiumModal(prev => ({ ...prev, show: false }))}
        confirmText={premiumModal.confirmText}
        cancelText={premiumModal.cancelText}
      />
    </div>
  );
}
