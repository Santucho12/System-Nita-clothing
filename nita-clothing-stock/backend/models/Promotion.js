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
      WHERE 1=1
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
      WHERE p.id = ?
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
      AND (p.start_date IS NULL OR p.start_date <= NOW())
      AND (p.end_date IS NULL OR p.end_date >= NOW())
      GROUP BY p.id
    `;
    return await db.all(query, []);
  },

  // Crear promoción
  async create(data) {
    const { name, description, type, discount_type, discount_value, applies_to, category_ids, product_ids, start_date, end_date, status } = data;
    
    const query = `
      INSERT INTO promotions (name, description, type, discount_type, discount_value, applies_to, start_date, end_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await db.run(query, [name, description, type, discount_type, discount_value, applies_to, start_date, end_date, status || 'activa']);
    const promotionId = result.lastID;

    // Asociar categorías
    if (category_ids && category_ids.length > 0) {
      for (const catId of category_ids) {
        await db.run('INSERT INTO promotion_categories (promotion_id, category_id) VALUES (?, ?)', [promotionId, catId]);
      }
    }

    // Asociar productos
    if (product_ids && product_ids.length > 0) {
      for (const prodId of product_ids) {
        await db.run('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)', [promotionId, prodId]);
      }
    }

    return this.findById(promotionId);
  },

  // Actualizar promoción
  async update(id, data) {
    const { name, description, type, discount_type, discount_value, applies_to, category_ids, product_ids, start_date, end_date, status } = data;
    
    const query = `
      UPDATE promotions 
      SET name = ?, description = ?, type = ?, discount_type = ?, discount_value = ?, 
          applies_to = ?, start_date = ?, end_date = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await db.run(query, [name, description, type, discount_type, discount_value, applies_to, start_date, end_date, status, id]);

    // Eliminar asociaciones antiguas
    await db.run('DELETE FROM promotion_categories WHERE promotion_id = ?', [id]);
    await db.run('DELETE FROM promotion_products WHERE promotion_id = ?', [id]);

    // Crear nuevas asociaciones
    if (category_ids && category_ids.length > 0) {
      for (const catId of category_ids) {
        await db.run('INSERT INTO promotion_categories (promotion_id, category_id) VALUES (?, ?)', [id, catId]);
      }
    }

    if (product_ids && product_ids.length > 0) {
      for (const prodId of product_ids) {
        await db.run('INSERT INTO promotion_products (promotion_id, product_id) VALUES (?, ?)', [id, prodId]);
      }
    }

    return this.findById(id);
  },

  // Cambiar estado
  async updateStatus(id, status) {
    const query = 'UPDATE promotions SET status = ?, updated_at = NOW() WHERE id = ?';
    await db.run(query, [status, id]);
    return this.findById(id);
  },

  // Eliminar promoción
  async delete(id) {
    await db.run('DELETE FROM promotion_categories WHERE promotion_id = ?', [id]);
    await db.run('DELETE FROM promotion_products WHERE promotion_id = ?', [id]);
    await db.run('DELETE FROM promotions WHERE id = ?', [id]);
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
