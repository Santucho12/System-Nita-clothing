import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaTshirt, FaShoppingCart, FaHistory, FaChartBar, FaUsers, FaTruck, FaBookmark, FaExchangeAlt, FaBell } from 'react-icons/fa';
import './Sidebar.css';

const menuItems = [
  { to: '/', icon: FaHome, label: 'Inicio' },
  { to: '/products', icon: FaTshirt, label: 'Stock de Ropa' },
  { to: '/sales/register', icon: FaShoppingCart, label: 'Registrar Venta' },
  { to: '/sales/history', icon: FaHistory, label: 'Historial Ventas' },
  { to: '/reports/advanced', icon: FaChartBar, label: 'Estadísticas' },
  { to: '/customers', icon: FaUsers, label: 'Clientes' },
  { to: '/suppliers', icon: FaTruck, label: 'Proveedores' },
  { to: '/reservations', icon: FaBookmark, label: 'Reservas', comingSoon: true },
  { to: '/exchange-returns', icon: FaExchangeAlt, label: 'Cambios/Devoluciones', comingSoon: true },
  { to: '/alerts', icon: FaBell, label: 'Alertas', comingSoon: true },
];

const Sidebar = () => {
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLabel, setModalLabel] = useState('');

  const handleComingSoon = (label, e) => {
    e.preventDefault();
    setModalLabel(label);
    setModalOpen(true);
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link to="/">
            <img src="/image.png" alt="Nita Clothing Logo" />
          </Link>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return item.comingSoon ? (
              <a
                href={item.to}
                key={item.to}
                className={`sidebar-link${location.pathname === item.to ? ' active' : ''}`}
                onClick={(e) => handleComingSoon(item.label, e)}
                style={{ cursor: 'pointer', animationDelay: `${index * 0.15}s` }}
              >
                <IconComponent />
                <span>{item.label}</span>
              </a>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link${location.pathname === item.to ? ' active' : ''}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <IconComponent />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          Sistema Nita Clothing
        </div>
      </aside>
      {modalOpen && (
        <div className="sidebar-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="sidebar-modal" onClick={e => e.stopPropagation()}>
            <div className="sidebar-modal-title">Funcionalidad Próxima a implementar</div>
            <div className="sidebar-modal-desc">La sección <b>{modalLabel}</b> estará disponible próximamente.</div>
            <button className="sidebar-modal-btn" onClick={() => setModalOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
