import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productService, categoryService, supplierService } from '../services/api';
import { toast } from 'react-toastify';
import {
  FaTshirt, FaPlus, FaEdit, FaTrash, FaCopy, FaSearch,
  FaFileExcel, FaTimes, FaBox, FaDollarSign, FaBarcode, FaTag,
  FaPalette, FaRulerVertical, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle,
  FaTimesCircle, FaEye, FaSave, FaBoxes, FaUser, FaCamera, FaImage
} from 'react-icons/fa';

import './Sidebar.css';
import PremiumModal from './PremiumModal';
import './PremiumModal.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BASE_URL = API_URL.replace('/api', '');

const getImageUrl = (path) => {
  if (!path || path === 'undefined' || path === 'null') return 'https://placehold.co/400x400?text=Sin+Imagen';
  if (path.startsWith('http')) return path;
  if (path.startsWith('blob:')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (cleanPath.startsWith('/uploads/')) return `${BASE_URL}${cleanPath}`;
  return cleanPath;
};

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

  // Estado para el Modal Premium
  const [premiumModal, setPremiumModal] = useState({
    show: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    onConfirm: () => { },
    inputValue: '',
    onInputChange: (val) => setPremiumModal(prev => ({ ...prev, inputValue: val }))
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
      // Mapeo unificado para el servicio
      const productData = {
        name: formData.name,
        sku: formData.sku,
        category_id: formData.category_id,
        supplier_id: formData.supplier_id,
        size: formData.size,
        color: formData.color,
        quantity: formData.quantity,
        min_stock: formData.min_stock,
        sale_price: formData.sale_price,
        cost_price: formData.cost_price,
        location: formData.ubicacion,
        notes: formData.notas,
        status: formData.status,
        images: formData.images // El servicio decidirá si usar FormData o JSON
      };

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
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  // Duplicar producto
  const handleDuplicate = (product) => {
    setPremiumModal({
      show: true,
      type: 'confirm',
      title: 'Duplicar Producto',
      message: `¿Estás seguro de que deseas duplicar el producto "${product.nombre || product.name}"?`,
      confirmText: 'Duplicar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await productService.duplicate(product.id);
          toast.success('Producto duplicado exitosamente');
          loadProducts();
          setPremiumModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          toast.error('Error duplicando producto: ' + error.message);
          setPremiumModal(prev => ({ ...prev, show: false }));
        }
      }
    });
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
      supplier_id: (product?.supplier_id ?? product?.proveedor ?? '').toString(),
      images: product?.images ?? [],
      status: product?.estado ?? product?.status ?? 'activo',
      sku: product?.codigo ?? product?.sku ?? '',
      barcode: product?.barcode ?? '',
      category_id: (product?.categoria_id ?? product?.category_id ?? '').toString()
    });
    setShowForm(true);
  };

  const handleShowDetail = (product) => {
    console.log('[DEBUG] Showing product detail for:', product);
    setDetailProduct(product);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    console.log('[DEBUG] Closing product detail');
    setShowDetail(false);
    setDetailProduct(null);
  };

  const handleDelete = (id) => {
    setPremiumModal({
      show: true,
      type: 'danger',
      title: 'Eliminar Producto',
      message: '¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await productService.delete(id);
          toast.success('Producto eliminado exitosamente');
          loadProducts();
          setPremiumModal(prev => ({ ...prev, show: false }));
        } catch (error) {
          toast.error('Error eliminando producto: ' + error.message);
          setPremiumModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const handleUpdateStock = (productId, currentQuantity) => {
    setPremiumModal({
      show: true,
      type: 'prompt',
      title: 'Actualizar Stock',
      message: `Stock actual: ${currentQuantity}. Ingresa la nueva cantidad:`,
      confirmText: 'Actualizar',
      cancelText: 'Cancelar',
      inputValue: currentQuantity.toString(),
      onInputChange: (val) => setPremiumModal(prev => ({ ...prev, inputValue: val })),
      onConfirm: async () => {
        // Obtenemos el valor actual del state de premiumModal
        // pero necesitamos el valor actualizado, así que usamos un wrapper o accedemos al estado actual
        setPremiumModal(prev => {
          const quantity = parseInt(prev.inputValue);
          if (isNaN(quantity) || quantity < 0) {
            toast.error('La cantidad debe ser un número mayor o igual a 0');
            return prev;
          }

          (async () => {
            try {
              await productService.updateStock(productId, quantity);
              toast.success('Stock actualizado exitosamente');
              loadProducts();
              setPremiumModal(p => ({ ...p, show: false }));
            } catch (error) {
              toast.error('Error actualizando stock: ' + error.message);
              setPremiumModal(p => ({ ...p, show: false }));
            }
          })();

          return prev;
        });
      }
    });
  };

  const resetForm = () => {
    setFormData({
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
      sku: (lastSku !== undefined && lastSku !== null) ? String(parseInt(lastSku) + 1) : '',
      barcode: '',
      category_id: ''
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find(cat => String(cat.id) === String(categoryId));
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
    <div style={{ padding: '30px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes perspective3DFlip {
            0% { opacity: 0; transform: perspective(1000px) rotateY(-15deg) rotateX(10deg); }
            100% { opacity: 1; transform: perspective(1000px) rotateY(0deg) rotateX(0deg); }
          }

          .products-hero {
            animation: fadeSlideUp 0.6s ease both;
          }

          .products-filters-bar {
            animation: fadeSlideUp 0.6s ease 0.12s both;
          }

          .product-card-premium {
            animation: fadeSlideUp 0.5s ease both;
          }

          .empty-state {
            animation: fadeSlideUp 0.6s ease 0.3s both;
          }

          /* ---- Buttons ---- */
          .btn-pink { background: #f73194; transition: all 0.3s ease; }
          .btn-pink:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 20px rgba(247,49,148,0.35) !important; background: #f73194 !important; }

          .btn-gray { background: #6c757d; transition: all 0.3s ease; }
          .btn-gray:hover { transform: translateY(-2px) !important; background: #5a6268 !important; }

          .btn-green { background: #495057; transition: all 0.3s ease; }
          .btn-green:hover { transform: translateY(-2px) !important; background: #3d4349 !important; }

          .btn-red { background: #dc3545; transition: all 0.3s ease; }
          .btn-red:hover { transform: translateY(-2px) !important; background: #c82333 !important; }

          /* ---- Search / Filter inputs ---- */
          .nita-search-input {
            width: 100%;
            padding: 13px 18px 13px 44px;
            border: 2px solid var(--border-color);
            border-radius: 14px;
            font-size: 15px;
            font-weight: 500;
            color: var(--text-primary);
            background: var(--bg-secondary);
            transition: all 0.25s ease;
            box-sizing: border-box;
          }
          .nita-search-input:focus {
            outline: none;
            border-color: var(--accent-pink);
            background: var(--bg-card);
            box-shadow: 0 0 0 4px var(--accent-pink-light);
          }
          .nita-search-input::placeholder { color: #94a3b8; font-weight: 400; }

          .nita-filter-select {
            width: 100%;
            padding: 13px 14px;
            border: 2px solid var(--border-color);
            border-radius: 14px;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
            background: var(--bg-secondary);
            cursor: pointer;
            transition: all 0.25s ease;
            box-sizing: border-box;
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2394a3b8'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
            padding-right: 36px;
          }
          .nita-filter-select:focus {
            outline: none;
            border-color: var(--accent-pink);
            background-color: var(--bg-card);
            box-shadow: 0 0 0 4px var(--accent-pink-light);
          }

          /* ---- Clear filter chip ---- */
          .clear-filters-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 50px;
            border: 1px solid var(--border-color);
            background: var(--bg-card);
            color: var(--text-secondary);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .clear-filters-chip:hover {
            background: var(--accent-pink-light);
            border-color: var(--accent-pink);
            color: var(--accent-pink);
          }

          /* ---- Form Styles ---- */
          .form-input:focus {
            border-color: var(--accent-pink) !important;
            box-shadow: 0 0 0 3px var(--accent-pink-light) !important;
            outline: none !important;
          }

          .form-group-premium { display: flex; flex-direction: column; gap: 8px; }

          .label-premium {
            font-size: 13px; font-weight: 700; color: var(--text-secondary);
            display: flex; align-items: center; gap: 8px;
            text-transform: uppercase; letter-spacing: 0.02em;
          }
          .label-premium svg { color: var(--accent-pink); font-size: 14px; }

          .input-premium {
            width: 100%; padding: 12px 16px;
            border: 2px solid var(--border-color); border-radius: 12px;
            font-size: 15px; font-weight: 500; color: var(--text-primary);
            transition: all 0.2s ease; background: var(--bg-secondary);
          }
          .input-premium:focus {
            outline: none; border-color: var(--accent-pink);
            background: var(--bg-card); box-shadow: 0 0 0 4px var(--accent-pink-light);
          }
          .input-premium::placeholder { color: #94a3b8; }

          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          .no-image-placeholder-premium {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-tertiary);
            transition: all 0.3s ease;
            overflow: hidden;
          }
          .no-image-placeholder-premium svg {
            font-size: 100px;
            opacity: 0.2;
            color: var(--text-muted);
          }
        `}
      </style>

      {/* ═══════ HERO HEADER ═══════ */}
      <div className="products-hero" style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '28px 36px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            background: 'var(--accent-pink-light)',
            padding: '14px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaTshirt style={{ color: '#f73194', fontSize: '26px' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Stock de Ropa
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
              {products.filter(p => (Number(p.stock) || 0) > 0).length} en stock y {products.filter(p => (Number(p.stock) || 0) <= 0).length} sin stock
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExport}
            style={{
              padding: '11px 22px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)', borderRadius: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
          >
            <FaFileExcel />
            Exportar
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '11px 24px', color: 'white', background: '#f73194',
              border: 'none', borderRadius: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '14px', fontWeight: '700', transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(247,49,148,0.25)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(247,49,148,0.35)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(247,49,148,0.25)'; }}
          >
            <FaPlus />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* ═══════ FILTERS BAR ═══════ */}
      <div className="products-filters-bar" style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '20px 28px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Buscador con ícono integrado */}
          <div style={{ flex: '2.5 1 220px', position: 'relative' }}>
            <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '15px', zIndex: 1, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o sku"
              value={searchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="nita-search-input"
            />
          </div>

          {/* Separador vertical eliminado */}

          {/* Categoría */}
          <div style={{ flex: '1 1 140px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="nita-filter-select"
            >
              <option value="">Categoría</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowCategoryForm(true)}
              title="Nueva categoría"
              style={{
                width: '42px', height: '42px', flexShrink: 0,
                background: '#f73194', color: 'white', border: 'none',
                borderRadius: '12px', cursor: 'pointer', fontSize: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', fontWeight: 'bold'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              +
            </button>
          </div>

          {/* Talle */}
          <div style={{ flex: '0.8 1 110px' }}>
            <select
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
              className="nita-filter-select"
            >
              <option value="">Talle</option>
              <option value="Talle único">Talle único</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="36">36</option>
              <option value="38">38</option>
              <option value="40">40</option>
              <option value="42">42</option>
              <option value="44">44</option>
            </select>
          </div>

          {/* Estado */}
          <div style={{ flex: '0.8 1 110px' }}>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="nita-filter-select"
            >
              <option value="">Estado</option>
              <option value="activo">Activo</option>
              <option value="sin_stock">Sin stock</option>
            </select>
          </div>

          {/* Limpiar filtros */}
          {(selectedCategory || searchTerm || selectedSize || selectedStatus) && (
            <button
              className="clear-filters-chip"
              onClick={() => {
                setSelectedCategory('');
                setSearchTerm('');
                setSelectedStatus('');
                setSelectedSize('');
                loadProducts();
              }}
            >
              <FaTimes style={{ fontSize: '11px' }} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Modal Formulario Premium */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
          onClick={resetForm}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '0',
              borderRadius: '24px',
              maxWidth: '1000px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              border: '1px solid var(--border-color)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-card)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'var(--accent-pink-light)', color: 'var(--accent-pink)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                    {editingProduct ? <FaEdit /> : <FaPlus />}
                  </div>
                  {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </h3>
                <p style={{ margin: '4px 0 0 46px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {editingProduct ? 'Modifica los detalles del producto existente' : 'Completa los datos para agregar un producto al stock'}
                </p>
              </div>
              <button
                onClick={resetForm}
                style={{
                  background: 'var(--bg-tertiary)',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-pink-light)'; e.currentTarget.style.color = '#f73194'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '0' }}>

                {/* Lateral Izquierdo: IMÁGENES */}
                <div style={{ padding: '32px', background: 'var(--bg-tertiary)', borderRight: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', marginBottom: '16px', fontWeight: '700', fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Fotos del Producto
                  </label>

                  <div
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: '20px',
                      padding: '24px',
                      textAlign: 'center',
                      background: 'var(--bg-card)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#f73194'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <input
                      type="file"
                      name="images"
                      accept="image/*"
                      multiple
                      onChange={handleInputChange}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                    />

                    {formData.images && formData.images.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                        {formData.images.map((img, idx) => (
                          <div key={idx} style={{ position: 'relative', paddingTop: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <img
                              src={img instanceof File ? URL.createObjectURL(img) : getImageUrl(img)}
                              alt={`preview-${idx}`}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ))}
                        <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'var(--text-muted)', minHeight: '80px' }}>
                          <FaPlus />
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '20px 0' }}>
                        <div style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                          <FaImage />
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Subir fotos</p>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-hover)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <FaExclamationTriangle style={{ color: '#d97706', marginTop: '2px' }} />
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        <strong>Tip Pro:</strong> Las fotos con fondo claro y buena iluminación se van a ver mejor.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lateral Derecho: CAMPOS */}
                <div style={{ padding: '32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    <div className="form-group-premium">
                      <label className="label-premium"><FaTshirt /> Nombre del Producto</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Remera Siena " required className="input-premium" />
                    </div>
                    <div className="form-group-premium">
                      <label className="label-premium"><FaBarcode /> SKU / Código</label>
                      <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="Autogenerado" className="input-premium" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
                    <div className="form-group-premium">
                      <label className="label-premium"><FaTag /> Categoría</label>
                      <select name="category_id" value={formData.category_id} onChange={handleInputChange} required className="input-premium">
                        <option value="">Selecciona...</option>
                        {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                      </select>
                    </div>
                    <div className="form-group-premium">
                      <label className="label-premium"><FaRulerVertical /> Talle</label>
                      <select name="size" value={formData.size} onChange={handleInputChange} required className="input-premium">
                        <option value="">Elegir...</option>
                        {['Talle único', 'S', 'M', 'L', 'XL', '36', '38', '40', '42', '44'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group-premium">
                      <label className="label-premium"><FaPalette /> Color</label>
                      <input type="text" name="color" value={formData.color} onChange={handleInputChange} placeholder="Ej: Negro" required className="input-premium" />
                    </div>
                  </div>

                  {/* Sección de Precios con Cálculo de Margen */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '24px', borderRadius: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
                      <div className="form-group-premium">
                        <label className="label-premium" style={{ color: 'var(--text-secondary)' }}><FaDollarSign /> Precio Costo</label>
                        <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} placeholder="0.00" className="input-premium" />
                      </div>
                      <div className="form-group-premium">
                        <label className="label-premium" style={{ color: '#f73194' }}><FaDollarSign /> Precio Venta</label>
                        <input type="number" name="sale_price" value={formData.sale_price} onChange={handleInputChange} placeholder="0.00" className="input-premium" style={{ borderColor: '#f73194' }} />
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Margen Est.</span>
                        {formData.sale_price && formData.cost_price && Number(formData.sale_price) > 0 ? (
                          <div style={{
                            fontSize: '20px',
                            fontWeight: '800',
                            color: (Number(formData.sale_price) - Number(formData.cost_price)) > 0 ? '#10b981' : '#ef4444'
                          }}>
                            {Math.round(((Number(formData.sale_price) - Number(formData.cost_price)) / Number(formData.sale_price)) * 100)}%
                          </div>
                        ) : <div style={{ fontSize: '20px', fontWeight: '800', color: '#cbd5e1' }}>--</div>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group-premium">
                      <label className="label-premium"><FaBox /> Stock Inicial</label>
                      <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="0" className="input-premium" />
                    </div>
                    <div className="form-group-premium">
                      <label className="label-premium"><FaUser /> Proveedor (Opcional)</label>
                      <select name="supplier_id" value={formData.supplier_id} onChange={handleInputChange} className="input-premium">
                        <option value="">Sin asignar</option>
                        {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name || s.nombre}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer de Acciones */}
              <div style={{
                padding: '24px 32px',
                background: 'var(--bg-card)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '16px',
                position: 'sticky',
                bottom: 0,
                zIndex: 20
              }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 36px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#f73194',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 10px 15px -3px rgba(247, 49, 148, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <FaSave style={{ marginRight: '8px' }} />
                  {editingProduct ? 'Guardar Cambios' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de productos */}
      <div className="products-grid">
        {products.length === 0 ? (
          <div className="empty-state">
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
                className="btn-primary"
                onClick={() => setShowForm(true)}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
              >
                <FaPlus />
                Crear Primer Producto
              </button>
            )}
          </div>
        ) : (
          products.map((product, index) => {
            const isSinStock = product.status === 'sin_stock' || product.estado === 'sin_stock';
            const stockStatus = isSinStock ? 'stock-critical' : getStockStatus(product.quantity, product.min_stock);

            return (
              <div
                key={product.id}
                className="product-card-premium"
                style={{ animationDelay: `${0.1 + index * 0.05}s`, cursor: 'pointer' }}
                onClick={() => handleShowDetail(product)}
              >
                {/* Imagen y Badges */}
                <div className="product-image-wrapper">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={getImageUrl(product.images[0])}
                      alt={product.nombre || product.name}
                      className="product-image-premium"
                      onError={e => { e.target.src = 'https://placehold.co/400x400?text=Error+Imagen'; }}
                    />
                  ) : (
                    <div className="no-image-placeholder-premium">
                      <FaImage />
                    </div>
                  )}

                  {/* Badge de Stock */}
                  <div className={`product-badge-premium ${isSinStock ? 'status-badge-out' : 'status-badge-active'}`}>
                    {isSinStock ? 'Agotado' : 'Disponible'}
                  </div>

                  {/* Acciones Hover */}
                  <div className="product-actions-overlay">
                    <button className="action-btn-circle" onClick={(e) => { e.stopPropagation(); handleEdit(product); }} title="Editar">
                      <FaEdit />
                    </button>
                    <button className="action-btn-circle" onClick={(e) => { e.stopPropagation(); handleDuplicate(product); }} title="Duplicar">
                      <FaCopy />
                    </button>
                    <button className="action-btn-circle delete" onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }} title="Eliminar">
                      <FaTrash />
                    </button>
                  </div>
                </div>

                {/* Información */}
                <div className="product-info-premium">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="product-category-tag">{getCategoryName(product.categoria_id || product.category_id)}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        SKU {product.sku || product.codigo || '-'}
                      </span>
                    </div>
                    <h3 className="product-name-premium" style={{ margin: 0 }}>
                      {product.nombre || product.name || 'Sin nombre'}
                    </h3>
                  </div>

                  {/* Chips de Talle y Color */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {(product.tallas || product.size) && (
                      <span style={{
                        fontSize: '11px', background: 'var(--bg-tertiary)', padding: '3px 10px',
                        borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: '600',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <FaRulerVertical style={{ fontSize: '9px', color: '#94a3b8' }} />
                        {product.tallas || product.size}
                      </span>
                    )}
                    {(product.colores || product.color) && (
                      <span style={{
                        fontSize: '11px', background: '#f1f5f9', padding: '3px 10px',
                        borderRadius: '6px', color: '#475569', fontWeight: '600',
                        display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        <FaPalette style={{ fontSize: '9px', color: '#94a3b8' }} />
                        {product.colores || product.color}
                      </span>
                    )}
                  </div>

                  {/* Precio y Stock */}
                  <div className="product-details-row">
                    <div className="product-price-premium">
                      <span className="price-value-premium">${product.precio || product.sale_price}</span>
                    </div>


                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de detalle Premium */}
      {showDetail && detailProduct && (
        <div className="modal-overlay-premium" onClick={handleCloseDetail}>
          <div className="modal-content-premium" style={{ maxWidth: '900px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <button className="detail-close-btn" onClick={handleCloseDetail}>×</button>

            <div className="detail-layout">
              {/* Lado Izquierdo: Galería */}
              <div className="detail-gallery-side">
                {detailProduct.images && detailProduct.images.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(detailProduct.images[0])}
                      alt={detailProduct.name}
                      style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '16px', marginBottom: '20px' }}
                      onError={e => { e.target.src = 'https://placehold.co/400x400?text=Error+Imagen'; }}
                    />
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', width: '100%', paddingBottom: '10px' }}>
                      {detailProduct.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={getImageUrl(img)}
                          alt={`thumb-${idx}`}
                          style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer', border: idx === 0 ? '2px solid #f73194' : '2px solid transparent' }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <FaTshirt style={{ fontSize: '80px', opacity: 0.2, marginBottom: '15px' }} />
                    <p>Sin imágenes disponibles</p>
                  </div>
                )}
              </div>

              {/* Lado Derecho: Info */}
              <div className="detail-info-side">
                <span className="detail-subtitle">{getCategoryName(detailProduct.categoria_id || detailProduct.category_id)}</span>
                <h2 className="detail-title">{detailProduct.name || detailProduct.nombre}</h2>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                  <span style={{ background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    SKU: {detailProduct.codigo || detailProduct.sku || 'N/A'}
                  </span>
                  <span style={{
                    background: (detailProduct.status === 'sin_stock' || detailProduct.estado === 'sin_stock') ? '#fee2e2' : '#dcfce7',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: (detailProduct.status === 'sin_stock' || detailProduct.estado === 'sin_stock') ? '#dc2626' : '#16a34a',
                    fontWeight: '700'
                  }}>
                    {(detailProduct.status === 'sin_stock' || detailProduct.estado === 'sin_stock') ? 'SIN STOCK' : 'DISPONIBLE'}
                  </span>
                </div>

                <div className="price-card-premium">
                  <div>
                    <div className="price-card-label">Precio de Venta</div>
                    <div className="price-card-value">${detailProduct.precio || detailProduct.sale_price}</div>
                  </div>
                  <FaTag style={{ fontSize: '32px', opacity: 0.3 }} />
                </div>

                <div className="detail-grid">
                  <div className="detail-item-premium">
                    <div className="detail-item-label"><FaDollarSign /> Precio Costo</div>
                    <div className="detail-item-value">${detailProduct.costo || detailProduct.cost_price || '-'}</div>
                  </div>
                  <div className="detail-item-premium">
                    <div className="detail-item-label"><FaBoxes /> Stock Actual</div>
                    <div className="detail-item-value">{detailProduct.quantity || detailProduct.stock || '0'} unidades</div>
                  </div>
                  <div className="detail-item-premium">
                    <div className="detail-item-label"><FaRulerVertical /> Talle</div>
                    <div className="detail-item-value">{detailProduct.tallas || detailProduct.size || 'Único'}</div>
                  </div>
                  <div className="detail-item-premium">
                    <div className="detail-item-label"><FaPalette /> Color</div>
                    <div className="detail-item-value">{detailProduct.colores || detailProduct.color || 'N/A'}</div>
                  </div>
                  <div className="detail-item-premium" style={{ gridColumn: 'span 2' }}>
                    <div className="detail-item-label"><FaUser /> Proveedor</div>
                    <div className="detail-item-value">
                      {(() => {
                        const provId = detailProduct.supplier_id ?? detailProduct.proveedor;
                        if (!provId) return 'No asignado';
                        const provObj = suppliers?.find(s => String(s.id) === String(provId));
                        return provObj?.name || 'Cargando...';
                      })()}
                    </div>
                  </div>
                </div>

                {detailProduct.notas && (
                  <div style={{ marginTop: 'auto', padding: '15px', background: 'var(--bg-tertiary)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                    <strong>Notas:</strong> {detailProduct.notas}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de funcionalidad próxima */}
      {showExportModal && (
        <div className="sidebar-modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="sidebar-modal" onClick={e => e.stopPropagation()}>
            <div className="sidebar-modal-title">Funcionalidad Próxima a implementar</div>
            <div className="sidebar-modal-desc">La sección <b>Exportar a Excel</b> estará disponible próximamente.</div>
            <button className="sidebar-modal-btn" onClick={() => setShowExportModal(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal de crear categoría */}
      {showCategoryForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2005,
            padding: '20px'
          }}
          onClick={() => setShowCategoryForm(false)}
        >
          <div
            style={{
              background: 'white',
              padding: '0',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fff'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#fff0f7', color: '#f73194', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                    <FaTag />
                  </div>
                  Nueva Categoría
                </h3>
              </div>
              <button
                onClick={() => setShowCategoryForm(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} style={{ padding: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="form-group-premium">
                  <label className="label-premium">Nombre de la Categoría *</label>
                  <input
                    type="text"
                    name="name"
                    value={categoryFormData.name}
                    onChange={handleCategoryInputChange}
                    placeholder="Ej: Accesorios, Remeras, etc."
                    required
                    className="input-premium"
                  />
                </div>

                <div className="form-group-premium">
                  <label className="label-premium">Descripción (Opcional)</label>
                  <textarea
                    name="description"
                    value={categoryFormData.description}
                    onChange={handleCategoryInputChange}
                    placeholder="Describe brevemente esta categoría..."
                    className="input-premium"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{
                marginTop: '32px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-muted)',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--accent-pink)',
                    color: 'white',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px var(--accent-pink-light)'
                  }}
                >
                  <FaPlus style={{ marginRight: '8px' }} />
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Alerta Premium */}
      <PremiumModal
        show={premiumModal.show}
        type={premiumModal.type}
        title={premiumModal.title}
        message={premiumModal.message}
        inputValue={premiumModal.inputValue}
        onInputChange={premiumModal.onInputChange}
        onConfirm={premiumModal.onConfirm}
        onCancel={() => setPremiumModal(prev => ({ ...prev, show: false }))}
        confirmText={premiumModal.confirmText}
        cancelText={premiumModal.cancelText}
      />
    </div>
  );
};

export default Products;