const db = require('../config/database');

class Product {
    /**
     * Devuelve el total de productos según filtros simples (nombre, código, categoría, estado)
     * @param {Object} filters - { nombre, codigo, categoria_id, estado }
     * @returns {Promise<number>}
     */
    static async getFilteredCount(filters = {}) {
        let sql = 'SELECT COUNT(*) AS total FROM productos WHERE 1=1';
        const params = [];
        if (filters.nombre) {
            sql += ' AND nombre LIKE ?';
            params.push(`%${filters.nombre}%`);
        }
        if (filters.codigo) {
            sql += ' AND codigo LIKE ?';
            params.push(`%${filters.codigo}%`);
        }
        if (filters.categoria_id) {
            sql += ' AND categoria_id = ?';
            params.push(filters.categoria_id);
        }
        if (filters.estado) {
            sql += ' AND estado = ?';
            params.push(filters.estado);
        }
        const [rows] = await db.query(sql, params);
        return rows[0]?.total || 0;
    }
    // Helper: parsear imagen_url de forma segura
    static parseImages(imagen_url) {
        try {
            const parsed = imagen_url ? JSON.parse(imagen_url) : [];
            return Array.isArray(parsed) ? parsed.filter(img => img && img !== 'undefined') : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Determinar el estado correcto según el stock
     * Regla: stock > 0 → 'activo', stock === 0 → 'sin_stock'
     * 'descontinuado' solo se asigna manualmente (al "borrar" un producto)
     */
    static resolveEstado(stock, estadoActual) {
        const qty = parseInt(stock) || 0;
        // Si el producto está descontinuado, mantenerlo así (solo se cambia manualmente)
        if (estadoActual === 'descontinuado') return 'descontinuado';
        return qty > 0 ? 'activo' : 'sin_stock';
    }

    // Contar total de productos activos
    static async getCount() {
        const [rows] = await db.query("SELECT COUNT(*) AS total FROM productos WHERE estado = 'activo'");
        return rows[0]?.total || 0;
    }
    // Obtener el último SKU numérico
    static async getLastSku() {
        const [rows] = await db.query('SELECT MAX(CAST(sku AS UNSIGNED)) AS lastSku FROM productos');
        return rows[0]?.lastSku || 0;
    }
    // Crear producto
    static async create(data) {
        // Calcular estado según stock
        const stockQty = parseInt(data.stock) || 0;
        const estadoCalculado = stockQty > 0 ? 'activo' : 'sin_stock';

        // Log exhaustivo para debugging
        console.log('[DEBUG] [Product.create] Iniciando inserción...');
        console.log('[DEBUG] [Product.create] Data recibida:', JSON.stringify(data, null, 2).substring(0, 1000));

        const {
            nombre,
            descripcion = null,
            codigo,
            categoria_id,
            tallas = null,
            colores = null,
            precio = 0,
            costo = 0,
            stock = 0,
            stock_minimo = 0,
            supplier_id = null,
            ubicacion = null,
            fecha_ingreso = new Date().toISOString().slice(0, 10),
            imagen_url = '[]',
            notas = null,
            created_at = new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ')
        } = data;

        // Orden explícito para el INSERT
        const columns = [
            'nombre', 'descripcion', 'codigo', 'categoria_id', 'precio', 'costo',
            'stock', 'stock_minimo', 'tallas', 'colores', 'ubicacion', 'estado',
            'fecha_ingreso', 'imagen_url', 'notas', 'created_at', 'updated_at', 'supplier_id'
        ];

        const values = [
            nombre,
            descripcion,
            codigo,
            categoria_id,
            parseFloat(precio),
            parseFloat(costo),
            parseInt(stock),
            parseInt(stock_minimo),
            tallas,
            colores,
            ubicacion,
            estadoCalculado,
            fecha_ingreso,
            imagen_url,
            notas,
            created_at,
            updated_at,
            supplier_id
        ];

        console.log('[DEBUG] [Product.create] Columnas:', columns.join(', '));
        console.log('[DEBUG] [Product.create] Cantidad de valores:', values.length);
        console.log('[DEBUG] [Product.create] Valor imagen_url:', values[columns.indexOf('imagen_url')]);

        try {
            const placeholders = columns.map(() => '?').join(', ');
            const query = `INSERT INTO productos (${columns.join(', ')}) VALUES (${placeholders})`;

            const [result] = await db.query(query, values);
            console.log('[DEBUG] [Product.create] Inserción EXITOSA. ID:', result.insertId);
            return { id: result.insertId, ...data, estado: estadoCalculado };
        } catch (error) {
            console.error('[CRITICAL] [Product.create] Error en query:', error.message);
            console.error('[CRITICAL] Query fallida:', error.sql);
            throw error;
        }
    }

    // Obtener todos los productos
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM productos');
        return rows.map(p => {
            return { ...p, images: Product.parseImages(p.imagen_url) };
        });
    }

    // Obtener producto por ID
    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
        if (!rows[0]) return null;
        return { ...rows[0], images: Product.parseImages(rows[0].imagen_url) };
    }

