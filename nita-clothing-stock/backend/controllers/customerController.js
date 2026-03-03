const Customer = require('../models/Customer');

class CustomerController {
    static async createCustomer(req, res, next) {
        try {
            const customer = await Customer.create(req.body);
            res.status(201).json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    static async getAllCustomers(req, res, next) {
        try {
            const customers = await Customer.getAll();
            res.status(200).json({ success: true, data: customers });
        } catch (error) {
            next(error);
        }
    }

    static async getCustomerByEmail(req, res, next) {
        try {
            const { email } = req.params;
            const customer = await Customer.getByEmail(email);
            if (!customer) {
                const error = new Error('Cliente no encontrado');
                error.status = 404;
                throw error;
            }
            res.status(200).json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    static async updateCustomer(req, res, next) {
        try {
            const { email } = req.params;
            const customer = await Customer.update(email, req.body);
            res.status(200).json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    }

    static async getPurchaseHistory(req, res, next) {
        try {
            const { email } = req.params;
            const history = await Customer.getPurchaseHistory(email);
            res.status(200).json({ success: true, data: history });
        } catch (error) {
            next(error);
        }
    }

    static async getStats(req, res, next) {
        try {
            const { email } = req.params;
            const stats = await Customer.getStats(email);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    static async getSegmentation(req, res, next) {
        try {
            const data = await Customer.getSegmentation();
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    static async deleteCustomer(req, res, next) {
        try {
            const { email } = req.params;
            await Customer.delete(email);
            res.status(200).json({ success: true, message: 'Cliente eliminado correctamente (Soft Delete)' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CustomerController;
