const database = require('../config/database');

class Customer {
    // Crear cliente
    static async create({ email, name, phone, birth_date, address, city, province, postal_code, notes }) {
        const sql = `INSERT INTO customers (email, name, phone, birth_date, address, city, province, postal_code, notes, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        await database.run(sql, [email, name, phone, birth_date, address, city, province, postal_code, notes]);
        return await Customer.getByEmail(email);
    }

    // Obtener cliente por email
    static async getByEmail(email) {
        const sql = `SELECT * FROM customers WHERE email = ?`;
        return await database.get(sql, [email]);
    }

    // Listar clientes
    static async getAll() {
        const sql = `SELECT * FROM customers ORDER BY created_at DESC`;
        return await database.all(sql);
    }

    // Actualizar cliente
    static async update(email, data) {
        const fields = [];
        const values = [];
        for (const key in data) {
            fields.push(`${key} = ?`);
            values.push(data[key]);
        }
        values.push(email);
        const sql = `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE email = ?`;
        await database.run(sql, values);
        return await Customer.getByEmail(email);
    }

    // Historial de compras
    static async getPurchaseHistory(email) {
        const sql = `SELECT s.*, (
            SELECT GROUP_CONCAT(CONCAT(product_name, ' x', quantity) SEPARATOR ', ')
            FROM sale_items si WHERE si.sale_id = s.id
        ) as items
        FROM sales s WHERE s.customer_email = ? ORDER BY s.created_at DESC`;
        return await database.all(sql, [email]);
    }

    // Estadísticas del cliente
    static async getStats(email) {
        const sql = `SELECT COUNT(*) as purchase_count, SUM(total) as total_spent, MAX(created_at) as last_purchase
                     FROM sales WHERE customer_email = ?`;
        return await database.get(sql, [email]);
    }

    // Segmentación de clientes
    static async getSegmentation() {
        const sql = `SELECT c.email, c.name, COUNT(s.id) as purchase_count, SUM(s.total) as total_spent,
                            MAX(s.created_at) as last_purchase,
                            CASE WHEN MAX(s.created_at) >= date('now', '-30 days') THEN 'frecuente'
                                 WHEN MAX(s.created_at) < date('now', '-90 days') THEN 'inactivo'
                                 ELSE 'normal' END as segment
                     FROM customers c
                     LEFT JOIN sales s ON c.email = s.customer_email
                     GROUP BY c.email, c.name`;
        return await database.all(sql);
    }
}

module.exports = Customer;
