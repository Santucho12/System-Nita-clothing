import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Categories from './components/Categories';
import Products from './components/Products';
import Reports from './components/Reports';
import AdvancedReports from './components/AdvancedReports';
import RegisterSale from './components/RegisterSale';
import SalesHistory from './components/SalesHistory';
import DashboardSales from './components/DashboardSales';
import Customers from './components/Customers';
import Reservations from './components/Reservations';
import ExchangeReturns from './components/ExchangeReturns';
import Suppliers from './components/Suppliers';
import PurchaseOrders from './components/PurchaseOrders';
import Alerts from './components/Alerts';
import Promotions from './components/Promotions';
import Login from './components/Login';

import './App.css';


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Intentar cargar usuario desde localStorage/token
    const token = localStorage.getItem('token');
    if (token) {
      // Opcional: decodificar token o pedir /api/auth/me
      setUser({ token });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Redirigir a la página principal
    window.location.href = '/';
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="App" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: 230, minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
          <main className="main-content" style={{ flex: 1, padding: '32px 24px 24px 24px' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<Products />} />
              <Route path="/reports" element={<Navigate to="/reports/advanced" replace />} />
              <Route path="/reports/advanced" element={<AdvancedReports />} />
              <Route path="/sales/register" element={<RegisterSale />} />
              <Route path="/sales/history" element={<SalesHistory />} />
              <Route path="/sales/dashboard" element={<DashboardSales />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/exchange-returns" element={<ExchangeReturns />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/promotions" element={<Promotions />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </div>
    </Router>
  );
}

export default App;