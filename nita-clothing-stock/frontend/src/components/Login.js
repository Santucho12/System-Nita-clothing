import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });

      if (res.data && res.data.token) {
        // Notificamos al AuthContext pasando el objeto completo { token, user }
        onLogin && onLogin(res.data);
        toast.success(`¡Bienvenido de nuevo, ${res.data.user.username}!`);
      } else {
        toast.error('Respuesta del servidor inválida');
      }
    } catch (err) {
      console.error('[Login] Error:', err);
      const message = err.response?.data?.message || 'Credenciales incorrectas o error de conexión';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-placeholder">🛍️</div>
          <h2>Nita Clothing</h2>
          <p>Gestión de Stock Profesional</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <FaUser className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="admin@nita.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <FaLock className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <span className="loader"></span>
            ) : (
              <>
                <FaSignInAlt style={{ marginRight: '8px' }} />
                Ingresar al Sistema
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>&copy; {new Date().getFullYear()} Nita Clothing | v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
