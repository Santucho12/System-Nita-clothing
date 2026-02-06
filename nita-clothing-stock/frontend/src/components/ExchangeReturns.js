import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import './ExchangeReturns.css';

const ExchangeReturns = () => {
  const [exchangeReturns, setExchangeReturns] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedER, setSelectedER] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // list, create, stats

  // Filtros
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    customer_name: '',
    customer_email: '',
    start_date: '',
    end_date: ''
  });

  // Formulario
  const [formData, setFormData] = useState({
    type: 'return',
    original_sale_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    items: [],
    refund_amount: 0,
    refund_method: 'efectivo',
    notes: ''
  });

  // Items para agregar al formulario
  const [currentItem, setCurrentItem] = useState({
    product_id: '',
    quantity: 1,
    reason: 'defecto',
    reason_notes: '',
    new_product_id: '',
    new_quantity: 0,
    unit_price: 0,
    subtotal: 0
  });

  // Stats
  const [stats, setStats] = useState(null);
  const [topReasons, setTopReasons] = useState([]);
  const [topReturnedProducts, setTopReturnedProducts] = useState([]);

  useEffect(() => {
    fetchExchangeReturns();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
      fetchTopReasons();
      fetchTopReturnedProducts();
    }
  }, [activeTab]);

  const fetchExchangeReturns = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.customer_name) queryParams.append('customer_name', filters.customer_name);
      if (filters.customer_email) queryParams.append('customer_email', filters.customer_email);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);

      const response = await api.get(`/cambios-devoluciones?${queryParams}`);
      setExchangeReturns(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar cambios/devoluciones:', error);
      // toast.error('Error al cargar cambios/devoluciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/productos');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const fetchSalesByCustomer = async (customerEmail) => {
    try {
      const response = await api.get(`/ventas/history?customer_email=${customerEmail}`);
      setSales(response.data.sales || []);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      // toast.error('Error al cargar ventas del cliente');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/cambios-devoluciones/stats');
      setStats(response.data.data || null);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const fetchTopReasons = async () => {
    try {
      const response = await api.get('/cambios-devoluciones/top-reasons?limit=5');
      setTopReasons(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar razones:', error);
    }
  };

  const fetchTopReturnedProducts = async () => {
    try {
      const response = await api.get('/cambios-devoluciones/top-returned-products?limit=10');
      setTopReturnedProducts(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar productos más devueltos:', error);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyFilters = () => {
    fetchExchangeReturns();
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      status: '',
      customer_name: '',
      customer_email: '',
      start_date: '',
      end_date: ''
    });
    setTimeout(() => fetchExchangeReturns(), 100);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Si cambia el email del cliente, buscar sus ventas
    if (name === 'customer_email' && value) {
      fetchSalesByCustomer(value);
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem({
      ...currentItem,
      [name]: value
    });
  };

  const handleAddItem = () => {
    if (!currentItem.product_id || currentItem.quantity <= 0) {
      // toast.warning('Debe seleccionar un producto y cantidad válida');
      return;
    }

    const product = products.find(p => p.id === parseInt(currentItem.product_id));
    if (!product) {
      // toast.error('Producto no encontrado');
      return;
    }

    const item = {
      ...currentItem,
      product_name: product.nombre,
      subtotal: currentItem.unit_price * currentItem.quantity
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    // Resetear currentItem
    setCurrentItem({
      product_id: '',
      quantity: 1,
      reason: 'defecto',
      reason_notes: '',
      new_product_id: '',
      new_quantity: 0,
      unit_price: 0,
      subtotal: 0
    });

    // toast.success('Item agregado');
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
    // toast.info('Item removido');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      // toast.warning('Debe agregar al menos un item');
      return;
    }

    if (!formData.original_sale_id) {
      // toast.warning('Debe seleccionar la venta original');
      return;
    }

    try {
      setLoading(true);
      await api.post('/cambios-devoluciones', formData);
      // toast.success('Cambio/devolución registrado exitosamente');
      
      // Reset form
      setFormData({
        type: 'return',
        original_sale_id: '',
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        items: [],
        refund_amount: 0,
        refund_method: 'efectivo',
        notes: ''
      });
      setSales([]);
      setActiveTab('list');
      fetchExchangeReturns();
    } catch (error) {
      console.error('Error al registrar:', error);
      // toast.error(error.response?.data?.error || 'Error al registrar cambio/devolución');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const notes = window.prompt('Notas de aprobación (opcional):');
    
    try {
      setLoading(true);
      await api.patch(`/cambios-devoluciones/${id}/status`, {
        status: newStatus,
        approval_notes: notes || ''
      });
      // toast.success(`Estado actualizado a ${newStatus}`);
      fetchExchangeReturns();
      if (showDetailModal) {
        const response = await api.get(`/cambios-devoluciones/${id}`);
        setSelectedER(response.data.data);
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      // toast.error(error.response?.data?.error || 'Error al actualizar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este cambio/devolución?')) return;

    try {
      setLoading(true);
      await api.delete(`/cambios-devoluciones/${id}`);
      // toast.success('Cambio/devolución eliminado');
      fetchExchangeReturns();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error al eliminar:', error);
      // toast.error(error.response?.data?.error || 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/cambios-devoluciones/${id}`);
      setSelectedER(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      // toast.error('Error al cargar detalle');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Pendiente', color: '#f39c12' },
      approved: { label: 'Aprobado', color: '#27ae60' },
      rejected: { label: 'Rechazado', color: '#e74c3c' },
      completed: { label: 'Completado', color: '#3498db' },
      cancelled: { label: 'Cancelado', color: '#95a5a6' }
    };

    const badge = badges[status] || { label: status, color: '#95a5a6' };
    return <span style={{ 
      backgroundColor: badge.color, 
      color: 'white', 
      padding: '4px 10px', 
      borderRadius: '12px',
      fontSize: '0.85em',
      fontWeight: 'bold'
    }}>{badge.label}</span>;
  };

  const getTypeBadge = (type) => {
    const badges = {
      return: { label: 'Devolución', color: '#e67e22' },
      exchange: { label: 'Cambio', color: '#9b59b6' }
    };

    const badge = badges[type] || { label: type, color: '#95a5a6' };
    return <span style={{
      backgroundColor: badge.color,
      color: 'white',
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.85em',
      fontWeight: 'bold'
    }}>{badge.label}</span>;
  };

  const reasonLabels = {
    defecto: 'Defecto',
    talla_incorrecta: 'Talla Incorrecta',
    color_incorrecto: 'Color Incorrecto',
    no_satisfecho: 'No Satisfecho',
    otro: 'Otro'
  };

  return (
    <div className="exchange-returns-container">
      <h2>Cambios y Devoluciones</h2>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'list' ? 'tab-active' : ''}
          onClick={() => setActiveTab('list')}
        >
          📋 Lista
        </button>
        <button 
          className={activeTab === 'create' ? 'tab-active' : ''}
          onClick={() => setActiveTab('create')}
        >
          ➕ Nuevo
        </button>
        <button 
          className={activeTab === 'stats' ? 'tab-active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Estadísticas
        </button>
      </div>

      {/* Tab: Lista */}
      {activeTab === 'list' && (
        <div className="list-tab">
          {/* Filtros */}
          <div className="filters-card">
            <h3>Filtros</h3>
            <div className="filters-grid">
              <div className="form-group">
                <label>Tipo:</label>
                <select name="type" value={filters.type} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  <option value="return">Devolución</option>
                  <option value="exchange">Cambio</option>
                </select>
              </div>

              <div className="form-group">
                <label>Estado:</label>
                <select name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre Cliente:</label>
                <input
                  type="text"
                  name="customer_name"
                  value={filters.customer_name}
                  onChange={handleFilterChange}
                  placeholder="Buscar por nombre..."
                />
              </div>

              <div className="form-group">
                <label>Email Cliente:</label>
                <input
                  type="email"
                  name="customer_email"
                  value={filters.customer_email}
                  onChange={handleFilterChange}
                  placeholder="Buscar por email..."
                />
              </div>

              <div className="form-group">
                <label>Desde:</label>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="form-group">
                <label>Hasta:</label>
                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="filters-actions">
              <button onClick={handleApplyFilters} className="btn-apply">Aplicar Filtros</button>
              <button onClick={handleClearFilters} className="btn-clear">Limpiar</button>
            </div>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : (
            <div className="table-container">
              <table className="er-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Cliente</th>
                    <th>Venta Original</th>
                    <th>Items</th>
                    <th>Reembolso</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {exchangeReturns.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                        No hay cambios/devoluciones registrados
                      </td>
                    </tr>
                  ) : (
                    exchangeReturns.map((er) => (
                      <tr key={er.id}>
                        <td>{er.id}</td>
                        <td>{new Date(er.created_at).toLocaleDateString()}</td>
                        <td>{getTypeBadge(er.type)}</td>
                        <td>
                          <div>{er.customer_name}</div>
                          <small style={{ color: '#7f8c8d' }}>{er.customer_email}</small>
                        </td>
                        <td>#{er.original_sale_id}</td>
                        <td>{er.items_count || 0}</td>
                        <td>${parseFloat(er.refund_amount || 0).toFixed(2)}</td>
                        <td>{getStatusBadge(er.status)}</td>
                        <td>
                          <button 
                            onClick={() => openDetail(er.id)}
                            className="btn-detail"
                            title="Ver detalle"
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Crear Nuevo */}
      {activeTab === 'create' && (
        <div className="create-tab">
          <form onSubmit={handleSubmit} className="er-form">
            <h3>Registrar Cambio/Devolución</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Tipo: *</label>
                <select name="type" value={formData.type} onChange={handleFormChange} required>
                  <option value="return">Devolución</option>
                  <option value="exchange">Cambio</option>
                </select>
              </div>

              <div className="form-group">
                <label>Email Cliente: *</label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleFormChange}
                  placeholder="cliente@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre Cliente: *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleFormChange}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono:</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleFormChange}
                  placeholder="Teléfono"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Venta Original: *</label>
              <select 
                name="original_sale_id" 
                value={formData.original_sale_id} 
                onChange={handleFormChange}
                required
              >
                <option value="">Seleccionar venta...</option>
                {sales.map(sale => (
                  <option key={sale.id} value={sale.id}>
                    Venta #{sale.id} - {new Date(sale.created_at).toLocaleDateString()} - ${parseFloat(sale.total).toFixed(2)}
                  </option>
                ))}
              </select>
              {sales.length === 0 && formData.customer_email && (
                <small style={{ color: '#e74c3c' }}>
                  No se encontraron ventas para este cliente
                </small>
              )}
            </div>

            <hr />

            <h4>Items a Cambiar/Devolver</h4>

            <div className="item-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Producto: *</label>
                  <select 
                    name="product_id" 
                    value={currentItem.product_id} 
                    onChange={handleItemChange}
                  >
                    <option value="">Seleccionar...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} - {p.codigo} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Cantidad: *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={currentItem.quantity}
                    onChange={handleItemChange}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Precio Unitario:</label>
                  <input
                    type="number"
                    name="unit_price"
                    value={currentItem.unit_price}
                    onChange={handleItemChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Razón: *</label>
                  <select name="reason" value={currentItem.reason} onChange={handleItemChange}>
                    <option value="defecto">Defecto</option>
                    <option value="talla_incorrecta">Talla Incorrecta</option>
                    <option value="color_incorrecto">Color Incorrecto</option>
                    <option value="no_satisfecho">No Satisfecho</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notas de la Razón:</label>
                  <input
                    type="text"
                    name="reason_notes"
                    value={currentItem.reason_notes}
                    onChange={handleItemChange}
                    placeholder="Detalles adicionales..."
                  />
                </div>
              </div>

              {formData.type === 'exchange' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Nuevo Producto:</label>
                    <select 
                      name="new_product_id" 
                      value={currentItem.new_product_id} 
                      onChange={handleItemChange}
                    >
                      <option value="">Seleccionar...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - {p.codigo} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nueva Cantidad:</label>
                    <input
                      type="number"
                      name="new_quantity"
                      value={currentItem.new_quantity}
                      onChange={handleItemChange}
                      min="0"
                    />
                  </div>
                </div>
              )}

              <button type="button" onClick={handleAddItem} className="btn-add-item">
                ➕ Agregar Item
              </button>
            </div>

            {/* Lista de items agregados */}
            {formData.items.length > 0 && (
              <div className="items-list">
                <h5>Items Agregados:</h5>
                {formData.items.map((item, index) => (
                  <div key={index} className="item-card">
                    <div>
                      <strong>{item.product_name || `Producto #${item.product_id}`}</strong>
                      <div>Cantidad: {item.quantity} - Razón: {reasonLabels[item.reason]}</div>
                      {item.reason_notes && <div><em>{item.reason_notes}</em></div>}
                      {formData.type === 'exchange' && item.new_product_id && (
                        <div>Cambio por: Producto #{item.new_product_id} (x{item.new_quantity})</div>
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(index)}
                      className="btn-remove-item"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            <hr />

            <div className="form-row">
              <div className="form-group">
                <label>Monto a Reembolsar:</label>
                <input
                  type="number"
                  name="refund_amount"
                  value={formData.refund_amount}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Método de Reembolso:</label>
                <select name="refund_method" value={formData.refund_method} onChange={handleFormChange}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="credito_tienda">Crédito en Tienda</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Notas:</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows="3"
                placeholder="Notas adicionales..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Registrar Cambio/Devolución'}
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('list')}
                className="btn-cancel"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Estadísticas */}
      {activeTab === 'stats' && (
        <div className="stats-tab">
          <h3>Estadísticas de Cambios y Devoluciones</h3>

          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.total || 0}</div>
                <div className="stat-label">Total</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.returns_count || 0}</div>
                <div className="stat-label">Devoluciones</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.exchanges_count || 0}</div>
                <div className="stat-label">Cambios</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.pending_count || 0}</div>
                <div className="stat-label">Pendientes</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.approved_count || 0}</div>
                <div className="stat-label">Aprobados</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{stats.completed_count || 0}</div>
                <div className="stat-label">Completados</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">${parseFloat(stats.total_refunded || 0).toFixed(2)}</div>
                <div className="stat-label">Total Reembolsado</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">${parseFloat(stats.avg_refund || 0).toFixed(2)}</div>
                <div className="stat-label">Reembolso Promedio</div>
              </div>
            </div>
          )}

          <div className="stats-row">
            <div className="stats-section">
              <h4>Razones Más Comunes</h4>
              {topReasons.length > 0 ? (
                <ul className="reasons-list">
                  {topReasons.map((r, i) => (
                    <li key={i}>
                      <span>{reasonLabels[r.reason] || r.reason}</span>
                      <span className="count-badge">{r.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay datos</p>
              )}
            </div>

            <div className="stats-section">
              <h4>Productos Más Devueltos</h4>
              {topReturnedProducts.length > 0 ? (
                <table className="small-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Código</th>
                      <th>Cant. Devuelta</th>
                      <th>Veces</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReturnedProducts.map((p, i) => (
                      <tr key={i}>
                        <td>{p.nombre}</td>
                        <td>{p.codigo}</td>
                        <td>{p.total_returned}</td>
                        <td>{p.times_returned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No hay datos</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetailModal && selectedER && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetailModal(false)}>✖</button>
            
            <h3>Detalle de {selectedER.type === 'return' ? 'Devolución' : 'Cambio'} #{selectedER.id}</h3>

            <div className="detail-grid">
              <div className="detail-item">
                <strong>Fecha:</strong> {new Date(selectedER.created_at).toLocaleString()}
              </div>
              <div className="detail-item">
                <strong>Estado:</strong> {getStatusBadge(selectedER.status)}
              </div>
              <div className="detail-item">
                <strong>Cliente:</strong> {selectedER.customer_name}
              </div>
              <div className="detail-item">
                <strong>Email:</strong> {selectedER.customer_email || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Teléfono:</strong> {selectedER.customer_phone || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Venta Original:</strong> #{selectedER.original_sale_id}
              </div>
              <div className="detail-item">
                <strong>Reembolso:</strong> ${parseFloat(selectedER.refund_amount || 0).toFixed(2)} ({selectedER.refund_method})
              </div>
              <div className="detail-item">
                <strong>Procesado por:</strong> {selectedER.processed_by_name || 'N/A'}
              </div>
            </div>

            {selectedER.notes && (
              <div className="detail-notes">
                <strong>Notas:</strong>
                <p>{selectedER.notes}</p>
              </div>
            )}

            {selectedER.approval_notes && (
              <div className="detail-notes">
                <strong>Notas de Aprobación:</strong>
                <p>{selectedER.approval_notes}</p>
              </div>
            )}

            <h4>Items</h4>
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Código</th>
                  <th>Cantidad</th>
                  <th>Razón</th>
                  <th>Notas</th>
                  {selectedER.type === 'exchange' && <th>Nuevo Producto</th>}
                </tr>
              </thead>
              <tbody>
                {selectedER.items && selectedER.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.product_name}</td>
                    <td>{item.product_code}</td>
                    <td>{item.quantity}</td>
                    <td>{reasonLabels[item.reason]}</td>
                    <td>{item.reason_notes || '-'}</td>
                    {selectedER.type === 'exchange' && (
                      <td>
                        {item.new_product_name ? 
                          `${item.new_product_name} (x${item.new_quantity})` : 
                          'N/A'
                        }
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-actions">
              {selectedER.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(selectedER.id, 'approved')}
                    className="btn-approve"
                  >
                    ✔️ Aprobar
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedER.id, 'rejected')}
                    className="btn-reject"
                  >
                    ✖ Rechazar
                  </button>
                </>
              )}

              {selectedER.status === 'approved' && (
                <button 
                  onClick={() => handleStatusUpdate(selectedER.id, 'completed')}
                  className="btn-complete"
                >
                  ✅ Completar
                </button>
              )}

              {['pending', 'rejected'].includes(selectedER.status) && (
                <button 
                  onClick={() => handleDelete(selectedER.id)}
                  className="btn-delete"
                >
                  🗑️ Eliminar
                </button>
              )}

              <button onClick={() => setShowDetailModal(false)} className="btn-close-modal">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeReturns;
