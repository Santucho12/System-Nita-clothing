const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const notificationHelper = require('../utils/notificationHelper');

class SaleController {
    // Ventas del día
    static async getSalesOfDay(req, res, next) {
        try {
            const stats = await Sale.getSalesOfDay();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    // Ventas del mes
    static async getSalesOfMonth(req, res, next) {
        try {
            const stats = await Sale.getSalesOfMonth();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    // Ventas del año
    static async getSalesOfYear(req, res, next) {
        try {
            const stats = await Sale.getSalesOfYear();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    // Productos más vendidos (parámetro limit y days opcional)
    static async getTopSellingProducts(req, res, next) {
        try {
            const { limit = 10, days = 30 } = req.query;
            const products = await Sale.getTopSellingProducts({ limit: parseInt(limit), days: parseInt(days) });
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    // Mejores días del mes (ventas agrupadas por día)
    static async getBestDaysOfMonth(req, res, next) {
        try {
            const { year, month } = req.query;
            if (!year || !month) {
                const error = new Error('Debe enviar year y month');
                error.status = 400;
                throw error;
            }
            const days = await Sale.getBestDaysOfMonth(year, month);
            res.status(200).json({ success: true, data: days });
        } catch (error) {
            next(error);
        }
    }

    // Historial de ventas con filtros avanzados
    static async getSalesHistory(req, res, next) {
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
            const filters = {};
            if (start_date) filters.start_date = start_date;
            if (end_date) filters.end_date = end_date;
            if (payment_method) filters.payment_method = payment_method;
            if (sale_number) filters.sale_number = sale_number;
            if (customer_email) filters.customer_email = customer_email;
            if (req.query.customer_name) filters.customer_name = req.query.customer_name;
            filters.page = parseInt(page) || 1;
            filters.page_size = parseInt(page_size) || 20;
            const result = await Sale.getSalesHistory(filters);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    }

    // Ventas del mes actual
    static async getCurrentMonthSales(req, res, next) {
        try {
            const sales = await Sale.getSalesOfMonth();
            res.status(200).json({ success: true, data: sales });
        } catch (error) {
            next(error);
        }
    }

    // Ventas por rango de fechas
    static async getSalesByDateRange(req, res, next) {
        try {
            const { start_date, end_date } = req.query;
            if (!start_date || !end_date) {
                const error = new Error('Debe enviar start_date y end_date (YYYY-MM-DD)');
                error.status = 400;
                throw error;
            }
            const sales = await Sale.getSalesByDateRange(start_date, end_date);
            res.status(200).json({ success: true, data: sales });
        } catch (error) {
            next(error);
        }
    }

    static async createSale(req, res, next) {
        try {
            const { items, customer_name, customer_email, payment_method, discount_percent, discount_amount } = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                const error = new Error('Debe enviar al menos un item de venta');
                error.status = 400;
                throw error;
            }
            let subtotal = 0;
            for (const item of items) {
                if (!item.product_id || !item.quantity || item.quantity <= 0 || !item.unit_price || item.unit_price <= 0) {
                    const error = new Error('Datos de items inválidos');
                    error.status = 400;
                    throw error;
                }
                subtotal += (parseFloat(item.unit_price) * parseInt(item.quantity));
            }

            // Validar descuentos
            if (discount_percent && (discount_percent < 0 || discount_percent > 100)) {
                const error = new Error('El porcentaje de descuento debe estar entre 0 y 100');
                error.status = 400;
                throw error;
            }
            if (discount_amount && (discount_amount < 0 || discount_amount > subtotal)) {
                const error = new Error('El monto de descuento no puede ser negativo ni mayor al subtotal');
                error.status = 400;
                throw error;
            }

            let total = subtotal;
            if (discount_percent && discount_percent > 0) total -= (total * (discount_percent / 100));
            if (discount_amount && discount_amount > 0) total -= discount_amount;

            total = Math.max(0, total);

            const saleData = {
                subtotal,
                discount_percent: discount_percent || 0,
                discount_amount: discount_amount || 0,
                total,
                customer_name: customer_name || null,
                customer_email: customer_email || null,
                payment_method: payment_method || 'efectivo',
            };

            const newSale = await Sale.createWithItems(saleData, items, customer_email);
            notificationHelper.notifyNewSale(newSale);
            res.status(201).json({
                success: true,
                message: 'Venta registrada exitosamente',
                data: newSale
            });
        } catch (error) {
            if (error.message && (error.message.includes('Stock insuficiente') || error.message.includes('no existe'))) {
                error.status = 400;
            }
            next(error);
        }
    }

    static async getAllSales(req, res, next) {
        try {
            const sales = await Sale.getAll();
            res.status(200).json({ success: true, data: sales });
        } catch (error) {
            next(error);
        }
    }

    static async getSaleById(req, res, next) {
        try {
            const { id } = req.params;
            const sale = await Sale.getById(id);
            if (!sale) {
                const error = new Error('Venta no encontrada');
                error.status = 404;
                throw error;
            }
            res.status(200).json({ success: true, data: sale });
        } catch (error) {
            next(error);
        }
    }

    static async deleteSale(req, res, next) {
        try {
            const { id } = req.params;
            await Sale.delete(id);
            res.status(200).json({ success: true, message: 'Venta cancelada y stock restaurado' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SaleController;
