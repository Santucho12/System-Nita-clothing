import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api';
import { toast } from 'react-toastify';
import { exportToExcel, formatProductsForExport } from '../utils/exportUtils';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    size: '',
    sale_price: '',
    cost_price: '',
    quantity: '',
    min_stock: '',
    supplier_id: '',
    images: [], // array de archivos o urls
    status: 'disponible',
    sku: '',
    barcode: '',
    category_id: ''
  });
  const [showDetail, setShowDetail] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtrar productos cuando cambia la categoría seleccionada o término de búsqueda
  useEffect(() => {
    if (selectedCategory || searchTerm || selectedSize || selectedColor || selectedStatus) {
      filterProducts();
    } else {
      loadProducts();
    }
  }, [selectedCategory, searchTerm, selectedSize, selectedColor, selectedStatus]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadProducts(), loadCategories()]);
    } catch (error) {
      toast.error('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data || []);
    } catch (error) {
      toast.error('Error cargando productos: ' + error.message);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data || []);
    } catch (error) {
      toast.error('Error cargando categorías: ' + error.message);
    }
  };

  // Cambiar estado del producto
  const handleChangeStatus = async (product, newStatus) => {
    if (!window.confirm(`¿Cambiar estado a "${newStatus}"?`)) return;
    try {
      await productService.changeStatus(product.id, newStatus);
      toast.success('Estado actualizado');
      loadProducts();
    } catch (error) {
      toast.error('Error cambiando estado: ' + error.message);
    }
  };

  const filterProducts = async () => {
    try {
      let filtered = [];
      if (searchTerm) {
        const response = await productService.search(searchTerm);
        filtered = response.data || [];
      } else if (selectedCategory) {
        const response = await productService.getByCategory(selectedCategory);
        filtered = response.data || [];
      } else {
        const response = await productService.getAll();
        filtered = response.data || [];
      }
      // Filtros locales
      if (selectedSize) filtered = filtered.filter(p => p.size === selectedSize);
      if (selectedColor) filtered = filtered.filter(p => p.color && p.color.toLowerCase() === selectedColor.toLowerCase());
      if (selectedStatus) filtered = filtered.filter(p => p.status === selectedStatus);
      setProducts(filtered);
    } catch (error) {
      toast.error('Error filtrando productos: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        images: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validaciones mínimas
    if (!formData.name.trim() || !formData.color.trim() || !formData.category_id) {
      toast.error('Nombre, color y categoría son requeridos');
      return;
    }
    if (formData.quantity === '' || parseInt(formData.quantity) < 0) {
      toast.error('La cantidad debe ser un número mayor o igual a 0');
      return;
    }
    if (!formData.size.trim()) {
      toast.error('El talle es requerido');
      return;
    }
    if (!formData.sale_price || isNaN(parseFloat(formData.sale_price))) {
      toast.error('Precio de venta requerido');
      return;
    }
    if (!formData.cost_price || isNaN(parseFloat(formData.cost_price))) {
      toast.error('Precio de costo requerido');
      return;
    }
    if (!formData.min_stock || isNaN(parseInt(formData.min_stock))) {
      toast.error('Stock mínimo requerido');
      return;
    }
    // supplier_id puede ser opcional por ahora
    try {
      const productData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        min_stock: parseInt(formData.min_stock),
        sale_price: parseFloat(formData.sale_price),
        cost_price: parseFloat(formData.cost_price),
        category_id: parseInt(formData.category_id),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        images: formData.images // array de archivos o urls
      };
      if (editingProduct) {
        await productService.update(editingProduct.id, productData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await productService.create(productData);
        toast.success('Producto creado exitosamente');
      }
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  // Duplicar producto
  const handleDuplicate = async (product) => {
    if (!window.confirm('¿Deseas duplicar este producto?')) return;
    try {
      await productService.duplicate(product.id);
      toast.success('Producto duplicado exitosamente');
      loadProducts();
    } catch (error) {
      toast.error('Error duplicando producto: ' + error.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      color: product.color,
      size: product.size || '',
      sale_price: product.sale_price?.toString() || '',
      cost_price: product.cost_price?.toString() || '',
      quantity: product.quantity?.toString() || '',
      min_stock: product.min_stock?.toString() || '',
      supplier_id: product.supplier_id?.toString() || '',
      images: product.images || [],
      status: product.status || 'disponible',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category_id: product.category_id?.toString() || ''
    });
    setShowForm(true);
  };

  const handleShowDetail = (product) => {
    setDetailProduct(product);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setDetailProduct(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productService.delete(id);
        toast.success('Producto eliminado exitosamente');
        loadProducts();
      } catch (error) {
        toast.error('Error eliminando producto: ' + error.message);
      }
    }
  };

  const handleUpdateStock = async (productId, currentQuantity) => {
    const newQuantity = prompt(`Stock actual: ${currentQuantity}\nIngresa la nueva cantidad:`, currentQuantity);
    
    if (newQuantity !== null) {
      const quantity = parseInt(newQuantity);
      if (isNaN(quantity) || quantity < 0) {
        toast.error('La cantidad debe ser un número mayor o igual a 0');
        return;
      }

      try {
        await productService.updateStock(productId, quantity);
        toast.success('Stock actualizado exitosamente');
        loadProducts();
      } catch (error) {
        toast.error('Error actualizando stock: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '',
      size: '',
      sale_price: '',
      cost_price: '',
      quantity: '',
      min_stock: '',
      supplier_id: '',
      images: [],
      status: 'disponible',
      sku: '',
      barcode: '',
      category_id: ''
    });
    setShowForm(false);
    setEditingProduct(null);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  // Indicadores visuales de stock según reglas del sistema
  const getStockStatus = (quantity, min_stock = 1) => {
    if (quantity <= 0 || quantity < (min_stock * 0.5)) return 'stock-critical';
    if (quantity < min_stock && quantity > 0) return 'stock-low';
    if (quantity >= min_stock) return 'stock-ok';
    return 'stock-unknown';
  };

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando productos...</p>
      </div>
    );
  };

  // Exportar productos a Excel
  const handleExport = () => {
    if (products.length === 0) {
      toast.warning('No hay productos para exportar');
      return;
    }
    const formattedData = formatProductsForExport(products);
    const filename = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToExcel(formattedData, filename, 'Productos');
    toast.success('Productos exportados exitosamente');
  };

  return (
    <div className="products-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-tshirt"></i>
          Gestión de Productos
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-success"
            onClick={handleExport}
            style={{ background: '#28a745', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fas fa-file-excel"></i>
            Exportar Excel
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <i className="fas fa-plus"></i>
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="search">Buscar productos:</label>
          <input
            type="text"
            id="search"
            placeholder="Buscar por nombre, SKU o color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="category-filter">Categoría:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="size-filter">Talle:</label>
          <select
            id="size-filter"
            value={selectedSize}
            onChange={e => setSelectedSize(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
            <option value="Único">Único</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="color-filter">Color:</label>
          <input
            type="text"
            id="color-filter"
            value={selectedColor}
            onChange={e => setSelectedColor(e.target.value)}
            placeholder="Todos"
          />
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter">Estado:</label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="sin_stock">Sin stock</option>
            <option value="descontinuado">Descontinuado</option>
          </select>
        </div>
        {(selectedCategory || searchTerm || selectedSize || selectedColor || selectedStatus) && (
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSelectedCategory('');
              setSearchTerm('');
              setSelectedSize('');
              setSelectedColor('');
              setSelectedStatus('');
            }}
          >
            <i className="fas fa-times"></i>
            Limpiar filtros
          </button>
        )}
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-header">
            <h3>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <button 
              className="btn btn-ghost"
              onClick={resetForm}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Nombre *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Remera Básica, Jean Skinny..."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="color">Color *</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="Ej: Blanco, Negro, Azul..."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="size">Talle *</label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecciona un talle</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                  <option value="Único">Único</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sale_price">Precio de venta *</label>
                <input
                  type="number"
                  id="sale_price"
                  name="sale_price"
                  value={formData.sale_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cost_price">Precio de costo *</label>
                <input
                  type="number"
                  id="cost_price"
                  name="cost_price"
                  value={formData.cost_price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="min_stock">Stock mínimo *</label>
                <input
                  type="number"
                  id="min_stock"
                  name="min_stock"
                  value={formData.min_stock}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quantity">Cantidad *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category_id">Categoría *</label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="supplier_id">Proveedor</label>
                <input
                  type="number"
                  id="supplier_id"
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sku">SKU</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="Código único"
                />
              </div>
              <div className="form-group">
                <label htmlFor="barcode">Código de barras</label>
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  placeholder="Opcional"
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Estado</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="disponible">Disponible</option>
                  <option value="sin_stock">Sin stock</option>
                  <option value="descontinuado">Descontinuado</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="images">Imágenes</label>
              <input
                type="file"
                id="images"
                name="images"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleInputChange}
              />
              {/* Preview de imágenes seleccionadas */}
              {formData.images && formData.images.length > 0 && (
                <div className="image-preview-list">
                  {Array.from(formData.images).map((img, idx) => (
                    <img
                      key={idx}
                      src={img instanceof File ? URL.createObjectURL(img) : img}
                      alt={`preview-${idx}`}
                      style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 8 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save"></i>
                {editingProduct ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="products-grid">
        {products.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-tshirt"></i>
            <h3>No hay productos</h3>
            <p>
              {searchTerm || selectedCategory 
                ? 'No se encontraron productos con los filtros aplicados'
                : 'Crea tu primer producto para empezar a gestionar tu inventario'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                <i className="fas fa-plus"></i>
                Crear Primer Producto
              </button>
            )}
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-gallery" onClick={() => handleShowDetail(product)} style={{ cursor: 'pointer' }}>
                {product.images && product.images.length > 0 ? (
                  <div className="gallery-thumbs">
                    {product.images.slice(0, 3).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`img-${idx}`}
                        style={{ width: 60, height: 60, objectFit: 'cover', marginRight: 4, borderRadius: 4, border: idx === 0 ? '2px solid #007bff' : '1px solid #ccc' }}
                      />
                    ))}
                    {product.images.length > 3 && (
                      <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>+{product.images.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <div className="no-image">Sin imagen</div>
                )}
              </div>
              <div className="product-content">
                <div className="product-header">
                  <h3>{product.name}</h3>
                  <div className="product-actions">
                                        <select
                                          className="btn btn-sm btn-status"
                                          value={product.status}
                                          onChange={e => handleChangeStatus(product, e.target.value)}
                                          style={{ marginRight: 8 }}
                                        >
                                          <option value="disponible">Disponible</option>
                                          <option value="sin_stock">Sin stock</option>
                                          <option value="descontinuado">Descontinuado</option>
                                        </select>
                    <button 
                      className="btn btn-icon btn-edit"
                      onClick={() => handleEdit(product)}
                      title="Editar producto"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn btn-icon btn-copy"
                      onClick={() => handleDuplicate(product)}
                      title="Duplicar producto"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                    <button 
                      className="btn btn-icon btn-delete"
                      onClick={() => handleDelete(product.id)}
                      title="Eliminar producto"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="product-details">
                  <p><strong>Color:</strong> {product.color}</p>
                  <p><strong>Categoría:</strong> {getCategoryName(product.category_id)}</p>
                  <div className="stock-info">
                    <span className={`stock-badge ${getStockStatus(product.quantity, product.min_stock)}`}>
                      <i className="fas fa-boxes"></i>
                      Stock: {product.quantity}
                    </span>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleUpdateStock(product.id, product.quantity)}
                      title="Actualizar stock"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                </div>
                <div className="product-meta">
                  <small>
                    <i className="fas fa-calendar"></i>
                    Creado: {new Date(product.created_at).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalle de producto con galería de imágenes */}
      {showDetail && detailProduct && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-detail" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, background: '#fff', borderRadius: 8, padding: 24, position: 'relative' }}>
            <button className="btn btn-ghost" style={{ position: 'absolute', top: 8, right: 8 }} onClick={handleCloseDetail}>
              <i className="fas fa-times"></i>
            </button>
            <h2>{detailProduct.name}</h2>
            <div className="detail-gallery" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {detailProduct.images && detailProduct.images.length > 0 ? (
                detailProduct.images.map((img, idx) => (
                  <img key={idx} src={img} alt={`img-${idx}`} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 6, border: idx === 0 ? '2px solid #007bff' : '1px solid #ccc' }} />
                ))
              ) : (
                <div>Sin imágenes</div>
              )}
            </div>
            <div>
              <p><strong>Color:</strong> {detailProduct.color}</p>
              <p><strong>Talle:</strong> {detailProduct.size}</p>
              <p><strong>Categoría:</strong> {getCategoryName(detailProduct.category_id)}</p>
              <p><strong>Precio de venta:</strong> ${detailProduct.sale_price}</p>
              <p><strong>Precio de costo:</strong> ${detailProduct.cost_price}</p>
              <p><strong>Stock:</strong> {detailProduct.quantity}</p>
              <p><strong>Estado:</strong> {detailProduct.status}</p>
              <p><strong>SKU:</strong> {detailProduct.sku}</p>
              <p><strong>Código de barras:</strong> {detailProduct.barcode}</p>
              <p><strong>Proveedor:</strong> {detailProduct.supplier_id || 'N/A'}</p>
              <p><strong>Creado:</strong> {new Date(detailProduct.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;