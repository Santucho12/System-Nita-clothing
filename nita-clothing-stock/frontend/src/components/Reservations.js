import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './Reservations.css';

const initialReservation = {
  customer_email: '',
  customer_name: '',
  customer_phone: '',
  items: [{ product_id: '', quantity: 1 }],
  deposit_amount: 0,
  expiration_date: '',
  payment_method: 'efectivo',
  notes: ''
};

export default function Reservations() {
  const [view, setView] = useState('list'); // list, create, detail
  const [reservations, setReservations] = useState([]);
  const [activeReservations, setActiveReservations] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [formData, setFormData] = useState(initialReservation);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (view === 'list') fetchReservations();
  }, [view]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const [all, active, expiring] = await Promise.all([
        api.get('/reservas'),
        api.get('/reservas/activas'),
        api.get('/reservas/proximas-vencer')
      ]);
      setReservations(all.data.data);
      setActiveReservations(active.data.data);
      setExpiringSoon(expiring.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (idx, field, value) => {
    const newItems = [...formData.items];
    newItems[idx][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { product_id: '', quantity: 1 }] });
  const removeItem = idx => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post('/reservas', {
        ...formData,
        items: formData.items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
        deposit_amount: Number(formData.deposit_amount)
      });
      setMessage({ type: 'success', text: 'Reserva creada correctamente' });
      setFormData(initialReservation);
      setView('list');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al crear reserva' });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async id => {
    if (!window.confirm('¿Completar reserva y generar venta?')) return;
    try {
      await api.patch(`/reservas/${id}/completar`);
      setMessage({ type: 'success', text: 'Reserva completada y venta generada' });
      fetchReservations();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al completar reserva' });
    }
  };

  const handleCancel = async id => {
    if (!window.confirm('¿Cancelar reserva y restaurar stock?')) return;
    try {
      await api.patch(`/reservas/${id}/cancelar`);
      setMessage({ type: 'success', text: 'Reserva cancelada y stock restaurado' });
      fetchReservations();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al cancelar reserva' });
    }
  };

  return (
    <div className="reservations">
      <h2>Gestión de Reservas</h2>
      <div className="view-buttons">
        <button onClick={() => setView('list')}>Listar Reservas</button>
        <button onClick={() => setView('create')}>Nueva Reserva</button>
      </div>

      {message && <div className={`message ${message.type}`}>{message.text}</div>}

      {view === 'create' && (
        <form className="reservation-form" onSubmit={handleSubmit}>
          <h3>Nueva Reserva</h3>
          <input type="email" placeholder="Email del cliente" value={formData.customer_email} 
                 onChange={e => setFormData({ ...formData, customer_email: e.target.value })} required />
          <input type="text" placeholder="Nombre" value={formData.customer_name}
                 onChange={e => setFormData({ ...formData, customer_name: e.target.value })} required />
          <input type="tel" placeholder="Teléfono" value={formData.customer_phone}
                 onChange={e => setFormData({ ...formData, customer_phone: e.target.value })} required />
          
          <h4>Productos</h4>
          {formData.items.map((item, idx) => (
            <div key={idx} className="item-row">
              <input type="number" placeholder="ID Producto" value={item.product_id}
                     onChange={e => handleItemChange(idx, 'product_id', e.target.value)} required />
              <input type="number" min="1" placeholder="Cantidad" value={item.quantity}
                     onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required />
              {formData.items.length > 1 && <button type="button" onClick={() => removeItem(idx)}>-</button>}
            </div>
          ))}
          <button type="button" onClick={addItem}>Agregar Producto</button>

          <input type="number" min="0" step="0.01" placeholder="Seña" value={formData.deposit_amount}
                 onChange={e => setFormData({ ...formData, deposit_amount: e.target.value })} required />
          <input type="date" value={formData.expiration_date}
                 onChange={e => setFormData({ ...formData, expiration_date: e.target.value })} required />
          <select value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
          <textarea placeholder="Notas" value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear Reserva'}</button>
        </form>
      )}

      {view === 'list' && (
        <>
          {expiringSoon.length > 0 && (
            <div className="alert-section">
              <h3>⚠️ Reservas próximas a vencer</h3>
              <table>
                <thead><tr><th>N°</th><th>Cliente</th><th>Vence</th><th>Total</th><th>Acciones</th></tr></thead>
                <tbody>
                  {expiringSoon.map(r => (
                    <tr key={r.id}>
                      <td>{r.reservation_number}</td>
                      <td>{r.customer_name}</td>
                      <td>{r.expiration_date?.slice(0, 10)}</td>
                      <td>${r.total_amount?.toFixed(2)}</td>
                      <td>
                        <button onClick={() => handleComplete(r.id)}>Completar</button>
                        <button onClick={() => handleCancel(r.id)}>Cancelar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3>Reservas Activas</h3>
          <table className="reservations-table">
            <thead><tr><th>N°</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Seña</th><th>Vence</th><th>Acciones</th></tr></thead>
            <tbody>
              {activeReservations.map(r => (
                <tr key={r.id}>
                  <td>{r.reservation_number}</td>
                  <td>{r.customer_name}</td>
                  <td>{r.items}</td>
                  <td>${r.total_amount?.toFixed(2)}</td>
                  <td>${r.deposit_amount?.toFixed(2)}</td>
                  <td>{r.expiration_date?.slice(0, 10)}</td>
                  <td>
                    <button onClick={() => handleComplete(r.id)}>Completar</button>
                    <button onClick={() => handleCancel(r.id)}>Cancelar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Todas las Reservas</h3>
          <table className="reservations-table">
            <thead><tr><th>N°</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Fecha</th></tr></thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id}>
                  <td>{r.reservation_number}</td>
                  <td>{r.customer_name}</td>
                  <td><span className={`status ${r.status}`}>{r.status}</span></td>
                  <td>${r.total_amount?.toFixed(2)}</td>
                  <td>{r.reservation_date?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
