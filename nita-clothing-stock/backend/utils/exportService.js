const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Exportar ventas a PDF
exports.exportSalesToPDF = (sales, stream) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  // Encabezado
  doc.fontSize(20).text('Reporte de Ventas', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
  doc.moveDown(2);

  // Tabla de ventas
  let y = doc.y;
  
  // Encabezados
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Nº Venta', 50, y, { width: 70 });
  doc.text('Fecha', 120, y, { width: 80 });
  doc.text('Cliente', 200, y, { width: 150 });
  doc.text('Total', 350, y, { width: 80, align: 'right' });
  doc.text('Método', 430, y, { width: 100 });
  
  y += 20;
  doc.moveTo(50, y).lineTo(530, y).stroke();
  y += 10;

  // Datos
  doc.font('Helvetica').fontSize(9);
  sales.forEach(sale => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.text(sale.sale_number || sale.id, 50, y, { width: 70 });
    doc.text(new Date(sale.sale_date).toLocaleDateString('es-ES'), 120, y, { width: 80 });
    doc.text(sale.customer_email || 'N/A', 200, y, { width: 150 });
    doc.text(`$${parseFloat(sale.total).toFixed(2)}`, 350, y, { width: 80, align: 'right' });
    doc.text(sale.payment_method || 'N/A', 430, y, { width: 100 });
    
    y += 20;
  });

  // Total
  doc.moveDown(2);
  doc.fontSize(12).font('Helvetica-Bold');
  const totalAmount = sales.reduce((sum, sale) => sum + parseFloat(sale.total || 0), 0);
  doc.text(`Total: $${totalAmount.toFixed(2)}`, { align: 'right' });

  doc.end();
};

// Exportar productos a PDF
exports.exportProductsToPDF = (products, stream) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  doc.fontSize(20).text('Listado de Productos', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
  doc.moveDown(2);

  let y = doc.y;
  
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('SKU', 50, y, { width: 80 });
  doc.text('Nombre', 130, y, { width: 200 });
  doc.text('Stock', 330, y, { width: 60, align: 'right' });
  doc.text('Precio', 390, y, { width: 70, align: 'right' });
  doc.text('Estado', 460, y, { width: 80 });
  
  y += 20;
  doc.moveTo(50, y).lineTo(540, y).stroke();
  y += 10;

  doc.font('Helvetica').fontSize(9);
  products.forEach(prod => {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    doc.text(prod.sku || 'N/A', 50, y, { width: 80 });
    doc.text(prod.nombre || prod.name, 130, y, { width: 200 });
    doc.text(prod.cantidad || prod.stock_quantity || 0, 330, y, { width: 60, align: 'right' });
    doc.text(`$${parseFloat(prod.precio_venta || prod.sale_price || 0).toFixed(2)}`, 390, y, { width: 70, align: 'right' });
    doc.text(prod.estado || prod.status || 'N/A', 460, y, { width: 80 });
    
    y += 20;
  });

  doc.end();
};

// Exportar clientes a Excel
exports.exportCustomersToExcel = async (customers) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clientes');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Nombre', key: 'name', width: 25 },
    { header: 'Teléfono', key: 'phone', width: 15 },
    { header: 'Total Compras', key: 'total_purchases', width: 15 },
    { header: 'Cantidad Compras', key: 'purchase_count', width: 15 },
    { header: 'Última Compra', key: 'last_purchase_date', width: 20 },
    { header: 'Cliente Desde', key: 'customer_since', width: 20 }
  ];

  customers.forEach(customer => {
    worksheet.addRow({
      id: customer.id,
      email: customer.email,
      name: customer.name || 'N/A',
      phone: customer.phone || 'N/A',
      total_purchases: parseFloat(customer.total_purchases || 0).toFixed(2),
      purchase_count: customer.purchase_count || 0,
      last_purchase_date: customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString('es-ES') : 'N/A',
      customer_since: customer.customer_since ? new Date(customer.customer_since).toLocaleDateString('es-ES') : 'N/A'
    });
  });

  // Estilo de encabezados
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };

  return workbook;
};

// Exportar reportes a Excel
exports.exportReportsToExcel = async (reportData) => {
  const workbook = new ExcelJS.Workbook();
  
  // Hoja de ventas
  const salesSheet = workbook.addWorksheet('Ventas');
  salesSheet.columns = [
    { header: 'Período', key: 'period', width: 20 },
    { header: 'Total Ventas', key: 'total', width: 15 },
    { header: 'Cantidad', key: 'count', width: 12 },
    { header: 'Promedio', key: 'average', width: 15 }
  ];

  if (reportData.sales) {
    reportData.sales.forEach(row => salesSheet.addRow(row));
  }

  // Hoja de productos
  const productsSheet = workbook.addWorksheet('Productos');
  productsSheet.columns = [
    { header: 'Producto', key: 'product', width: 30 },
    { header: 'Cantidad Vendida', key: 'quantity', width: 15 },
    { header: 'Total Ventas', key: 'total', width: 15 },
    { header: 'Ganancia', key: 'profit', width: 15 }
  ];

  if (reportData.products) {
    reportData.products.forEach(row => productsSheet.addRow(row));
  }

  // Estilo
  [salesSheet, productsSheet].forEach(sheet => {
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };
  });

  return workbook;
};
