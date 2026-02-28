const db = require('../config/database');

class Product {
    // Obtener el último SKU numérico
    static async getLastSku() {
        const [rows] = await db.query('SELECT MAX(CAST(sku AS UNSIGNED)) AS lastSku FROM productos');
        return rows[0]?.lastSku || 0;
    }
    // Crear producto
    static async create(data) {
        const {
            nombre,
            codigo, // Agregado el código/sku
            categoria_id,
            tallas = null,
            colores = null,
            precio,
            costo,
            stock,
            stock_minimo,
            proveedor,
            ubicacion,
            estado = 'activo',
            fecha_ingreso,
            imagen_url,
            notas,
            created_at,
            updated_at
        } = data;
        const values = [
            nombre !== undefined ? nombre : null,
            codigo !== undefined ? codigo : null,
            categoria_id !== undefined ? categoria_id : null,
            tallas !== undefined ? tallas : null,
            colores !== undefined ? colores : null,
            precio !== undefined ? precio : null,
            costo !== undefined ? costo : null,
            stock !== undefined ? stock : null,
            stock_minimo !== undefined ? stock_minimo : null,
            proveedor !== undefined ? proveedor : null,
            ubicacion !== undefined ? ubicacion : null,
            estado !== undefined ? estado : 'activo',
            fecha_ingreso !== undefined ? fecha_ingreso : null,
            imagen_url !== undefined ? imagen_url : null,
            notas !== undefined ? notas : null,
            created_at !== undefined ? created_at : null,
            updated_at !== undefined ? updated_at : null
        ];
        const [result] = await db.query(
            `INSERT INTO productos (nombre, codigo, categoria_id, tallas, colores, precio, costo, stock, stock_minimo, proveedor, ubicacion, estado, fecha_ingreso, imagen_url, notas, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values
        );
        return { id: result.insertId, ...data };
    }

    // Obtener todos los productos
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM productos');
        return rows.map(p => ({ ...p, images: p.imagen_url ? JSON.parse(p.imagen_url) : [] }));
    }

    // Obtener producto por ID
    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
        if (!rows[0]) return null;
        return { ...rows[0], images: rows[0].imagen_url ? JSON.parse(rows[0].imagen_url) : [] };
    }

    // Buscar productos por nombre o SKU
    static async search(query) {
        const [rows] = await db.query(
            `SELECT * FROM productos WHERE nombre LIKE ? OR codigo LIKE ?`,
            [`%${query}%`, `%${query}%`]
        );
        return rows.map(p => ({ ...p, images: p.imagen_url ? JSON.parse(p.imagen_url) : [] }));
    }

    // Filtrar por categoría
    static async getByCategory(categoryId) {
        const [rows] = await db.query('SELECT * FROM productos WHERE categoria_id = ?', [categoryId]);
        return rows.map(p => ({ ...p, images: p.imagen_url ? JSON.parse(p.imagen_url) : [] }));
    }

    // Productos con stock bajo
    static async getLowStock() {
        const [rows] = await db.query('SELECT * FROM productos WHERE stock < stock_minimo AND stock > 0');
        return rows.map(p => ({ ...p, images: p.imagen_url ? JSON.parse(p.imagen_url) : [] }));
    }

    // Productos sin stock
    static async getOutOfStock() {
        const [rows] = await db.query('SELECT * FROM productos WHERE stock <= 0');
        return rows.map(p => ({ ...p, images: p.imagen_url ? JSON.parse(p.imagen_url) : [] }));
    }

    // Actualizar producto
    static async update(id, data) {
        const fields = [];
        const values = [];
        for (const key in data) {
            if (key === 'images' || key === 'imagen_url') {
                fields.push('imagen_url = ?');
                if (Array.isArray(data[key])) {
                    values.push(JSON.stringify(data[key]));
                } else {
                    values.push(data[key]);
                }
            } else {
                fields.push(`${key} = ?`);
                values.push(data[key]);
            }
        }
        values.push(id);
        await db.query(`UPDATE productos SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`, [...values, new Date(), id]);
        return this.getById(id);
    }

    // Eliminar producto
    static async delete(id) {
        await db.query('DELETE FROM productos WHERE id = ?', [id]);
        return true;
    }

    // Ajustar stock manualmente (positivo o negativo)
    static async adjustStock(id, delta) {
        await db.query(
            'UPDATE productos SET stock = stock + ?, updated_at = ? WHERE id = ?',
            [delta, new Date(), id]
        );
        return this.getById(id);
    }

    // Cambiar estado
    static async changeStatus(id, status) {
        await db.query('UPDATE productos SET estado = ?, updated_at = ? WHERE id = ?', [status, new Date(), id]);
        return this.getById(id);
    }

    // Subir imágenes (agrega a las existentes)
    static async addImages(id, imageUrls) {
        const product = await this.getById(id);
        const images = product.images.concat(imageUrls);
        await db.query('UPDATE productos SET imagen_url = ?, updated_at = ? WHERE id = ?', [JSON.stringify(images), new Date(), id]);
        return this.getById(id);
    }

    // Eliminar imagen
    static async removeImage(id, imageUrl) {
        const product = await this.getById(id);
        const images = product.images.filter(img => img !== imageUrl);
        await db.query('UPDATE productos SET imagen_url = ?, updated_at = ? WHERE id = ?', [JSON.stringify(images), new Date(), id]);
        return this.getById(id);
    }

    // Duplicar producto (para variantes)
    static async duplicate(id, overrides = {}) {
        const product = await this.getById(id);
        if (!product) return null;
        const copy = { ...product, ...overrides };
        delete copy.id;
        copy.sku = copy.sku + '-COPY-' + Date.now();
        copy.created_at = new Date();
        copy.updated_at = new Date();
        return this.create(copy);
    }

    // Indicador visual de stock
    static getStockIndicator(product) {
        if (product.stock_quantity <= 0 || product.stock_quantity < (product.min_stock * 0.5)) return 'critical';
        if (product.stock_quantity < product.min_stock && product.stock_quantity > 0) return 'low';
        if (product.stock_quantity >= product.min_stock) return 'ok';
        return 'unknown';
    }
}

module.exports = Product;
