import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 20px' }}>
        <Link to="/" className="nav-logo" style={{ marginRight: '32px', display: 'flex', alignItems: 'center' }}>
          <img
            src="/image.png"
            alt="Nita Clothing Logo"
            className="nav-logo-img"
            style={{ height: '48px', marginRight: '8px' }}
          />
        </Link>
        
        <GlobalSearch />
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <NotificationBell />
          <ThemeToggle />
        </div>
        
        <div className="nav-menu" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flex: 1, marginLeft: '20px' }}>
          <Link 
            to="/products" 
            className={`nav-link ${isActive('/products') ? 'active' : ''}`}
          >
            <span role="img" aria-label="ropa" style={{marginRight: '0.3em'}}>👚</span>Ropa
          </Link>
          <Link 
            to="/sales/register" 
            className={`nav-link ${isActive('/sales/register') ? 'active' : ''}`}
          >
            <span role="img" aria-label="ventas" style={{marginRight: '0.3em'}}>🛒</span>Registrar Venta
          </Link>
          <Link 
            to="/sales/history" 
            className={`nav-link ${isActive('/sales/history') ? 'active' : ''}`}
          >
            <span role="img" aria-label="historial" style={{marginRight: '0.3em'}}>📄</span>Historial Ventas
          </Link>
          <Link 
            to="/reports" 
            className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
          >
            <span role="img" aria-label="estadísticas" style={{marginRight: '0.3em'}}>📊</span>Estadísticas
          </Link>
          <Link 
            to="/customers" 
            className={`nav-link ${isActive('/customers') ? 'active' : ''}`}
          >
            <span role="img" aria-label="clientes" style={{marginRight: '0.3em'}}>👥</span>Clientes
          </Link>
          <Link 
            to="/reservations" 
            className={`nav-link ${isActive('/reservations') ? 'active' : ''}`}
          >
            <span role="img" aria-label="reservas" style={{marginRight: '0.3em'}}>📌</span>Reservas
          </Link>
          <Link 
            to="/exchange-returns" 
            className={`nav-link ${isActive('/exchange-returns') ? 'active' : ''}`}
          >
            <span role="img" aria-label="cambios" style={{marginRight: '0.3em'}}>🔄</span>Cambios/Devoluciones
          </Link>
          <Link 
            to="/suppliers" 
            className={`nav-link ${isActive('/suppliers') ? 'active' : ''}`}
          >
            <span role="img" aria-label="proveedores" style={{marginRight: '0.3em'}}>🏭</span>Proveedores
          </Link>
          <Link 
            to="/purchase-orders" 
            className={`nav-link ${isActive('/purchase-orders') ? 'active' : ''}`}
          >
            <span role="img" aria-label="ordenes" style={{marginRight: '0.3em'}}>📦</span>Órdenes Compra
          </Link>
          <Link 
            to="/promotions" 
            className={`nav-link ${isActive('/promotions') ? 'active' : ''}`}
          >
            <span role="img" aria-label="promociones" style={{marginRight: '0.3em'}}>🏷️</span>Promociones
          </Link>
          <Link 
            to="/alerts" 
            className={`nav-link ${isActive('/alerts') ? 'active' : ''}`}
          >
            <span role="img" aria-label="alertas" style={{marginRight: '0.3em'}}>🔔</span>Alertas
          </Link>
          <Link 
            to="/sales/dashboard" 
            className={`nav-link ${isActive('/sales/dashboard') ? 'active' : ''}`}
          >
            <span role="img" aria-label="dashboard" style={{marginRight: '0.3em'}}>📈</span>Dashboard Ventas
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;