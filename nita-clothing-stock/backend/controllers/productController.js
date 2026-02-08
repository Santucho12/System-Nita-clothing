        const Product = require('../models/Product');
        const path = require('path');
        const fs = require('fs');

        class ProductController {
            // Cambiar estado del producto
            static async changeStatus(req, res) {
                try {
                    const { id } = req.params;
                    const { status } = req.body;
                    if (!['disponible', 'sin_stock', 'descontinuado'].includes(status)) {
                        return res.status(400).json({ success: false, message: 'Estado inválido' });
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
                    // Guardar archivos en /uploads y devolver URLs (simulado local)
                    const imageUrls = req.files.map(file => {
                        // En producción, subir a S3/Cloudinary y guardar la URL
                        const url = `/uploads/${file.filename}`;
                        return url;
                    });
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
                    if (req.files && req.files.length > 0) {
                        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
                        data = { ...data, images: imageUrls };
                    }
                    // Parsear campos numéricos
                    if (data.category_id) data.category_id = parseInt(data.category_id);
                    if (data.supplier_id) data.supplier_id = parseInt(data.supplier_id);
                    if (data.quantity) data.quantity = parseInt(data.quantity);
                    if (data.min_stock) data.min_stock = parseInt(data.min_stock);
                    if (data.sale_price) data.sale_price = parseFloat(data.sale_price);
                    if (data.cost_price) data.cost_price = parseFloat(data.cost_price);
                    const newProduct = await Product.create(data);
                    res.status(201).json({ success: true, data: newProduct });
                } catch (error) {
                    res.status(400).json({ success: false, message: error.message });
                }
            }

            static async updateProduct(req, res) {
                try {
                    const { id } = req.params;
                    let data = req.body;
                    if (req.files && req.files.length > 0) {
                        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
                        data = { ...data, images: imageUrls };
                    }
                    // Parsear campos numéricos
                    if (data.category_id) data.category_id = parseInt(data.category_id);
                    if (data.supplier_id) data.supplier_id = parseInt(data.supplier_id);
                    if (data.quantity) data.quantity = parseInt(data.quantity);
                    if (data.min_stock) data.min_stock = parseInt(data.min_stock);
                    if (data.sale_price) data.sale_price = parseFloat(data.sale_price);
                    if (data.cost_price) data.cost_price = parseFloat(data.cost_price);
                    const updatedProduct = await Product.update(id, data);
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
                    const result = await Product.updateStock(id, quantity);
                    res.status(200).json({ success: true, data: result });
                } catch (error) {
                    res.status(400).json({ success: false, message: error.message });
                }
            }

            static async deleteProduct(req, res) {
                try {
                    const { id } = req.params;
                    await Product.delete(id);
                    res.status(200).json({ success: true, message: 'Producto eliminado' });
                } catch (error) {
                    res.status(400).json({ success: false, message: error.message });
                }
            }
        }

        module.exports = ProductController;
