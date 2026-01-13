
import React, { useState } from 'react';
import api from '../services/api';
import './RegisterSale.css';

const initialItem = { product_id: '', quantity: 1, unit_price: 0 };

export default function RegisterSale() {
  const [items, setItems] = useState([{ ...initialItem }]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleItemChange = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { ...initialItem }]);
  const removeItem = idx => setItems(items.filter((_, i) => i !== idx));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/ventas', {
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
      setMessage({ type: 'success', text: 'Venta registrada correctamente' });
      setItems([{ ...initialItem }]);
      setCustomerEmail('');
      setDiscountPercent(0);
      setDiscountAmount(0);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al registrar venta' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-sale">
      <h2>Registrar Venta</h2>
      <form onSubmit={handleSubmit}>
        {items.map((item, idx) => (
          <div key={idx} className="sale-item-row">
            <input
              type="number"
              placeholder="ID Producto"
              value={item.product_id}
              onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Cantidad"
              value={item.quantity}
              onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
              required
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio Unitario"
              value={item.unit_price}
              onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
              required
            />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(idx)}>-</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addItem}>Agregar Producto</button>
        <div>
          <input
            type="email"
            placeholder="Email del cliente"
            value={customerEmail}
            onChange={e => setCustomerEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Método de pago:</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="mixto">Mixto</option>
          </select>
        </div>
        <div>
          <label>Descuento %:</label>
          <input
            type="number"
            min="0"
            max="100"
            value={discountPercent}
            onChange={e => setDiscountPercent(e.target.value)}
          />
        </div>
        <div>
          <label>Descuento $:</label>
          <input
            type="number"
            min="0"
            value={discountAmount}
            onChange={e => setDiscountAmount(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar Venta'}</button>
      </form>
      {message && <div className={message.type}>{message.text}</div>}
    </div>
  );
}
