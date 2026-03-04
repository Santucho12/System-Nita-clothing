import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

const THEMES = ['light', 'dark', 'blue-dark'];
const THEME_LABELS = { light: 'Claro', dark: 'Oscuro', 'blue-dark': 'Azulado' };

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const validTheme = THEMES.includes(savedTheme) ? savedTheme : 'light';
    setTheme(validTheme);
    document.documentElement.setAttribute('data-theme', validTheme);
  }, []);

  const setSpecificTheme = (newTheme) => {
    if (THEMES.includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setSpecificTheme(THEMES[nextIndex]);
  };

  const value = {
    theme,
    setTheme: setSpecificTheme,
    cycleTheme,
    toggleTheme: cycleTheme,
    isDark: theme === 'dark' || theme === 'blue-dark',
    isLight: theme === 'light',
    themes: THEMES,
    themeLabels: THEME_LABELS
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
