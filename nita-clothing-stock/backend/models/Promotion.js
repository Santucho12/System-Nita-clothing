const db = require('../config/database');

const Promotion = {
  // Obtener todas las promociones
  async findAll(filters = {}) {
    let query = `
      SELECT p.*, 
        GROUP_CONCAT(DISTINCT pc.category_id) as category_ids,
        GROUP_CONCAT(DISTINCT pp.product_id) as product_ids
      FROM promotions p
      LEFT JOIN promotion_categories pc ON p.id = pc.promotion_id
      LEFT JOIN promotion_products pp ON p.id = pp.promotion_id
      WHERE p.deleted_at IS NULL
    `;
    const params = [];

    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }

    if (filters.type) {
      query += ' AND p.type = ?';
      params.push(filters.type);
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    return await db.all(query, params);
  },

  // Obtener una promoción por ID
  async findById(id) {
    const query = `
      SELECT p.*,
        GROUP_CONCAT(DISTINCT pc.category_id) as category_ids,
        GROUP_CONCAT(DISTINCT pp.product_id) as product_ids
      FROM promotions p
      LEFT JOIN promotion_categories pc ON p.id = pc.promotion_id
      LEFT JOIN promotion_products pp ON p.id = pp.promotion_id
      WHERE p.id = ? AND p.deleted_at IS NULL
      GROUP BY p.id
    `;
    const promotion = await db.get(query, [id]);

    if (promotion) {
      promotion.category_ids = promotion.category_ids ? promotion.category_ids.split(',').map(Number) : [];
      promotion.product_ids = promotion.product_ids ? promotion.product_ids.split(',').map(Number) : [];
    }

    return promotion;
  },

  // Obtener promociones activas
  async findActive() {
    const query = `
      SELECT p.*, 
        GROUP_CONCAT(DISTINCT pc.category_id) as category_ids,
        GROUP_CONCAT(DISTINCT pp.product_id) as product_ids
      FROM promotions p
      LEFT JOIN promotion_categories pc ON p.id = pc.promotion_id
      LEFT JOIN promotion_products pp ON p.id = pp.promotion_id
      WHERE p.status = 'activa'
      AND p.deleted_at IS NULL
      AND (p.start_date IS NULL OR p.start_date <= NOW())
      AND (p.end_date IS NULL OR p.end_date >= NOW())
      GROUP BY p.id
    `;
    return await db.all(query, []);
  },

  async create(data, connection = null) {
    const { name, description, type, discount_type, discount_value, applies_to, category_ids, product_ids, start_date, end_date, status } = data;
    const conn = connection || await db.beginTransaction();

    try {
      const query = `
        INSERT INTO promotions (name, description, type, discount_type, discount_value, applies_to, start_date, end_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await db.run(query, [name, description, type, discount_type, discount_value, applies_to, start_date, end_date, status || 'activa'], conn);
      const promotionId = result.insertId;

      // Asociar categorías
      if (category_ids && category_ids.length > 0) {
        for (const catId of category_ids) {
          await db.run('INSERT INTO promotion_categories (promotion_id, category_id) VALUES (?, ?)', [promotionId, catId], conn);
        }
      }

      // Asociar productos
      if (product_ids && product_ids.length > 0) {
        for (const prodId of product_ids) {
          await db.run('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)', [promotionId, prodId], conn);
        }
      }

      if (!connection) await db.commit(conn);
      return this.findById(promotionId);
    } catch (error) {
      if (!connection && conn) await db.rollback(conn);
      throw error;
    }
  },

  // Actualizar promoción
  async update(id, data, connection = null) {
    const { name, description, type, discount_type, discount_value, applies_to, category_ids, product_ids, start_date, end_date, status } = data;
    const conn = connection || await db.beginTransaction();

    try {
      const query = `
        UPDATE promotions 
        SET name = ?, description = ?, type = ?, discount_type = ?, discount_value = ?, 
            applies_to = ?, start_date = ?, end_date = ?, status = ?, updated_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;

      await db.run(query, [name, description, type, discount_type, discount_value, applies_to, start_date, end_date, status, id], conn);

      // Eliminar asociaciones antiguas
      await db.run('DELETE FROM promotion_categories WHERE promotion_id = ?', [id], conn);
      await db.run('DELETE FROM promotion_products WHERE promotion_id = ?', [id], conn);

      // Crear nuevas asociaciones
      if (category_ids && category_ids.length > 0) {
        for (const catId of category_ids) {
          await db.run('INSERT INTO promotion_categories (promotion_id, category_id) VALUES (?, ?)', [id, catId], conn);
        }
      }

      if (product_ids && product_ids.length > 0) {
        for (const prodId of product_ids) {
          await db.run('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)', [id, prodId], conn);
        }
      }

      if (!connection) await db.commit(conn);
      return this.findById(id);
    } catch (error) {
      if (!connection && conn) await db.rollback(conn);
      throw error;
    }
  },

  // Cambiar estado
  async updateStatus(id, status, connection = null) {
    const query = 'UPDATE promotions SET status = ?, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL';
    await db.run(query, [status, id], connection);
    return this.findById(id);
  },

  // Eliminar promoción (Soft Delete)
  async delete(id, connection = null) {
    await db.run('UPDATE promotions SET deleted_at = NOW(), status = "inactiva" WHERE id = ?', [id], connection);
    return { success: true };
  },

  // Obtener promociones aplicables a un producto
  async findForProduct(productId, categoryId) {
    const query = `
      SELECT DISTINCT p.*
      FROM promotions p
      LEFT JOIN promotion_products pp ON p.id = pp.promotion_id
      LEFT JOIN promotion_categories pc ON p.id = pc.promotion_id
      WHERE p.status = 'activa'
      AND p.deleted_at IS NULL
      AND (p.start_date IS NULL OR p.start_date <= NOW())
      AND (p.end_date IS NULL OR p.end_date >= NOW())
      AND (
        (p.applies_to = 'all') OR
        (p.applies_to = 'products' AND pp.product_id = ?) OR
        (p.applies_to = 'categories' AND pc.category_id = ?)
      )
      ORDER BY p.discount_value DESC
      LIMIT 1
    `;
    return await db.get(query, [productId, categoryId]);
  }
};

module.exports = Promotion;
