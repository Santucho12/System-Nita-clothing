import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './SalesHistory.css';

const defaultFilters = {
  start_date: '',
  end_date: '',
  payment_method: '',
  status: '',
  customer_email: '',
  sale_number: '',
  page: 1,
  page_size: 20
};

export default function SalesHistory() {
  const [filters, setFilters] = useState(defaultFilters);
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [error, setError] = useState(null);

  const fetchSales = async (params = filters) => {
    setLoading(true);
    setError(null);
    try {
      const { data, total: totalCount } = (await api.get('/ventas/history', { params })).data;
      setSales(data);
      setTotal(totalCount);
    } catch (err) {
      setError('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line
  }, []);

  const handleFilterChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchSales({ ...filters, page: 1 });
  };

  const handlePageChange = newPage => {
    setFilters(f => ({ ...f, page: newPage }));
    fetchSales({ ...filters, page: newPage });
  };

  const handleShowDetail = sale => setSelectedSale(sale);
  const handleCloseDetail = () => setSelectedSale(null);

  return (
    <div className="sales-history">
      <h2>Historial de Ventas</h2>
      <form className="filters" onSubmit={handleSearch}>
        <input type="date" name="start_date" value={filters.start_date} onChange={handleFilterChange} />
        <input type="date" name="end_date" value={filters.end_date} onChange={handleFilterChange} />
        <input type="text" name="sale_number" placeholder="N° Venta" value={filters.sale_number} onChange={handleFilterChange} />
        <input type="email" name="customer_email" placeholder="Email Cliente" value={filters.customer_email} onChange={handleFilterChange} />
        <select name="payment_method" value={filters.payment_method} onChange={handleFilterChange}>
          <option value="">Método de pago</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="mixto">Mixto</option>
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">Estado</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
          <option value="devuelta">Devuelta</option>
        </select>
        <button type="submit">Buscar</button>
      </form>
      {loading ? <div>Cargando...</div> : error ? <div className="error">{error}</div> : (
        <>
          <table className="sales-table">
            <thead>
              <tr>
                <th>N° Venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Método</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td>{sale.sale_number || sale.id}</td>
                  <td>{sale.sale_date?.slice(0, 10)}</td>
                  <td>{sale.customer_email}</td>
                  <td>{sale.payment_method}</td>
                  <td>${sale.total?.toFixed(2)}</td>
                  <td>{sale.status || 'completada'}</td>
                  <td>
                    <button onClick={() => handleShowDetail(sale)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            {Array.from({ length: Math.ceil(total / filters.page_size) }, (_, i) => (
              <button
                key={i + 1}
                className={filters.page === i + 1 ? 'active' : ''}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
      {selectedSale && (
        <div className="sale-detail-modal">
          <div className="modal-content">
            <button className="close" onClick={handleCloseDetail}>X</button>
            <h3>Detalle de Venta #{selectedSale.sale_number || selectedSale.id}</h3>
            <p><b>Fecha:</b> {selectedSale.sale_date?.slice(0, 16)}</p>
            <p><b>Cliente:</b> {selectedSale.customer_email}</p>
            <p><b>Método de pago:</b> {selectedSale.payment_method}</p>
            <p><b>Total:</b> ${selectedSale.total?.toFixed(2)}</p>
            <p><b>Estado:</b> {selectedSale.status || 'completada'}</p>
            <p><b>Productos:</b> {selectedSale.items}</p>
            {/* Acciones: imprimir, email, cancelar, exportar */}
            <div className="actions">
              <button>Imprimir Ticket</button>
              <button>Enviar Email</button>
              <button>Cancelar Venta</button>
              <button>Exportar PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
