import api from './api';

// Servicio para ventas
export const salesService = {
    // Crear nueva venta
    createSale: async (saleData) => {
        try {
            const response = await api.post('/ventas', saleData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al crear la venta' };
        }
    },

    // Obtener todas las ventas
    getAllSales: async (limit = 50, offset = 0) => {
        try {
            const response = await api.get(`/ventas?limit=${limit}&offset=${offset}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener las ventas' };
        }
    },

    // Obtener ventas del mes actual
    getCurrentMonthSales: async () => {
        try {
            const response = await api.get('/ventas/current-month');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener las ventas del mes' };
        }
    },

    // Obtener ventas por rango de fechas
    getSalesByDateRange: async (startDate, endDate) => {
        try {
            const response = await api.get(`/ventas/by-date-range?start_date=${startDate}&end_date=${endDate}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener las ventas por fecha' };
        }
    },

    // Eliminar venta
    deleteSale: async (id) => {
        try {
            const response = await api.delete(`/ventas/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al eliminar la venta' };
        }
    }
};

// Servicio para reportes
export const reportsService = {
    // Obtener estadísticas mensuales
    getMonthlyStats: async () => {
        try {
            const response = await api.get('/reportes/monthly-stats');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener estadísticas mensuales' };
        }
    },

    // Obtener productos más vendidos
    getTopProducts: async (limit = 10) => {
        try {
            const response = await api.get(`/reportes/top-products?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener productos más vendidos' };
        }
    },

    // Obtener categorías más vendidas
    getTopCategories: async (limit = 3) => {
        try {
            const response = await api.get(`/reportes/top-categories?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener categorías más vendidas' };
        }
    },

    // Obtener ventas por método de pago
    getSalesByPaymentMethod: async (year, month) => {
        try {
            let url = '/reportes/payment-methods';
            const params = [];
            if (year) params.push(`year=${year}`);
            if (month) params.push(`month=${month}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener reporte por método de pago' };
        }
    },

    // Obtener reporte de ventas diarias
    getDailySalesReport: async (year, month) => {
        try {
            let url = '/reportes/daily-sales';
            const params = [];
            if (year) params.push(`year=${year}`);
            if (month) params.push(`month=${month}`);
            if (params.length > 0) url += `?${params.join('&')}`;

            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener reporte de ventas diarias' };
        }
    },

    // Obtener reporte de rendimiento
    getPerformanceReport: async () => {
        try {
            const response = await api.get('/reportes/performance');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener reporte de rendimiento' };
        }
    },

    // Obtener valor del inventario (Capital en Ropa)
    getInventoryValue: async () => {
        try {
            const response = await api.get('/reportes/inventory-value');
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Error al obtener valor del inventario' };
        }
    }
};

export default { salesService, reportsService };