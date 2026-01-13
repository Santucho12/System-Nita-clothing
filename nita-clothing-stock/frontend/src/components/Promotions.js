import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Promotions.css';

const API_URL = 'http://localhost:3000/api';

const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'discount',
    discount_type: 'percentage',
    discount_value: '',
    applies_to: 'all',
    category_ids: [],
    product_ids: [],
    start_date: '',
    end_date: '',
    status: 'activa'
  });

  useEffect(() => {
    loadPromotions();
    loadCategories();
    loadProducts();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/promociones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromotions(response.data);
    } catch (error) {
      console.error('Error al cargar promociones:', error);
      alert('Error al cargar promociones');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/categorias`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/productos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.discount_value) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      alert('El descuento porcentual no puede ser mayor a 100%');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        category_ids: formData.applies_to === 'categories' ? formData.category_ids : [],
        product_ids: formData.applies_to === 'products' ? formData.product_ids : []
      };

      if (editingPromotion) {
        await axios.put(`${API_URL}/promociones/${editingPromotion.id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Promoción actualizada exitosamente');
      } else {
        await axios.post(`${API_URL}/promociones`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Promoción creada exitosamente');
      }

      loadPromotions();
      closeModal();
    } catch (error) {
      console.error('Error al guardar promoción:', error);
      alert(error.response?.data?.message || 'Error al guardar promoción');
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      applies_to: promotion.applies_to,
      category_ids: promotion.category_ids || [],
      product_ids: promotion.product_ids || [],
      start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
      end_date: promotion.end_date ? promotion.end_date.split('T')[0] : '',
      status: promotion.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta promoción?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/promociones/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Promoción eliminada exitosamente');
      loadPromotions();
    } catch (error) {
      console.error('Error al eliminar promoción:', error);
      alert('Error al eliminar promoción');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/promociones/${id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadPromotions();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar estado');
    }
  };

  const openNewModal = () => {
    setEditingPromotion(null);
    setFormData({
      name: '',
      description: '',
      type: 'discount',
      discount_type: 'percentage',
      discount_value: '',
      applies_to: 'all',
      category_ids: [],
      product_ids: [],
      start_date: '',
      end_date: '',
      status: 'activa'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPromotion(null);
  };

  const handleCategoryChange = (categoryId) => {
    const newIds = formData.category_ids.includes(categoryId)
      ? formData.category_ids.filter(id => id !== categoryId)
      : [...formData.category_ids, categoryId];
    setFormData({ ...formData, category_ids: newIds });
  };

  const handleProductChange = (productId) => {
    const newIds = formData.product_ids.includes(productId)
      ? formData.product_ids.filter(id => id !== productId)
      : [...formData.product_ids, productId];
    setFormData({ ...formData, product_ids: newIds });
  };

  const filteredPromotions = promotions.filter(promo => {
    const matchesSearch = promo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || promo.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      'activa': { class: 'status-activa', text: 'Activa' },
      'pausada': { class: 'status-pausada', text: 'Pausada' },
      'finalizada': { class: 'status-finalizada', text: 'Finalizada' }
    };
    const badge = badges[status] || badges['activa'];
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getDiscountText = (promo) => {
    if (promo.discount_type === 'percentage') {
      return `${promo.discount_value}%`;
    } else {
      return `$${promo.discount_value.toFixed(2)}`;
    }
  };

  const getAppliesTo = (promo) => {
    const texts = {
      'all': 'Todos los productos',
      'categories': `${(promo.category_ids || '').split(',').length} categorías`,
      'products': `${(promo.product_ids || '').split(',').length} productos`
    };
    return texts[promo.applies_to] || 'No especificado';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin límite';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="promotions-container">
      <div className="promotions-header">
        <h1>
          <i className="fas fa-tags"></i> Promociones y Descuentos
        </h1>
        <button className="btn-primary" onClick={openNewModal}>
          <i className="fas fa-plus"></i> Nueva Promoción
        </button>
      </div>

      <div className="promotions-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar promoción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los estados</option>
          <option value="activa">Activas</option>
          <option value="pausada">Pausadas</option>
          <option value="finalizada">Finalizadas</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">
          <i className="fas fa-spinner fa-spin"></i> Cargando...
        </div>
      ) : (
        <div className="promotions-grid">
          {filteredPromotions.length === 0 ? (
            <div className="no-data">
              <i className="fas fa-tags"></i>
              <p>No hay promociones {filterStatus ? `${filterStatus}s` : 'disponibles'}</p>
            </div>
          ) : (
            filteredPromotions.map(promo => (
              <div key={promo.id} className="promotion-card">
                <div className="promotion-header">
                  <h3>{promo.name}</h3>
                  {getStatusBadge(promo.status)}
                </div>
                
                {promo.description && (
                  <p className="promotion-description">{promo.description}</p>
                )}

                <div className="promotion-details">
                  <div className="detail-item">
                    <span className="label">
                      <i className="fas fa-percent"></i> Descuento:
                    </span>
                    <span className="value discount-value">{getDiscountText(promo)}</span>
                  </div>

                  <div className="detail-item">
                    <span className="label">
                      <i className="fas fa-box"></i> Aplica a:
                    </span>
                    <span className="value">{getAppliesTo(promo)}</span>
                  </div>

                  <div className="detail-item">
                    <span className="label">
                      <i className="fas fa-calendar"></i> Inicio:
                    </span>
                    <span className="value">{formatDate(promo.start_date)}</span>
                  </div>

                  <div className="detail-item">
                    <span className="label">
                      <i className="fas fa-calendar-check"></i> Fin:
                    </span>
                    <span className="value">{formatDate(promo.end_date)}</span>
                  </div>
                </div>

                <div className="promotion-actions">
                  <button 
                    className="btn-icon btn-edit" 
                    onClick={() => handleEdit(promo)}
                    title="Editar"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  
                  {promo.status === 'activa' ? (
                    <button 
                      className="btn-icon btn-pause" 
                      onClick={() => handleStatusChange(promo.id, 'pausada')}
                      title="Pausar"
                    >
                      <i className="fas fa-pause"></i>
                    </button>
                  ) : promo.status === 'pausada' ? (
                    <button 
                      className="btn-icon btn-play" 
                      onClick={() => handleStatusChange(promo.id, 'activa')}
                      title="Activar"
                    >
                      <i className="fas fa-play"></i>
                    </button>
                  ) : null}
                  
                  <button 
                    className="btn-icon btn-delete" 
                    onClick={() => handleDelete(promo.id)}
                    title="Eliminar"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-tags"></i>
                {editingPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
              </h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="promotion-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nombre de la Promoción *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Tipo de Descuento *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    required
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Valor del Descuento *
                    {formData.discount_type === 'percentage' && ' (%)'}
                    {formData.discount_type === 'fixed' && ' ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Aplica a *</label>
                  <select
                    value={formData.applies_to}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      applies_to: e.target.value,
                      category_ids: [],
                      product_ids: []
                    })}
                    required
                  >
                    <option value="all">Todos los productos</option>
                    <option value="categories">Categorías específicas</option>
                    <option value="products">Productos específicos</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="activa">Activa</option>
                    <option value="pausada">Pausada</option>
                    <option value="finalizada">Finalizada</option>
                  </select>
                </div>

                {formData.applies_to === 'categories' && (
                  <div className="form-group full-width">
                    <label>Seleccionar Categorías</label>
                    <div className="checkbox-list">
                      {categories.map(cat => (
                        <label key={cat.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.category_ids.includes(cat.id)}
                            onChange={() => handleCategoryChange(cat.id)}
                          />
                          <span>{cat.nombre}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.applies_to === 'products' && (
                  <div className="form-group full-width">
                    <label>Seleccionar Productos</label>
                    <div className="checkbox-list">
                      {products.map(prod => (
                        <label key={prod.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.product_ids.includes(prod.id)}
                            onChange={() => handleProductChange(prod.id)}
                          />
                          <span>{prod.nombre} - {prod.sku}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Fecha de Inicio</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha de Fin</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fas fa-save"></i>
                  {editingPromotion ? 'Actualizar' : 'Guardar'} Promoción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotions;
