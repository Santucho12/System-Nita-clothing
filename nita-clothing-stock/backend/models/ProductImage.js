const db = require('../config/database');

const ProductImage = {
  // Crear imagen
  async create(data) {
    const { product_id, url, thumbnail_url, is_primary, order, uploaded_by } = data;
    
    const query = `
      INSERT INTO product_images (product_id, url, thumbnail_url, is_primary, \`order\`, uploaded_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await db.run(query, [
      product_id,
      url,
      thumbnail_url || url,
      is_primary || 0,
      order || 0,
      uploaded_by || null
    ]);
    
    return this.findById(result.lastID);
  },

  // Obtener por ID
  async findById(id) {
    const query = 'SELECT * FROM product_images WHERE id = ?';
    return await db.get(query, [id]);
  },

  // Obtener por producto
  async findByProduct(productId) {
    const query = `
      SELECT * FROM product_images 
      WHERE product_id = ? 
      ORDER BY is_primary DESC, \`order\` ASC
    `;
    return await db.all(query, [productId]);
  },

  // Establecer como primaria
  async setPrimary(id, productId) {
    // Quitar primaria de todas
    await db.run('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
    
    // Establecer nueva primaria
    await db.run('UPDATE product_images SET is_primary = 1 WHERE id = ?', [id]);
    
    return this.findById(id);
  },

  // Eliminar
  async delete(id) {
    const query = 'DELETE FROM product_images WHERE id = ?';
    await db.run(query, [id]);
    return { success: true };
  },

  // Eliminar todas de un producto
  async deleteByProduct(productId) {
    const query = 'DELETE FROM product_images WHERE product_id = ?';
    await db.run(query, [productId]);
    return { success: true };
  }
};

module.exports = ProductImage;
