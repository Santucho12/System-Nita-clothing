const fs = require('fs');
const path = require('path');

// ============================================
// REWRITE Product.js - Sistema de 3 estados
// ============================================
const productCode = `const db = require('../config/database');
const { deletePhysicalFile } = require('../utils/fileHelper');

// Helper para parsear imágenes de forma segura
const safeParseImages = (jsonStr, productId) => {
    if (!jsonStr) return [];
    try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed.filter(img => img && img !== 'undefined') : [jsonStr];
    } catch (e) {
        console.error(\`[ERROR] Error parseando imagen_url para producto \${productId}:\`, e);
        return [jsonStr];
    }
};

class Product {
    /**
     * Determinar el estado correcto según el stock
     * Regla: stock > 0 → 'activo', stock === 0 → 'sin_stock'
     * 'descontinuado' solo se asigna manualmente (al "borrar" un producto)
     */
    static resolveEstado(stock, estadoActual) {
        const qty = parseInt(stock) || 0;
        if (estadoActual === 'descontinuado') return 'descontinuado';
        return qty > 0 ? 'activo' : 'sin_stock';
    }

    // Obtener el último SKU numérico
    static async getLastSku(connection = null) {
        const sql = 'SELECT codigo FROM productos WHERE codigo REGEXP "^[0-9]+$" ORDER BY CAST(codigo AS UNSIGNED) DESC LIMIT 1';
        const [rows] = await db.query(sql, [], connection);
        return rows[0]?.codigo || null;
    }

    // Crear producto
    static async create(data, connection = null) {
        const stockQty = parseInt(data.stock) || 0;
        const estadoCalculado = stockQty > 0 ? 'activo' : 'sin_stock';

        const {
            nombre,
            descripcion = null,
            codigo,
            categoria_id,
            tallas = null,
            colores = null,
            precio,
            costo,
            stock,
            stock_minimo,
            proveedor,
            supplier_id = null,
            ubicacion,
            fecha_ingreso,
            imagen_url,
            notas,
            created_at,
            updated_at
        } = data;

        const sql = \`
            INSERT INTO productos (
                nombre, descripcion, codigo, categoria_id, tallas, colores, precio, costo,
                stock, stock_minimo, proveedor, supplier_id, ubicacion,
                estado, fecha_ingreso, imagen_url, notas, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        \`;

        const values = [
            nombre !== undefined ? nombre : null,
            descripcion !== undefined ? descripcion : null,
            codigo !== undefined ? codigo : null,
            categoria_id !== undefined ? categoria_id : null,
            tallas !== undefined ? tallas : null,
            colores !== undefined ? colores : null,
            precio !== undefined ? precio : 0,
            costo !== undefined ? costo : 0,
            stock !== undefined ? stock : 0,
            stock_minimo !== undefined ? stock_minimo : 0,
            proveedor !== undefined ? proveedor : null,
            supplier_id !== undefined ? supplier_id : null,
            ubicacion !== undefined ? ubicacion : null,
            estadoCalculado,
            fecha_ingreso !== undefined ? fecha_ingreso : null,
            imagen_url !== undefined ? imagen_url : null,
            notas !== undefined ? notas : null,
            created_at !== undefined ? created_at : null,
            updated_at !== undefined ? updated_at : null
        ];

        const [result] = await db.query(sql, values, connection);
        return { id: result.insertId, ...data, estado: estadoCalculado };
    }

    // Obtener todos los productos con paginación y filtros
    static async getAll(options = {}, connection = null) {
        const {
            limit = null,
            offset = 0,
            sort = 'id',
            direction = 'DESC',
            q = null,
            category = null,
            size = null,
            color = null,
            status = null
        } = options;

        let sql = "SELECT * FROM productos WHERE estado != 'descontinuado'";
        const params = [];

        if (q) {
            sql += ' AND (nombre LIKE ? OR codigo LIKE ?)';
            params.push(\`%\${q}%\`, \`%\${q}%\`);
        }
        if (category) {
            sql += ' AND categoria_id = ?';
            params.push(category);
        }
        if (size) {
            sql += ' AND tallas = ?';
            params.push(size);
        }
        if (color) {
            sql += ' AND colores LIKE ?';
            params.push(\`%\${color}%\`);
        }
        if (status) {
            sql += ' AND estado = ?';
            params.push(status);
        }

        const ALLOWED_SORT_FIELDS = ['id', 'nombre', 'precio', 'stock', 'created_at'];
        const validatedSort = ALLOWED_SORT_FIELDS.includes(sort) ? sort : 'id';
        const validatedDir = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        sql += \` ORDER BY \${validatedSort} \${validatedDir}\`;

        if (limit !== null) {
            const safeLimit = parseInt(limit) || 25;
            const safeOffset = parseInt(offset) || 0;
            sql += \` LIMIT \${safeLimit} OFFSET \${safeOffset}\`;
        }

        const [rows] = await db.query(sql, params, connection);
        return rows.map(p => ({ ...p, images: safeParseImages(p.imagen_url, p.id) }));
    }

    // Obtener conteo filtrado para paginación
    static async getFilteredCount(options = {}, connection = null) {
        const {
            q = null,
            category = null,
            size = null,
            color = null,
            status = null
        } = options;

        let sql = "SELECT COUNT(*) as total FROM productos WHERE estado != 'descontinuado'";
        const params = [];

        if (q) {
            sql += ' AND (nombre LIKE ? OR codigo LIKE ?)';
            params.push(\`%\${q}%\`, \`%\${q}%\`);
        }
        if (category) {
            sql += ' AND categoria_id = ?';
            params.push(category);
        }
        if (size) {
            sql += ' AND tallas = ?';
            params.push(size);
        }
        if (color) {
            sql += ' AND colores LIKE ?';
            params.push(\`%\${color}%\`);
        }
        if (status) {
            sql += ' AND estado = ?';
            params.push(status);
        }

        const row = await db.get(sql, params, connection);
        return row ? row.total : 0;
    }

    // Verificar si un SKU ya existe
    static async checkSkuExists(sku, excludeId = null, connection = null) {
        let query = "SELECT id FROM productos WHERE codigo = ? AND estado != 'descontinuado'";
        const params = [sku];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await db.query(query, params, connection);
        return rows.length > 0;
    }

    // Obtener producto por ID
    static async getById(id, connection = null) {
        const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id], connection);
        if (!rows[0]) return null;
        return { ...rows[0], images: safeParseImages(rows[0].imagen_url, rows[0].id) };
    }

    // Buscar productos por nombre o SKU
    static async search(query, connection = null) {
        const [rows] = await db.query(
            \`SELECT * FROM productos WHERE (nombre LIKE ? OR codigo LIKE ?) AND estado != 'descontinuado'\`,
            [\`%\${query}%\`, \`%\${query}%\`],
            connection
        );
        return rows.map(p => ({ ...p, images: safeParseImages(p.imagen_url, p.id) }));
    }

    // Filtrar por categoría
    static async getByCategory(categoryId, connection = null) {
        const [rows] = await db.query("SELECT * FROM productos WHERE categoria_id = ? AND estado != 'descontinuado'", [categoryId], connection);
        return rows.map(p => ({ ...p, images: safeParseImages(p.imagen_url, p.id) }));
    }

    // Productos con stock bajo
    static async getLowStock(connection = null) {
        const [rows] = await db.query("SELECT * FROM productos WHERE stock < stock_minimo AND stock > 0 AND estado = 'activo'", [], connection);
        return rows.map(p => ({ ...p, images: safeParseImages(p.imagen_url, p.id) }));
    }

    // Productos sin stock
    static async getOutOfStock(connection = null) {
        const [rows] = await db.query("SELECT * FROM productos WHERE stock <= 0 AND estado != 'descontinuado'", [], connection);
        return rows.map(p => ({ ...p, images: safeParseImages(p.imagen_url, p.id) }));
    }

    // Actualizar producto
    static async update(id, data, connection = null) {
        const ALLOWED_FIELDS = [
            'nombre', 'descripcion', 'codigo', 'categoria_id', 'tallas', 'colores',
            'precio', 'costo', 'stock', 'stock_minimo', 'proveedor', 'supplier_id',
            'ubicacion', 'estado', 'imagen_url', 'notas', 'fecha_ingreso'
        ];

        const fields = [];
        const values = [];
        for (const key in data) {
            if (key === 'id') continue;
            if (!ALLOWED_FIELDS.includes(key) && key !== 'images') continue;

            if (key === 'images' || key === 'imagen_url') {
                fields.push('imagen_url = ?');
                values.push(Array.isArray(data[key]) ? JSON.stringify(data[key]) : data[key]);
            } else if (key === 'stock') {
                fields.push('\`stock\` = GREATEST(0, ?)');
                values.push(data[key]);
            } else {
                fields.push(\`\\\`\${key}\\\` = ?\`);
                values.push(data[key]);
            }
        }
        if (fields.length === 0) return this.getById(id, connection);
        await db.query(\`UPDATE productos SET \${fields.join(', ')}, updated_at = NOW() WHERE id = ?\`, [...values, id], connection);
        return this.getById(id, connection);
    }

    // Eliminar producto (SOFT DELETE: estado=descontinuado, stock=0)
    static async delete(id, connection = null) {
        await db.query(
            "UPDATE productos SET estado = 'descontinuado', stock = 0, updated_at = NOW() WHERE id = ?",
            [id],
            connection
        );
        return true;
    }

    // Actualizar stock manualmente y sincronizar estado
    static async updateStock(id, quantity, connection = null) {
        const product = await this.getById(id, connection);
        if (!product) return null;
        
        // Si está descontinuado, no permitir cambio de stock
        if (product.estado === 'descontinuado') {
            throw new Error('No se puede modificar el stock de un producto descontinuado');
        }
        
        const newEstado = quantity > 0 ? 'activo' : 'sin_stock';
        await db.query(
            'UPDATE productos SET stock = ?, estado = ?, updated_at = NOW() WHERE id = ?',
            [quantity, newEstado, id],
            connection
        );
        return this.getById(id, connection);
    }

    // Cambiar estado manualmente con lógica de stock asociada
    static async changeStatus(id, status, connection = null) {
        if (status === 'sin_stock') {
            await db.query(
                "UPDATE productos SET estado = 'sin_stock', stock = 0, updated_at = NOW() WHERE id = ?",
                [id], connection
            );
        } else if (status === 'activo') {
            const product = await this.getById(id, connection);
            if (product && product.stock <= 0) {
                await db.query(
                    "UPDATE productos SET estado = 'activo', stock = 1, updated_at = NOW() WHERE id = ?",
                    [id], connection
                );
            } else {
                await db.query(
                    "UPDATE productos SET estado = 'activo', updated_at = NOW() WHERE id = ?",
                    [id], connection
                );
            }
        } else if (status === 'descontinuado') {
            await db.query(
                "UPDATE productos SET estado = 'descontinuado', stock = 0, updated_at = NOW() WHERE id = ?",
                [id], connection
            );
        }
        return this.getById(id, connection);
    }

    // Subir imágenes (agrega a las existentes)
    static async addImages(id, imageUrls, connection = null) {
        const product = await this.getById(id, connection);
        const images = product.images.concat(imageUrls);
        await db.query('UPDATE productos SET imagen_url = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(images), id], connection);
        return this.getById(id, connection);
    }

    // Eliminar imagen
    static async removeImage(id, imageUrl, connection = null) {
        const product = await this.getById(id, connection);
        const images = product.images.filter(img => img !== imageUrl);
        deletePhysicalFile(imageUrl);
        await db.query('UPDATE productos SET imagen_url = ?, updated_at = NOW() WHERE id = ?', [JSON.stringify(images), id], connection);
        return this.getById(id, connection);
    }

    // Duplicar producto (para variantes)
    static async duplicate(id, overrides = {}) {
        const product = await this.getById(id);
        if (!product) return null;

        const copy = { ...product, ...overrides };
        delete copy.id;
        delete copy.images;
        delete copy.created_at;
        delete copy.updated_at;

        if (!overrides.imagen_url && !overrides.images) {
            copy.imagen_url = null;
        }

        copy.codigo = (copy.codigo || '') + '-COPY-' + Date.now();
        return this.create(copy);
    }

    // Indicador visual de stock
    static getStockIndicator(product) {
        if (product.stock <= 0 || product.stock < (product.stock_minimo * 0.5)) return 'critical';
        if (product.stock < product.stock_minimo && product.stock > 0) return 'low';
        if (product.stock >= product.stock_minimo) return 'ok';
        return 'unknown';
    }

    // Conteo total de productos ACTIVOS (para dashboard)
    static async getCount(connection = null) {
        const [rows] = await db.query("SELECT COUNT(*) AS total FROM productos WHERE estado = 'activo'", [], connection);
        return rows[0]?.total || 0;
    }
}

module.exports = Product;
`;

