import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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
      toast.error('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReceive = async (orderId) => {
    if (!window.confirm('¿Marcar esta orden como recibida? Esto actualizará el stock automáticamente.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/ordenes-compra/${orderId}/recibir`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Orden marcada como recibida y stock actualizado');
      loadData();
    } catch (error) {
      toast.error('Error: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm('¿Cancelar esta orden de compra?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/ordenes-compra/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Orden cancelada exitosamente');
      loadData();
    } catch (error) {
      toast.error('Error: ' + (error.response?.data?.message || error.message));
    }
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
    const styles = {
      pending: { bg: '#fff3cd', color: '#856404', text: 'Pendiente' },
      received: { bg: '#d4edda', color: '#155724', text: 'Recibida' },
      partial: { bg: '#d1ecf1', color: '#0c5460', text: 'Parcial' },
      cancelled: { bg: '#f8d7da', color: '#721c24', text: 'Cancelada' }
    };
    
    const style = styles[status] || styles.pending;
    return (
      <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: style.bg, color: style.color }}>
        {style.text}
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
    <div className="purchase-orders-container" style={{ padding: '20px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>
          <i className="fas fa-file-invoice" style={{ marginRight: '10px' }}></i>
          Órdenes de Compra
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
          Nueva Orden
        </button>
      </div>

      <div className="filters" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => setFilterStatus('all')}
          style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: filterStatus === 'all' ? '#007bff' : 'white', color: filterStatus === 'all' ? 'white' : '#333', cursor: 'pointer' }}
        >
          Todas
        </button>
        <button 
          onClick={() => setFilterStatus('pending')}
          style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: filterStatus === 'pending' ? '#007bff' : 'white', color: filterStatus === 'pending' ? 'white' : '#333', cursor: 'pointer' }}
        >
          Pendientes
        </button>
        <button 
          onClick={() => setFilterStatus('received')}
          style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: filterStatus === 'received' ? '#007bff' : 'white', color: filterStatus === 'received' ? 'white' : '#333', cursor: 'pointer' }}
        >
          Recibidas
        </button>
        <button 
          onClick={() => setFilterStatus('cancelled')}
          style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: filterStatus === 'cancelled' ? '#007bff' : 'white', color: filterStatus === 'cancelled' ? 'white' : '#333', cursor: 'pointer' }}
        >
          Canceladas
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={resetForm}>
          <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Nueva Orden de Compra</h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
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

              <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={resetForm} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                  Crear Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Orden #{selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p><strong>Proveedor:</strong> {selectedOrder.supplier?.name}</p>
              <p><strong>Fecha:</strong> {new Date(selectedOrder.order_date).toLocaleDateString()}</p>
              <p><strong>Fecha Esperada:</strong> {selectedOrder.expected_date ? new Date(selectedOrder.expected_date).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Estado:</strong> {getStatusBadge(selectedOrder.status)}</p>
              {selectedOrder.notes && <p><strong>Notas:</strong> {selectedOrder.notes}</p>}
            </div>

            <h4>Productos</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Producto</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Cantidad</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Costo</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{item.product_name}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>${parseFloat(item.unit_cost).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>${parseFloat(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  <td colSpan="3" style={{ textAlign: 'right', padding: '12px 8px' }}>TOTAL:</td>
                  <td style={{ textAlign: 'right', padding: '12px 8px' }}>${parseFloat(selectedOrder.total).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedOrder(null)} style={{ padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="orders-table" style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {filteredOrders.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fas fa-file-invoice" style={{ fontSize: '3em', color: '#ccc', marginBottom: '20px' }}></i>
            <h3>No hay órdenes de compra</h3>
            <p>Crea tu primera orden para empezar a gestionar compras</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
              style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '15px' }}
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Crear Primera Orden
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Orden #</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Proveedor</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Fecha</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{order.order_number}</td>
                  <td style={{ padding: '12px' }}>{order.supplier?.name || 'N/A'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>${parseFloat(order.total).toFixed(2)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(order.status)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => viewDetails(order.id)}
                      style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '16px', marginRight: '8px' }}
                      title="Ver Detalles"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {order.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleReceive(order.id)}
                          style={{ background: 'none', border: 'none', color: '#28a745', cursor: 'pointer', fontSize: '16px', marginRight: '8px' }}
                          title="Marcar como Recibida"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button 
                          onClick={() => handleCancel(order.id)}
                          style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px' }}
                          title="Cancelar"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrders;
