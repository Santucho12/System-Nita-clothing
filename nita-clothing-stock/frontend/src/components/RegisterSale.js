import React, { useState } from 'react';
import api from '../services/api';
import { FaShoppingCart, FaPlus, FaTrash, FaBox, FaHashtag, FaDollarSign, FaEnvelope, FaCreditCard, FaPercent, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const initialItem = { product_id: '', quantity: 1, unit_price: 0 };

export default function RegisterSale() {
  const [items, setItems] = useState([{ ...initialItem }]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleItemChange = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { ...initialItem }]);
  const removeItem = idx => setItems(items.filter((_, i) => i !== idx));

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unit_price));
    }, 0);
    const discountByPercent = subtotal * (Number(discountPercent) / 100);
    const totalDiscount = discountByPercent + Number(discountAmount);
    return Math.max(0, subtotal - totalDiscount);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/ventas', {
        items: items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price)
        })),
        customer_name: '',
        customer_email: customerEmail,
        payment_method: paymentMethod,
        discount_percent: Number(discountPercent),
        discount_amount: Number(discountAmount)
      });
      // toast.success('Venta registrada correctamente');
      setItems([{ ...initialItem }]);
      setCustomerEmail('');
      setDiscountPercent(0);
      setDiscountAmount(0);
    } catch (err) {
      // toast.error(err.response?.data?.message || 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
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

          .sale-form-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
          }

          .total-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both;
          }

          .btn-pink {
            background: #f73194;
            transition: all 0.3s ease;
          }
          .btn-pink:hover {
            transform: scale(1.1);
          }
          .btn-secondary {
            background: #6c757d;
            transition: all 0.3s ease;
          }
          .btn-secondary:hover {
            transform: scale(1.1);
          }
          .btn-danger {
            background: #dc3545;
            transition: all 0.3s ease;
          }
          .btn-danger:hover {
            transform: scale(1.1);
          }
          .form-input {
            transition: all 0.3s ease;
          }
          .form-input:focus {
            border-color: #f73194 !important;
            box-shadow: 0 0 0 3px rgba(247, 49, 148, 0.1) !important;
            outline: none !important;
          }
          .item-card {
            transition: all 0.3s ease;
          }
          .item-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          }
        `}
      </style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '28px', color: '#333', fontWeight: '600' }}>
          <FaShoppingCart style={{ marginRight: '12px', color: '#f73194', fontSize: '32px' }} />
          Registrar Venta
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div className="sale-form-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>
              <FaBox style={{ color: '#f73194' }} />
              Productos
            </h3>

            {items.map((item, idx) => (
              <div key={idx} className="item-card" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '15px', border: '2px solid #e0e0e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>Producto #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="btn-danger"
                      style={{ padding: '8px 12px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
                    >
                      <FaTrash />
                      Eliminar
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                      <FaHashtag style={{ marginRight: '6px', color: '#f73194' }} />
                      ID Producto
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 1"
                      value={item.product_id}
                      onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                      required
                      className="form-input"
                      style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                      <FaBox style={{ marginRight: '6px', color: '#f73194' }} />
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ej: 2"
                      value={item.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                      className="form-input"
                      style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#555' }}>
                      <FaDollarSign style={{ marginRight: '6px', color: '#f73194' }} />
                      Precio Unitario
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ej: 100.00"
                      value={item.unit_price}
                      onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                      required
                      className="form-input"
                      style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '10px', background: 'white', borderRadius: '6px', textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', color: '#666', marginRight: '8px' }}>Subtotal:</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#4CAF50' }}>
                    ${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="btn-secondary"
              style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500', marginBottom: '30px', width: '100%', justifyContent: 'center' }}
            >
              <FaPlus />
              Agregar Producto
            </button>

            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>
              <FaEnvelope style={{ color: '#f73194' }} />
              Datos del Cliente
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                <FaEnvelope style={{ marginRight: '6px', color: '#f73194' }} />
                Email del Cliente
              </label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                required
                className="form-input"
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                <FaCreditCard style={{ marginRight: '6px', color: '#f73194' }} />
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="form-input"
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="mixto">💰 Mixto</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaPercent style={{ marginRight: '6px', color: '#f73194' }} />
                  Descuento %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaDollarSign style={{ marginRight: '6px', color: '#f73194' }} />
                  Descuento $
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-pink"
              style={{ padding: '16px', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '600', width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div style={{ width: '20px', height: '20px', border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}`}</style>
                  </div>
                  Registrando...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Registrar Venta
                </>
              )}
            </button>
          </form>
        </div>

        <div className="total-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: 'fit-content', position: 'sticky', top: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>
            <FaDollarSign style={{ color: '#f73194' }} />
            Resumen
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Productos:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Subtotal:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                ${items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fff3cd', borderRadius: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#856404' }}>Descuento:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#856404' }}>
                -${(
                  items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0) * (Number(discountPercent) / 100) + 
                  Number(discountAmount)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '3px solid #f73194', paddingTop: '20px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%)', borderRadius: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>Total:</span>
              <span style={{ fontSize: '32px', fontWeight: '700', color: '#f73194' }}>
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <FaCheckCircle style={{ color: '#2196F3', fontSize: '18px', marginTop: '2px' }} />
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: '600', color: '#1976D2' }}>Información</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#555', lineHeight: '1.5' }}>
                  Completa todos los campos y presiona "Registrar Venta" para finalizar la transacción.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
