import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './GlobalSearch.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    products: [],
    sales: [],
    customers: [],
    suppliers: []
  });
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Click fuera del search para cerrar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar cuando cambia el query (debounce)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ products: [], sales: [], customers: [], suppliers: [] });
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [productsRes, salesRes, customersRes, suppliersRes] = await Promise.all([
        axios.get(`${API_URL}/productos/search?q=${encodeURIComponent(searchQuery)}`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/ventas?search=${encodeURIComponent(searchQuery)}`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/clientes?search=${encodeURIComponent(searchQuery)}`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_URL}/proveedores?search=${encodeURIComponent(searchQuery)}`, { headers }).catch(() => ({ data: { data: [] } }))
      ]);

      setResults({
        products: (productsRes.data.data || []).slice(0, 5),
        sales: (salesRes.data.data || []).slice(0, 5),
        customers: (customersRes.data.data || []).slice(0, 5),
        suppliers: (suppliersRes.data.data || []).slice(0, 5)
      });
      
      setShowResults(true);
    } catch (error) {
      console.error('Error en búsqueda global:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    navigate('/products');
    setShowResults(false);
    setQuery('');
  };

  const handleSaleClick = (sale) => {
    navigate('/sales/history');
    setShowResults(false);
    setQuery('');
  };

  const handleCustomerClick = (customer) => {
    navigate('/customers');
    setShowResults(false);
    setQuery('');
  };

  const handleSupplierClick = (supplier) => {
    navigate('/suppliers');
    setShowResults(false);
    setQuery('');
  };

  const getTotalResults = () => {
    return results.products.length + results.sales.length + results.customers.length + results.suppliers.length;
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-container">
        <i className="fas fa-search search-icon"></i>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar productos, ventas, clientes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        {loading && <i className="fas fa-spinner fa-spin search-loading"></i>}
        {query && (
          <button 
            className="search-clear"
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      {showResults && getTotalResults() > 0 && (
        <div className="search-results">
          {results.products.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <i className="fas fa-tshirt"></i> Productos ({results.products.length})
              </div>
              {results.products.map(product => (
                <div 
                  key={product.id} 
                  className="result-item"
                  onClick={() => handleProductClick(product)}
                >
                  <div className="result-info">
                    <div className="result-title">{product.name}</div>
                    <div className="result-subtitle">
                      {product.size} - {product.color} | Stock: {product.stock_quantity}
                    </div>
                  </div>
                  <div className="result-price">${parseFloat(product.sale_price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}

          {results.sales.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <i className="fas fa-shopping-cart"></i> Ventas ({results.sales.length})
              </div>
              {results.sales.map(sale => (
                <div 
                  key={sale.id} 
                  className="result-item"
                  onClick={() => handleSaleClick(sale)}
                >
                  <div className="result-info">
                    <div className="result-title">Venta #{sale.sale_number}</div>
                    <div className="result-subtitle">
                      {new Date(sale.sale_date).toLocaleDateString()} | {sale.customer_email || 'Sin cliente'}
                    </div>
                  </div>
                  <div className="result-price">${parseFloat(sale.total).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}

          {results.customers.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <i className="fas fa-users"></i> Clientes ({results.customers.length})
              </div>
              {results.customers.map(customer => (
                <div 
                  key={customer.id} 
                  className="result-item"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <div className="result-info">
                    <div className="result-title">{customer.name || customer.email}</div>
                    <div className="result-subtitle">
                      {customer.email} | Compras: {customer.purchase_count || 0}
                    </div>
                  </div>
                  <div className="result-price">
                    ${parseFloat(customer.total_purchases || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.suppliers.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <i className="fas fa-truck"></i> Proveedores ({results.suppliers.length})
              </div>
              {results.suppliers.map(supplier => (
                <div 
                  key={supplier.id} 
                  className="result-item"
                  onClick={() => handleSupplierClick(supplier)}
                >
                  <div className="result-info">
                    <div className="result-title">{supplier.name}</div>
                    <div className="result-subtitle">
                      {supplier.contact_name || supplier.email || 'Sin contacto'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="results-footer">
            Mostrando {getTotalResults()} resultados
          </div>
        </div>
      )}

      {showResults && query.length >= 2 && getTotalResults() === 0 && !loading && (
        <div className="search-results">
          <div className="no-results">
            <i className="fas fa-search"></i>
            <p>No se encontraron resultados para "{query}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
