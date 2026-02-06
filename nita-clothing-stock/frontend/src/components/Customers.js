import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FaUsers, FaSearch, FaChartPie, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaShoppingBag, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';
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

  const [searchTerm, setSearchTerm] = useState('');

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
      setSegmentation(res.data.data);
      setView('segmentation');
    } catch (err) {
      console.error(err);
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

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  return (
    <div className="customers-container" style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
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

          .search-bar {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
          }

          .customer-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.3s ease;
          }

          .customer-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(247, 49, 148, 0.2) !important;
          }

          .empty-state {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
          }

          .btn-pink {
            background: #f73194;
            transition: all 0.3s ease;
          }
          .btn-pink:hover {
            transform: scale(1.1) !important;
            background: #f73194 !important;
          }
          .btn-segmentation {
            background: #c5a572;
            transition: all 0.3s ease;
          }
          .btn-segmentation:hover {
            transform: scale(1.1) !important;
            background: #c5a572 !important;
          }
          .btn-secondary {
            background: #6c757d;
            transition: all 0.3s ease;
          }
          .btn-secondary:hover {
            transform: scale(1.1) !important;
            background: #6c757d !important;
          }
          .search-input {
            transition: all 0.3s ease;
          }
          .search-input:focus {
            border-color: #f73194 !important;
            box-shadow: 0 0 0 3px rgba(247, 49, 148, 0.1) !important;
            outline: none !important;
          }
        `}
      </style>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '28px', color: '#333', fontWeight: '600' }}>
          <FaUsers style={{ marginRight: '12px', color: '#f73194', fontSize: '32px' }} />
          Gestión de Clientes
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={view === 'list' ? 'btn-pink' : 'btn-secondary'}
            onClick={() => { setView('list'); fetchCustomers(); }}
            style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
          >
            <FaUsers />
            Lista de Clientes
          </button>
          <button 
            className={view === 'segmentation' ? 'btn-pink' : 'btn-secondary'}
            onClick={fetchSegmentation}
            style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
          >
            <FaChartPie />
            Segmentación
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '16px' }}>
          <div style={{ fontSize: '48px', color: '#f73194', marginBottom: '20px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Cargando...</p>
        </div>
      ) : (
        <>
          {view === 'list' && (
            <>
              <div className="search-bar" style={{ marginBottom: '30px', position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '16px' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  style={{ width: '100%', padding: '14px 14px 14px 45px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                />
              </div>

              <div className="customers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredCustomers.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <div style={{ background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%)', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
                      <FaUsers style={{ fontSize: '60px', color: '#f73194' }} />
                    </div>
                    <h3 style={{ fontSize: '24px', color: '#333', margin: '0 0 12px 0', fontWeight: '600' }}>No hay clientes</h3>
                    <p style={{ color: '#666', fontSize: '16px', margin: '0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>Los clientes se crearán automáticamente al realizar ventas</p>
                  </div>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <>
                      <style>
                        {`
                          .customer-card:nth-child(${index + 1}) {
                            animation-delay: ${0.3 + index * 0.1}s;
                          }
                        `}
                      </style>
                      <div key={customer.email} className="customer-card" style={{ border: 'none', borderRadius: '12px', padding: '24px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderTop: '4px solid #f73194' }}>
                      <div className="customer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f5f5f5' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', color: '#333', fontWeight: '600' }}>{customer.name}</h3>
                        <button 
                          onClick={() => fetchCustomerDetail(customer.email)}
                          style={{ background: '#f73194', border: 'none', color: 'white', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '6px', transition: 'all 0.3s ease', fontWeight: '500' }}
                          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                          Ver Detalle
                        </button>
                      </div>

                      <div className="customer-details" style={{ fontSize: '14px', color: '#555' }}>
                        <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                          <FaEnvelope style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                          <span style={{ wordBreak: 'break-all' }}>{customer.email}</span>
                        </p>
                        {customer.phone && (
                          <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                            <FaPhone style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                            <span>{customer.phone}</span>
                          </p>
                        )}
                        {customer.address && (
                          <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                            <FaMapMarkerAlt style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                            <span>{customer.address}</span>
                          </p>
                        )}
                      </div>
                      </div>
                    </>
                  ))
                )}
              </div>
            </>
          )}

          {view === 'segmentation' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '22px', color: '#333', fontWeight: '600' }}>Segmentación de Clientes</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #f73194' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Nombre</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Compras</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Total Gastado</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Última Compra</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Segmento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentation.map(c => (
                      <tr key={c.email} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{c.email}</td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{c.name}</td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{c.purchase_count || 0}</td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#f73194' }}>${c.total_spent?.toFixed(2) || '0.00'}</td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{c.last_purchase?.slice(0, 10) || 'N/A'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            padding: '6px 16px', 
                            borderRadius: '20px', 
                            fontSize: '13px', 
                            fontWeight: '600',
                            background: c.segment === 'VIP' ? '#d4edda' : c.segment === 'Regular' ? '#fff3cd' : '#f8d7da',
                            color: c.segment === 'VIP' ? '#155724' : c.segment === 'Regular' ? '#856404' : '#721c24'
                          }}>
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
            <>
              {/* Overlay */}
              <div 
                onClick={closeModal}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 1000,
                  animation: 'fadeIn 0.3s ease-in-out'
                }}
              />
              
              {/* Modal Content */}
              <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                zIndex: 1001,
                maxWidth: '900px',
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
                animation: 'fadeIn 0.3s ease-in-out'
              }}>
                {/* Close Button */}
                <button 
                  onClick={closeModal}
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    color: '#666',
                    cursor: 'pointer',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f5f5f5';
                    e.target.style.color = '#f73194';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#666';
                  }}
                >
                  ✕
                </button>

                {!selectedCustomer ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '48px', color: '#f73194', marginBottom: '20px' }}>⏳</div>
                    <p style={{ fontSize: '18px', color: '#666' }}>Cargando información del cliente...</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #f5f5f5' }}>
                      <div style={{ background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '20px' }}>
                        <FaUser style={{ fontSize: '40px', color: '#f73194' }} />
                      </div>
                      <div>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#333', fontWeight: '600' }}>Detalle de Cliente</h2>
                        <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>Información completa y estadísticas</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                      <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #f73194' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <FaEnvelope style={{ marginRight: '8px', color: '#f73194' }} />
                          <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Email</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '16px', color: '#333', fontWeight: '500' }}>{selectedCustomer.email}</p>
                      </div>

                      <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #f73194' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <FaUser style={{ marginRight: '8px', color: '#f73194' }} />
                          <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Nombre</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '16px', color: '#333', fontWeight: '500' }}>{selectedCustomer.name}</p>
                      </div>

                      <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #f73194' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <FaPhone style={{ marginRight: '8px', color: '#f73194' }} />
                          <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Teléfono</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '16px', color: '#333', fontWeight: '500' }}>{selectedCustomer.phone}</p>
                      </div>

                      <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #f73194' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <FaMapMarkerAlt style={{ marginRight: '8px', color: '#f73194' }} />
                          <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Dirección</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '16px', color: '#333', fontWeight: '500' }}>{selectedCustomer.address || 'N/A'}</p>
                      </div>
                    </div>

                    <h3 style={{ margin: '30px 0 20px 0', fontSize: '22px', color: '#333', fontWeight: '600' }}>Estadísticas</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                      <div style={{ padding: '24px', background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%)', borderRadius: '12px', textAlign: 'center' }}>
                        <FaShoppingBag style={{ fontSize: '36px', color: '#f73194', marginBottom: '12px' }} />
                        <p style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '600', color: '#f73194' }}>{customerStats?.purchase_count || 0}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666', fontWeight: '500' }}>Total de Compras</p>
                      </div>

                      <div style={{ padding: '24px', background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)', borderRadius: '12px', textAlign: 'center' }}>
                        <FaDollarSign style={{ fontSize: '36px', color: '#155724', marginBottom: '12px' }} />
                        <p style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '600', color: '#155724' }}>${customerStats?.total_spent?.toFixed(2) || '0.00'}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666', fontWeight: '500' }}>Total Gastado</p>
                      </div>

                      <div style={{ padding: '24px', background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)', borderRadius: '12px', textAlign: 'center' }}>
                        <FaCalendarAlt style={{ fontSize: '36px', color: '#856404', marginBottom: '12px' }} />
                        <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#856404' }}>{customerStats?.last_purchase?.slice(0, 10) || 'N/A'}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#666', fontWeight: '500' }}>Última Compra</p>
                      </div>
                    </div>

                    <h3 style={{ margin: '30px 0 20px 0', fontSize: '22px', color: '#333', fontWeight: '600' }}>Historial de Compras</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #f73194' }}>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Fecha</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Productos</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#333' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseHistory.map(s => (
                            <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{s.sale_date?.slice(0, 10)}</td>
                              <td style={{ padding: '12px', fontSize: '14px' }}>{s.items}</td>
                              <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#f73194', textAlign: 'right' }}>${s.total?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
