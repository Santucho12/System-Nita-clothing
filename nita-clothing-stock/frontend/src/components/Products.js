import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productService, categoryService, supplierService } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaTshirt, FaPlus, FaEdit, FaTrash, FaCopy, FaSearch, 
  FaFileExcel, FaTimes, FaBox, FaDollarSign, FaBarcode, FaTag,
  FaPalette, FaRulerVertical, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle,
  FaTimesCircle, FaEye, FaSave, FaBoxes, FaUser
} from 'react-icons/fa';

const Products = () => {
    const [lastSku, setLastSku] = useState(undefined);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSize, setSelectedSize] = useState('');  
  // Eliminado filtro de color
  const [selectedStatus, setSelectedStatus] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    size: '',
    sale_price: '',
    cost_price: '',
    quantity: '1',
    min_stock: '',
    supplier_id: '',
    images: [], // array de archivos o urls
    status: 'activo',
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

  // Guardar y recuperar el último SKU usando localStorage
  useEffect(() => {
    // Al abrir el formulario, recuperar el último SKU guardado en localStorage
    if (showForm && !editingProduct) {
      const storedSku = localStorage.getItem('lastSKU');
      if (storedSku) {
        setFormData(prev => ({
          ...prev,
          sku: String(parseInt(storedSku) + 1)
        }));
      } else if (lastSku !== undefined && lastSku !== null) {
        setFormData(prev => ({
          ...prev,
          sku: String(parseInt(lastSku) + 1)
        }));
      }
    }
  }, [lastSku, showForm, editingProduct]);
  useEffect(() => {
        // Obtener el último SKU al abrir el formulario
        if (showForm) {
          productService.getLastSku().then(res => {
            setLastSku(res.lastSku);
            // Solo sugerir el siguiente SKU si no estamos editando
            setFormData(prev => ({
              ...prev,
              sku: editingProduct ? prev.sku : (res.lastSku !== undefined ? String(parseInt(res.lastSku) + 1) : '')
            }));
          }).catch(() => setLastSku(undefined));
        }
    loadInitialData();
  }, []);


  // Debounce búsqueda en vivo
  const searchTimerRef = useRef(null);
  const handleSearchInput = useCallback((value) => {
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchFilteredProducts(value, selectedCategory, selectedSize, selectedStatus);
    }, 400);
  }, [selectedCategory, selectedSize, selectedStatus]);

  // Función para obtener productos con filtros
  const fetchFilteredProducts = useCallback(async (search, category, size, status) => {
    try {
      let filtered = [];
      if (search) {
        const response = await productService.search(search);
        filtered = response.data || [];
      } else if (category) {
        const response = await productService.getByCategory(category);
        filtered = response.data || [];
      } else {
        const response = await productService.getAll();
        filtered = response.data || [];
      }
      if (size) filtered = filtered.filter(p => p.tallas === size);
      if (status) filtered = filtered.filter(p => (p.status === status) || (p.estado === status));
      setProducts(filtered);
    } catch (error) {
      toast.error('Error filtrando productos: ' + error.message);
    }
  }, []);

  // Buscar automáticamente al cambiar filtros
  useEffect(() => {
    fetchFilteredProducts(searchTerm, selectedCategory, selectedSize, selectedStatus);
    // eslint-disable-next-line
  }, [selectedCategory, selectedSize, selectedStatus]);

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
        [name]: name === 'quantity' && value === '' ? '1' : value
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
    // Si cantidad está vacío, poner 1 por defecto
    if (!formData.quantity || formData.quantity === '') {
      formData.quantity = '1';
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
    // Stock mínimo ya no es obligatorio
    // supplier_id puede ser opcional por ahora
    try {
      // Mapeo para backend
      let productData = {
        nombre: formData.name,
        codigo: formData.sku,
        categoria_id: parseInt(formData.category_id),
        proveedor: formData.supplier_id ? parseInt(formData.supplier_id) : null,
        tallas: formData.size,
        colores: formData.color,
        ubicacion: formData.ubicacion || '',
        estado: formData.status,
        notas: formData.notas || '',
        stock: parseInt(formData.quantity),
        stock_minimo: parseInt(formData.min_stock),
        precio: parseFloat(formData.sale_price),
        costo: parseFloat(formData.cost_price)
      };
      // Si hay archivos nuevos, enviar como FormData
      if (formData.images && formData.images.length > 0 && formData.images[0] instanceof File) {
        const dataToSend = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          dataToSend.append(key, value);
        });
        formData.images.forEach(img => dataToSend.append('images', img));
        if (editingProduct) {
          await productService.update(editingProduct.id, dataToSend);
          toast.success('Producto actualizado exitosamente');
        } else {
          await productService.create(dataToSend);
          toast.success('Producto creado exitosamente');
          if (formData.sku) {
            localStorage.setItem('lastSKU', formData.sku);
          }
        }
      } else {
        // Si no hay archivos nuevos, enviar como objeto normal
        productData.imagen_url = JSON.stringify(formData.images.filter(img => typeof img === 'string' && (img.startsWith('/uploads/') || img.startsWith('http'))));
        if (editingProduct) {
          await productService.update(editingProduct.id, productData);
          toast.success('Producto actualizado exitosamente');
        } else {
          await productService.create(productData);
          toast.success('Producto creado exitosamente');
          if (formData.sku) {
            localStorage.setItem('lastSKU', formData.sku);
          }
        }
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
      name: product?.nombre ?? product?.name ?? '',
      color: product?.colores ?? product?.color ?? '',
      size: product?.tallas ?? product?.size ?? '',
      sale_price: (product?.precio ?? product?.sale_price ?? '').toString(),
      cost_price: (product?.costo ?? product?.cost_price ?? '').toString(),
      quantity: (product?.stock ?? product?.quantity ?? '1').toString(),
      min_stock: (product?.stock_minimo ?? product?.min_stock ?? '').toString(),
      supplier_id: (product?.proveedor ?? product?.supplier_id ?? '').toString(),
      images: product?.images ?? [],
      status: product?.estado ?? product?.status ?? 'activo',
      sku: product?.codigo ?? product?.sku ?? '',
      barcode: product?.barcode ?? '',
      category_id: (product?.categoria_id ?? product?.category_id ?? '').toString()
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
    setFormData(prev => ({
      name: '',
      color: '',
      size: '',
      sale_price: '',
      cost_price: '',
      quantity: '1',
      min_stock: '',
      supplier_id: '',
      images: [],
      status: 'activo',
      sku: (lastSku !== undefined && lastSku !== null) ? String(parseInt(lastSku) + 1) : '1',
      barcode: '',
      category_id: ''
    }));
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
    <div style={{ padding: '30px', background: 'var(--bg-gradient)', minHeight: '100vh' }}>
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

      <div className="filters-section" style={{ background: 'white', padding: '24px 32px', borderRadius: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.10)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-end', width: '100%' }}>
          {/* Buscar */}
          <div style={{ flex: '2.5 1 0', minWidth: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#555', whiteSpace: 'nowrap' }}>
              <FaSearch style={{ marginRight: '4px', color: '#f73194', fontSize: '11px' }} />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre, SKU o color..."
              value={searchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="filter-input"
              style={{ width: '100%', padding: '14px 18px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Categoría */}
          <div style={{ flex: '1.5 1 0', minWidth: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#555', whiteSpace: 'nowrap' }}>
              <FaTag style={{ marginRight: '4px', color: '#f73194', fontSize: '11px' }} />
              Categoría
            </label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-input"
                style={{ flex: 1, minWidth: 0, padding: '14px 10px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', boxSizing: 'border-box' }}
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
                style={{ padding: '14px 14px', background: '#f73194', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: 'all 0.3s', flexShrink: 0 }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                +
              </button>
            </div>
          </div>

          {/* Talle */}
          <div style={{ flex: '1.2 1 0', minWidth: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#555', whiteSpace: 'nowrap' }}>
              <FaRulerVertical style={{ marginRight: '4px', color: '#f73194', fontSize: '11px' }} />
              Talle
            </label>
            <select
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
              className="filter-input"
              style={{ width: '100%', padding: '14px 10px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <option value="">Todos</option>
              <option value="Talle único">Talle único</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="36">36</option>
              <option value="38">38</option>
              <option value="40">40</option>
              <option value="42">42</option>
            </select>
          </div>



          {/* Estado */}
          <div style={{ flex: '1.2 1 0', minWidth: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', fontSize: '12px', fontWeight: '600', color: '#555', whiteSpace: 'nowrap' }}>
              <FaCheckCircle style={{ marginRight: '4px', color: '#f73194', fontSize: '11px' }} />
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="filter-input"
              style={{ width: '100%', padding: '14px 10px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="sin_stock">Sin stock</option>
            </select>
          </div>



          {/* Limpiar filtros */}
          {(selectedCategory || searchTerm || selectedSize || selectedStatus) && (
            <button 
              className="btn-secondary"
              onClick={() => {
                setSelectedCategory('');
                setSearchTerm('');
                setSelectedStatus('');
                setSelectedSize('');
                loadProducts();
              }}
              style={{ padding: '8px 14px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '500', background: '#343a40', whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-end' }}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                {/* Fila 1 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}><FaTshirt style={{ marginRight: '6px', color: '#f73194' }} /> Nombre *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Remera Básica" required className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}><FaTag style={{ marginRight: '6px', color: '#f73194' }} /> Categoría *</label>
                  <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <option value="">Selecciona</option>
                    {categories.map(category => (<option key={category.id} value={category.id}>{category.name}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}><FaRulerVertical style={{ marginRight: '6px', color: '#f73194' }} /> Talle *</label>
                  <select name="size" value={formData.size} onChange={handleInputChange} required className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <option value="">Selecciona</option>
                    <option value="Talle único">Talle único</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="36">36</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="42">42</option>
                  </select>
                </div>
                {/* Fila 2 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}><FaPalette style={{ marginRight: '6px', color: '#f73194' }} /> Color *</label>
                  <input type="text" name="color" value={formData.color} onChange={handleInputChange} placeholder="Ej: Negro" required className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}><FaDollarSign style={{ marginRight: '6px', color: '#4CAF50' }} /> Precio Costo *</label>
                  <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} min="0" step="0.01" required className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}><FaDollarSign style={{ marginRight: '6px', color: '#f73194' }} /> Precio Venta *</label>
                  <input type="number" name="sale_price" value={formData.sale_price} onChange={handleInputChange} min="0" step="0.01" required className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                {/* Fila 3 */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}><FaBox style={{ marginRight: '6px', color: '#f73194' }} /> Cantidad</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="0" className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} placeholder="Por defecto 1" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>Proveedor</label>
                  <select name="supplier_id" value={formData.supplier_id} onChange={handleInputChange} className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                    <option value="">Selecciona</option>
                    {suppliers.map(supplier => (<option key={supplier.id} value={supplier.id}>{supplier.name}</option>))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}><FaBarcode style={{ marginRight: '6px', color: '#f73194' }} /> SKU *</label>
                  <input type="number" name="sku" value={formData.sku} onChange={handleInputChange} min={lastSku !== undefined && lastSku !== null ? parseInt(lastSku) + 1 : 1} step="1" required className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} placeholder={lastSku !== undefined ? `Ej: ${parseInt(lastSku) + 1}` : '1'} />
                  {lastSku !== undefined && (<div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Siguiente sugerido: <b>{parseInt(lastSku) + 1}</b></div>)}
                </div>
              </div>
              {/* Imágenes */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' }}>Imágenes</label>
                <input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple onChange={handleInputChange} className="form-input" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} />
                {formData.images && formData.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {formData.images.map((img, idx) => (
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
                <button type="button" className="btn-gray" onClick={resetForm} style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}><FaTimes /> Cancelar</button>
                <button
                  type="submit"
                  className="btn-pink"
                  style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500' }}
                  disabled={!formData.name || formData.name.trim() === '' || !formData.sale_price || isNaN(parseFloat(formData.sale_price)) || !formData.quantity || isNaN(parseInt(formData.quantity))}
                >
                  <FaSave /> {editingProduct ? 'Actualizar' : 'Crear'}
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
            // Usar estado para mostrar sin_stock correctamente
            const isSinStock = product.status === 'sin_stock' || product.estado === 'sin_stock';
            const stockStatus = isSinStock ? 'stock-critical' : getStockStatus(product.quantity, product.min_stock);
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
                  {product.images && Array.isArray(product.images) && product.images.filter(img => img && img !== 'undefined').length > 0 ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {product.images.filter(img => img && img !== 'undefined').slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img.startsWith('/uploads/') ? `http://localhost:5000${img}` : img}
                          alt={`img-${idx}`}
                          style={{ width: '240px', height: '240px', objectFit: 'cover', borderRadius: '16px', border: idx === 0 ? '3px solid #f73194' : '2px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                        />
                      ))}
                      {product.images.filter(img => img && img !== 'undefined').length > 3 && (
                        <div style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', padding: '0 8px', background: 'white', borderRadius: '6px', fontWeight: '600' }}>+{product.images.filter(img => img && img !== 'undefined').length - 3}</div>
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
                      <strong style={{ fontWeight: 'bold', color: '#333' }}>{getCategoryName(product.categoria_id || product.category_id)} {product.nombre || product.name}</strong>
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
                                                      {/* Precio Costo */}
                                                      {product.cost_price !== undefined && (
                                                        <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                                          <FaDollarSign style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                                                          <strong style={{ marginRight: '6px' }}>Precio Costo:</strong> ${product.cost_price}
                                                        </p>
                                                      )}
                                                      {/* Precio Venta */}
                                                      {product.sale_price !== undefined && (
                                                        <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                                          <FaDollarSign style={{ marginRight: '8px', color: '#4CAF50', fontSize: '13px' }} />
                                                          <strong style={{ marginRight: '6px' }}>Precio Venta:</strong> ${product.sale_price}
                                                        </p>
                                                      )}
                                                      {/* SKU */}
                                                      {product.sku && (
                                                        <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#777' }}>
                                                          <FaBarcode style={{ marginRight: '8px', color: '#666', fontSize: '13px' }} />
                                                          <strong style={{ marginRight: '6px' }}>SKU:</strong> {product.sku}
                                                        </p>
                                                      )}
                                    {/* Proveedor (mostrar nombre si existe en suppliers) */}
                                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                      <FaUser style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                                      <strong style={{ marginRight: '6px' }}>Proveedor:</strong> {suppliers && suppliers.length > 0 ? (suppliers.find(s => String(s.id) === String(product.proveedor))?.name || product.proveedor) : product.proveedor}
                                    </p>
                                    {/* Cantidad */}
                                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                      <FaBox style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                                      <strong style={{ marginRight: '6px' }}>Cantidad:</strong> {product.stock !== undefined ? product.stock : product.quantity}
                                    </p>
                                    {/* Categoría */}
                                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                      <FaTag style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                                      <strong style={{ marginRight: '6px' }}>Categoría:</strong> {getCategoryName(product.categoria_id || product.category_id)}
                                    </p>
                                    {/* Precio Costo */}
                                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                      <FaDollarSign style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                                      <strong style={{ marginRight: '6px' }}>Precio Costo:</strong> ${product.costo !== undefined ? product.costo : product.cost_price}
                                    </p>
                                    {/* Precio Venta */}
                                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                      <FaDollarSign style={{ marginRight: '8px', color: '#4CAF50', fontSize: '13px' }} />
                                      <strong style={{ marginRight: '6px' }}>Precio Venta:</strong> ${product.precio !== undefined ? product.precio : product.sale_price}
                                    </p>
                                    {/* Talle */}
                                    {product.tallas && (
                                      <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                        <FaTshirt style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                                        <strong style={{ marginRight: '6px' }}>Talle:</strong> {product.tallas}
                                      </p>
                                    )}
                                    {/* Color */}
                                    {product.colores && (
                                      <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#555' }}>
                                        <FaPalette style={{ marginRight: '8px', color: '#f73194', fontSize: '13px' }} />
                                        <strong style={{ marginRight: '6px' }}>Color:</strong> {product.colores}
                                      </p>
                                    )}
                                    {/* SKU */}
                                    <p style={{ margin: '8px 0', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#777' }}>
                                      <FaBarcode style={{ marginRight: '8px', color: '#666', fontSize: '13px' }} />
                                      <strong style={{ marginRight: '6px' }}>SKU:</strong> {product.codigo !== undefined ? product.codigo : product.sku}
                                    </p>
                </div>

                {/* Stock y Estado unificados */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '14px', background: 'linear-gradient(90deg, #fff 80%, #ffe6f6 100%)', borderRadius: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(247,49,148,0.10)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '600', color: stockColor }}>
                    {stockIcon}
                    Stock: {product.quantity}
                  </span>
                  <select
                    value={product.estado || product.status || 'activo'}
                    onChange={e => handleChangeStatus(product, e.target.value)}
                    className="filter-select"
                    style={{
                      minWidth: '140px',
                      padding: '12px 18px',
                      border: '2px solid #f73194',
                      borderRadius: '12px',
                      fontSize: '15px',
                      background: 'white',
                      cursor: 'pointer',
                      fontWeight: '600',
                      color: '#f73194',
                      boxShadow: '0 2px 8px rgba(247,49,148,0.10)',
                      transition: 'border 0.2s, box-shadow 0.2s',
                      outline: 'none',
                      appearance: 'none',
                      position: 'relative'
                    }}
                  >
                    <option value="activo">✓ Disponible</option>
                    <option value="sin_stock">✗ No hay stock</option>
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
            
            {/* Imagen principal grande */}
            {detailProduct.images && Array.isArray(detailProduct.images) && detailProduct.images.filter(img => img && img !== 'undefined').length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                <img
                  src={(() => {
                    const img = detailProduct.images.filter(img => img && img !== 'undefined')[0];
                    return img.startsWith('/uploads/') ? `http://localhost:5000${img}` : img;
                  })()}
                  alt="Producto"
                  style={{ width: '320px', height: '320px', objectFit: 'cover', borderRadius: '16px', border: '4px solid #f73194', boxShadow: '0 4px 24px rgba(247,49,148,0.10)', marginBottom: '12px' }}
                  onError={e => { e.target.src = 'https://via.placeholder.com/320x320?text=Sin+imagen'; }}
                />
                {/* Galería miniaturas */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                  {detailProduct.images.filter(img => img && img !== 'undefined').map((img, idx) => (
                    <img 
                      key={idx} 
                      src={img.startsWith('/uploads/') ? `http://localhost:5000${img}` : img}
                      alt={`img-${idx}`}
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: idx === 0 ? '2px solid #f73194' : '2px solid #e0e0e0', cursor: 'pointer' }}
                      onError={e => { e.target.src = 'https://via.placeholder.com/60x60?text=Sin+imagen'; }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '15px' }}>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaTshirt style={{ color: '#f73194' }} /> Nombre:
                </strong>
                {detailProduct.nombre ?? detailProduct.name ?? '-'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaUser style={{ color: '#f73194' }} /> Proveedor:
                </strong>
                {(() => {
                  const provId = detailProduct.proveedor ?? detailProduct.supplier_id;
                  if (!provId) return '-';
                  const provObj = suppliers?.find(s => String(s.id) === String(provId));
                  return provObj?.name || '-';
                })()}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaPalette style={{ color: '#f73194' }} /> Color:
                </strong>
                {detailProduct.colores ?? detailProduct.color ?? '-'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaRulerVertical style={{ color: '#f73194' }} /> Talle:
                </strong>
                {detailProduct.tallas ?? detailProduct.size ?? '-'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaTag style={{ color: '#f73194' }} /> Categoría:
                </strong>
                {getCategoryName(detailProduct.categoria_id ?? detailProduct.category_id) ?? '-'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaDollarSign style={{ color: '#4CAF50' }} /> Precio Venta:
                </strong>
                ${detailProduct.precio ?? detailProduct.sale_price ?? '-'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaDollarSign style={{ color: '#FF9800' }} /> Precio Costo:
                </strong>
                ${detailProduct.costo ?? detailProduct.cost_price ?? '-'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaBoxes style={{ color: '#f73194' }} /> Stock:
                </strong>
                {detailProduct.stock ?? detailProduct.quantity ?? '-'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaCheckCircle style={{ color: '#f73194' }} /> Estado:
                </strong>
                {detailProduct.estado ?? detailProduct.status ?? '-'}
              </p>
              <p style={{ margin: '8px 0', gridColumn: '1 / -1' }}>
                <strong style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <FaBarcode style={{ color: '#f73194' }} /> SKU:
                </strong>
                {detailProduct.codigo ?? detailProduct.sku ?? 'Sin SKU'}
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