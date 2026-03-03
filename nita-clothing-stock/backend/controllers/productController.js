const Product = require('../models/Product');
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
            if (!['disponible', 'sin_stock'].includes(status)) {
                const error = new Error('Estado inválido');
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
                .map(file => `/uploads/products/${file.filename}`);
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
            const updated = await Product.removeImage(id, `/uploads/${img}`);
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
                    .map(file => `/uploads/products/${file.filename}`);
            }

            // Simplificación del mapeo de datos: alineando nombres de frontend con DB
            const mappedData = {
                nombre: data.nombre || data.name || null,
                codigo: data.sku || data.codigo || null,
                sku: data.sku || data.codigo || null,
                categoria_id: data.categoria_id || data.category_id ? parseInt(data.categoria_id || data.category_id) : null,
                tallas: data.tallas || data.size || null,
                colores: data.colores || data.color || null,
                estado: (parseInt(data.stock || data.quantity) || 0) === 0 ? 'sin_stock' : 'disponible',
                imagen_url: (imageUrls.length > 0) ? JSON.stringify(imageUrls) : (data.imagen_url || null),
                stock: parseInt(data.stock || data.quantity) || 0,
                precio: parseFloat(data.precio || data.sale_price) || 0,
                costo: parseFloat(data.costo || data.cost_price) || 0,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };

            // Validar SKU duplicado
            if (mappedData.codigo) {
                const skuExists = await Product.checkSkuExists(mappedData.codigo);
                if (skuExists) {
                    const error = new Error(`El SKU/Código "${mappedData.codigo}" ya está en uso.`);
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

            // Procesar nuevas imágenes (asegurando ruta consistente)
            const newImageUrls = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];
            const finalImageUrls = [...currentImages, ...newImageUrls];

            const mappedData = {
                nombre: data.nombre || data.name,
                codigo: data.sku || data.codigo,
                sku: data.sku || data.codigo,
                categoria_id: data.categoria_id || data.category_id,
                tallas: data.tallas || data.size,
                colores: data.colores || data.color,
                estado: (parseInt(data.stock || data.quantity) || 0) === 0 ? 'sin_stock' : 'disponible',
                imagen_url: JSON.stringify(finalImageUrls),
                stock: parseInt(data.stock || data.quantity) || 0,
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
                    const error = new Error(`El SKU/Código "${mappedData.codigo}" ya está en uso por otro producto.`);
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

            // Obtener producto para el log
            const product = await Product.getById(id);
            if (!product) {
                const error = new Error('Producto no encontrado');
                error.status = 404;
                throw error;
            }

            const currentStock = product.stock;
            const result = await Product.updateStock(id, quantity);

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
            res.status(200).json({ success: true, message: 'Producto eliminado (Soft Delete)' });
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
