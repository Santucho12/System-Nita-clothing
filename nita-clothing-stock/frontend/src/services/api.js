import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejo de errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API:', error);
    return Promise.reject(error);
  }
);

// Servicios de Categorías
export const categoryService = {
  // Obtener todas las categorías
  getAll: async () => {
    try {
      const response = await api.get('/categorias');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo categorías');
    }
  },

  // Obtener categoría por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/categorias/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo categoría');
    }
  },

  // Crear nueva categoría
  create: async (categoryData) => {
    try {
      const response = await api.post('/categorias', categoryData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error creando categoría');
    }
  },

  // Actualizar categoría
  update: async (id, categoryData) => {
    try {
      const response = await api.put(`/categorias/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error actualizando categoría');
    }
  },

  // Eliminar categoría
  delete: async (id) => {
    try {
      const response = await api.delete(`/categorias/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error eliminando categoría');
    }
  }
};

// Servicios de Productos
export const productService = {
  // Obtener todos los productos
  getAll: async () => {
    try {
      const response = await api.get('/productos');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo productos');
    }
  },

  // Obtener producto por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/productos/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo producto');
    }
  },

  // Obtener productos por categoría
  getByCategory: async (categoryId) => {
    try {
      const response = await api.get(`/productos/categoria/${categoryId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo productos por categoría');
    }
  },

  // Buscar productos
  search: async (searchTerm) => {
    try {
      const response = await api.get(`/productos/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error buscando productos');
    }
  },

  // Obtener productos con stock bajo
  getLowStock: async (minQuantity = 5) => {
    try {
      const response = await api.get(`/productos/stock-bajo?min=${minQuantity}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo productos con stock bajo');
    }
  },

  // Crear nuevo producto
  create: async (productData) => {
    try {
      const response = await api.post('/productos', productData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error creando producto');
    }
  },

  // Actualizar producto
  update: async (id, productData) => {
    try {
      const response = await api.put(`/productos/${id}`, productData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error actualizando producto');
    }
  },

  // Actualizar solo stock
  updateStock: async (id, quantity) => {
    try {
      const response = await api.patch(`/productos/${id}/stock`, { quantity });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error actualizando stock');
    }
  },

  // Eliminar producto
  delete: async (id) => {
    try {
      const response = await api.delete(`/productos/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error eliminando producto');
    }
  }
};

export default api;