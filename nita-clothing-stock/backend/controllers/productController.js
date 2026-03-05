const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

class ProductController {
    // Contar total de productos
    static async getCount(req, res) {
        try {
            const count = await Product.getCount();
            console.log('[getCount] resultado:', count);
            res.status(200).json({ success: true, count });
        } catch (error) {
            console.error('[getCount] ERROR:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Obtener el último SKU numérico
    static async getLastSku(req, res) {
        try {
            const lastSku = await Product.getLastSku();
            res.status(200).json({ success: true, lastSku });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Cambiar estado del producto
    static async changeStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!['activo', 'sin_stock', 'descontinuado'].includes(status)) {
                return res.status(400).json({ success: false, message: 'Estado inválido. Estados válidos: activo, sin_stock, descontinuado' });
            }
            const updated = await Product.changeStatus(id, status);
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Duplicar producto
    static async duplicateProduct(req, res) {
        try {
            const { id } = req.params;
            // Opcional: permitir overrides (ej: sin stock)
            const overrides = {};
            if (req.body && req.body.noStock) {
                overrides.stock_quantity = 0;
            }
            const duplicated = await Product.duplicate(id, overrides);
            if (!duplicated) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado para duplicar' });
            }
            res.status(201).json({ success: true, data: duplicated });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Subir imágenes a producto
    static async uploadImages(req, res) {
        try {
            const { id } = req.params;
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No se enviaron imágenes' });
            }
            // Guardar archivos en /uploads/products y devolver URLs
            const imageUrls = req.files
                .filter(file => file && file.filename)
                .map(file => `/uploads/products/${file.filename}`);
            const updated = await Product.addImages(id, imageUrls);
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Eliminar imagen de producto
    static async deleteImage(req, res) {
        try {
            const { id, img } = req.params;
            // Eliminar físicamente si está en local
            const imgPath = path.join(__dirname, '../../uploads', path.basename(img));
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
            const updated = await Product.removeImage(id, `/uploads/${img}`);
            res.status(200).json({ success: true, data: updated });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getAllProducts(req, res) {
        try {
            const products = await Product.getAll();
            res.status(200).json({
                success: true,
                message: 'Productos obtenidos exitosamente',
                data: products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    static async searchProducts(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ success: false, message: 'Falta el parámetro de búsqueda' });
            }
            const products = await Product.search(q);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getLowStockProducts(req, res) {
        try {
            const products = await Product.getLowStock();
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getProductsByCategory(req, res) {
        try {
            const { categoryId } = req.params;
            const products = await Product.getByCategory(categoryId);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getProductById(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.getById(id);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }
            res.status(200).json({ success: true, data: product });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async createProduct(req, res) {
        try {
            console.log('\n[DEBUG] === NUEVA PETICIÓN DE CREACIÓN ===');
            console.log('[DEBUG] Headers:', req.headers['content-type']);
            console.log('[DEBUG] Body:', req.body);
            console.log('[DEBUG] Files:', req.files?.length || 0);
            if (req.files && req.files.length > 0) {
                console.log('[DEBUG] Detalles de archivos:', req.files.map(f => ({ name: f.originalname, size: f.size })));
            }

            const data = req.body;

            // Determinar imágenes finales
            let imagenesFinal = [];

            // 1. Prioridad: Archivos recién subidos
            if (req.files && req.files.length > 0) {
                imagenesFinal = req.files.map(file => `/uploads/products/${file.filename}`);
            }

            // 2. Fallback/Complemento: URLs existentes enviadas como string o array
            const imagesInput = data.images || data.imagen_url;
            if (imagesInput) {
                try {
                    const parsed = typeof imagesInput === 'string' ? JSON.parse(imagesInput) : imagesInput;
                    const urls = Array.isArray(parsed) ? parsed : [parsed];
                    const validUrls = urls.filter(img => typeof img === 'string' && img.startsWith('/uploads/'));
                    imagenesFinal = [...imagenesFinal, ...validUrls];
                } catch (e) {
                    if (typeof imagesInput === 'string' && imagesInput.startsWith('/uploads/')) {
                        imagenesFinal.push(imagesInput);
                    }
                }
            }

            console.log('[DEBUG] Imágenes finales a guardar:', imagenesFinal);

            // Normalizar datos
            const mappedData = {
                nombre: data.nombre || data.name || null,
                codigo: data.codigo || data.sku || null,
                categoria_id: data.categoria_id || data.category_id ? parseInt(data.categoria_id || data.category_id) : null,
                supplier_id: data.supplier_id ? parseInt(data.supplier_id) : null,
                tallas: data.tallas || data.size || null,
                colores: data.colores || data.color || null,
                ubicacion: data.ubicacion || data.location || null,
                notas: data.notas || data.notes || null,
                stock: parseInt(data.stock || data.quantity || 1),
                stock_minimo: parseInt(data.stock_minimo || data.min_stock || 0),
                precio: parseFloat(data.precio || data.sale_price || 0),
                costo: parseFloat(data.costo || data.cost_price || 0),
                imagen_url: JSON.stringify(imagenesFinal),
                fecha_ingreso: data.fecha_ingreso || new Date().toISOString().slice(0, 10),
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            if (!mappedData.nombre) {
                return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
            }

            // Validar SKU único antes de crear
            if (mappedData.codigo) {
                const exists = await Product.checkSkuExists(mappedData.codigo);
                if (exists) {
                    return res.status(400).json({
                        success: false,
                        message: `El SKU "${mappedData.codigo}" ya fue usado. Por favor, utiliza uno diferente.`
                    });
                }
            }

            const newProduct = await Product.create(mappedData);
            res.status(201).json({ success: true, data: newProduct });
        } catch (error) {
            console.error('[CRITICAL] Error en createProduct:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async updateProduct(req, res) {
        const { id } = req.params;
        try {
            console.log(`\n[DEBUG] === ACTUALIZANDO PRODUCTO ID ${id} ===`);
            console.log('[DEBUG] Headers:', req.headers['content-type']);
            console.log('[DEBUG] Body:', req.body);
            console.log('[DEBUG] Files:', req.files?.length || 0);

            const data = req.body;
            let imagenesFinal = [];

            // 1. Archivos nuevos
            if (req.files && req.files.length > 0) {
                imagenesFinal = req.files.map(file => `/uploads/products/${file.filename}`);
            }

            // 2. URLs persistentes (evitar pérdida de fotos al editar otras cosas)
            const imagesInput = data.images || data.imagen_url;
            if (imagesInput) {
                try {
                    const parsed = typeof imagesInput === 'string' ? JSON.parse(imagesInput) : imagesInput;
                    const urls = Array.isArray(parsed) ? parsed : [parsed];
                    const validUrls = urls.filter(img => typeof img === 'string' && (img.startsWith('/uploads/') || img.startsWith('http')));
                    imagenesFinal = [...imagenesFinal, ...validUrls];
                } catch (e) {
                    if (typeof imagesInput === 'string' && (imagesInput.startsWith('/uploads/') || imagesInput.startsWith('http'))) {
                        imagenesFinal.push(imagesInput);
                    }
                }
            }

            console.log('[DEBUG] Imágenes finales a actualizar:', imagenesFinal);

            const stock = parseInt(data.stock || data.quantity || 0);

            const mappedData = {
                nombre: data.nombre || data.name,
                codigo: data.codigo || data.sku,
                categoria_id: data.categoria_id || data.category_id ? parseInt(data.categoria_id || data.category_id) : undefined,
                supplier_id: data.supplier_id ? parseInt(data.supplier_id) : undefined,
                tallas: data.tallas || data.size,
                colores: data.colores || data.color,
                ubicacion: data.ubicacion || data.location,
                estado: stock > 0 ? 'activo' : 'sin_stock',
                notas: data.notas || data.notes,
                imagen_url: JSON.stringify(imagenesFinal),
                stock,
                stock_minimo: data.stock_minimo !== undefined ? parseInt(data.stock_minimo) : (data.min_stock !== undefined ? parseInt(data.min_stock) : undefined),
                precio: data.precio !== undefined ? parseFloat(data.precio) : (data.sale_price !== undefined ? parseFloat(data.sale_price) : undefined),
                costo: data.costo !== undefined ? parseFloat(data.costo) : (data.cost_price !== undefined ? parseFloat(data.cost_price) : undefined)
            };

            Object.keys(mappedData).forEach(key => mappedData[key] === undefined && delete mappedData[key]);

            // Validar SKU único antes de actualizar (excluyendo el actual)
            if (mappedData.codigo) {
                const exists = await Product.checkSkuExists(mappedData.codigo, id);
                if (exists) {
                    return res.status(400).json({
                        success: false,
                        message: `No se puede actualizar el producto: El SKU "${mappedData.codigo}" ya está registrado en otro producto.`
                    });
                }
            }

            const updatedProduct = await Product.update(id, mappedData);
            res.status(200).json({ success: true, data: updatedProduct });
        } catch (error) {
            console.error('[CRITICAL] Error en updateProduct:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async updateStock(req, res) {
        try {
            const { id } = req.params;
            const { quantity } = req.body;
            if (typeof quantity !== 'number') {
                return res.status(400).json({ success: false, message: 'Cantidad inválida' });
            }
            // Usar el método correcto del modelo
            const result = await Product.adjustStock(id, quantity);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            await Product.delete(id);
            res.status(200).json({ success: true, message: 'Producto descontinuado (stock = 0, estado = descontinuado)' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = ProductController;
