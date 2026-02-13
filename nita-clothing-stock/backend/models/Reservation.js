const database = require('../config/database');

class Reservation {
    // Crear reserva
    static async create(data) {
        const { customer_email, customer_name, customer_phone, items, deposit_amount, expiration_date, payment_method, notes } = data;
        
        try {
            // Validar stock de productos
            for (const item of items) {
                const product = await database.get('SELECT id, name, quantity FROM products WHERE id = ?', [item.product_id]);
                if (!product) throw new Error(`Producto con ID ${item.product_id} no existe`);
                if (product.quantity < item.quantity) {
                    throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.quantity}, Solicitado: ${item.quantity}`);
                }
            }

            
            try {
                // Calcular total
                let total_amount = 0;
                for (const item of items) {
                    const product = await database.get('SELECT sale_price FROM products WHERE id = ?', [item.product_id]);
                    total_amount += product.sale_price * item.quantity;
                }
                
                const remaining_amount = total_amount - deposit_amount;
                
                // Generar número de reserva
                const count = await database.get('SELECT COUNT(*) as count FROM reservations');
                const reservation_number = `RES-${String(count.count + 1).padStart(6, '0')}`;
                
                // Crear reserva
                const sql = `INSERT INTO reservations (reservation_number, customer_email, customer_name, customer_phone, 
                             total_amount, deposit_amount, remaining_amount, expiration_date, status, payment_method, notes, 
                             reservation_date, created_at, updated_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activa', ?, ?, datetime('now'), datetime('now'), datetime('now'))`;
                
                const result = await database.run(sql, [
                    reservation_number, customer_email, customer_name, customer_phone,
                    total_amount, deposit_amount, remaining_amount, expiration_date, payment_method, notes
                ]);
                
                const reservation_id = result.lastID;
                
                // Crear items y descontar stock
                for (const item of items) {
                    const product = await database.get('SELECT * FROM products WHERE id = ?', [item.product_id]);
                    
                    await database.run(`INSERT INTO reservation_items (reservation_id, product_id, product_name, 
                                        product_size, product_color, quantity, unit_price)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                        reservation_id, item.product_id, product.name, product.size, product.color, 
                        item.quantity, product.sale_price
                    ]);
                    
                    // Descontar stock
                    await database.run('UPDATE products SET quantity = quantity - ?, updated_at = datetime("now") WHERE id = ?', 
                                      [item.quantity, item.product_id]);
                }
                
                
                return { id: reservation_id, reservation_number, ...data };
            } catch (err) {
                throw err;
            }
        } catch (error) {
            throw new Error(`Error creando reserva: ${error.message}`);
        }
    }

    // Listar reservas
    static async getAll() {
        const sql = `SELECT r.*, (
            SELECT GROUP_CONCAT(product_name || ' x' || quantity, ', ')
            FROM reservation_items ri WHERE ri.reservation_id = r.id
        ) as items FROM reservations r ORDER BY r.reservation_date DESC`;
        return await database.all(sql);
    }

    // Obtener reserva por ID
    static async getById(id) {
        const sql = `SELECT * FROM reservations WHERE id = ?`;
        return await database.get(sql, [id]);
    }

    // Reservas activas
    static async getActive() {
        const sql = `SELECT r.*, (
            SELECT GROUP_CONCAT(product_name || ' x' || quantity, ', ')
            FROM reservation_items ri WHERE ri.reservation_id = r.id
        ) as items FROM reservations r WHERE r.status = 'activa' ORDER BY r.expiration_date ASC`;
        return await database.all(sql);
    }

    // Reservas próximas a vencer (48 horas)
    static async getExpiringSoon() {
        const sql = `SELECT r.*, (
            SELECT GROUP_CONCAT(product_name || ' x' || quantity, ', ')
            FROM reservation_items ri WHERE ri.reservation_id = r.id
        ) as items FROM reservations r 
        WHERE r.status = 'activa' AND r.expiration_date <= datetime('now', '+48 hours')
        ORDER BY r.expiration_date ASC`;
        return await database.all(sql);
    }

    // Completar reserva (generar venta)
    static async complete(id) {
        try {
            const reservation = await Reservation.getById(id);
            if (!reservation) throw new Error('Reserva no encontrada');
            if (reservation.status !== 'activa') throw new Error('La reserva no está activa');
            
            
            try {
                // Crear venta
                const saleSql = `INSERT INTO sales (sale_number, customer_email, subtotal, total, payment_method, 
                                 sale_date, status, created_at, updated_at)
                                 VALUES (?, ?, ?, ?, ?, datetime('now'), 'completada', datetime('now'), datetime('now'))`;
                
                const saleNumber = `V-${String(Date.now()).slice(-8)}`;
                const saleResult = await database.run(saleSql, [
                    saleNumber, reservation.customer_email, reservation.total_amount, 
                    reservation.total_amount, reservation.payment_method
                ]);
                
                const sale_id = saleResult.lastID;
                
                // Copiar items de reserva a venta
                const items = await database.all('SELECT * FROM reservation_items WHERE reservation_id = ?', [id]);
                for (const item of items) {
                    const product = await database.get('SELECT cost_price FROM products WHERE id = ?', [item.product_id]);
                    const profit = (item.unit_price - product.cost_price) * item.quantity;
                    
                    await database.run(`INSERT INTO sale_items (sale_id, product_id, product_name, product_size, 
                                        product_color, quantity, unit_price, unit_cost, subtotal, profit)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        sale_id, item.product_id, item.product_name, item.product_size, item.product_color,
                        item.quantity, item.unit_price, product.cost_price, item.unit_price * item.quantity, profit
                    ]);
                }
                
                // Actualizar reserva
                await database.run('UPDATE reservations SET status = "completada", updated_at = datetime("now") WHERE id = ?', [id]);
                
                return { sale_id, reservation_id: id };
            } catch (err) {
                throw err;
            }
        } catch (error) {
            throw new Error(`Error completando reserva: ${error.message}`);
        }
    }

    // Cancelar reserva (restaurar stock)
    static async cancel(id) {
        try {
            const reservation = await Reservation.getById(id);
            if (!reservation) throw new Error('Reserva no encontrada');
            
            
            try {
                // Restaurar stock
                const items = await database.all('SELECT * FROM reservation_items WHERE reservation_id = ?', [id]);
                for (const item of items) {
                    await database.run('UPDATE products SET quantity = quantity + ?, updated_at = datetime("now") WHERE id = ?',
                                      [item.quantity, item.product_id]);
                }
                
                // Actualizar reserva
                await database.run('UPDATE reservations SET status = "cancelada", updated_at = datetime("now") WHERE id = ?', [id]);
                
                return true;
            } catch (err) {
                throw err;
            }
        } catch (error) {
            throw new Error(`Error cancelando reserva: ${error.message}`);
        }
    }

    // Extender fecha de vencimiento
    static async extend(id, new_expiration_date) {
        const sql = `UPDATE reservations SET expiration_date = ?, updated_at = datetime('now') WHERE id = ?`;
        await database.run(sql, [new_expiration_date, id]);
        return await Reservation.getById(id);
    }
}

module.exports = Reservation;
