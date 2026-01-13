const exportService = require('../utils/exportService');
const db = require('../config/database');

// Exportar ventas a PDF
exports.exportSalesPDF = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
    let query = 'SELECT * FROM sales WHERE 1=1';
    const params = [];

    if (dateFrom) {
      query += ' AND DATE(sale_date) >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ' AND DATE(sale_date) <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY sale_date DESC';

    const sales = await db.all(query, params);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ventas-${Date.now()}.pdf`);

    exportService.exportSalesToPDF(sales, res);
  } catch (error) {
    console.error('Error exportando ventas a PDF:', error);
    res.status(500).json({ message: 'Error al exportar', error: error.message });
  }
};

// Exportar productos a PDF
exports.exportProductsPDF = async (req, res) => {
  try {
    const products = await db.all('SELECT * FROM productos ORDER BY nombre');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=productos-${Date.now()}.pdf`);

    exportService.exportProductsToPDF(products, res);
  } catch (error) {
    console.error('Error exportando productos a PDF:', error);
    res.status(500).json({ message: 'Error al exportar', error: error.message });
  }
};

// Exportar clientes a Excel
exports.exportCustomersExcel = async (req, res) => {
  try {
    const customers = await db.all('SELECT * FROM customers ORDER BY name');

    const workbook = await exportService.exportCustomersToExcel(customers);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=clientes-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exportando clientes:', error);
    res.status(500).json({ message: 'Error al exportar', error: error.message });
  }
};

// Exportar reportes a Excel
exports.exportReportsExcel = async (req, res) => {
  try {
    // Obtener datos de reportes
    const salesData = await db.all(`
      SELECT DATE(sale_date) as period, SUM(total) as total, COUNT(*) as count, AVG(total) as average
      FROM sales
      WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(sale_date)
      ORDER BY period DESC
    `);

    const productsData = await db.all(`
      SELECT p.nombre as product, SUM(si.quantity) as quantity, SUM(si.subtotal) as total, SUM(si.profit) as profit
      FROM sale_items si
      JOIN productos p ON si.product_id = p.id
      GROUP BY si.product_id
      ORDER BY quantity DESC
      LIMIT 20
    `);

    const reportData = {
      sales: salesData,
      products: productsData
    };

    const workbook = await exportService.exportReportsToExcel(reportData);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reportes-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exportando reportes:', error);
    res.status(500).json({ message: 'Error al exportar', error: error.message });
  }
};
