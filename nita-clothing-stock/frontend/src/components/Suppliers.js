import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import useSortableData from '../hooks/useSortableData';
import { FaTruck, FaPlus, FaEdit, FaTrash, FaPhone, FaMapMarkerAlt, FaGlobe, FaShoppingCart, FaStickyNote, FaSearch, FaTimes, FaUser, FaEnvelope } from 'react-icons/fa';
import PremiumModal from './PremiumModal';
import './PremiumModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    website: '',
    min_purchase: '',
    notes: ''
  });

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

  // Hook de ordenado
  const { items: sortedSuppliers, requestSort, sortConfig } = useSortableData(suppliers, { key: 'name', direction: 'ascending' });

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
      phone: supplier.phone || '',
      address: supplier.address || '',
      website: supplier.website || '',
      min_purchase: supplier.min_purchase || '',
      notes: supplier.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setPremiumModal({
      show: true,
      type: 'danger',
      title: 'Eliminar Proveedor',
      message: '¿Estás seguro de que quieres eliminar este proveedor? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/proveedores/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Proveedor eliminado exitosamente');
          loadSuppliers();
          setPremiumModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          toast.error('Error eliminando proveedor: ' + (error.response?.data?.message || error.message));
          setPremiumModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      website: '',
      min_purchase: '',
      notes: ''
    });
    setShowForm(false);
    setEditingSupplier(null);
  };

  const filteredSuppliers = sortedSuppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.phone && supplier.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          width: '56px', height: '56px', border: '4px solid #f1f5f9',
          borderTop: '4px solid #f73194', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#64748b', fontSize: '16px', fontWeight: '500' }}>Cargando proveedores...</p>
      </div>
    );
  }

  return (
    <div className="suppliers-container" style={{ padding: '30px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .suppliers-hero { animation: fadeSlideUp 0.6s ease both; }
          .suppliers-filters-bar { animation: fadeSlideUp 0.6s ease 0.12s both; }
          .supplier-card-premium { animation: fadeSlideUp 0.5s ease both; }
          .empty-state { animation: fadeSlideUp 0.6s ease 0.3s both; }

          /* ---- Inputs ---- */
          .nita-search-input {
            width: 100%;
            padding: 13px 18px 13px 44px;
            border: 2px solid var(--border-color);
            border-radius: 14px;
            font-size: 15px;
            font-weight: 500;
            color: var(--text-primary);
            background: var(--bg-input);
            transition: all 0.25s ease;
            box-sizing: border-box;
          }
          .nita-search-input:focus {
            outline: none;
            border-color: var(--accent-pink);
            background: var(--bg-card);
            box-shadow: 0 0 0 4px var(--accent-pink-light);
          }
          .nita-search-input::placeholder { color: var(--text-muted); font-weight: 400; }

          .nita-filter-select {
            width: 100%;
            padding: 13px 36px 13px 14px;
            border: 2px solid var(--border-color);
            border-radius: 14px;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            background: var(--bg-input);
            cursor: pointer;
            transition: all 0.25s ease;
            box-sizing: border-box;
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2394a3b8'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
          }
          .nita-filter-select:focus {
            outline: none;
            border-color: var(--accent-pink);
            background-color: var(--bg-card);
            box-shadow: 0 0 0 4px var(--accent-pink-light);
          }

          /* ---- Form Premium ---- */
          .form-input-premium {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid var(--border-light);
            border-radius: 12px;
            font-size: 15px;
            font-weight: 500;
            color: var(--text-primary);
            transition: all 0.2s ease;
            background: var(--bg-input);
            box-sizing: border-box;
          }
          .form-input-premium:focus {
            outline: none;
            border-color: var(--accent-pink);
            background: var(--bg-card);
            box-shadow: 0 0 0 4px var(--accent-pink-light);
          }
          .form-input-premium::placeholder { color: var(--text-muted); }

          .form-label-premium {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          .form-label-premium svg { color: var(--accent-pink); font-size: 13px; }

          /* ---- Card Premium ---- */
          .supplier-card-premium {
            background: var(--bg-card);
            border-radius: 20px;
            padding: 0;
            overflow: hidden;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            transition: all 0.35s cubic-bezier(0.165, 0.84, 0.44, 1);
            position: relative;
          }
          .supplier-card-premium:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 40px rgba(247, 49, 148, 0.12);
            border-color: rgba(247, 49, 148, 0.15);
          }

          .supplier-card-premium .card-accent {
            height: 4px;
            background: linear-gradient(90deg, #f73194, #ff6fb8, #f73194);
            background-size: 200% 100%;
          }
          .supplier-card-premium:hover .card-accent {
            animation: shimmer 1.5s linear infinite;
          }
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          /* ---- Clear filter chip ---- */
          .clear-filters-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 50px;
            border: 1px solid var(--border-color);
            background: var(--bg-card);
            color: var(--text-muted);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .clear-filters-chip:hover {
            background: var(--bg-hover);
            border-color: var(--accent-pink);
            color: var(--accent-pink);
          }
        `}
      </style>

      {/* ═══════ HERO HEADER ═══════ */}
      <div className="products-hero" style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '28px 36px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow)',
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
            <FaTruck style={{ color: 'var(--accent-pink)', fontSize: '26px' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Proveedores
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
              {suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''} en el sistema
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '11px 24px', color: 'white', background: '#f73194',
            border: 'none', borderRadius: '12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px', fontWeight: '700', transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(247,49,148,0.25)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(247,49,148,0.35)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(247,49,148,0.25)';
          }}
        >
          <FaPlus />
          Nuevo Proveedor
        </button>
      </div>

      {/* ═══════ FILTERS BAR ═══════ */}
      <div className="products-filters-bar" style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '20px 28px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Buscador con ícono integrado */}
          <div style={{ flex: '2.5 1 220px', position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '15px', zIndex: 1, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="nita-search-input"
            />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="nita-filter-select"
            >
              <option value="all">Todos los Estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* Limpiar filtros */}
          {(searchTerm || statusFilter !== 'all') && (
            <button
              className="clear-filters-chip"
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
            >
              <FaTimes style={{ fontSize: '11px' }} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ═══════ MODAL FORM PREMIUM ═══════ */}
      {showForm && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: '20px'
          }}
          onClick={resetForm}
        >
          <div
            style={{
              background: 'var(--bg-card)', borderRadius: '24px',
              boxShadow: 'var(--shadow-lg)',
              width: '100%', maxWidth: '580px',
              overflow: 'hidden',
              animation: 'modalSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div style={{
              background: 'linear-gradient(135deg, #f73194 0%, #ff6fb8 100%)',
              padding: '24px 32px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.2)', width: '44px', height: '44px',
                  borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FaTruck style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '700' }}>
                    {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </h3>
                  <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                    {editingSupplier ? 'Modificá los datos del proveedor' : 'Completá los datos del proveedor'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                  width: '36px', height: '36px', borderRadius: '10px',
                  fontSize: '18px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ×
              </button>
            </div>

            {/* Body del formulario */}
            <form onSubmit={handleSubmit} style={{ padding: '28px 32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Nombre - Full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label-premium"><FaUser /> Nombre *</label>
                  <input
                    type="text" name="name"
                    value={formData.name} onChange={handleInputChange}
                    required placeholder="Nombre del proveedor"
                    className="form-input-premium"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="form-label-premium"><FaPhone /> Teléfono</label>
                  <input
                    type="text" name="phone"
                    value={formData.phone} onChange={handleInputChange}
                    placeholder="011 1234-5678"
                    className="form-input-premium"
                  />
                </div>

                {/* Sitio Web */}
                <div>
                  <label className="form-label-premium"><FaGlobe /> Sitio Web</label>
                  <input
                    type="url" name="website"
                    value={formData.website} onChange={handleInputChange}
                    placeholder="https://ejemplo.com"
                    className="form-input-premium"
                  />
                </div>

                {/* Dirección - Full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label-premium"><FaMapMarkerAlt /> Dirección</label>
                  <input
                    type="text" name="address"
                    value={formData.address} onChange={handleInputChange}
                    placeholder="Calle, Número, Ciudad"
                    className="form-input-premium"
                  />
                </div>

                {/* Mínimo de Compra */}
                <div>
                  <label className="form-label-premium"><FaShoppingCart /> Mínimo de Compra</label>
                  <input
                    type="number" name="min_purchase"
                    value={formData.min_purchase} onChange={handleInputChange}
                    min="0" placeholder="$0"
                    className="form-input-premium"
                  />
                </div>

                {/* Notas - Full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label-premium"><FaStickyNote /> Notas</label>
                  <textarea
                    name="notes"
                    value={formData.notes} onChange={handleInputChange}
                    rows="3" placeholder="Anotaciones sobre este proveedor..."
                    className="form-input-premium"
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '28px', justifyContent: 'flex-end' }}>
                <button
                  type="button" onClick={resetForm}
                  style={{
                    padding: '12px 28px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '600', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 32px', background: '#f73194', color: 'white',
                    border: 'none', borderRadius: '12px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '700', transition: 'all 0.2s',
                    boxShadow: '0 4px 14px rgba(247,49,148,0.25)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(247,49,148,0.35)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(247,49,148,0.25)'; }}
                >
                  {editingSupplier ? 'Actualizar' : 'Crear Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ GRID DE CARDS ═══════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
        {filteredSuppliers.length === 0 ? (
          <div className="empty-state" style={{
            gridColumn: '1 / -1', textAlign: 'center', padding: '80px 40px',
            background: 'var(--bg-card)', borderRadius: '24px',
            boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)'
          }}>
            <div style={{
              background: 'var(--accent-pink-light)',
              width: '100px', height: '100px', borderRadius: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <FaTruck style={{ fontSize: '44px', color: 'var(--accent-pink)' }} />
            </div>
            <h3 style={{ fontSize: '22px', color: 'var(--text-heading)', margin: '0 0 10px 0', fontWeight: '700' }}>No hay proveedores</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: '0 0 28px 0', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
              Creá tu primer proveedor para gestionar compras y mantener un registro completo.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '12px 28px', color: 'white', background: '#f73194',
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                fontSize: '14px', fontWeight: '700',
                boxShadow: '0 4px 14px rgba(247,49,148,0.25)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <FaPlus />
              Crear Primer Proveedor
            </button>
          </div>
        ) : (
          filteredSuppliers.map((supplier, index) => (
            <div
              key={supplier.id}
              className="supplier-card-premium"
              style={{ animationDelay: `${0.1 + index * 0.06}s` }}
            >
              {/* Accent bar */}
              <div className="card-accent" />

              {/* Card Body */}
              <div style={{ padding: '24px 28px' }}>
                {/* Header con nombre y acciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      background: 'var(--accent-pink-light)',
                      width: '46px', height: '46px', borderRadius: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <FaTruck style={{ color: 'var(--accent-pink)', fontSize: '18px' }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-heading)', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {supplier.name}
                      </h3>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                        marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
                        background: supplier.status === 'active' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                        color: supplier.status === 'active' ? '#16a34a' : '#dc2626'
                      }}>
                        <span style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: supplier.status === 'active' ? '#16a34a' : '#dc2626'
                        }} />
                        {supplier.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(supplier)}
                      title="Editar"
                      style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '13px', transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-pink)'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      title="Eliminar"
                      style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '13px', transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {/* Info items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {supplier.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <FaPhone style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }} />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <FaMapMarkerAlt style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{supplier.address}</span>
                    </div>
                  )}
                  {supplier.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <FaGlobe style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }} />
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#f73194', textDecoration: 'none', fontWeight: '500' }}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {supplier.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer: Mínimo de compra + Notas */}
                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mín. Compra</span>
                    <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-heading)' }}>
                      {supplier.min_purchase ? `$${Number(supplier.min_purchase).toLocaleString()}` : '—'}
                    </p>
                  </div>
                  {supplier.notes && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '6px 12px', background: '#fffbeb', borderRadius: '8px',
                      fontSize: '12px', color: '#92400e', fontWeight: '500', maxWidth: '160px'
                    }}>
                      <FaStickyNote style={{ fontSize: '10px', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{supplier.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
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
};

export default Suppliers;
