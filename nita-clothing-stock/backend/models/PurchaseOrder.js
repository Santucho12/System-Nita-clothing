const database = require('../config/database');

class PurchaseOrder {
  /**
   * Crear nueva orden de compra
   */
  static async create(data) {
    const {
      supplier_id,
      order_date,
      expected_delivery_date,
      items,
      subtotal,
      tax_amount,
      shipping_cost,
      total_amount,
      payment_status,
      payment_method,
      notes,
      created_by
    } = data;

    // Validar campos obligatorios
    if (!supplier_id || !items || items.length === 0) {
      throw new Error('supplier_id e items son obligatorios');
    }

    try {
      // Crear orden principal
      const result = await database.run(
        `INSERT INTO purchase_orders (
          supplier_id, order_date, expected_delivery_date, subtotal,
          tax_amount, shipping_cost, total_amount, status, payment_status,
          payment_method, notes, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NOW(), NOW())`,
        [
          supplier_id,
          order_date || new Date().toISOString().split('T')[0],
          expected_delivery_date || null,
          subtotal || 0,
          tax_amount || 0,
          shipping_cost || 0,
          total_amount || 0,
          payment_status || 'pending',
          payment_method || null,
          notes || null,
          created_by
        ]
      );

      const purchaseOrderId = result.insertId;

      // Insertar items
      for (const item of items) {
        await database.run(
          `INSERT INTO purchase_order_items (
            purchase_order_id, product_id, product_name, quantity,
            unit_cost, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [
            purchaseOrderId,
            item.product_id,
            item.product_name,
            item.quantity,
            item.unit_cost,
            item.subtotal || (item.quantity * item.unit_cost)
          ]
        );
      }

      return await this.getById(purchaseOrderId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todas las órdenes con filtros
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT po.*,
             s.name as supplier_name,
             u.nombre as created_by_name,
             COUNT(poi.id) as items_count
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN usuarios u ON po.created_by = u.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.supplier_id) {
      query += ' AND po.supplier_id = ?';
      params.push(filters.supplier_id);
    }

    if (filters.status) {
      query += ' AND po.status = ?';
      params.push(filters.status);
    }

    if (filters.payment_status) {
      query += ' AND po.payment_status = ?';
      params.push(filters.payment_status);
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
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    return await database.all(query, params);
  }

  /**
   * Obtener orden por ID con items
   */
  static async getById(id) {
    const order = await database.get(
      `SELECT po.*,
              s.name as supplier_name,
              s.email as supplier_email,
              s.phone as supplier_phone,
              u.nombre as created_by_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       LEFT JOIN usuarios u ON po.created_by = u.id
       WHERE po.id = ?`,
      [id]
    );

    if (!order) {
      return null;
    }

    // Obtener items
    const items = await database.all(
      `SELECT poi.*,
              p.codigo as product_code,
              p.stock as current_stock
       FROM purchase_order_items poi
       LEFT JOIN productos p ON poi.product_id = p.id
       WHERE poi.purchase_order_id = ?`,
      [id]
    );

    return {
      ...order,
      items
    };
  }

  /**
   * Actualizar estado de la orden
   */
  static async updateStatus(id, status, received_date = null) {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'received', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado inválido');
    }

    const updates = ['status = ?', 'updated_at = NOW()'];
    const params = [status];

    if (status === 'received' && received_date) {
      updates.push('received_date = ?');
      params.push(received_date);
    }

    params.push(id);

    await database.run(
      `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return await this.getById(id);
  }

  /**
   * Recibir orden de compra (incrementa stock automáticamente)
   */
  static async receiveOrder(id, userId) {
    const order = await this.getById(id);
    
    if (!order) {
      throw new Error('Orden de compra no encontrada');
    }

    if (order.status === 'received') {
      throw new Error('Esta orden ya fue recibida anteriormente');
    }

    if (order.status === 'cancelled') {
      throw new Error('No se puede recibir una orden cancelada');
    }

    try {
      const Product = require('./Product');
      const ActivityLog = require('./ActivityLog');
      const notificationHelper = require('../utils/notificationHelper');

      // Array para trackear cambios
      const stockUpdates = [];

      // Incrementar stock de cada producto
      for (const item of order.items) {
        const product = await Product.getById(item.product_id);
        
        if (!product) {
          console.warn(`Producto ${item.product_name} (ID: ${item.product_id}) no encontrado, omitiendo...`);
          continue;
        }

        const oldStock = product.stock_quantity || 0;
        const newStock = oldStock + item.quantity;
        const oldCost = product.cost_price || 0;
        const newCost = item.unit_cost;

        // Actualizar stock y costo usando database directamente
        await database.run(
          `UPDATE products SET stock_quantity = ?, cost_price = ?, updated_at = ? WHERE id = ?`,
          [newStock, newCost, new Date(), item.product_id]
        );

        // Registrar en activity log
        await ActivityLog.create({
          user_id: userId,
          action: 'receive_purchase_order',
          table_name: 'products',
          record_id: item.product_id,
          old_value: JSON.stringify({ 
            stock: oldStock, 
            cost: oldCost 
          }),
          new_value: JSON.stringify({ 
            stock: newStock, 
            cost: newCost,
            purchase_order_id: id,
            quantity_added: item.quantity
          }),
          ip_address: null
        });

        stockUpdates.push({
          product_id: item.product_id,
          product_name: item.product_name,
          old_stock: oldStock,
          new_stock: newStock,
          quantity_added: item.quantity
        });

        // Notificar si el producto estaba sin stock o bajo
        if (oldStock === 0 || (product.min_stock && oldStock < product.min_stock)) {
          notificationHelper.notifySystemAlert(
            '📦 Stock Reabastecido',
            `${item.product_name}: stock actualizado de ${oldStock} a ${newStock} unidades`
          );
        }
      }

      // Actualizar estado de la orden a "received"
      await database.run(
        `UPDATE purchase_orders SET status = 'received', received_date = NOW(), updated_at = NOW() WHERE id = ?`,
        [id]
      );

      // Registrar recepción de orden en activity log
      await ActivityLog.create({
        user_id: userId,
        action: 'receive_purchase_order',
        table_name: 'purchase_orders',
        record_id: id,
        old_value: JSON.stringify({ status: order.status }),
        new_value: JSON.stringify({ 
          status: 'received',
          received_date: new Date().toISOString(),
          stock_updates: stockUpdates
        }),
        ip_address: null
      });

      // Notificar orden recibida
      notificationHelper.notifyOrderReceived({
        id: order.id,
        order_number: `OC-${order.id}`,
        supplier_name: order.supplier_name,
        total_amount: order.total_amount,
        items_count: order.items.length
      });

      return {
        success: true,
        message: `Orden recibida exitosamente. ${stockUpdates.length} producto(s) actualizado(s).`,
        order: await this.getById(id),
        stock_updates: stockUpdates
      };

    } catch (error) {
      console.error('Error recibiendo orden:', error);
      throw new Error(`Error al recibir la orden: ${error.message}`);
    }
  }

  /**
   * Actualizar estado de pago
   */
  static async updatePaymentStatus(id, payment_status, payment_date = null) {
    const validStatuses = ['pending', 'partial', 'paid', 'overdue'];
    if (!validStatuses.includes(payment_status)) {
      throw new Error('Estado de pago inválido');
    }

    const updates = ['payment_status = ?', 'updated_at = NOW()'];
    const params = [payment_status];

    if (payment_status === 'paid' && payment_date) {
      updates.push('payment_date = ?');
      params.push(payment_date);
    }

    params.push(id);

    await database.run(
      `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return await this.getById(id);
  }

  /**
   * Actualizar datos generales
   */
  static async update(id, data) {
    const allowedFields = [
      'expected_delivery_date', 'subtotal', 'tax_amount',
      'shipping_cost', 'total_amount', 'payment_method', 'notes'
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

    await database.run(
      `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return await this.getById(id);
  }

  /**
   * Eliminar orden (solo si está en pending)
   */
  static async delete(id) {
    const order = await this.getById(id);
    
    if (!order) {
      throw new Error('Orden no encontrada');
    }

    if (order.status !== 'pending') {
      throw new Error('Solo se pueden eliminar órdenes pendientes');
    }

    await database.run('DELETE FROM purchase_orders WHERE id = ?', [id]);
    return true;
  }

  /**
   * Obtener estadísticas de órdenes
   */
  static async getStats(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as avg_order_value,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received_count,
        SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_payments,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount
      FROM purchase_orders
      WHERE 1=1
    `;
    const params = [];

    if (filters.start_date) {
      query += ' AND DATE(order_date) >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND DATE(order_date) <= ?';
      params.push(filters.end_date);
    }

    return await database.get(query, params);
  }

  /**
   * Obtener órdenes con pagos pendientes
   */
  static async getPendingPayments() {
    return await database.all(
      `SELECT po.*,
              s.name as supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.payment_status IN ('pending', 'partial', 'overdue')
       ORDER BY po.order_date ASC`
    );
  }
}

module.exports = PurchaseOrder;
