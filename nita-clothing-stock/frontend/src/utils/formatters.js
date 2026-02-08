/**
 * Formatea un número como moneda con puntos de miles y comas decimales
 * Ejemplo: 2272034 -> $2.272.034,00
 */
export const formatCurrency = (value) => {
  const number = parseFloat(value) || 0;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number).replace('ARS', '$').trim();
};

/**
 * Formatea un número con puntos de miles y comas decimales (sin símbolo de moneda)
 * Ejemplo: 2272034.50 -> 2.272.034,50
 */
export const formatNumber = (value, decimals = 2) => {
  const number = parseFloat(value) || 0;
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Formatea un número entero con puntos de miles
 * Ejemplo: 2272034 -> 2.272.034
 */
export const formatInteger = (value) => {
  const number = parseInt(value) || 0;
  return new Intl.NumberFormat('es-AR').format(number);
};
