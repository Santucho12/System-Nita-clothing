const database = require('../config/database');

class Customer {
    // Crear cliente
    static async create({ email, name, phone, birth_date, address, city, province, postal_code, notes }, connection = null) {
        const sql = `INSERT INTO customers (email, name, phone, birth_date, address, city, province, postal_code, notes, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        await database.run(sql, [email, name, phone, birth_date, address, city, province, postal_code, notes], connection);
        return await Customer.getByEmail(email, connection);
    }

    // Obtener cliente por email
    static async getByEmail(email, connection = null) {
        const sql = `SELECT * FROM customers WHERE email = ? AND deleted_at IS NULL`;
        return await database.get(sql, [email], connection);
    }

    // Listar clientes con estadísticas básicas
    static async getAll(connection = null) {
        const sql = `
            SELECT c.*, 
                   COUNT(s.id) as purchase_count, 
                   COALESCE(SUM(s.total), 0) as total_spent
            FROM customers c
            LEFT JOIN sales s ON c.email = s.customer_email
            WHERE c.deleted_at IS NULL
            GROUP BY c.email
            ORDER BY c.created_at DESC
        `;
        return await database.all(sql, [], connection);
    }

    // Actualizar cliente
    static async update(email, data, connection = null) {
        // Whitelist de columnas permitidas para prevenir SQL injection
        const ALLOWED_FIELDS = [
            'name', 'phone', 'birth_date', 'address', 'city',
            'province', 'state', 'postal_code', 'notes', 'segment'
        ];

        const fields = [];
        const values = [];
        for (const key in data) {
            if (!ALLOWED_FIELDS.includes(key)) continue;
            fields.push(`\`${key}\` = ?`);
            values.push(data[key]);
        }
        if (fields.length === 0) return await Customer.getByEmail(email, connection);
        values.push(email);
        const sql = `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE email = ? AND deleted_at IS NULL`;
        await database.run(sql, values, connection);
        return await Customer.getByEmail(email, connection);
    }

    // Historial de compras
    static async getPurchaseHistory(email, connection = null) {
        const sql = `SELECT s.*, s.created_at as sale_date, (
            SELECT GROUP_CONCAT(CONCAT(product_name, ' x', quantity) SEPARATOR ', ')
            FROM sale_items si WHERE si.sale_id = s.id
        ) as items
        FROM sales s WHERE s.customer_email = ? ORDER BY s.created_at DESC`;
        return await database.all(sql, [email], connection);
    }

    // Estadísticas del cliente
    static async getStats(email, connection = null) {
        const sql = `SELECT COUNT(*) as purchase_count, SUM(total) as total_spent, MAX(created_at) as last_purchase
                     FROM sales WHERE customer_email = ?`;
        return await database.get(sql, [email], connection);
    }

    // Segmentación de clientes
    static async getSegmentation(connection = null) {
        const sql = `SELECT c.email, c.name, COUNT(s.id) as purchase_count, SUM(s.total) as total_spent,
                            MAX(s.created_at) as last_purchase,
                            CASE WHEN MAX(s.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'frecuente'
                                 WHEN MAX(s.created_at) < DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'inactivo'
                                 ELSE 'normal' END as segment
                      FROM customers c
                      LEFT JOIN sales s ON c.email = s.customer_email
                      WHERE c.deleted_at IS NULL
                      GROUP BY c.email, c.name`;
        return await database.all(sql, [], connection);
    }

    // Eliminar cliente (Soft Delete)
    static async delete(email, connection = null) {
        // Verificar si tiene ventas asociadas
        const sales = await database.get(
            'SELECT COUNT(*) as count FROM sales WHERE customer_email = ?',
            [email],
            connection
        );

        if (sales.count > 0) {
            throw new Error('No se puede eliminar el cliente porque tiene ventas asociadas');
        }

        const sql = `UPDATE customers SET deleted_at = NOW() WHERE email = ?`;
        await database.run(sql, [email], connection);
        return true;
    }
}

module.exports = Customer;
