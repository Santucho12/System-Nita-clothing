const database = require('../config/database');
const Product = require('./Product');

class ExchangeReturn {
  /**
   * Crear cambio o devolución con items parciales y restauración de stock
   * @param {Object} data - Datos del cambio/devolución
   * @param {string} data.type - 'exchange' o 'return'
   * @param {number} data.original_sale_id - ID de la venta original
   * @param {string} data.customer_name - Nombre del cliente
   * @param {string} data.customer_email - Email del cliente
   * @param {string} data.customer_phone - Teléfono del cliente
   * @param {Array} data.items - Items a cambiar/devolver [{product_id, quantity, reason, reason_notes, new_product_id, new_quantity}]
   * @param {string} data.status - 'pending', 'approved', 'rejected', 'completed'
   * @param {number} data.refund_amount - Monto a reembolsar
   * @param {string} data.refund_method - Método de reembolso
   * @param {string} data.notes - Notas adicionales
   * @param {number} data.processed_by - ID del usuario que procesa
   * @returns {Promise<Object>} Cambio/devolución creado con items
   */
  static async create(data) {
    const {
      type,
      original_sale_id,
      customer_name,
      customer_email,
      customer_phone,
      items,
      status = 'pending',
      refund_amount = 0,
      refund_method = null,
      notes = '',
      processed_by
    } = data;

    // Validar que existan items
    if (!items || items.length === 0) {
      throw new Error('Debe incluir al menos un item para el cambio/devolución');
    }

    // Validar tipo
    if (!['exchange', 'return'].includes(type)) {
      throw new Error('Tipo debe ser "exchange" o "return"');
    }

    try {
      // Crear registro principal
      const result = await database.run(
        `INSERT INTO exchanges_returns (
          type, original_sale_id, customer_name, customer_email, customer_phone,
          status, refund_amount, refund_method, notes, processed_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [type, original_sale_id, customer_name, customer_email, customer_phone, 
         status, refund_amount, refund_method, notes, processed_by]
      );

      const exchangeReturnId = result.insertId;

      // Insertar items
      for (const item of items) {
        await database.run(
          `INSERT INTO exchange_return_items (
            exchange_return_id, product_id, quantity, reason, reason_notes,
            new_product_id, new_quantity, unit_price, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            exchangeReturnId,
            item.product_id,
            item.quantity,
            item.reason,
            item.reason_notes || '',
            item.new_product_id || null,
            item.new_quantity || 0,
            item.unit_price || 0,
            item.subtotal || 0
          ]
        );

        // Si está aprobado, restaurar/ajustar stock automáticamente
        if (status === 'approved' || status === 'completed') {
          // Restaurar stock del producto devuelto
          const product = await Product.findById(item.product_id);
          if (product) {
            await Product.update(item.product_id, {
              stock: product.stock + item.quantity
            });
          }

          // Si es cambio, descontar stock del nuevo producto
          if (type === 'exchange' && item.new_product_id) {
            const newProduct = await Product.findById(item.new_product_id);
            if (newProduct) {
              if (newProduct.stock < item.new_quantity) {
                throw new Error(`Stock insuficiente para producto ${newProduct.name}`);
              }
              await Product.update(item.new_product_id, {
                stock: newProduct.stock - item.new_quantity
              });
            }
          }
        }
      }

      return await this.getById(exchangeReturnId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener cambio/devolución por ID con items
   */
  static async getById(id) {
    const exchangeReturn = await database.get(
      `SELECT er.*, u.nombre as processed_by_name
       FROM exchanges_returns er
       LEFT JOIN usuarios u ON er.processed_by = u.id
       WHERE er.id = ?`,
      [id]
    );

    if (!exchangeReturn) {
      return null;
    }

    // Obtener items con detalles de productos
    const items = await database.all(
      `SELECT eri.*, 
              p.nombre as product_name, p.codigo as product_code,
              np.nombre as new_product_name, np.codigo as new_product_code
       FROM exchange_return_items eri
       LEFT JOIN productos p ON eri.product_id = p.id
       LEFT JOIN productos np ON eri.new_product_id = np.id
       WHERE eri.exchange_return_id = ?`,
      [id]
    );

    return {
      ...exchangeReturn,
      items
    };
  }

  /**
   * Obtener todos con filtros
   */
  static async getAll(filters = {}) {
    let query = `
      SELECT er.*, u.nombre as processed_by_name,
             COUNT(eri.id) as items_count
      FROM exchanges_returns er
      LEFT JOIN usuarios u ON er.processed_by = u.id
      LEFT JOIN exchange_return_items eri ON er.id = eri.exchange_return_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.type) {
      query += ' AND er.type = ?';
      params.push(filters.type);
    }

    if (filters.status) {
      query += ' AND er.status = ?';
      params.push(filters.status);
    }

    if (filters.customer_email) {
      query += ' AND er.customer_email LIKE ?';
      params.push(`%${filters.customer_email}%`);
    }

    if (filters.customer_name) {
      query += ' AND er.customer_name LIKE ?';
      params.push(`%${filters.customer_name}%`);
    }

    if (filters.original_sale_id) {
      query += ' AND er.original_sale_id = ?';
      params.push(filters.original_sale_id);
    }

    if (filters.start_date) {
      query += ' AND DATE(er.created_at) >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND DATE(er.created_at) <= ?';
      params.push(filters.end_date);
    }

    query += ' GROUP BY er.id ORDER BY er.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    return await database.all(query, params);
  }

  /**
   * Actualizar estado con workflow de aprobación
   */
  static async updateStatus(id, status, processed_by, approval_notes = '') {
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado inválido');
    }

    const exchangeReturn = await this.getById(id);
    if (!exchangeReturn) {
      throw new Error('Cambio/devolución no encontrado');
    }

    try {
      // Actualizar estado
      await database.run(
        `UPDATE exchanges_returns 
         SET status = ?, processed_by = ?, processed_date = NOW(), 
             approval_notes = ?
         WHERE id = ?`,
        [status, processed_by, approval_notes, id]
      );

      // Si se aprueba, ajustar stock
      if (status === 'approved' && exchangeReturn.status === 'pending') {
        for (const item of exchangeReturn.items) {
          // Restaurar stock del producto devuelto
          const product = await Product.findById(item.product_id);
          if (product) {
            await Product.update(item.product_id, {
              stock: product.stock + item.quantity
            });
          }

          // Si es cambio, descontar stock del nuevo producto
          if (exchangeReturn.type === 'exchange' && item.new_product_id) {
            const newProduct = await Product.findById(item.new_product_id);
            if (newProduct) {
              if (newProduct.stock < item.new_quantity) {
                throw new Error(`Stock insuficiente para producto ${newProduct.name}`);
              }
              await Product.update(item.new_product_id, {
                stock: newProduct.stock - item.new_quantity
              });
            }
          }
        }
      }

      // Si se rechaza después de aprobar, revertir stock
      if (status === 'rejected' && exchangeReturn.status === 'approved') {
        for (const item of exchangeReturn.items) {
          // Revertir stock del producto devuelto
          const product = await Product.findById(item.product_id);
          if (product) {
            await Product.update(item.product_id, {
              stock: product.stock - item.quantity
            });
          }

          // Si es cambio, restaurar stock del nuevo producto
          if (exchangeReturn.type === 'exchange' && item.new_product_id) {
            const newProduct = await Product.findById(item.new_product_id);
            if (newProduct) {
              await Product.update(item.new_product_id, {
                stock: newProduct.stock + item.new_quantity
              });
            }
          }
        }
      }

      return await this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar datos generales
   */
  static async update(id, data) {
    const allowedFields = [
      'customer_name', 'customer_email', 'customer_phone',
      'refund_amount', 'refund_method', 'notes'
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

    params.push(id);

    await database.run(
      `UPDATE exchanges_returns SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return await this.getById(id);
  }

  /**
   * Eliminar (soft delete)
   */
  static async delete(id) {
    const exchangeReturn = await this.getById(id);
    if (!exchangeReturn) {
      throw new Error('Cambio/devolución no encontrado');
    }

    // Solo se puede eliminar si está en estado pending o rejected
    if (!['pending', 'rejected', 'cancelled'].includes(exchangeReturn.status)) {
      throw new Error('Solo se pueden eliminar cambios/devoluciones pendientes, rechazados o cancelados');
    }

    await database.run('DELETE FROM exchanges_returns WHERE id = ?', [id]);
    return true;
  }

  /**
   * Obtener por venta original
   */
  static async getByOriginalSale(saleId) {
    return await this.getAll({ original_sale_id: saleId });
  }

  /**
   * Obtener estadísticas
   */
  static async getStats(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN type = 'return' THEN 1 ELSE 0 END) as returns_count,
        SUM(CASE WHEN type = 'exchange' THEN 1 ELSE 0 END) as exchanges_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(refund_amount) as total_refunded,
        AVG(refund_amount) as avg_refund
      FROM exchanges_returns
      WHERE 1=1
    `;
    const params = [];

    if (filters.start_date) {
      query += ' AND DATE(created_at) >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND DATE(created_at) <= ?';
      params.push(filters.end_date);
    }

    return await database.get(query, params);
  }

  /**
   * Obtener razones más comunes
   */
  static async getTopReasons(limit = 10) {
    return await database.all(
      `SELECT reason, COUNT(*) as count
       FROM exchange_return_items
       GROUP BY reason
       ORDER BY count DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Obtener productos más devueltos
   */
  static async getTopReturnedProducts(limit = 10) {
    return await database.all(
      `SELECT p.id, p.nombre, p.codigo, 
              SUM(eri.quantity) as total_returned,
              COUNT(DISTINCT eri.exchange_return_id) as times_returned
       FROM exchange_return_items eri
       JOIN productos p ON eri.product_id = p.id
       GROUP BY p.id
       ORDER BY total_returned DESC
       LIMIT ?`,
      [limit]
    );
  }
}

module.exports = ExchangeReturn;
