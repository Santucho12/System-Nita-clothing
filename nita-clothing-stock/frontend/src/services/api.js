import axios from 'axios';

// Configuración base de Axios
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
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
  },

  // Cambiar estado de la categoría (activa/inactiva)
  changeStatus: async (id, status) => {
    try {
      const response = await api.patch(`/categorias/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error cambiando estado de categoría');
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

  // Crear nuevo producto (con imágenes)
  create: async (productData) => {
    try {
      let dataToSend;
      let headers = {};
      if (productData.images && productData.images.length > 0 && productData.images[0] instanceof File) {
        // Si hay archivos, usar FormData
        dataToSend = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (key === 'images') {
            Array.from(value).forEach(img => dataToSend.append('images', img));
          } else {
            dataToSend.append(key, value);
          }
        });
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        dataToSend = productData;
      }
      const response = await api.post('/productos', dataToSend, { headers });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error creando producto');
    }
  },

  // Actualizar producto (con imágenes)
  update: async (id, productData) => {
    try {
      let dataToSend;
      let headers = {};
      if (productData.images && productData.images.length > 0 && productData.images[0] instanceof File) {
        dataToSend = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (key === 'images') {
            Array.from(value).forEach(img => dataToSend.append('images', img));
          } else {
            dataToSend.append(key, value);
          }
        });
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        dataToSend = productData;
      }
      const response = await api.put(`/productos/${id}`, dataToSend, { headers });
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

  // Cambiar estado del producto
  changeStatus: async (id, status) => {
    try {
      const response = await api.patch(`/productos/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error cambiando estado del producto');
    }
  },

  // Duplicar producto
  duplicate: async (id) => {
    try {
      const response = await api.post(`/productos/${id}/duplicar`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error duplicando producto');
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

// Servicios de Proveedores
export const supplierService = {
  // Obtener todos los proveedores
  getAll: async () => {
    try {
      const response = await api.get('/proveedores');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo proveedores');
    }
  },

  // Obtener proveedor por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/proveedores/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error obteniendo proveedor');
    }
  },

  // Crear nuevo proveedor
  create: async (supplierData) => {
    try {
      const response = await api.post('/proveedores', supplierData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error creando proveedor');
    }
  },

  // Actualizar proveedor
  update: async (id, supplierData) => {
    try {
      const response = await api.put(`/proveedores/${id}`, supplierData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error actualizando proveedor');
    }
  },

  // Eliminar proveedor
  delete: async (id) => {
    try {
      const response = await api.delete(`/proveedores/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error eliminando proveedor');
    }
  }
};

export default api;