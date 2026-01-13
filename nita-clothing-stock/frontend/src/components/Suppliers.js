import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
    city: '',
    state: '',
    postal_code: '',
    country: 'Argentina',
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
      city: supplier.city || '',
      state: supplier.state || '',
      postal_code: supplier.postal_code || '',
      country: supplier.country || 'Argentina',
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
      city: '',
      state: '',
      postal_code: '',
      country: 'Argentina',
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
    <div className="suppliers-container" style={{ padding: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>
          <i className="fas fa-truck" style={{ marginRight: '10px' }}></i>
          Proveedores
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
          Nuevo Proveedor
        </button>
      </div>

      <div className="search-bar" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, email o CUIT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
        />
      </div>

      {showForm && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={resetForm}>
          <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Provincia</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código Postal</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>País</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
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
                <button type="button" onClick={resetForm} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                  {editingSupplier ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="suppliers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredSuppliers.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <i className="fas fa-truck" style={{ fontSize: '3em', color: '#ccc', marginBottom: '20px' }}></i>
            <h3>No hay proveedores</h3>
            <p>Crea tu primer proveedor para empezar a gestionar compras</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '15px' }}
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Crear Primer Proveedor
            </button>
          </div>
        ) : (
          filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="supplier-card" style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <div className="supplier-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{supplier.name}</h3>
                <div className="supplier-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleEdit(supplier)}
                    style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '16px' }}
                    title="Editar"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    onClick={() => handleDelete(supplier.id)}
                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px' }}
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <div className="supplier-details" style={{ fontSize: '14px', color: '#666' }}>
                {supplier.contact_name && (
                  <p style={{ margin: '5px 0' }}>
                    <i className="fas fa-user" style={{ marginRight: '8px', width: '16px' }}></i>
                    {supplier.contact_name}
                  </p>
                )}
                {supplier.email && (
                  <p style={{ margin: '5px 0' }}>
                    <i className="fas fa-envelope" style={{ marginRight: '8px', width: '16px' }}></i>
                    {supplier.email}
                  </p>
                )}
                {supplier.phone && (
                  <p style={{ margin: '5px 0' }}>
                    <i className="fas fa-phone" style={{ marginRight: '8px', width: '16px' }}></i>
                    {supplier.phone}
                  </p>
                )}
                {supplier.tax_id && (
                  <p style={{ margin: '5px 0' }}>
                    <i className="fas fa-id-card" style={{ marginRight: '8px', width: '16px' }}></i>
                    CUIT: {supplier.tax_id}
                  </p>
                )}
                {supplier.city && (
                  <p style={{ margin: '5px 0' }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: '8px', width: '16px' }}></i>
                    {supplier.city}{supplier.state ? `, ${supplier.state}` : ''}
                  </p>
                )}
                <p style={{ margin: '10px 0 5px 0' }}>
                  <i className="fas fa-calendar-alt" style={{ marginRight: '8px', width: '16px' }}></i>
                  Pago: {getPaymentTermsLabel(supplier.payment_terms)}
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#999' }}>
                  Creado: {new Date(supplier.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="supplier-status" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: supplier.status === 'active' ? '#d4edda' : '#f8d7da', color: supplier.status === 'active' ? '#155724' : '#721c24' }}>
                  {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
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