// ============================================
// REWRITE productController.js
// ============================================
const controllerCode = `const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');

class ProductController {
    // Obtener el último SKU numérico
    static async getLastSku(req, res, next) {
        try {
            const lastSku = await Product.getLastSku();
            res.status(200).json({ success: true, lastSku });
        } catch (error) {
            next(error);
        }
    }

    // Cambiar estado del producto
    static async changeStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!['activo', 'sin_stock', 'descontinuado'].includes(status)) {
                const error = new Error('Estado inválido. Estados válidos: activo, sin_stock, descontinuado');
                error.status = 400;
                throw error;
            }
            const updated = await Product.changeStatus(id, status);
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    // Duplicar producto
    static async duplicateProduct(req, res, next) {
        try {
            const { id } = req.params;
            const overrides = {};
            if (req.body && req.body.noStock) {
                overrides.stock_quantity = 0;
            }
            const duplicated = await Product.duplicate(id, overrides);
            if (!duplicated) {
                const error = new Error('Producto no encontrado para duplicar');
                error.status = 404;
                throw error;
            }
            res.status(201).json({ success: true, data: duplicated });
        } catch (error) {
            next(error);
        }
    }

    // Subir imágenes a producto
    static async uploadImages(req, res, next) {
        try {
            const { id } = req.params;
            if (!req.files || req.files.length === 0) {
                const error = new Error('No se enviaron imágenes');
                error.status = 400;
                throw error;
            }
            const imageUrls = req.files
                .filter(file => file && file.filename)
                .map(file => \`/uploads/products/\${file.filename}\`);
            const updated = await Product.addImages(id, imageUrls);
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    // Eliminar imagen de producto
    static async deleteImage(req, res, next) {
        try {
            const { id, img } = req.params;
            const updated = await Product.removeImage(id, \`/uploads/\${img}\`);
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            next(error);
        }
    }

    static async getAllProducts(req, res, next) {
        try {
            const { limit, offset, sort, direction, q, category, size, color, status } = req.query;
            const options = {
                limit: limit ? parseInt(limit) : null,
                offset: offset ? parseInt(offset) : 0,
                sort: sort || 'id',
                direction: direction || 'DESC',
                q,
                category,
                size,
                color,
                status
            };

            const products = await Product.getAll(options);
            const total = await Product.getFilteredCount(options);

            res.status(200).json({
                success: true,
                message: 'Productos obtenidos exitosamente',
                data: products,
                pagination: {
                    total,
                    limit: options.limit,
                    offset: options.offset
                }
            });
        } catch (error) {
            next(error);
        }
    }

    static async searchProducts(req, res, next) {
        try {
            const { q } = req.query;
            if (!q) {
                const error = new Error('Falta el parámetro de búsqueda');
                error.status = 400;
                throw error;
            }
            const products = await Product.search(q);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async getLowStockProducts(req, res, next) {
        try {
            const products = await Product.getLowStock();
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async getProductsByCategory(req, res, next) {
        try {
            const { categoryId } = req.params;
            const products = await Product.getByCategory(categoryId);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    }

    static async getProductById(req, res, next) {
        try {
            const { id } = req.params;
            const product = await Product.getById(id);
            if (!product) {
                const error = new Error('Producto no encontrado');
                error.status = 404;
                throw error;
            }
            res.status(200).json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    }

    static async createProduct(req, res, next) {
        try {
            let data = req.body;
            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                imageUrls = req.files
                    .filter(file => file && file.filename)
                    .map(file => \`/uploads/products/\${file.filename}\`);
            }

            const stockQty = parseInt(data.stock || data.quantity) || 0;
            const mappedData = {
                nombre: data.nombre || data.name || null,
                codigo: data.sku || data.codigo || null,
                categoria_id: data.categoria_id || data.category_id ? parseInt(data.categoria_id || data.category_id) : null,
                tallas: data.tallas || data.size || null,
                colores: data.colores || data.color || null,
                estado: stockQty > 0 ? 'activo' : 'sin_stock',
                imagen_url: (imageUrls.length > 0) ? JSON.stringify(imageUrls) : (data.imagen_url || null),
                stock: stockQty,
                precio: parseFloat(data.precio || data.sale_price) || 0,
                costo: parseFloat(data.costo || data.cost_price) || 0,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Validar SKU duplicado
            if (mappedData.codigo) {
                const skuExists = await Product.checkSkuExists(mappedData.codigo);
                if (skuExists) {
                    const error = new Error(\`El SKU/Código "\${mappedData.codigo}" ya está en uso.\`);
                    error.status = 400;
                    throw error;
                }
            }

            const newProduct = await Product.create(mappedData);
            res.status(201).json({ success: true, data: newProduct });
        } catch (error) {
            next(error);
        }
    }

    static async updateProduct(req, res, next) {
        try {
            const { id } = req.params;
            let data = req.body;

            // Procesar imágenes existentes
            let currentImages = [];
            if (data.imagen_url) {
                try {
                    currentImages = JSON.parse(data.imagen_url);
                } catch (e) {
                    currentImages = [data.imagen_url];
                }
            }

            // Procesar nuevas imágenes
            const newImageUrls = req.files ? req.files.map(file => \`/uploads/products/\${file.filename}\`) : [];
            const finalImageUrls = [...currentImages, ...newImageUrls];

            const stockQty = parseInt(data.stock || data.quantity) || 0;
            
            // Verificar si está descontinuado - no permitir edición de stock
            const currentProduct = await Product.getById(id);
            let newEstado;
            if (currentProduct && currentProduct.estado === 'descontinuado') {
                newEstado = 'descontinuado';
            } else {
                newEstado = stockQty > 0 ? 'activo' : 'sin_stock';
            }

            const mappedData = {
                nombre: data.nombre || data.name,
                codigo: data.sku || data.codigo,
                categoria_id: data.categoria_id || data.category_id,
                tallas: data.tallas || data.size,
                colores: data.colores || data.color,
                estado: newEstado,
                imagen_url: JSON.stringify(finalImageUrls),
                stock: stockQty,
                precio: parseFloat(data.precio || data.sale_price) || 0,
                costo: parseFloat(data.costo || data.cost_price) || 0
            };

            if (!mappedData.nombre || mappedData.nombre.trim() === '') {
                const error = new Error('El nombre del producto es obligatorio.');
                error.status = 400;
                throw error;
            }

            // Validar SKU duplicado (excluyendo el actual)
            if (mappedData.codigo) {
                const skuExists = await Product.checkSkuExists(mappedData.codigo, id);
                if (skuExists) {
                    const error = new Error(\`El SKU/Código "\${mappedData.codigo}" ya está en uso por otro producto.\`);
                    error.status = 400;
                    throw error;
                }
            }

            const updatedProduct = await Product.update(id, mappedData);
            res.status(200).json({ success: true, data: updatedProduct });
        } catch (error) {
            next(error);
        }
    }

    static async updateStock(req, res, next) {
        try {
            const { id } = req.params;
            const { quantity, reason } = req.body;
            if (typeof quantity !== 'number') {
                const error = new Error('Cantidad inválida');
                error.status = 400;
                throw error;
            }

            const product = await Product.getById(id);
            if (!product) {
                const error = new Error('Producto no encontrado');
                error.status = 404;
                throw error;
            }

            const currentStock = product.stock;
            const result = await Product.adjustStock(id, quantity);

            // Registrar en el log de actividad
            await ActivityLog.create({
                user_id: req.user ? req.user.id : null,
                action: 'STOCK_ADJUSTMENT',
                table_name: 'productos',
                record_id: id,
                old_value: { stock: currentStock },
                new_value: { stock: quantity, reason: reason || 'Ajuste manual' },
                ip_address: req.ip
            });

            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    static async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            await Product.delete(id);
            res.status(200).json({ success: true, message: 'Producto descontinuado (stock = 0, estado = descontinuado)' });
        } catch (error) {
            next(error);
        }
    }

    static async getProductsCount(req, res, next) {
        try {
            const count = await Product.getCount();
            res.status(200).json({ success: true, count });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ProductController;
`;

