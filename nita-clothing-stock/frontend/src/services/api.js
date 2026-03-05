import axios from 'axios';

// Configuración base de Axios
// Configuración base de Axios
const API_BASE_URL = process.env.REACT_APP_API_URL;
if (!API_BASE_URL) {
  console.error('⚠️  REACT_APP_API_URL no está configurada en las variables de entorno (.env)');
}
export const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:5000/api',
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
    // Personalizar mensaje para errores comunes
    let friendlyMessage = error.response?.data?.message || error.message || 'Error desconocido';

    // Error de SKU duplicado (MySQL)
    if (friendlyMessage.includes('Duplicate entry') && friendlyMessage.includes('codigo')) {
      friendlyMessage = 'El código SKU ya está en uso por otro producto. Por favor, usa uno diferente.';
    }

    const detailedError = {
      message: friendlyMessage,
      status: error.response?.status,
      data: error.response?.data,
      originalError: error
    };

    console.error('Error en API:', detailedError);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Propagamos el error detallado para que los servicios puedan usarlo
    return Promise.reject(detailedError);
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
      throw error;
    }
  },

  // Obtener categoría por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/categorias/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error obteniendo categoría');
    }
  },

  // Crear nueva categoría
  create: async (categoryData) => {
    try {
      const response = await api.post('/categorias', categoryData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error creando categoría');
    }
  },

  // Actualizar categoría
  update: async (id, categoryData) => {
    try {
      const response = await api.put(`/categorias/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error actualizando categoría');
    }
  },

  // Eliminar categoría
  delete: async (id) => {
    try {
      const response = await api.delete(`/categorias/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Tiene productos activos esta categoria');
    }
  },

  // Cambiar estado de la categoría (activa/inactiva)
  changeStatus: async (id, status) => {
    try {
      const response = await api.patch(`/categorias/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error cambiando estado de categoría');
    }
  }
};

// Servicios de Productos
export const productService = {
  // Obtener el último SKU
  getLastSku: async () => {
    try {
      const response = await api.get('/productos/ultimo-sku');
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error obteniendo último SKU');
    }
  },
  // Obtener todos los productos con paginación y filtros
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/productos', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener el conteo de productos
  getCount: async () => {
    try {
      const response = await api.get('/productos/count', {
        params: { _t: Date.now() }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error obteniendo el conteo de productos');
    }
  },

  // Obtener producto por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/productos/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error obteniendo producto');
    }
  },

  // Obtener productos por categoría
  getByCategory: async (categoryId) => {
    try {
      const response = await api.get(`/productos/categoria/${categoryId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error obteniendo productos por categoría');
    }
  },

  // Buscar productos
  search: async (searchTerm) => {
    try {
      const response = await api.get(`/productos/search?q=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error buscando productos');
    }
  },

  // Obtener productos con stock bajo
  getLowStock: async (minQuantity = 5) => {
    try {
      const response = await api.get(`/productos/stock-bajo?min=${minQuantity}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error obteniendo productos con stock bajo');
    }
  },

  // Crear nuevo producto (con imágenes)
  create: async (productData) => {
    try {
      // Detección más robusta de archivos (File o Blob con propiedades de archivo)
      const hasFiles = Array.isArray(productData.images) && productData.images.some(img =>
        (img instanceof File) || (img && img.name && img.size && typeof img.name === 'string')
      );

      console.log('[API] create productData.images:', productData.images);
      console.log('[API] hasFiles:', hasFiles);

      let dataToSend;
      let headers = {};

      if (hasFiles) {
        dataToSend = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (key === 'images') {
            const files = Array.isArray(value) ? value : [value];
            const existingUrls = [];
            files.forEach(img => {
              if ((img instanceof File) || (img && img.name && img.size)) {
                console.log('[API] Agregando archivo a FormData:', img.name);
                dataToSend.append('images', img);
              } else if (typeof img === 'string' && img.trim() !== '') {
                existingUrls.push(img);
              }
            });
            if (existingUrls.length > 0) {
              dataToSend.append('imagen_url', JSON.stringify(existingUrls));
            }
          } else if (value !== null && value !== undefined) {
            dataToSend.append(key, value);
          }
        });
        // IMPORTANTE: NO fijar Content-Type para FormData, Axios lo hará con el boundary correcto
        headers['Content-Type'] = undefined;
      } else {
        dataToSend = { ...productData };
        if (Array.isArray(productData.images)) {
          dataToSend.imagen_url = JSON.stringify(productData.images.filter(img => typeof img === 'string'));
        }
      }

      const response = await api.post('/productos', dataToSend, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar producto (con imágenes)
  update: async (id, productData) => {
    try {
      const hasFiles = Array.isArray(productData.images) && productData.images.some(img =>
        (img instanceof File) || (img && img.name && img.size && typeof img.name === 'string')
      );

      console.log('[API] update current images:', productData.images);
      console.log('[API] hasFiles:', hasFiles);

      let dataToSend;
      let headers = {};

      if (hasFiles) {
        dataToSend = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (key === 'images') {
            const files = Array.isArray(value) ? value : [value];
            const existingUrls = [];
            files.forEach(img => {
              if ((img instanceof File) || (img && img.name && img.size)) {
                dataToSend.append('images', img);
              } else if (typeof img === 'string' && img.trim() !== '') {
                existingUrls.push(img);
              }
            });
            if (existingUrls.length > 0) {
              dataToSend.append('imagen_url', JSON.stringify(existingUrls));
            }
          } else if (value !== null && value !== undefined) {
            dataToSend.append(key, value);
          }
        });
        headers['Content-Type'] = undefined;
      } else {
        dataToSend = { ...productData };
        if (Array.isArray(productData.images)) {
          dataToSend.imagen_url = JSON.stringify(productData.images.filter(img => typeof img === 'string'));
        }
      }

      const response = await api.put(`/productos/${id}`, dataToSend, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar solo stock
  updateStock: async (id, quantity) => {
    try {
      const response = await api.patch(`/productos/${id}/stock`, { quantity });
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error actualizando stock');
    }
  },

  // Cambiar estado del producto
  changeStatus: async (id, status) => {
    try {
      const response = await api.patch(`/productos/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error cambiando estado del producto');
    }
  },

  // Duplicar producto
  duplicate: async (id) => {
    try {
      const response = await api.post(`/productos/${id}/duplicar`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error duplicando producto');
    }
  },

  // Eliminar producto
  delete: async (id) => {
    try {
      const response = await api.delete(`/productos/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error eliminando producto');
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
      throw new Error(error.message || error.data?.message || 'Error obteniendo proveedores');
    }
  },

  // Obtener proveedor por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/proveedores/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error obteniendo proveedor');
    }
  },

  // Crear nuevo proveedor
  create: async (supplierData) => {
    try {
      const response = await api.post('/proveedores', supplierData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error creando proveedor');
    }
  },

  // Actualizar proveedor
  update: async (id, supplierData) => {
    try {
      const response = await api.put(`/proveedores/${id}`, supplierData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error actualizando proveedor');
    }
  },

  // Eliminar proveedor
  delete: async (id) => {
    try {
      const response = await api.delete(`/proveedores/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || error.data?.message || 'Error eliminando proveedor');
    }
  }
};

export default api;