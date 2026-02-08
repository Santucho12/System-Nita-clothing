import React, { useState, useEffect } from 'react';
import { productService, categoryService, supplierService } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaTshirt, FaPlus, FaEdit, FaTrash, FaCopy, FaSearch, FaFilter, 
  FaFileExcel, FaTimes, FaBox, FaDollarSign, FaBarcode, FaTag,
  FaPalette, FaRulerVertical, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle,
  FaTimesCircle, FaEye, FaSave, FaBoxes
} from 'react-icons/fa';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });

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
      await Promise.all([loadProducts(), loadCategories(), loadSuppliers()]);
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

  const loadSuppliers = async () => {
    try {
      const response = await supplierService.getAll();
      setSuppliers(response.data || []);
    } catch (error) {
      toast.error('Error cargando proveedores: ' + error.message);
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
      if (selectedSize) filtered = filtered.filter(p => p.tallas === selectedSize);
      if (selectedColor) filtered = filtered.filter(p => p.colores && p.colores.toLowerCase().includes(selectedColor.toLowerCase()));
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
        colores: formData.color,
        tallas: formData.size,
        quantity: parseInt(formData.quantity),
        min_stock: parseInt(formData.min_stock),
        sale_price: parseFloat(formData.sale_price),
        cost_price: parseFloat(formData.cost_price),
        category_id: parseInt(formData.category_id),
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        images: formData.images // array de archivos o urls
      };
      // Eliminar los campos antiguos
      delete productData.color;
      delete productData.size;
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
      color: product.colores || '',
      size: product.tallas || '',
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
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '2em', color: '#f73194' }}>⏳</div>
        <p>Cargando productos...</p>
      </div>
    );
  };

  // Mostrar modal de funcionalidad próxima
  const handleExport = () => {
    setShowExportModal(true);
  };

  // Manejar creación de categoría
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      toast.warning('El nombre de la categoría es requerido');
      return;
    }

    try {
      await categoryService.create(categoryFormData);
      toast.success('Categoría creada exitosamente');
      setCategoryFormData({ name: '', description: '' });
      setShowCategoryForm(false);
      loadCategories();
    } catch (error) {
      toast.error('Error creando categoría: ' + error.message);
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{ padding: '30px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes perspective3DFlip {
            0% {
              opacity: 0;
              transform: perspective(1000px) rotateY(-15deg) rotateX(10deg);
            }
            100% {
              opacity: 1;
              transform: perspective(1000px) rotateY(0deg) rotateX(0deg);
            }
          }

          .page-header {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          .filters-section {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
          }

          .product-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            transition: all 0.3s ease;
          }

          .product-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(247, 49, 148, 0.2) !important;
          }

          .empty-state {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
          }

          .btn-pink {
            background: #f73194;
            transition: all 0.3s ease;
          }

          .btn-pink:hover {
            transform: scale(1.1) !important;
            background: #f73194 !important;
          }

          .btn-gray {
            background: #6c757d;
            transition: all 0.3s ease;
          }

          .btn-gray:hover {
            transform: scale(1.1) !important;
            background: #6c757d !important;
          }

          .btn-green {
            background: #495057;
            transition: all 0.3s ease;
          }

          .btn-green:hover {
            transform: scale(1.1) !important;
            background: #495057 !important;
          }

          .btn-red {
            background: #dc3545;
            transition: all 0.3s ease;
          }

          .btn-red:hover {
            transform: scale(1.1) !important;
            background: #dc3545 !important;
          }

          .search-input, .filter-input, .filter-select {
            transition: all 0.3s ease;
          }

          .search-input:focus, .filter-input:focus, .filter-select:focus {
            border-color: #f73194 !important;
            box-shadow: 0 0 0 3px rgba(247, 49, 148, 0.1) !important;
            outline: none !important;
          }

          .form-input:focus {
            border-color: #f73194 !important;
            box-shadow: 0 0 0 3px rgba(247, 49, 148, 0.1) !important;
            outline: none !important;
          }
        `}
      </style>

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '28px', color: '#333', fontWeight: '600' }}>
          <FaTshirt style={{ marginRight: '12px', color: '#f73194', fontSize: '32px' }} />
          Stock de Ropa
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-green"
            onClick={handleExport}
            style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
          >
            <FaFileExcel />
            Exportar Excel
          </button>
          <button 
            className="btn-pink"
            onClick={() => setShowForm(true)}
            style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
          >
            <FaPlus />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros horizontales */}
      <div className="filters-section" style={{ marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FaFilter style={{ marginRight: '10px', color: '#f73194', fontSize: '18px' }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>Filtros</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
          {/* Buscar */}
          <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
              <FaSearch style={{ marginRight: '6px', color: '#f73194' }} />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre, SKU o color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', background: '#fafafa' }}
            />
          </div>

          {/* Categoría */}
          <div style={{ flex: '0 0 180px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
              <FaTag style={{ marginRight: '6px', color: '#f73194' }} />
              Categoría
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
                style={{ flex: 1, padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', background: '#fafafa', cursor: 'pointer' }}
              >
                <option value="">Todas</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCategoryForm(true)}
                title="Nueva categoría"
                style={{ padding: '10px 12px', background: '#f73194', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.3s' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                +
              </button>
            </div>
          </div>

          {/* Talle */}
          <div style={{ flex: '0 0 140px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
              <FaRulerVertical style={{ marginRight: '6px', color: '#f73194' }} />
              Talle
            </label>
            <select
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
              className="filter-select"
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', background: '#fafafa', cursor: 'pointer' }}
            >
              <option value="">Todos</option>
              <option value="Talle único">Talle único</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>

          {/* Color */}
          <div style={{ flex: '0 0 160px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
              <FaPalette style={{ marginRight: '6px', color: '#f73194' }} />
              Color
            </label>
            <input
              type="text"
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
              placeholder="Ej: Rojo"
              className="filter-input"
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', background: '#fafafa' }}
            />
          </div>

          {/* Estado */}
          <div style={{ flex: '0 0 170px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
              <FaCheckCircle style={{ marginRight: '6px', color: '#f73194' }} />
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="filter-select"
              style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', background: '#fafafa', cursor: 'pointer' }}
            >
              <option value="">Todos</option>
              <option value="disponible">Disponible</option>
              <option value="sin_stock">Sin stock</option>
              <option value="descontinuado">Descontinuado</option>
            </select>
          </div>

          {/* Limpiar filtros */}
          {(selectedCategory || searchTerm || selectedSize || selectedColor || selectedStatus) && (
            <button 
              className="btn-gray"
              onClick={() => {
                setSelectedCategory('');
                setSearchTerm('');
                setSelectedSize('');
                setSelectedColor('');
                setSelectedStatus('');
              }}
              style={{ padding: '10px 20px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500' }}
            >
              <FaTimes />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Modal Formulario */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={resetForm}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #f0f0f0' }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaTshirt style={{ color: '#f73194' }} />
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#f73194'} onMouseOut={(e) => e.currentTarget.style.color = '#999'}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Fila 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaTshirt style={{ marginRight: '6px', color: '#f73194' }} />
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej: Remera Básica"
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaPalette style={{ marginRight: '6px', color: '#f73194' }} />
                    Color *
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="Ej: Negro"
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaRulerVertical style={{ marginRight: '6px', color: '#f73194' }} />
                    Talle *
                  </label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    <option value="">Selecciona</option>
                    <option value="Talle único">Talle único</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
              </div>

              {/* Fila 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaDollarSign style={{ marginRight: '6px', color: '#f73194' }} />
                    Precio Venta *
                  </label>
                  <input
                    type="number"
                    name="sale_price"
                    value={formData.sale_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaDollarSign style={{ marginRight: '6px', color: '#4CAF50' }} />
                    Precio Costo *
                  </label>
                  <input
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaBoxes style={{ marginRight: '6px', color: '#f73194' }} />
                    Stock Mínimo *
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Fila 3 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaBox style={{ marginRight: '6px', color: '#f73194' }} />
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaTag style={{ marginRight: '6px', color: '#f73194' }} />
                    Categoría *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    <option value="">Selecciona</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>Proveedor</label>
                  <select
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    <option value="">Selecciona</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 4 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaBarcode style={{ marginRight: '6px', color: '#f73194' }} />
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Código único"
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaBarcode style={{ marginRight: '6px', color: '#666' }} />
                    Código Barras
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    placeholder="Opcional"
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>
                    <FaCheckCircle style={{ marginRight: '6px', color: '#f73194' }} />
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="sin_stock">Sin stock</option>
                    <option value="descontinuado">Descontinuado</option>
                  </select>
                </div>
              </div>

              {/* Imágenes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>Imágenes</label>
                <input
                  type="file"
                  name="images"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleInputChange}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
                {formData.images && formData.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {Array.from(formData.images).map((img, idx) => (
                      <img
                        key={idx}
                        src={img instanceof File ? URL.createObjectURL(img) : img}
                        alt={`preview-${idx}`}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #f73194' }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '2px solid #f0f0f0' }}>
                <button 
                  type="button" 
                  className="btn-gray" 
                  onClick={resetForm}
                  style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
                >
                  <FaTimes />
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-pink"
                  style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
                >
                  <FaSave />
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de productos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {products.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '80px 40px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%)', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 30px' }}>
              <FaTshirt style={{ fontSize: '60px', color: '#f73194' }} />
            </div>
            <h3 style={{ fontSize: '24px', color: '#333', margin: '0 0 12px 0', fontWeight: '600' }}>No hay productos</h3>
            <p style={{ color: '#666', fontSize: '16px', margin: '0 0 30px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              {searchTerm || selectedCategory 
                ? 'No se encontraron productos con los filtros aplicados'
                : 'Crea tu primer producto para empezar a gestionar tu inventario'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <button 
                className="btn-pink"
                onClick={() => setShowForm(true)}
                style={{ padding: '14px 28px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '500' }}
              >
                <FaPlus />
                Crear Primer Producto
              </button>
            )}
          </div>
        ) : (
          products.map((product, index) => {
            const stockStatus = getStockStatus(product.quantity, product.min_stock);
            const stockColor = stockStatus === 'stock-critical' ? '#dc3545' : stockStatus === 'stock-low' ? '#FF9800' : '#4CAF50';
            const stockIcon = stockStatus === 'stock-critical' ? <FaTimesCircle /> : stockStatus === 'stock-low' ? <FaExclamationTriangle /> : <FaCheckCircle />;
            
            return (
              <div
                key={product.id} 
                className="product-card" 
                style={{ 
                  border: 'none', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  background: 'white', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                  borderTop: '4px solid #f73194',
                  animationDelay: `${0.3 + index * 0.05}s`
                }}
              >
                {/* Galería de imágenes */}
                <div 
                  onClick={() => handleShowDetail(product)} 
                  style={{ cursor: 'pointer', marginBottom: '15px', background: '#f8f9fa', borderRadius: '8px', padding: '12px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {product.images && product.images.length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {product.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`img-${idx}`}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: idx === 0 ? '2px solid #f73194' : '2px solid #e0e0e0' }}
                        />
                      ))}
                      {product.images.length > 3 && (
                        <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', padding: '0 8px', background: 'white', borderRadius: '6px', fontWeight: '600' }}>+{product.images.length - 3}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>📷 Sin imagen</div>
                  )}
                </div>

                {/* Header con acciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', paddingBottom: '12px', borderBottom: '2px solid #f5f5f5' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#333', fontWeight: '600' }}>{product.name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaPalette style={{ color: '#f73194' }} />
                      {product.colores} • Talle {product.tallas}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleEdit(product)}
                      className="btn-pink"
                      style={{ border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '6px' }}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleDuplicate(product)}
                      className="btn-gray"
                      style={{ border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '6px' }}
                      title="Duplicar"
                    >
                      <FaCopy />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="btn-red"
                      style={{ border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '6px' }}
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {/* Detalles */}
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                    <FaTag style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                    <strong style={{ marginRight: '6px' }}>Categoría:</strong> {getCategoryName(product.category_id)}
                  </p>
                  <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                    <FaDollarSign style={{ marginRight: '8px', color: '#4CAF50', fontSize: '13px' }} />
                    <strong style={{ marginRight: '6px' }}>Precio:</strong> ${product.sale_price}
                  </p>
                  {product.tallas && (
                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                      <FaTshirt style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                      <strong style={{ marginRight: '6px' }}>Talle:</strong> {product.tallas}
                    </p>
                  )}
                  {product.colores && (
                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                      <FaPalette style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                      <strong style={{ marginRight: '6px' }}>Color:</strong> {product.colores}
                    </p>
                  )}
                  {product.sku && (
                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#777' }}>
                      <FaBarcode style={{ marginRight: '8px', color: '#666', fontSize: '13px' }} />
                      SKU: {product.sku}
                    </p>
                  )}
                </div>

                {/* Stock info */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: stockColor }}>
                    {stockIcon}
                    Stock: {product.quantity}
                  </span>
                  <button 
                    onClick={() => handleUpdateStock(product.id, product.quantity)}
                    className="btn-gray"
                    style={{ padding: '6px 12px', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '500' }}
                    title="Actualizar stock"
                  >
                    <FaEdit />
                    Editar
                  </button>
                </div>

                {/* Estado */}
                <div style={{ marginBottom: '12px' }}>
                  <select
                    value={product.status}
                    onChange={e => handleChangeStatus(product, e.target.value)}
                    className="filter-select"
                    style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', background: 'white', cursor: 'pointer', fontWeight: '500' }}
                  >
                    <option value="disponible">✓ Disponible</option>
                    <option value="sin_stock">✗ Sin stock</option>
                    <option value="descontinuado">⊘ Descontinuado</option>
                  </select>
                </div>

                {/* Footer */}
                <div style={{ paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCalendarAlt style={{ color: '#f73194' }} />
                    {new Date(product.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de detalle */}
      {showDetail && detailProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={handleCloseDetail}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={handleCloseDetail} 
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999', transition: 'color 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#f73194'}
              onMouseOut={(e) => e.currentTarget.style.color = '#999'}
            >
              ×
            </button>
            
            <h2 style={{ margin: '0 0 20px 0', fontSize: '26px', fontWeight: '600', color: '#333', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaEye style={{ color: '#f73194' }} />
              Detalle del Producto
            </h2>
            
            {/* Galería completa */}
            {detailProduct.images && detailProduct.images.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                {detailProduct.images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`img-${idx}`} 
                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: idx === 0 ? '3px solid #f73194' : '2px solid #e0e0e0' }} 
                  />
                ))}
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '15px' }}>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaTshirt style={{ color: '#f73194' }} /> Nombre:
                </strong>
                {detailProduct.name}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaPalette style={{ color: '#f73194' }} /> Color:
                </strong>
                {detailProduct.colores}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaRulerVertical style={{ color: '#f73194' }} /> Talle:
                </strong>
                {detailProduct.tallas}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaTag style={{ color: '#f73194' }} /> Categoría:
                </strong>
                {getCategoryName(detailProduct.category_id)}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaDollarSign style={{ color: '#4CAF50' }} /> Precio Venta:
                </strong>
                ${detailProduct.sale_price}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaDollarSign style={{ color: '#FF9800' }} /> Precio Costo:
                </strong>
                ${detailProduct.cost_price}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaBoxes style={{ color: '#f73194' }} /> Stock:
                </strong>
                {detailProduct.quantity}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaCheckCircle style={{ color: '#f73194' }} /> Estado:
                </strong>
                {detailProduct.status}
              </p>
              {detailProduct.sku && (
                <p style={{ margin: '8px 0' }}>
                  <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <FaBarcode style={{ color: '#f73194' }} /> SKU:
                  </strong>
                  {detailProduct.sku}
                </p>
              )}
              {detailProduct.barcode && (
                <p style={{ margin: '8px 0' }}>
                  <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <FaBarcode style={{ color: '#666' }} /> Código Barras:
                  </strong>
                  {detailProduct.barcode}
                </p>
              )}
              {detailProduct.supplier_id && (
                <p style={{ margin: '8px 0' }}>
                  <strong style={{ color: '#555' }}>Proveedor ID:</strong> {detailProduct.supplier_id}
                </p>
              )}
              <p style={{ margin: '8px 0', gridColumn: '1 / -1' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaCalendarAlt style={{ color: '#f73194' }} /> Creado:
                </strong>
                {new Date(detailProduct.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de funcionalidad próxima */}
      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowExportModal(false)}>
          <div style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '32px 28px 24px 28px', minWidth: '320px', maxWidth: '90vw', textAlign: 'center', animation: 'sidebarModalIn 0.18s cubic-bezier(.4,1.4,.6,1) both' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', color: '#c8b273', letterSpacing: '0.5px' }}>Funcionalidad Próxima a implementar</div>
            <div style={{ fontSize: '1rem', color: '#444', marginBottom: '22px' }}>La sección <b>Exportar a Excel</b> estará disponible próximamente.</div>
            <button style={{ background: '#c8b273', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 22px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer', transition: 'background 0.18s' }} onClick={() => setShowExportModal(false)} onMouseOver={(e) => e.currentTarget.style.background = '#a08d5c'} onMouseOut={(e) => e.currentTarget.style.background = '#c8b273'}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal de crear categoría */}
      {showCategoryForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowCategoryForm(false)}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', padding: '30px', maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaTag style={{ color: '#f73194' }} />
                Nueva Categoría
              </h3>
              <button onClick={() => setShowCategoryForm(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#999', lineHeight: 1 }}>×</button>
            </div>
            
            <form onSubmit={handleCategorySubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  required
                  placeholder="Ej: Remeras, Pantalones, Accesorios..."
                  style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', transition: 'all 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#f73194'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  rows="3"
                  placeholder="Descripción opcional de la categoría..."
                  style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', resize: 'vertical', transition: 'all 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = '#f73194'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCategoryForm(false)}
                  style={{ padding: '12px 24px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', transition: 'all 0.3s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#5a6268'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#6c757d'}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ padding: '12px 24px', background: '#f73194', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FaPlus />
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;