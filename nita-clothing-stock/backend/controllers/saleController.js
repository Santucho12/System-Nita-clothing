const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const notificationHelper = require('../utils/notificationHelper');

class SaleController {

    // Ventas del día
    static async getSalesOfDay(req, res) {
        try {
            const stats = await Sale.getSalesOfDay();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Ventas del mes
    static async getSalesOfMonth(req, res) {
        try {
            const stats = await Sale.getSalesOfMonth();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Ventas del año
    static async getSalesOfYear(req, res) {
        try {
            const stats = await Sale.getSalesOfYear();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Productos más vendidos (parámetro limit y days opcional)
    static async getTopSellingProducts(req, res) {
        try {
            const { limit = 10, days = 30 } = req.query;
            const products = await Sale.getTopSellingProducts({ limit: parseInt(limit), days: parseInt(days) });
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Mejores días del mes (ventas agrupadas por día)
    static async getBestDaysOfMonth(req, res) {
        try {
            const { year, month } = req.query;
            if (!year || !month) {
                return res.status(400).json({ success: false, message: 'Debe enviar year y month' });
            }
            const days = await Sale.getBestDaysOfMonth(year, month);
            res.status(200).json({ success: true, data: days });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Historial de ventas con filtros avanzados
    static async getSalesHistory(req, res) {
        try {
            const {
                start_date,
                end_date,
                month,
                year,
                payment_method,
                status,
                seller_id,
                customer_email,
                sale_number,
                page = 1,
                page_size = 20
            } = req.query;
            const filters = {
                start_date,
                end_date,
                month,
                year,
                payment_method,
                status,
                seller_id,
                customer_email,
                sale_number,
                page: parseInt(page),
                page_size: parseInt(page_size)
            };
            const result = await Sale.getSalesHistory(filters);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

        // Ventas del mes actual
        static async getCurrentMonthSales(req, res) {
            try {
                const sales = await Sale.getSalesOfMonth();
                res.status(200).json({ success: true, data: sales });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        }

        // Ventas por rango de fechas
        static async getSalesByDateRange(req, res) {
            try {
                const { start_date, end_date } = req.query;
                if (!start_date || !end_date) {
                    return res.status(400).json({ success: false, message: 'Debe enviar start_date y end_date (YYYY-MM-DD)' });
                }
                const sales = await Sale.getSalesByDateRange(start_date, end_date);
                res.status(200).json({ success: true, data: sales });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    static async createSale(req, res) {
        try {
            // Permitir ventas con múltiples items (carrito)
            const { items, customer_name, payment_method, discount_percent, discount_amount } = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe enviar al menos un item de venta',
                });
            }
            // Validar items
            const errors = [];
            let subtotal = 0;
            for (const item of items) {
                if (!item.product_id) errors.push('Falta product_id en un item');
                if (!item.quantity || item.quantity <= 0) errors.push('Cantidad inválida en un item');
                if (!item.unit_price || item.unit_price <= 0) errors.push('Precio inválido en un item');
                subtotal += (parseFloat(item.unit_price) * parseInt(item.quantity));
            }
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de items inválidos',
                    errors
                });
            }
            // Calcular descuentos
            let total = subtotal;
            if (discount_percent && discount_percent > 0) {
                total = total - (total * (discount_percent / 100));
            }
            if (discount_amount && discount_amount > 0) {
                total = total - discount_amount;
            }
            // Crear venta principal
            const saleData = {
                subtotal,
                discount_percent: discount_percent || 0,
                discount_amount: discount_amount || 0,
                total,
                customer_name: customer_name || null,
                payment_method: payment_method || 'efectivo',
            };
            // Usar método extendido en Sale para ventas con items
            const newSale = await Sale.createWithItems(saleData, items);
            
            // Notificar nueva venta en tiempo real
            notificationHelper.notifyNewSale(newSale);
            
            res.status(201).json({
                success: true,
                message: 'Venta registrada exitosamente',
                data: newSale
            });
        } catch (error) {
            if (error.message.includes('Stock insuficiente') || error.message.includes('no existe')) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                    error: error.message
                });
            }
        }
    }

    static async getAllSales(req, res) {
        try {
            const sales = await Sale.getAll();
            res.status(200).json({ success: true, data: sales });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getSaleById(req, res) {
        try {
            const { id } = req.params;
            const sale = await Sale.getById(id);
            if (!sale) return res.status(404).json({ success: false, message: 'Venta no encontrada' });
            res.status(200).json({ success: true, data: sale });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteSale(req, res) {
        try {
            const { id } = req.params;
            await Sale.delete(id);
            res.status(200).json({ success: true, message: 'Venta cancelada y stock restaurado' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // ...otros métodos (getCurrentMonthSales, getSalesByDateRange)...
}

module.exports = SaleController;
