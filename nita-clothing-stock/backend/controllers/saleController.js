const Sale = require('../models/Sale');

class SaleController {
    static async createSale(req, res) {
        try {
            const { product_id, quantity, price_per_unit, customer_name, payment_method } = req.body;
            const errors = [];
            if (!product_id) errors.push('El ID del producto es requerido');
            if (!quantity || quantity <= 0) errors.push('La cantidad debe ser mayor a 0');
            if (!price_per_unit || price_per_unit <= 0) errors.push('El precio por unidad debe ser mayor a 0');
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de entrada inválidos',
                    errors: errors
                });
            }
            const total_amount = parseFloat(price_per_unit) * parseInt(quantity);
            const saleData = {
                product_id: parseInt(product_id),
                quantity: parseInt(quantity),
                price_per_unit: parseFloat(price_per_unit),
                total_amount: total_amount,
                customer_name: customer_name || null,
                payment_method: payment_method || 'efectivo'
            };
            const newSale = await Sale.create(saleData);
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
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    static async getCurrentMonthSales(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    static async getSalesByDateRange(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    static async deleteSale(req, res) {
        // Implementación básica de ejemplo
        res.status(501).json({ success: false, message: 'No implementado' });
    }

    // ...otros métodos (getAllSales, getCurrentMonthSales, getSalesByDateRange, deleteSale)...
}

module.exports = SaleController;