    // Buscar productos por nombre o SKU
    static async search(query) {
        const [rows] = await db.query(
            `SELECT * FROM productos WHERE nombre LIKE ? OR codigo LIKE ?`,
            [`%${query}%`, `%${query}%`]
        );
        return rows.map(p => ({ ...p, images: Product.parseImages(p.imagen_url) }));
    }

    // Filtrar por categoría
    static async getByCategory(categoryId) {
        const [rows] = await db.query('SELECT * FROM productos WHERE categoria_id = ?', [categoryId]);
        return rows.map(p => ({ ...p, images: Product.parseImages(p.imagen_url) }));
    }

    // Productos con stock bajo
    static async getLowStock() {
        const [rows] = await db.query('SELECT * FROM productos WHERE stock < stock_minimo AND stock > 0');
        return rows.map(p => ({ ...p, images: Product.parseImages(p.imagen_url) }));
    }

    // Productos sin stock
    static async getOutOfStock() {
        const [rows] = await db.query('SELECT * FROM productos WHERE stock <= 0');
        return rows.map(p => ({ ...p, images: Product.parseImages(p.imagen_url) }));
    }

    // Actualizar producto
    static async update(id, data) {
        const fields = [];
        const values = [];
        for (const key in data) {
            if (data[key] === undefined) continue; // Evitar campos undefined
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
        fields.push('updated_at = ?');
        values.push(new Date());
        values.push(id);
        await db.query(`UPDATE productos SET ${fields.join(', ')} WHERE id = ?`, values);
        return this.getById(id);
    }

    // Eliminar producto (soft delete: stock=0, estado=descontinuado)
    static async delete(id) {
        await db.query(
            "UPDATE productos SET stock = 0, estado = 'descontinuado', updated_at = NOW() WHERE id = ?",
            [id]
        );
        return true;
    }

    // Ajustar stock manualmente (positivo o negativo) — auto-actualiza estado
    static async adjustStock(id, delta) {
        await db.query(
            'UPDATE productos SET stock = stock + ?, updated_at = NOW() WHERE id = ?',
            [delta, id]
        );
        // Sincronizar estado con el nuevo stock
        const product = await this.getById(id);
        if (product && product.estado !== 'descontinuado') {
            const newEstado = product.stock > 0 ? 'activo' : 'sin_stock';
            if (product.estado !== newEstado) {
                await db.query('UPDATE productos SET estado = ? WHERE id = ?', [newEstado, id]);
            }
        }
        return this.getById(id);
    }

    // Cambiar estado manualmente — con lógica de stock asociada
    static async changeStatus(id, status) {
        // Si se cambia a sin_stock → stock pasa a 0
        if (status === 'sin_stock') {
            await db.query(
                "UPDATE productos SET estado = 'sin_stock', stock = 0, updated_at = NOW() WHERE id = ?",
                [id]
            );
        }
        // Si se cambia a activo y el stock actual es 0 → stock pasa a 1
        else if (status === 'activo') {
            const product = await this.getById(id);
            if (product && product.stock <= 0) {
                await db.query(
                    "UPDATE productos SET estado = 'activo', stock = 1, updated_at = NOW() WHERE id = ?",
                    [id]
                );
            } else {
                await db.query(
                    "UPDATE productos SET estado = 'activo', updated_at = NOW() WHERE id = ?",
                    [id]
                );
            }
        }
        // descontinuado → stock pasa a 0
        else if (status === 'descontinuado') {
            await db.query(
                "UPDATE productos SET estado = 'descontinuado', stock = 0, updated_at = NOW() WHERE id = ?",
                [id]
            );
        }
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
        // Generar código único para el duplicado
        if (copy.codigo) {
            copy.codigo = copy.codigo + '-COPY-' + Date.now();
        }
        if (copy.sku) {
            copy.sku = copy.sku + '-COPY-' + Date.now();
        }
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

    /**
     * Verifica si existe un producto con el mismo SKU/código
     * @param {string} codigo - SKU/código a verificar
     * @param {number} [excludeId] - Opcional: ID a excluir (para edición)
     * @returns {Promise<boolean>} true si existe, false si no
     */
    static async checkSkuExists(codigo, excludeId = null) {
        let sql = 'SELECT COUNT(*) AS total FROM productos WHERE codigo = ?';
        const params = [codigo];
        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await db.query(sql, params);
        return rows[0]?.total > 0;
    }
}

module.exports = Product;
