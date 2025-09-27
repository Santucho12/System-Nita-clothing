import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Link to="/" className="nav-logo" style={{ marginRight: '32px', display: 'flex', alignItems: 'center' }}>
          <img
            src="/image.png"
            alt="Nita Clothing Logo"
            className="nav-logo-img"
            style={{ height: '48px', marginRight: '8px' }}
          />
        </Link>
        <div className="nav-menu" style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flex: 1 }}>
          <Link 
            to="/products" 
            className={`nav-link ${isActive('/products') ? 'active' : ''}`}
          >
            <span role="img" aria-label="ropa" style={{marginRight: '0.3em'}}>👚</span>Ropa
          </Link>
          <Link 
            to="/sales" 
            className={`nav-link ${isActive('/sales') ? 'active' : ''}`}
          >
            <span role="img" aria-label="ventas" style={{marginRight: '0.3em'}}>🛒</span>Ventas
          </Link>
          <Link 
            to="/reports" 
            className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
          >
            <span role="img" aria-label="estadísticas" style={{marginRight: '0.3em'}}>📊</span>Estadísticas
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;