import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PremiumModal from './PremiumModal';
import './PremiumModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_date: '',
    items: [],
    notes: ''
  });

  const [newItem, setNewItem] = useState({
    product_id: '',
    quantity: 1,
    unit_cost: 0
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/ordenes-compra`, { headers }),
        axios.get(`${API_URL}/proveedores`, { headers }),
        axios.get(`${API_URL}/productos`, { headers })
      ]);

      setOrders(ordersRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setProducts(productsRes.data.data || []);
    } catch (error) {
      toast.error('Error cargando datos: ' + (error.response?.data?.message || error.message));
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

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addItem = () => {
    if (!newItem.product_id || !newItem.quantity || !newItem.unit_cost) {
      toast.error('Complete todos los campos del producto');
      return;
    }

    const product = products.find(p => p.id === parseInt(newItem.product_id));
    if (!product) return;

    const item = {
      product_id: parseInt(newItem.product_id),
      product_name: product.name,
      quantity: parseInt(newItem.quantity),
      unit_cost: parseFloat(newItem.unit_cost),
      subtotal: parseInt(newItem.quantity) * parseFloat(newItem.unit_cost)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({ product_id: '', quantity: 1, unit_cost: 0 });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplier_id) {
      toast.error('Seleccione un proveedor');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Agregue al menos un producto');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/ordenes-compra`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Orden de compra creada exitosamente');
      resetForm();
      loadData();
    } catch (error) {
      // toast.error('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReceive = (orderId) => {
    setPremiumModal({
      show: true,
      type: 'confirm',
      title: 'Recibir Orden',
      message: '¿Marcar esta orden como recibida? Esto actualizará el stock automáticamente.',
      confirmText: 'Marcar como Recibida',
      cancelText: 'Cerrar',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.patch(`${API_URL}/ordenes-compra/${orderId}/recibir`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });

          toast.success('Orden marcada como recibida y stock actualizado');
          loadData();
          setPremiumModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          toast.error('Error: ' + (error.response?.data?.message || error.message));
          setPremiumModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleCancel = (orderId) => {
    setPremiumModal({
      show: true,
      type: 'danger',
      title: 'Cancelar Orden',
      message: '¿Estás seguro de que quieres cancelar esta orden de compra? Esta acción no se puede deshacer.',
      confirmText: 'Cancelar Orden',
      cancelText: 'Volver',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/ordenes-compra/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          toast.success('Orden cancelada exitosamente');
          loadData();
          setPremiumModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          toast.error('Error: ' + (error.response?.data?.message || error.message));
          setPremiumModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const viewDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/ordenes-compra/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(response.data.data);
    } catch (error) {
      toast.error('Error cargando detalles');
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      expected_date: '',
      items: [],
      notes: ''
    });
    setNewItem({ product_id: '', quantity: 1, unit_cost: 0 });
    setShowForm(false);
  };

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase();

    let className = 'status-pending';
    let text = 'Pendiente';

    if (s === 'received') {
      className = 'status-success';
      text = 'Recibida';
    } else if (s === 'partial') {
      className = 'status-warning';
      text = 'Parcial';
    } else if (s === 'cancelled') {
      className = 'status-danger';
      text = 'Cancelada';
    }

    return (
      <span className={`premium-status-badge ${className}`}>
        {text}
      </span>
    );
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  if (loading) {
    return (
      <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '2em' }}></i>
        <p>Cargando órdenes...</p>
      </div>
    );
  }

  return (
    <div className="purchase-orders-container" style={{ padding: '30px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
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
            <i className="fas fa-file-invoice" style={{ color: 'var(--accent-pink)', fontSize: '26px' }}></i>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Órdenes de Compra
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Gestiona el abastecimiento de mercadería
            </p>
          </div>
        </div>

        <button
          className="action-btn btn-primary-action"
          onClick={() => setShowForm(true)}
          style={{ width: 'auto', padding: '12px 24px' }}
        >
          <i className="fas fa-plus"></i> Nueva Orden
        </button>
      </div>

      <div className="products-filters-bar" style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '20px 28px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => setFilterStatus('all')}
          className={`nita-filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: filterStatus === 'all' ? 'var(--accent-pink)' : 'var(--bg-tertiary)',
            color: filterStatus === 'all' ? 'white' : 'var(--text-secondary)',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Todas
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: filterStatus === 'pending' ? 'var(--accent-pink)' : 'var(--bg-tertiary)',
            color: filterStatus === 'pending' ? 'white' : 'var(--text-secondary)',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilterStatus('received')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: filterStatus === 'received' ? 'var(--accent-pink)' : 'var(--bg-tertiary)',
            color: filterStatus === 'received' ? 'white' : 'var(--text-secondary)',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Recibidas
        </button>
        <button
          onClick={() => setFilterStatus('cancelled')}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: filterStatus === 'cancelled' ? 'var(--accent-pink)' : 'var(--bg-tertiary)',
            color: filterStatus === 'cancelled' ? 'white' : 'var(--text-secondary)',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Canceladas
        </button>
      </div>

      {showForm && (
        <div className="modal-premium-overlay" onClick={resetForm}>
          <div className="modal-premium-content" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-premium-header">
              <h2><i className="fas fa-file-invoice"></i> Nueva Orden de Compra</h2>
              <button onClick={resetForm} style={{ position: 'absolute', right: '20px', top: '20px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', color: 'var(--text-primary)', padding: '10px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Proveedor *</label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Seleccionar proveedor</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha Esperada</label>
                  <input
                    type="date"
                    name="expected_date"
                    value={formData.expected_date}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notas</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
              </div>

              <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '15px', marginBottom: '20px' }}>
                <h4 style={{ marginTop: 0 }}>Agregar Productos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Producto</label>
                    <select
                      name="product_id"
                      value={newItem.product_id}
                      onChange={handleItemChange}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.size} - {product.color}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Cantidad</label>
                    <input
                      type="number"
                      name="quantity"
                      value={newItem.quantity}
                      onChange={handleItemChange}
                      min="1"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Costo Unit.</label>
                    <input
                      type="number"
                      name="unit_cost"
                      value={newItem.unit_cost}
                      onChange={handleItemChange}
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>

                {formData.items.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #ddd' }}>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Producto</th>
                          <th style={{ textAlign: 'center', padding: '8px' }}>Cantidad</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Costo</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Subtotal</th>
                          <th style={{ textAlign: 'center', padding: '8px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px' }}>{item.product_name}</td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>${item.unit_cost.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>${item.subtotal.toFixed(2)}</td>
                            <td style={{ textAlign: 'center', padding: '8px' }}>
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          <td colSpan="3" style={{ textAlign: 'right', padding: '12px 8px' }}>TOTAL:</td>
                          <td style={{ textAlign: 'right', padding: '12px 8px' }}>${calculateTotal().toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-premium-footer">
                <button type="button" className="premium-btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="premium-btn-primary">
                  <i className="fas fa-save"></i> Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-premium-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-premium-content" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-premium-header">
              <h3><i className="fas fa-file-invoice"></i> Orden #{selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '10px', color: 'var(--text-primary)', padding: '10px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '20px', padding: '0 30px' }}>
              <p style={{ color: 'var(--text-secondary)' }}><strong>Proveedor:</strong> {selectedOrder.supplier?.name}</p>
              <p style={{ color: 'var(--text-secondary)' }}><strong>Fecha:</strong> {new Date(selectedOrder.order_date).toLocaleDateString()}</p>
              <p style={{ color: 'var(--text-secondary)' }}><strong>Fecha Esperada:</strong> {selectedOrder.expected_date ? new Date(selectedOrder.expected_date).toLocaleDateString() : 'N/A'}</p>
              <p style={{ color: 'var(--text-secondary)' }}><strong>Estado:</strong> {getStatusBadge(selectedOrder.status)}</p>
              {selectedOrder.notes && <p style={{ color: 'var(--text-secondary)' }}><strong>Notas:</strong> {selectedOrder.notes}</p>}
            </div>

            <div style={{ padding: '0 30px 30px' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>Productos</h4>
              <div className="premium-table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Producto</th>
                      <th style={{ textAlign: 'center' }}>Cantidad</th>
                      <th style={{ textAlign: 'right' }}>Costo</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product_name}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>${parseFloat(item.unit_cost).toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>${parseFloat(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      <td colSpan="3" style={{ textAlign: 'right', padding: '20px 15px' }}>TOTAL:</td>
                      <td style={{ textAlign: 'right', padding: '20px 15px', color: 'var(--accent-pink)' }}>${parseFloat(selectedOrder.total).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-premium-footer">
              <button onClick={() => setSelectedOrder(null)} className="premium-btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="premium-table-container">
        {filteredOrders.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-card)', borderRadius: '20px' }}>
            <i className="fas fa-file-invoice" style={{ fontSize: '4rem', color: 'var(--border-color)', marginBottom: '20px', display: 'block' }}></i>
            <h3 style={{ color: 'var(--text-primary)' }}>No hay órdenes de compra</h3>
            <p style={{ color: 'var(--text-muted)' }}>Crea tu primera orden para empezar a gestionar compras</p>
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Orden #</th>
                <th>Proveedor</th>
                <th style={{ textAlign: 'center' }}>Fecha</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: '600' }}>{order.order_number}</td>
                  <td>{order.supplier?.name || 'N/A'}</td>
                  <td style={{ textAlign: 'center' }}>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-pink)' }}>
                    ${parseFloat(order.total).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>{getStatusBadge(order.status)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn-icon"
                        onClick={() => viewDetails(order.id)}
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                        title="Ver Detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button
                            className="btn-icon"
                            onClick={() => handleReceive(order.id)}
                            style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                            title="Marcar como Recibida"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleCancel(order.id)}
                            style={{ background: 'rgba(232, 85, 94, 0.1)', color: '#e8555e', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}
                            title="Cancelar"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default PurchaseOrders;
