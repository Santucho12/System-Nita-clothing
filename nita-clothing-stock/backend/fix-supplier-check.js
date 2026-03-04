require('dotenv').config();
const fs = require('fs');

const filePath = 'controllers/productController.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Supplier require at the top
if (!content.includes("require('../models/Supplier')")) {
    content = content.replace(
        "const Product = require('../models/Product');",
        "const Product = require('../models/Product');\nconst Supplier = require('../models/Supplier');"
    );
    console.log('✅ Added Supplier require');
}

// 2. Add proveedor field to mappedData in createProduct and supplier validation
const oldCreateBlock = `            const stockQty = parseInt(data.stock || data.quantity) || 0;
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
            };`;

const newCreateBlock = `            // Validar proveedor activo si se especifica
            const supplierId = data.proveedor || data.supplier_id ? parseInt(data.proveedor || data.supplier_id) : null;
            if (supplierId) {
                const supplier = await Supplier.getById(supplierId);
                if (!supplier) {
                    const error = new Error('El proveedor seleccionado no existe.');
                    error.status = 404;
                    throw error;
                }
                if (supplier.status === 'inactive') {
                    const error = new Error(\`No se puede agregar el producto porque el proveedor "\${supplier.company_name || supplier.name}" está inactivo. Activá el proveedor primero o seleccioná otro.\`);
                    error.status = 400;
                    throw error;
                }
            }

            const stockQty = parseInt(data.stock || data.quantity) || 0;
            const mappedData = {
                nombre: data.nombre || data.name || null,
                codigo: data.sku || data.codigo || null,
                categoria_id: data.categoria_id || data.category_id ? parseInt(data.categoria_id || data.category_id) : null,
                proveedor: supplierId,
                tallas: data.tallas || data.size || null,
                colores: data.colores || data.color || null,
                estado: stockQty > 0 ? 'activo' : 'sin_stock',
                imagen_url: (imageUrls.length > 0) ? JSON.stringify(imageUrls) : (data.imagen_url || null),
                stock: stockQty,
                precio: parseFloat(data.precio || data.sale_price) || 0,
                costo: parseFloat(data.costo || data.cost_price) || 0,
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            };`;

if (content.includes(oldCreateBlock)) {
    content = content.replace(oldCreateBlock, newCreateBlock);
    console.log('✅ Added supplier validation to createProduct');
} else {
    console.log('❌ Could not find createProduct block to replace');
    // Try to find partial match
    if (content.includes('const stockQty = parseInt(data.stock || data.quantity)')) {
        console.log('   Found stockQty line - attempting line-by-line replacement');
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ File saved. Size:', fs.statSync(filePath).size, 'bytes');
