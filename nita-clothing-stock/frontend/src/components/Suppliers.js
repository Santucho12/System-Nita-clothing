import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTruck, FaPlus, FaEdit, FaTrash, FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaCalendarAlt, FaSearch } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    tax_id: '',
    payment_terms: 'net_30',
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/proveedores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuppliers(response.data.data || []);
    } catch (error) {
      toast.error('Error cargando proveedores: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre del proveedor es requerido');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (editingSupplier) {
        await axios.put(`${API_URL}/proveedores/${editingSupplier.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await axios.post(`${API_URL}/proveedores`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Proveedor creado exitosamente');
      }
      
      resetForm();
      loadSuppliers();
    } catch (error) {
      toast.error('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      website: supplier.website || '',
      tax_id: supplier.tax_id || '',
      payment_terms: supplier.payment_terms || 'net_30',
      notes: supplier.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/proveedores/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Proveedor eliminado exitosamente');
        loadSuppliers();
      } catch (error) {
        toast.error('Error eliminando proveedor: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      tax_id: '',
      payment_terms: 'net_30',
      notes: ''
    });
    setShowForm(false);
    setEditingSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.tax_id && supplier.tax_id.includes(searchTerm))
  );

  const getPaymentTermsLabel = (terms) => {
    const labels = {
      'net_15': '15 días',
      'net_30': '30 días',
      'net_45': '45 días',
      'net_60': '60 días',
      'immediate': 'Inmediato',
      'other': 'Otro'
    };
    return labels[terms] || terms;
  };

  if (loading) {
    return (
      <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2em' }}></i>
        <p>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div className="suppliers-container" style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
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

          .supplier-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.3s ease;
          }

          .supplier-card:hover {
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
          <FaTruck style={{ marginRight: '12px', color: '#f73194', fontSize: '32px' }} />
          Proveedores
        </h1>
        <button 
          className="btn-pink"
          onClick={() => setShowForm(true)}
          style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
        >
          <FaPlus />
          Nuevo Proveedor
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom: '30px', position: 'relative' }}>
        <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: '16px' }} />
        <input
          type="text"
          placeholder="Buscar por nombre, email o CUIT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          style={{ width: '100%', padding: '14px 14px 14px 45px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '15px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        />
      </div>

      {showForm && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={resetForm}>
          <style>
            {`
              .supplier-form-btn {
                padding: 10px 20px !important;
                color: white !important;
                border: none !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                min-width: 120px !important;
                transition: transform 0.2s ease !important;
                font-size: 14px !important;
                font-weight: 400 !important;
              }
              .supplier-form-btn:hover {
                transform: scale(1.05);
              }
            `}
          </style>
          <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Persona de Contacto</label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Teléfono</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>CUIT/Tax ID</label>
                  <input
                    type="text"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dirección</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Sitio Web</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Términos de Pago</label>
                  <select
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="immediate">Inmediato</option>
                    <option value="net_15">15 días</option>
                    <option value="net_30">30 días</option>
                    <option value="net_45">45 días</option>
                    <option value="net_60">60 días</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notas</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={resetForm} className="supplier-form-btn" style={{ background: '#3a3a3a' }}>
                  Cancelar
                </button>
                <button type="submit" className="supplier-form-btn" style={{ background: '#f73194' }}>
                  {editingSupplier ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="suppliers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {filteredSuppliers.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%)', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
              <FaTruck style={{ fontSize: '60px', color: '#f73194' }} />
            </div>
            <h3 style={{ fontSize: '24px', color: '#333', margin: '0 0 12px 0', fontWeight: '600' }}>No hay proveedores</h3>
            <p style={{ color: '#666', fontSize: '16px', margin: '0 0 30px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>Crea tu primer proveedor para empezar a gestionar compras y mantener un registro completo</p>
            <button 
              className="btn-pink"
              onClick={() => setShowForm(true)}
              style={{ padding: '14px 28px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '500' }}
            >
              <FaPlus />
              Crear Primer Proveedor
            </button>
          </div>
        ) : (
          filteredSuppliers.map((supplier, index) => (
            <div
              key={supplier.id} 
              className="supplier-card" 
              style={{ 
                border: 'none', 
                borderRadius: '12px', 
                padding: '24px', 
                background: 'white', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                borderTop: '4px solid #f73194'
              }}
            >
              <style>
                {`
                  .supplier-card:nth-child(${index + 1}) {
                    animation-delay: ${0.3 + index * 0.1}s;
                  }
                `}
              </style>
              <div className="supplier-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #f5f5f5' }}>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#333', fontWeight: '600' }}>{supplier.name}</h3>
                <div className="supplier-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleEdit(supplier)}
                    style={{ background: '#f73194', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', transition: 'all 0.3s ease' }}
                    title="Editar"
                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(supplier.id)}
                    style={{ background: '#dc3545', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', transition: 'all 0.3s ease' }}
                    title="Eliminar"
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="supplier-details" style={{ fontSize: '14px', color: '#555' }}>
                {supplier.contact_name && (
                  <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                    <FaUser style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                    <span style={{ fontWeight: '500' }}>{supplier.contact_name}</span>
                  </p>
                )}
                {supplier.email && (
                  <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                    <FaEnvelope style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                    <span>{supplier.email}</span>
                  </p>
                )}
                {supplier.phone && (
                  <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                    <FaPhone style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                    <span>{supplier.phone}</span>
                  </p>
                )}
                {supplier.tax_id && (
                  <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                    <FaIdCard style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                    <span>CUIT: {supplier.tax_id}</span>
                  </p>
                )}
                {supplier.city && (
                  <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                    <FaMapMarkerAlt style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                    <span>{supplier.city}{supplier.state ? `, ${supplier.state}` : ''}</span>
                  </p>
                )}
                <p style={{ margin: '12px 0 8px 0', display: 'flex', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                  <FaCalendarAlt style={{ marginRight: '10px', color: '#f73194', fontSize: '14px', minWidth: '14px' }} />
                  <span><strong>Pago:</strong> {getPaymentTermsLabel(supplier.payment_terms)}</span>
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#999', fontStyle: 'italic' }}>
                  Creado: {new Date(supplier.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="supplier-status" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: supplier.status === 'active' ? '#d4edda' : '#f8d7da', color: supplier.status === 'active' ? '#155724' : '#721c24' }}>
                  {supplier.status === 'active' ? '✓ Activo' : '✗ Inactivo'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Suppliers;
