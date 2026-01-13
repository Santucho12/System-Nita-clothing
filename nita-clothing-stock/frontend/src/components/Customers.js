import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './Customers.css';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [segmentation, setSegmentation] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list, segmentation, detail

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes');
      setCustomers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegmentation = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clientes/segmentacion');
      setSegmentation(res.data.data);
      setView('segmentation');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (email) => {
    setLoading(true);
    try {
      const [customer, stats, history] = await Promise.all([
        api.get(`/clientes/${email}`),
        api.get(`/clientes/${email}/estadisticas`),
        api.get(`/clientes/${email}/compras`)
      ]);
      setSelectedCustomer(customer.data.data);
      setCustomerStats(stats.data.data);
      setPurchaseHistory(history.data.data);
      setView('detail');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customers">
      <h2>Gestión de Clientes</h2>
      <div className="view-buttons">
        <button onClick={() => { setView('list'); fetchCustomers(); }}>Lista de Clientes</button>
        <button onClick={fetchSegmentation}>Segmentación</button>
      </div>

      {loading ? <div>Cargando...</div> : (
        <>
          {view === 'list' && (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.email}>
                    <td>{c.email}</td>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>
                      <button onClick={() => fetchCustomerDetail(c.email)}>Ver Detalle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view === 'segmentation' && (
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nombre</th>
                  <th>Compras</th>
                  <th>Total Gastado</th>
                  <th>Última Compra</th>
                  <th>Segmento</th>
                </tr>
              </thead>
              <tbody>
                {segmentation.map(c => (
                  <tr key={c.email}>
                    <td>{c.email}</td>
                    <td>{c.name}</td>
                    <td>{c.purchase_count || 0}</td>
                    <td>${c.total_spent?.toFixed(2) || '0.00'}</td>
                    <td>{c.last_purchase?.slice(0, 10) || 'N/A'}</td>
                    <td><span className={`segment ${c.segment}`}>{c.segment}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {view === 'detail' && selectedCustomer && (
            <div className="customer-detail">
              <button onClick={() => setView('list')}>← Volver</button>
              <h3>Detalle de Cliente</h3>
              <p><b>Email:</b> {selectedCustomer.email}</p>
              <p><b>Nombre:</b> {selectedCustomer.name}</p>
              <p><b>Teléfono:</b> {selectedCustomer.phone}</p>
              <p><b>Dirección:</b> {selectedCustomer.address}</p>
              
              <h4>Estadísticas</h4>
              <p><b>Total de Compras:</b> {customerStats?.purchase_count || 0}</p>
              <p><b>Total Gastado:</b> ${customerStats?.total_spent?.toFixed(2) || '0.00'}</p>
              <p><b>Última Compra:</b> {customerStats?.last_purchase?.slice(0, 10) || 'N/A'}</p>

              <h4>Historial de Compras</h4>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Productos</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseHistory.map(s => (
                    <tr key={s.id}>
                      <td>{s.sale_date?.slice(0, 10)}</td>
                      <td>{s.items}</td>
                      <td>${s.total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
