import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon, FaWater } from 'react-icons/fa';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', icon: <FaSun />, title: 'Modo Claro' },
    { id: 'dark', icon: <FaMoon />, title: 'Modo Oscuro' },
    { id: 'blue-dark', icon: <FaWater />, title: 'Modo Azulado' },
  ];

  return (
    <div className="theme-selector">
      {themes.map(t => (
        <button
          key={t.id}
          className={`theme-selector-btn${theme === t.id ? ' active' : ''}`}
          onClick={() => setTheme(t.id)}
          title={t.title}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
