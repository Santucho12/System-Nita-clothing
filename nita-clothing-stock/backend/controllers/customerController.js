const Customer = require('../models/Customer');

class CustomerController {
    static async createCustomer(req, res) {
        try {
            const customer = await Customer.create(req.body);
            res.status(201).json({ success: true, data: customer });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getAllCustomers(req, res) {
        try {
            const customers = await Customer.getAll();
            res.status(200).json({ success: true, data: customers });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getCustomerByEmail(req, res) {
        try {
            const { email } = req.params;
            const customer = await Customer.getByEmail(email);
            if (!customer) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
            res.status(200).json({ success: true, data: customer });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async updateCustomer(req, res) {
        try {
            const { email } = req.params;
            const customer = await Customer.update(email, req.body);
            res.status(200).json({ success: true, data: customer });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getPurchaseHistory(req, res) {
        try {
            const { email } = req.params;
            const history = await Customer.getPurchaseHistory(email);
            res.status(200).json({ success: true, data: history });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getStats(req, res) {
        try {
            const { email } = req.params;
            const stats = await Customer.getStats(email);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getSegmentation(req, res) {
        try {
            const data = await Customer.getSegmentation();
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = CustomerController;