// Write files
const basePath = path.join(__dirname);

fs.writeFileSync(path.join(basePath, 'models', 'Product.js'), productCode, 'utf8');
console.log('✅ Product.js escrito correctamente');

fs.writeFileSync(path.join(basePath, 'controllers', 'productController.js'), controllerCode, 'utf8');
console.log('✅ productController.js escrito correctamente');

// Verify
const written1 = fs.readFileSync(path.join(basePath, 'models', 'Product.js'), 'utf8');
const written2 = fs.readFileSync(path.join(basePath, 'controllers', 'productController.js'), 'utf8');

console.log(`\nProduct.js: ${written1.includes("descontinuado") ? '✅ contiene descontinuado' : '❌ NO contiene descontinuado'}`);
console.log(`Product.js delete: ${written1.includes("estado = 'descontinuado', stock = 0") ? '✅ delete correcto' : '❌ delete incorrecto'}`);
console.log(`Product.js getCount: ${written1.includes("estado = 'activo'") ? '✅ getCount filtra activo' : '❌ getCount incorrecto'}`);
console.log(`Controller changeStatus: ${written2.includes("'activo', 'sin_stock', 'descontinuado'") ? '✅ 3 estados' : '❌ estados incorrectos'}`);
console.log(`Controller delete msg: ${written2.includes("descontinuado") ? '✅ mensaje correcto' : '❌ mensaje incorrecto'}`);
