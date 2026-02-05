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

  // Ocultamos la navbar horizontal porque ahora usamos Sidebar vertical
  return null;
};

export default Navigation;