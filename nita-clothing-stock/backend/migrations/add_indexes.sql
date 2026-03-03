-- Optimización de Base de Datos Nita Clothing
-- Añadir índices para búsquedas frecuentes y claves foráneas

-- Ventas
ALTER TABLE sales ADD INDEX idx_sales_customer_email (customer_email);
ALTER TABLE sales ADD INDEX idx_sales_status (status);
ALTER TABLE sales ADD INDEX idx_sales_created_at (created_at);

-- Items de Venta
ALTER TABLE sale_items ADD INDEX idx_venta_items_product_id (product_id);
ALTER TABLE sale_items ADD INDEX idx_venta_items_sale_id (sale_id);

-- Productos
ALTER TABLE productos ADD INDEX idx_productos_codigo (codigo);
ALTER TABLE productos ADD INDEX idx_productos_categoria (categoria_id);
ALTER TABLE productos ADD INDEX idx_productos_estado (estado);

-- Clientes
ALTER TABLE clientes ADD INDEX idx_clientes_email (email);
ALTER TABLE clientes ADD INDEX idx_clientes_phone (phone);
