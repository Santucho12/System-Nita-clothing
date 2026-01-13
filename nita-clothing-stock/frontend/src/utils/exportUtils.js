import * as XLSX from 'xlsx';

// Exportar array de objetos a Excel
export const exportToExcel = (data, filename = 'export.xlsx', sheetName = 'Sheet1') => {
  if (!data || data.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  XLSX.writeFile(wb, filename);
};

// Exportar múltiples hojas
export const exportMultipleSheets = (sheets, filename = 'export.xlsx') => {
  if (!sheets || sheets.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const wb = XLSX.utils.book_new();
  
  sheets.forEach(({ data, sheetName }) => {
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });
  
  XLSX.writeFile(wb, filename);
};

// Formatear datos de ventas para exportar
export const formatSalesForExport = (sales) => {
  return sales.map(sale => ({
    'N° Venta': sale.sale_number,
    'Fecha': new Date(sale.sale_date).toLocaleDateString(),
    'Cliente': sale.customer_email || 'Sin cliente',
    'Subtotal': `$${parseFloat(sale.subtotal).toFixed(2)}`,
    'Descuento': `${sale.discount_percent || 0}%`,
    'Total': `$${parseFloat(sale.total).toFixed(2)}`,
    'Método Pago': sale.payment_method,
    'Estado': sale.status,
    'Vendedor': sale.seller_name || 'N/A'
  }));
};

// Formatear datos de productos para exportar
export const formatProductsForExport = (products) => {
  return products.map(product => ({
    'Código': product.sku || product.id,
    'Nombre': product.name,
    'Categoría': product.category_name || 'Sin categoría',
    'Talle': product.size,
    'Color': product.color,
    'Stock': product.stock_quantity,
    'Stock Mínimo': product.min_stock,
    'Precio Costo': `$${parseFloat(product.cost_price || 0).toFixed(2)}`,
    'Precio Venta': `$${parseFloat(product.sale_price || 0).toFixed(2)}`,
    'Estado': product.status,
    'Proveedor': product.supplier_name || 'N/A'
  }));
};

// Formatear datos de clientes para exportar
export const formatCustomersForExport = (customers) => {
  return customers.map(customer => ({
    'Email': customer.email,
    'Nombre': customer.name || 'N/A',
    'Teléfono': customer.phone || 'N/A',
    'Ciudad': customer.city || 'N/A',
    'Total Compras': `$${parseFloat(customer.total_purchases || 0).toFixed(2)}`,
    'Cantidad Compras': customer.purchase_count || 0,
    'Última Compra': customer.last_purchase_date 
      ? new Date(customer.last_purchase_date).toLocaleDateString() 
      : 'Nunca',
    'Cliente Desde': new Date(customer.customer_since).toLocaleDateString(),
    'Estado': customer.status || 'active'
  }));
};

// Formatear datos de reservas para exportar
export const formatReservationsForExport = (reservations) => {
  return reservations.map(reservation => ({
    'N° Reserva': reservation.reservation_number,
    'Cliente': reservation.customer_name,
    'Email': reservation.customer_email,
    'Teléfono': reservation.customer_phone || 'N/A',
    'Fecha Reserva': new Date(reservation.reservation_date).toLocaleDateString(),
    'Vencimiento': new Date(reservation.expiration_date).toLocaleDateString(),
    'Monto Total': `$${parseFloat(reservation.total_amount).toFixed(2)}`,
    'Seña': `$${parseFloat(reservation.deposit_amount).toFixed(2)}`,
    'Restante': `$${parseFloat(reservation.remaining_amount).toFixed(2)}`,
    'Estado': reservation.status,
    'Método Pago': reservation.payment_method
  }));
};

// Formatear datos de proveedores para exportar
export const formatSuppliersForExport = (suppliers) => {
  return suppliers.map(supplier => ({
    'Nombre': supplier.name,
    'Contacto': supplier.contact_name || 'N/A',
    'Email': supplier.email || 'N/A',
    'Teléfono': supplier.phone || 'N/A',
    'CUIT': supplier.tax_id || 'N/A',
    'Dirección': supplier.address || 'N/A',
    'Ciudad': supplier.city || 'N/A',
    'Provincia': supplier.state || 'N/A',
    'Términos de Pago': supplier.payment_terms || 'N/A',
    'Estado': supplier.status || 'active'
  }));
};

// Formatear datos de cambios/devoluciones para exportar
export const formatExchangesReturnsForExport = (exchanges) => {
  return exchanges.map(exchange => ({
    'ID': exchange.id,
    'Tipo': exchange.type === 'exchange' ? 'Cambio' : 'Devolución',
    'Venta Original': exchange.original_sale_id,
    'Cliente': exchange.customer_email,
    'Producto Original': exchange.original_product_name || 'N/A',
    'Producto Nuevo': exchange.new_product_name || 'N/A',
    'Motivo': exchange.reason,
    'Diferencia': `$${parseFloat(exchange.price_difference || 0).toFixed(2)}`,
    'Reembolso': `$${parseFloat(exchange.refund_amount || 0).toFixed(2)}`,
    'Fecha': new Date(exchange.processed_date).toLocaleDateString(),
    'Estado': exchange.status
  }));
};

export default {
  exportToExcel,
  exportMultipleSheets,
  formatSalesForExport,
  formatProductsForExport,
  formatCustomersForExport,
  formatReservationsForExport,
  formatSuppliersForExport,
  formatExchangesReturnsForExport
};
