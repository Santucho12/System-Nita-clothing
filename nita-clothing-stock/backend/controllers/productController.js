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
            let data = req.body;
            // Si hay imágenes subidas
            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                imageUrls = req.files
                    .filter(file => file && file.filename)
                    .map(file => `/uploads/products/${file.filename}`);
            }
            if (imageUrls.length > 0) {
                data = { ...data, images: imageUrls };
            }
            // Validar talles permitidos
            const allowedSizes = ['Talle único', 'S', 'M', 'L', '36', '38', '40', '42'];
            if (data.tallas && !allowedSizes.includes(data.tallas)) {
                return res.status(400).json({ success: false, message: 'Talle inválido. Los valores permitidos son: ' + allowedSizes.join(', ') });
            }
            // Log de depuración para ver los datos recibidos
            console.log('[createProduct] data recibido:', data);

            // Parsear campos numéricos y mapear los campos requeridos por la base de datos (Inglés a Español)
            const mappedData = {
                nombre: data.name || null,
                codigo: data.sku || null, // SKU convertido a codigo
                categoria_id: data.category_id ? parseInt(data.category_id) : null,
                supplier_id: data.supplier_id ? parseInt(data.supplier_id) : null,
                tallas: data.tallas || data.size || null,
                colores: data.colores || data.color || null,
                ubicacion: data.ubicacion || null,
                estado: (parseInt(data.quantity) || 0) > 0 ? 'activo' : 'sin_stock',
                notas: data.notas || null,
                imagen_url: (data.images && data.images.length > 0) ? JSON.stringify(data.images) : null,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Si cantidad no está presente o es vacío, poner 1
            if (!('quantity' in data) || data.quantity === '' || data.quantity === undefined || data.quantity === null) {
                data.quantity = 1;
            }
            mappedData.stock = parseInt(data.quantity) || 0;
            mappedData.stock_minimo = data.min_stock ? parseInt(data.min_stock) : 0;
            mappedData.precio = data.sale_price ? parseFloat(data.sale_price) : 0;
            mappedData.costo = data.cost_price ? parseFloat(data.cost_price) : 0;

            const newProduct = await Product.create(mappedData);
            res.status(201).json({ success: true, data: newProduct });
        } catch (error) {
            console.error('Error al crear producto:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async updateProduct(req, res) {
        // Log para ver el contenido real del body recibido
        console.log('[updateProduct] req.body:', req.body);
        try {
            const { id } = req.params;
            let data = req.body;
            let imagenesFinal = [];
            if (req.files && req.files.length > 0) {
                // Si se subieron nuevas imágenes, usar esas
                imagenesFinal = req.files.map(file => `/uploads/products/${file.filename}`);
            } else if (Array.isArray(data.images) && data.images.length > 0) {
                // Si no se subieron nuevas, usar las existentes
                imagenesFinal = data.images.filter(img => img && img !== 'undefined');
            } else if (data.imagen_url) {
                // Si viene como string, intentar parsear
                try {
                    const arr = JSON.parse(data.imagen_url);
                    if (Array.isArray(arr)) imagenesFinal = arr.filter(img => img && img !== 'undefined');
                } catch { }
            }

            // Asegurar que armamos el objeto solo con los campos permitidos/necesarios
            // Mapear todos los campos relevantes directamente desde data
            const mappedData = {
                nombre: data.nombre,
                codigo: data.codigo,
                categoria_id: data.categoria_id,
                supplier_id: data.supplier_id,
                tallas: data.tallas,
                colores: data.colores,
                ubicacion: data.ubicacion,
                estado: (parseInt(data.stock) || 0) > 0 ? 'activo' : 'sin_stock',
                notas: data.notas,
                imagen_url: JSON.stringify(imagenesFinal),
                stock: data.stock,
                stock_minimo: data.stock_minimo,
                precio: data.precio,
                costo: data.costo
            };

            // Validación de campos obligatorios y tipos
            if (!mappedData.nombre || typeof mappedData.nombre !== 'string' || mappedData.nombre.trim() === '') {
                return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio.' });
            }
            if (mappedData.precio === undefined || isNaN(mappedData.precio)) {
                return res.status(400).json({ success: false, message: 'El precio debe ser un número válido.' });
            }
            if (mappedData.stock === undefined || isNaN(mappedData.stock)) {
                return res.status(400).json({ success: false, message: 'El stock debe ser un número entero.' });
            }
            if ('imagen_url' in mappedData && typeof mappedData.imagen_url !== 'string') {
                return res.status(400).json({ success: false, message: 'El campo imagen_url debe ser un string.' });
            }
            // Si pasa validación, actualizar
            const updatedProduct = await Product.update(id, mappedData);
            res.status(200).json({ success: true, data: updatedProduct });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
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
