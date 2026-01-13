const database = require('../config/database');

class Supplier {
  /**
   * Crear nuevo proveedor
   */
  static async create(data) {
    const {
      name,
      contact_name,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      country,
      website,
      tax_id,
      payment_terms,
      notes
    } = data;

    // Validar campos obligatorios
    if (!name) {
      throw new Error('El nombre del proveedor es obligatorio');
    }

    try {
      const result = await database.run(
        `INSERT INTO suppliers (
          name, contact_name, email, phone, address, city, state, 
          postal_code, country, website, tax_id, payment_terms, notes,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [
          name, contact_name || null, email || null, phone || null,
          address || null, city || null, state || null, postal_code || null,
          country || null, website || null, tax_id || null,
          payment_terms || 'net_30', notes || null
        ]
      );

      return await this.getById(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe un proveedor con ese email o tax_id');
      }
      throw error;
    }
  }

  /**
   * Obtener todos los proveedores con filtros
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT s.*,
             COUNT(DISTINCT p.id) as products_count,
             COUNT(DISTINCT po.id) as orders_count,
             SUM(po.total_amount) as total_purchased
      FROM suppliers s
      LEFT JOIN productos p ON s.id = p.supplier_id
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += ' AND s.status = ?';
      params.push(filters.status);
    }

    if (filters.name) {
      query += ' AND s.name LIKE ?';
      params.push(`%${filters.name}%`);
    }

    if (filters.email) {
      query += ' AND s.email LIKE ?';
      params.push(`%${filters.email}%`);
    }

    if (filters.city) {
      query += ' AND s.city LIKE ?';
      params.push(`%${filters.city}%`);
    }

    if (filters.country) {
      query += ' AND s.country = ?';
      params.push(filters.country);
    }

    query += ' GROUP BY s.id ORDER BY s.name ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    return await database.all(query, params);
  }

  /**
   * Obtener proveedor por ID
   */
  static async getById(id) {
    const supplier = await database.get(
      `SELECT s.*,
              COUNT(DISTINCT p.id) as products_count,
              COUNT(DISTINCT po.id) as orders_count,
              SUM(po.total_amount) as total_purchased
       FROM suppliers s
       LEFT JOIN productos p ON s.id = p.supplier_id
       LEFT JOIN purchase_orders po ON s.id = po.supplier_id
       WHERE s.id = ?
       GROUP BY s.id`,
      [id]
    );

    return supplier || null;
  }

  /**
   * Actualizar proveedor
   */
  static async update(id, data) {
    const allowedFields = [
      'name', 'contact_name', 'email', 'phone', 'address',
      'city', 'state', 'postal_code', 'country', 'website',
      'tax_id', 'payment_terms', 'notes', 'status'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    try {
      await database.run(
        `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      return await this.getById(id);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe un proveedor con ese email o tax_id');
      }
      throw error;
    }
  }

  /**
   * Eliminar proveedor (soft delete)
   */
  static async delete(id) {
    // Verificar si tiene productos asociados
    const products = await database.get(
      'SELECT COUNT(*) as count FROM productos WHERE supplier_id = ?',
      [id]
    );

    if (products.count > 0) {
      throw new Error('No se puede eliminar el proveedor porque tiene productos asociados');
    }

    // Soft delete
    await database.run(
      'UPDATE suppliers SET status = ?, updated_at = NOW() WHERE id = ?',
      ['inactive', id]
    );

    return true;
  }

  /**
   * Obtener órdenes de compra de un proveedor
   */
  static async getPurchaseOrders(supplierId, filters = {}) {
    let query = `
      SELECT po.*,
             COUNT(poi.id) as items_count
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE po.supplier_id = ?
    `;
    const params = [supplierId];

    if (filters.status) {
      query += ' AND po.status = ?';
      params.push(filters.status);
    }

    if (filters.start_date) {
      query += ' AND DATE(po.order_date) >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND DATE(po.order_date) <= ?';
      params.push(filters.end_date);
    }

    query += ' GROUP BY po.id ORDER BY po.order_date DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    return await database.all(query, params);
  }

  /**
   * Obtener productos de un proveedor
   */
  static async getProducts(supplierId, filters = {}) {
    let query = `
      SELECT p.*
      FROM productos p
      WHERE p.supplier_id = ?
    `;
    const params = [supplierId];

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.name) {
      query += ' AND p.nombre LIKE ?';
      params.push(`%${filters.name}%`);
    }

    query += ' ORDER BY p.nombre ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    return await database.all(query, params);
  }

  /**
   * Obtener estadísticas de un proveedor
   */
  static async getStats(supplierId) {
    const stats = await database.get(
      `SELECT 
        COUNT(DISTINCT po.id) as total_orders,
        SUM(po.total_amount) as total_purchased,
        AVG(po.total_amount) as avg_order_value,
        SUM(CASE WHEN po.status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN po.status = 'received' THEN 1 ELSE 0 END) as received_orders,
        SUM(CASE WHEN po.payment_status = 'paid' THEN po.total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN po.payment_status = 'pending' THEN po.total_amount ELSE 0 END) as total_pending_payment,
        (SELECT COUNT(*) FROM productos WHERE supplier_id = ?) as products_count,
        (SELECT MAX(order_date) FROM purchase_orders WHERE supplier_id = ?) as last_order_date
       FROM purchase_orders po
       WHERE po.supplier_id = ?`,
      [supplierId, supplierId, supplierId]
    );

    return stats || {
      total_orders: 0,
      total_purchased: 0,
      avg_order_value: 0,
      pending_orders: 0,
      received_orders: 0,
      total_paid: 0,
      total_pending_payment: 0,
      products_count: 0,
      last_order_date: null
    };
  }

  /**
   * Obtener mejores proveedores (por volumen de compra)
   */
  static async getTopSuppliers(limit = 10) {
    return await database.all(
      `SELECT s.*, 
              COUNT(DISTINCT po.id) as orders_count,
              SUM(po.total_amount) as total_purchased
       FROM suppliers s
       LEFT JOIN purchase_orders po ON s.id = po.supplier_id
       WHERE s.status = 'active'
       GROUP BY s.id
       ORDER BY total_purchased DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Obtener proveedores con pagos pendientes
   */
  static async getSuppliersWithPendingPayments() {
    return await database.all(
      `SELECT s.*,
              COUNT(po.id) as pending_orders_count,
              SUM(po.total_amount) as pending_amount
       FROM suppliers s
       JOIN purchase_orders po ON s.id = po.supplier_id
       WHERE po.payment_status = 'pending'
       GROUP BY s.id
       ORDER BY pending_amount DESC`
    );
  }
}

module.exports = Supplier;
