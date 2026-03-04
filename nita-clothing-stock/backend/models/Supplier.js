const database = require('../config/database');

class Supplier {
  /**
   * Crear nuevo proveedor
   */
  static async create(data, connection = null) {
    const {
      name,
      phone,
      address,
      website,
      min_purchase,
      notes
    } = data;

    // Validar campos obligatorios
    if (!name) throw new Error('El nombre del proveedor es obligatorio');

    const sql = `INSERT INTO suppliers (
          name, phone, address, website, min_purchase, notes,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`;

    const params = [
      name,
      phone || null,
      address || null,
      website || null,
      min_purchase || null,
      notes || null
    ];

    const result = await database.run(sql, params, connection);
    return await this.getById(result.insertId, connection);
  }

  /**
   * Obtener todos los proveedores con filtros
   */
  static async getAll(filters = {}, connection = null) {
    let query = `
      SELECT s.*,
             COUNT(DISTINCT p.id) as products_count,
             COUNT(DISTINCT po.id) as orders_count,
             SUM(po.total_amount) as total_purchased
      FROM suppliers s
      LEFT JOIN productos p ON s.id = p.supplier_id AND p.deleted_at IS NULL
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


    query += ' GROUP BY s.id ORDER BY s.name ASC';

    if (filters.limit) {
      query += ` LIMIT ${parseInt(filters.limit)}`;
      if (filters.offset) {
        query += ` OFFSET ${parseInt(filters.offset)}`;
      }
    }

    return await database.all(query, params, connection);
  }

  /**
   * Obtener proveedor por ID
   */
  static async getById(id, connection = null) {
    const supplier = await database.get(
      `SELECT s.*,
              COUNT(DISTINCT p.id) as products_count,
              COUNT(DISTINCT po.id) as orders_count,
              SUM(po.total_amount) as total_purchased
       FROM suppliers s
       LEFT JOIN productos p ON s.id = p.supplier_id AND p.deleted_at IS NULL
       LEFT JOIN purchase_orders po ON s.id = po.supplier_id
       WHERE s.id = ?
       GROUP BY s.id`,
      [id],
      connection
    );

    return supplier || null;
  }

  /**
   * Actualizar proveedor
   */
  static async update(id, data, connection = null) {
    const allowedFields = [
      'name', 'phone', 'address', 'website', 'min_purchase', 'notes', 'status'
    ];

    const updates = [];
    const params = [];

    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) throw new Error('No hay campos para actualizar');

    updates.push('updated_at = NOW()');
    params.push(id);

    await database.run(
      `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`,
      params,
      connection
    );

    return await this.getById(id, connection);
  }

  /**
   * Eliminar proveedor (soft delete)
   */
  static async delete(id, connection = null) {
    // Verificar si tiene productos asociados
    const products = await database.get(
      'SELECT COUNT(*) as count FROM productos WHERE supplier_id = ? AND deleted_at IS NULL',
      [id],
      connection
    );

    if (products.count > 0) {
      throw new Error('No se puede eliminar el proveedor porque tiene productos asociados');
    }

    // Soft delete
    await database.run(
      'UPDATE suppliers SET status = ?, updated_at = NOW() WHERE id = ?',
      ['inactive', id],
      connection
    );

    return true;
  }

  /**
   * Obtener órdenes de compra de un proveedor
   */
  static async getPurchaseOrders(supplierId, filters = {}, connection = null) {
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

    if (filters.limit) query += ` LIMIT ${parseInt(filters.limit)}`;

    return await database.all(query, params, connection);
  }

  /**
   * Obtener productos de un proveedor
   */
  static async getProducts(supplierId, filters = {}, connection = null) {
    let query = `
      SELECT p.*
      FROM productos p
      WHERE p.supplier_id = ? AND p.deleted_at IS NULL
    `;
    const params = [supplierId];

    if (filters.status) {
      query += ' AND p.estado = ?';
      params.push(filters.status);
    }

    if (filters.name) {
      query += ' AND p.nombre LIKE ?';
      params.push(`%${filters.name}%`);
    }

    query += ' ORDER BY p.nombre ASC';

    if (filters.limit) query += ` LIMIT ${parseInt(filters.limit)}`;

    return await database.all(query, params, connection);
  }

  /**
   * Obtener estadísticas de un proveedor
   */
  static async getStats(supplierId, connection = null) {
    const stats = await database.get(
      `SELECT 
        COUNT(DISTINCT po.id) as total_orders,
        SUM(po.total_amount) as total_purchased,
        AVG(po.total_amount) as avg_order_value,
        SUM(CASE WHEN po.status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN po.status = 'received' THEN 1 ELSE 0 END) as received_orders,
        SUM(CASE WHEN po.payment_status = 'paid' THEN po.total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN po.payment_status = 'pending' THEN po.total_amount ELSE 0 END) as total_pending_payment,
        (SELECT COUNT(*) FROM productos WHERE supplier_id = ? AND deleted_at IS NULL) as products_count,
        (SELECT MAX(order_date) FROM purchase_orders WHERE supplier_id = ?) as last_order_date
       FROM purchase_orders po
       WHERE po.supplier_id = ?`,
      [supplierId, supplierId, supplierId],
      connection
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
  static async getTopSuppliers(limit = 10, connection = null) {
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
