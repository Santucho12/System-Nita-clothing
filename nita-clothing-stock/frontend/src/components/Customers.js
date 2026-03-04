import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import useSortableData from '../hooks/useSortableData';
import { FaUsers, FaSearch, FaChartPie, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShoppingBag, FaDollarSign, FaCalendarAlt, FaSortAmountDown, FaSortUp, FaSortDown } from 'react-icons/fa';
import '../components/Sidebar.css';
import './Customers.css';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [segmentation, setSegmentation] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list, segmentation
  const [showModal, setShowModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  // Hook de ordenado para la lista general
  const { items: sortedCustomers, requestSort, sortConfig } = useSortableData(customers, { key: 'name', direction: 'ascending' });

  // Hook de ordenado para segmentación
  const { items: sortedSegmentation, requestSort: requestSortSeg, sortConfig: sortConfigSeg } = useSortableData(segmentation, { key: 'total_spent', direction: 'descending' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes');
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegmentation = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes/segmentacion');
      setSegmentation(res.data.data || []);
      setView('segmentation');
    } catch (err) {
      console.error('Error fetching segmentation:', err);
      toast.error('Error al cargar la segmentación de clientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (email) => {
    console.log('Fetching customer detail for:', email);
    setLoading(true);
    setShowModal(true); // Mostrar modal inmediatamente
    try {
      const encodedEmail = encodeURIComponent(email);
      const [customer, stats, history] = await Promise.all([
        api.get(`/clientes/${encodedEmail}`),
        api.get(`/clientes/${encodedEmail}/estadisticas`),
        api.get(`/clientes/${encodedEmail}/compras`)
      ]);
      setSelectedCustomer(customer.data.data);
      setCustomerStats(stats.data.data);
      setPurchaseHistory(history.data.data);
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setShowModal(false); // Cerrar modal si hay error
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
    setCustomerStats(null);
    setPurchaseHistory([]);
  };

  const filteredCustomers = sortedCustomers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const getSegmentClass = (segment) => {
    if (segment === 'VIP') return 'segment-vip';
    if (segment === 'Regular') return 'segment-regular';
    return 'segment-new';
  };

  return (
    <div className="customers-container" style={{ padding: '30px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      {/* ═══════ HERO HEADER ═══════ */}
      <div className="products-hero" style={{
        background: 'white',
        borderRadius: '20px',
        padding: '28px 36px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff0f7, #ffe0ef)',
            padding: '14px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaUsers style={{ color: '#f73194', fontSize: '26px' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b', letterSpacing: '-0.02em' }}>
              Gestión de Clientes
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>
              {view === 'list' ? `${customers.length} clientes en tu base de datos` : 'Análisis inteligente del comportamiento de compra'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => { setView('list'); fetchCustomers(); }}
            style={{
              padding: '11px 22px',
              color: view === 'list' ? 'white' : '#475569',
              background: view === 'list' ? '#f73194' : '#f1f5f9',
              border: 'none',
              borderRadius: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: '700', transition: 'all 0.2s',
              boxShadow: view === 'list' ? '0 4px 14px rgba(247,49,148,0.25)' : 'none'
            }}
          >
            <FaUsers />
            Lista
          </button>
          <button
            onClick={fetchSegmentation}
            style={{
              padding: '11px 22px',
              color: view === 'segmentation' ? 'white' : '#475569',
              background: view === 'segmentation' ? '#f73194' : '#f1f5f9',
              border: 'none',
              borderRadius: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: '700', transition: 'all 0.2s',
              boxShadow: view === 'segmentation' ? '0 4px 14px rgba(247,49,148,0.25)' : 'none'
            }}
          >
            <FaChartPie />
            Segmentación
          </button>
        </div>
      </div>

      {loading && !showModal ? (
        <div className="animate-fade-in" style={{ textAlign: 'center', padding: '100px', background: 'var(--bg-card)', borderRadius: '24px', boxShadow: 'var(--shadow)' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 25px' }}>
            <div className="loading-pulse" style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: 'var(--accent-pink-light)', animation: 'pulse 2s infinite' }}></div>
            <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: 'var(--accent-pink)' }}>⏳</div>
          </div>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', fontWeight: '500' }}>Sincronizando base de datos...</p>
        </div>
      ) : (
        <>
          {view === 'list' && (
            <div className="animate-fade-in">
              <div className="products-filters-bar" style={{
                background: 'white',
                borderRadius: '20px',
                padding: '20px 28px',
                marginBottom: '28px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.04)'
              }}>
                <div style={{ position: 'relative' }}>
                  <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '15px', zIndex: 1, pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono de cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="nita-search-input"
                  />
                </div>
              </div>

              <div className="customers-grid">
                {filteredCustomers.length === 0 ? (
                  <div className="empty-state animate-fade-in" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 40px', background: 'var(--bg-card)', borderRadius: '20px', boxShadow: 'var(--shadow)' }}>
                    <div style={{ background: 'var(--accent-pink-light)', width: '120px', height: '120px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px', transform: 'rotate(-5deg)' }}>
                      <FaUsers style={{ fontSize: '60px', color: 'var(--accent-pink)' }} />
                    </div>
                    <h3 style={{ fontSize: '26px', color: 'var(--text-heading)', margin: '0 0 12px 0', fontWeight: '700' }}>Sin resultados</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', margin: '0', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>No pudimos encontrar clientes que coincidan con tu búsqueda. Prueba con otros términos.</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <div key={customer.email} className="premium-customer-card" style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className="card-top-accent"></div>
                      <div className="card-content">
                        <div className="card-header">
                          <h3 className="customer-name">{customer.name || 'Cliente Sin Nombre'}</h3>
                          <button
                            className="view-detail-btn"
                            onClick={() => fetchCustomerDetail(customer.email)}
                          >
                            Ver Perfil
                          </button>
                        </div>

                        <div className="customer-details">
                          <div className="customer-info-row">
                            <FaEnvelope className="info-icon" />
                            <span style={{ wordBreak: 'break-all' }}>{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="customer-info-row">
                              <FaPhone className="info-icon" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="customer-info-row">
                              <FaMapMarkerAlt className="info-icon" />
                              <span>{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'segmentation' && (
            <div className="segmentation-container animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, fontSize: '22px', color: 'var(--text-heading)', fontWeight: '700' }}>Segmentación de Inteligencia de Clientes</h3>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '8px' }}>
                  Total Clientes: {sortedSegmentation.length}
                </div>
              </div>
              <div className="table-wrapper">
                <table className="premium-table">
                  <thead>
                    <tr>

                      <th onClick={() => requestSortSeg('email')} style={{ cursor: 'pointer' }}>
                        Contacto {sortConfigSeg?.key === 'email' && (sortConfigSeg.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                      </th>
                      <th onClick={() => requestSortSeg('purchase_count')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                        Compras {sortConfigSeg?.key === 'purchase_count' && (sortConfigSeg.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                      </th>
                      <th onClick={() => requestSortSeg('total_spent')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                        Inversión Total {sortConfigSeg?.key === 'total_spent' && (sortConfigSeg.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                      </th>
                      <th onClick={() => requestSortSeg('last_purchase')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                        Última Actividad {sortConfigSeg?.key === 'last_purchase' && (sortConfigSeg.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                      </th>
                      <th onClick={() => requestSortSeg('segment')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                        Segmento {sortConfigSeg?.key === 'segment' && (sortConfigSeg.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />)}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSegmentation.map(c => (
                      <tr key={c.email}>

                        <td style={{ fontSize: '13px', opacity: 0.8 }}>{c.email}</td>
                        <td style={{ textAlign: 'center', fontWeight: '700' }}>{c.purchase_count || 0}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-pink)' }}>{formatCurrency(c.total_spent || 0)}</td>
                        <td style={{ textAlign: 'center', fontSize: '13px' }}>{c.last_purchase?.slice(0, 10) || 'Sin compras'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`segment-pill ${getSegmentClass(c.segment)}`}>
                            {c.segment === 'VIP' && <FaDollarSign style={{ fontSize: '10px' }} />}
                            {c.segment}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showModal && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="premium-modal" onClick={e => e.stopPropagation()}>
                <button className="close-modal-btn" onClick={closeModal}>✕</button>

                {!selectedCustomer ? (
                  <div style={{ textAlign: 'center', padding: '100px 40px' }}>
                    <div style={{ fontSize: '48px', color: 'var(--accent-pink)', marginBottom: '20px', animation: 'pulse 1.5s infinite' }}>⏳</div>
                    <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Compilando historial detallado...</p>
                  </div>
                ) : (
                  <>
                    <div className="modal-header-hero">
                      <div className="customer-avatar-large">
                        <FaUser />
                      </div>
                      <div className="hero-text">
                        <h2>{selectedCustomer.name || selectedCustomer.email.split('@')[0]}</h2>
                        <p>{selectedCustomer.email}</p>
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                          {selectedCustomer.phone && (
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FaPhone style={{ fontSize: '10px' }} /> {selectedCustomer.phone}
                            </span>
                          )}
                          <span style={{ background: 'var(--accent-pink)', border: '1px solid rgba(255,255,255,0.4)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                            {customerStats?.segment || 'CLIENTE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="modal-body">
                      <div className="stats-grid">
                        <div className="stat-premium-card" style={{ background: 'rgba(247, 49, 148, 0.03)' }}>
                          <div className="stat-icon-circle" style={{ background: 'var(--accent-pink-light)', color: 'var(--accent-pink)' }}>
                            <FaShoppingBag />
                          </div>
                          <span className="val-large">{customerStats?.purchase_count || 0}</span>
                          <span className="label-muted">Compras Realizadas</span>
                        </div>

                        <div className="stat-premium-card" style={{ background: 'rgba(40, 167, 69, 0.03)' }}>
                          <div className="stat-icon-circle" style={{ background: 'rgba(40, 167, 69, 0.1)', color: '#28a745' }}>
                            <FaDollarSign />
                          </div>
                          <span className="val-large" style={{ color: '#28a745' }}>{formatCurrency(customerStats?.total_spent || 0)}</span>
                          <span className="label-muted">Inversión Acumulada</span>
                        </div>

                        <div className="stat-premium-card" style={{ background: 'rgba(255, 193, 7, 0.03)' }}>
                          <div className="stat-icon-circle" style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107' }}>
                            <FaCalendarAlt />
                          </div>
                          <span className="val-large" style={{ fontSize: '18px', color: '#856404' }}>{customerStats?.last_purchase?.slice(0, 10) || 'N/A'}</span>
                          <span className="label-muted">Última Visita</span>
                        </div>
                      </div>

                      <div className="modal-section-title">
                        <FaShoppingBag />
                        <h3>Historial de Movimientos</h3>
                      </div>

                      <div className="table-wrapper" style={{ boxShadow: 'none', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                        <table className="premium-table">
                          <thead>
                            <tr>
                              <th style={{ background: 'transparent' }}>Fecha de Compra</th>
                              <th style={{ background: 'transparent' }}>Resumen de Productos</th>
                              <th style={{ background: 'transparent', textAlign: 'right' }}>Total Transacción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {purchaseHistory.length === 0 ? (
                              <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                  No se registran compras previas para este cliente.
                                </td>
                              </tr>
                            ) : (
                              purchaseHistory.map(s => (
                                <tr key={s.id}>
                                  <td style={{ fontWeight: '600' }}>{s.sale_date?.slice(0, 10)}</td>
                                  <td style={{ fontSize: '13px' }}>{s.items}</td>
                                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-pink)' }}>{formatCurrency(s.total || 0)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {selectedCustomer.address && (
                        <>
                          <div className="modal-section-title">
                            <FaMapMarkerAlt />
                            <h3>Información de Entrega</h3>
                          </div>
                          <div style={{ padding: '20px', background: 'var(--bg-tertiary)', borderRadius: '15px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: 'var(--bg-card)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FaMapMarkerAlt style={{ color: 'var(--accent-pink)' }} />
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: '500' }}>{selectedCustomer.address}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {/* Modal de funcionalidad próxima a implementar */}
      {showComingSoon && (
        <div className="sidebar-modal-overlay" onClick={() => setShowComingSoon(false)}>
          <div className="sidebar-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="sidebar-modal-title">Actualización de Sistema</div>
            <div className="sidebar-modal-desc">La sección de inteligencia de datos se está optimizando para brindarte mejores métricas.</div>
            <button className="sidebar-modal-btn" onClick={() => setShowComingSoon(false)}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}
