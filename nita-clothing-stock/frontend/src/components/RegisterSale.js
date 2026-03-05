import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { productService, categoryService } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { FaShoppingCart, FaPlus, FaTrash, FaBox, FaHashtag, FaDollarSign, FaEnvelope, FaCreditCard, FaPercent, FaCheckCircle, FaTimesCircle, FaBarcode, FaTshirt, FaPalette, FaRulerVertical, FaTag, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';

const initialItem = {
  searchMethod: 'details', // 'sku' o 'details'
  sku: '',
  category_id: '',
  product_name: '',
  color: '',
  size: '',
  product_id: '',
  quantity: 1,
  unit_price: 0,
  stock_available: 0
};

export default function RegisterSale() {
  const [items, setItems] = useState([{ ...initialItem }]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const scrollContainerRef = React.useRef(null);

  const customSlowScroll = (targetY, duration) => {
    const startingY = window.pageYOffset;
    const diff = targetY - startingY;
    let start;

    window.requestAnimationFrame(function step(timestamp) {
      if (!start) start = timestamp;
      const time = timestamp - start;
      const percent = Math.min(time / duration, 1);

      // Easing function (easeInOutCubic)
      const easing = percent < 0.5
        ? 4 * percent * percent * percent
        : 1 - Math.pow(-2 * percent + 2, 3) / 2;

      window.scrollTo(0, startingY + diff * easing);

      if (time < duration) {
        window.requestAnimationFrame(step);
      }
    });
  };

  useEffect(() => {
    const initData = async () => {
      await Promise.all([loadCategories(), loadProducts()]);

      setTimeout(() => {
        if (scrollContainerRef.current) {
          customSlowScroll(205, 1500); // 2.0 segundos para desplazarse 200px
        }
      }, 400);
    };

    initData();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data.data || data);
    } catch (err) {
      toast.error('Error al cargar categorías');
    }
  };

  const loadProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data.data || data);
    } catch (err) {
      toast.error('Error al cargar productos');
    }
  };

  const handleItemChange = async (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Lógica especial para búsqueda por SKU
    if (field === 'sku' && value) {
      const searchValue = value.toString().trim().toLowerCase();
      const product = products.find(p =>
        (p.sku && p.sku.toString().trim().toLowerCase() === searchValue) ||
        (p.codigo && p.codigo.toString().trim().toLowerCase() === searchValue)
      );
      if (product) {
        newItems[index].product_id = product.id;
        newItems[index].product_name = product.nombre || product.name || '';
        newItems[index].unit_price = product.precio || product.precio_venta || product.sale_price || 0;
        newItems[index].category_id = product.categoria_id || product.category_id || '';
        newItems[index].size = product.tallas || product.talle || product.size || '';
        newItems[index].color = product.colores || product.color || '';
        newItems[index].stock_available = product.stock || 0;

        if (newItems[index].quantity > product.stock) {
          toast.warning(`Stock limitado. ${product.nombre} solo tiene ${product.stock} unidades.`);
          newItems[index].quantity = product.stock;
        }
      } else {
        newItems[index].stock_available = 0;
      }
    }

    // Al cambiar categoría, resetear campos dependientes
    if (field === 'category_id') {
      newItems[index].product_name = '';
      newItems[index].color = '';
      newItems[index].size = '';
      newItems[index].product_id = '';
      newItems[index].stock_available = 0;
    }

    // Al cambiar nombre de producto, buscar coincidencia parcial o resetear talle/color
    if (field === 'product_name') {
      newItems[index].color = '';
      newItems[index].size = '';
      newItems[index].product_id = '';
      newItems[index].stock_available = 0;
    }

    // Al completar la selección (talle), asignar ID y precio final
    if (field === 'size') {
      const product = products.find(p =>
        (p.categoria_id == newItems[index].category_id || p.category_id == newItems[index].category_id) &&
        (p.nombre === newItems[index].product_name || p.name === newItems[index].product_name) &&
        (p.colores === newItems[index].color || p.color === newItems[index].color) &&
        (p.tallas === value || p.talle === value || p.size === value)
      );
      if (product) {
        newItems[index].product_id = product.id;
        newItems[index].unit_price = product.precio || product.precio_venta || product.sale_price || 0;
        newItems[index].stock_available = product.stock || 0;

        if (newItems[index].quantity > product.stock) {
          toast.warning(`Stock limitado. Solo hay ${product.stock} unidades disponibles.`);
          newItems[index].quantity = product.stock;
        }
      }
    }

    // Validación de cantidad en tiempo real
    if (field === 'quantity') {
      const qty = parseInt(value);
      if (newItems[index].product_id && qty > newItems[index].stock_available) {
        toast.error(`Stock insuficiente. Disponible: ${newItems[index].stock_available}`);
        newItems[index].quantity = newItems[index].stock_available;
      }
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { ...initialItem }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const discount = (subtotal * (Number(discountPercent) / 100)) + Number(discountAmount);
    return Math.max(0, subtotal - discount);
  };

  const getProductNamesForCategory = (categoryId) => {
    if (!categoryId) return [];
    const filtered = products.filter(p => (p.categoria_id == categoryId || p.category_id == categoryId));
    return [...new Set(filtered.map(p => p.nombre || p.name))];
  };

  const getColorsForProduct = (categoryId, productName) => {
    if (!categoryId || !productName) return [];
    const filtered = products.filter(p =>
      (p.categoria_id == categoryId || p.category_id == categoryId) &&
      (p.nombre === productName || p.name === productName)
    );
    return [...new Set(filtered.map(p => p.colores || p.color).filter(Boolean))];
  };

  const getSizesForProductColor = (categoryId, productName, color) => {
    if (!categoryId || !productName || !color) return [];
    const filtered = products.filter(p =>
      (p.categoria_id == categoryId || p.category_id == categoryId) &&
      (p.nombre === productName || p.name === productName) &&
      (p.colores === color || p.color === color)
    );
    return [...new Set(filtered.map(p => p.tallas || p.talle || p.size).filter(Boolean))];
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Validación: ningún item debe tener product_id vacío o 0
    const invalidItem = items.find(i => !i.product_id || Number(i.product_id) === 0);
    if (invalidItem) {
      toast.error('Todos los productos deben estar correctamente seleccionados. No se puede registrar venta con items inválidos.');
      return;
    }

    if (!customerEmail || !customerEmail.trim()) {
      toast.error('El email del cliente es obligatorio para registrar la venta.');
      return;
    }

    // Validación extra de stock antes de enviar
    const outOfStockItem = items.find(i => Number(i.quantity) > Number(i.stock_available));
    if (outOfStockItem) {
      toast.error(`Stock insuficiente para uno de los productos (${outOfStockItem.product_name}).`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/ventas', {
        items: items.map(i => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price)
        })),
        customer_name: customerName,
        customer_email: customerEmail,
        payment_method: paymentMethod,
        discount_percent: Number(discountPercent),
        discount_amount: Number(discountAmount)
      });
      toast.success('Venta registrada correctamente');
      setItems([{ ...initialItem }]);
      setCustomerEmail('');
      setCustomerName('');
      setDiscountPercent(0);
      setDiscountAmount(0);
      // Recargar productos para actualizar stock localmente
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al registrar venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={scrollContainerRef} style={{ padding: '30px', background: 'var(--bg-secondary)', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .animate-fade-in {
            animation: fadeInUp 0.5s ease forwards;
          }

          .nita-card {
            background: var(--bg-card);
            border-radius: 24px;
            box-shadow: var(--shadow);
            border: 1px solid var(--border-color);
            overflow: hidden;
            transition: all 0.3s ease;
          }

          .nita-input-group {
            margin-bottom: 20px;
          }

          .nita-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
            color: var(--text-secondary);
            margin-bottom: 10px;
            letter-spacing: -0.01em;
          }

          .nita-input {
            width: 100%;
            padding: 14px 18px;
            border-radius: 12px;
            border: 1.5px solid var(--border-color);
            background: var(--bg-input);
            font-size: 15px;
            font-weight: 500;
            color: var(--text-primary);
            transition: all 0.2s ease;
          }

          .nita-input:focus {
            outline: none;
            border-color: var(--accent-pink);
            background: var(--bg-card);
            box-shadow: 0 0 0 4px var(--accent-pink-light);
          }

          .nita-select {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 14px center;
            background-size: 16px;
          }

          .method-card {
            flex: 1;
            padding: 20px 10px;
            border: 2px solid var(--border-light);
            border-radius: 18px;
            background: var(--bg-card);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .method-card:hover {
            border-color: var(--accent-pink);
            transform: translateY(-4px);
            background: var(--accent-pink-light);
          }

          .method-card.active {
            border-color: var(--accent-pink);
            background: var(--accent-pink-light);
            box-shadow: 0 8px 16px rgba(247, 49, 148, 0.1);
          }

          .method-card .icon-placeholder {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-tertiary);
            border-radius: 10px;
            margin-bottom: 2px;
          }

          .method-card.active .icon-placeholder {
            background: var(--bg-card);
            color: var(--accent-pink);
          }

          .method-name {
            font-size: 11px;
            font-weight: 850;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
          }

          .method-card.active .method-name {
            color: var(--accent-pink);
          }

          .btn-add-item {
            width: 100%;
            padding: 16px;
            border: 2px dashed var(--border-color);
            border-radius: 16px;
            background: var(--bg-tertiary);
            color: var(--text-muted);
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.2s ease;
            margin-top: 10px;
          }

          .btn-add-item:hover {
            border-color: var(--accent-pink);
            color: var(--accent-pink);
            background: var(--accent-pink-light);
          }

          .product-item-card {
            position: relative;
            padding: 25px;
            background: var(--bg-card);
            border-radius: 20px;
            margin-bottom: 25px;
            border: 1px solid var(--border-light);
            box-shadow: var(--shadow-sm);
            transition: all 0.3s ease;
          }

          .product-item-card:hover {
            box-shadow: var(--shadow);
            border-color: var(--border-color);
          }

          .remove-item-btn {
            position: absolute;
            top: -10px;
            right: -10px;
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: var(--bg-tertiary);
            color: var(--accent-pink);
            border: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: var(--shadow-sm);
            transition: all 0.2s ease;
            z-index: 10;
          }

          .remove-item-btn:hover {
            background: var(--accent-pink);
            color: white;
            border-color: var(--accent-pink);
            transform: rotate(90deg) scale(1.1);
          }

          .btn-register-sale {
            width: 100%;
            padding: 20px;
            border-radius: 20px;
            background: var(--gradient-pink);
            color: white;
            font-size: 20px;
            font-weight: 900;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            box-shadow: 0 10px 25px var(--accent-pink-light);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }

          .btn-register-sale:hover:not(:disabled) {
            transform: translateY(-4px);
            box-shadow: 0 15px 35px var(--accent-pink-light);
          }

          .btn-register-sale:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            filter: grayscale(0.5);
          }

          .summary-header {
            background: #1e293b;
            border-bottom: 1px solid var(--border-color);
            padding: 30px;
            color: #f8fafc;
            text-align: center;
          }

          .summary-total {
            font-size: 48px;
            font-weight: 800;
            margin: 15px 0;
            display: block;
            letter-spacing: -0.03em;
            color: #ffffff;
            text-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }

          .search-method-toggle {
            display: flex;
            background: var(--bg-tertiary);
            padding: 5px;
            border-radius: 12px;
            margin-bottom: 25px;
          }

          .toggle-btn {
            flex: 1;
            padding: 10px;
            border-radius: 9px;
            border: none;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #64748b;
            background: transparent;
          }

          .toggle-btn.active {
            background: var(--bg-card);
            color: var(--accent-pink);
            box-shadow: var(--shadow-sm);
          }
        `}
      </style>

      {/* ═══════ HERO HEADER ═══════ */}
      <div className="animate-fade-in" style={{
        background: 'var(--bg-card)',
        borderRadius: '24px',
        padding: '30px 40px',
        marginBottom: '30px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <div style={{
            background: 'var(--accent-pink-light)',
            width: '60px', height: '60px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaShoppingCart style={{ color: 'var(--accent-pink)', fontSize: '26px' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Registrar Venta
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '15px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Nueva venta para Nita Clothing
            </p>
          </div>
        </div>


      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '35px' }}>
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '850', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
              Detalle de Productos
            </h3>
            <div style={{ height: '3px', flex: 1, background: 'linear-gradient(90deg, var(--border-color) 0%, transparent 100%)', borderRadius: '10px' }}></div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            {items.map((item, idx) => (
              <div key={idx} className="product-item-card">
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="remove-item-btn" title="Eliminar ítem">
                    <FaTimesCircle />
                  </button>
                )}

                <div className="search-method-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${item.searchMethod === 'sku' ? 'active' : ''}`}
                    onClick={() => handleItemChange(idx, 'searchMethod', 'sku')}
                  >
                    <FaBarcode /> BUSCAR POR SKU
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${item.searchMethod === 'details' ? 'active' : ''}`}
                    onClick={() => handleItemChange(idx, 'searchMethod', 'details')}
                  >
                    <FaTshirt /> CATEGORÍA Y DETALLES
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  {item.searchMethod === 'sku' ? (
                    <div className="nita-input-group" style={{ gridColumn: 'span 2' }}>
                      <label className="nita-label"><FaBarcode /> Código SKU</label>
                      <input
                        type="text"
                        placeholder="Ingresa el código del producto..."
                        value={item.sku}
                        onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                        required
                        className="nita-input"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="nita-input-group">
                        <label className="nita-label"><FaTag /> Categoría</label>
                        <select
                          value={item.category_id}
                          onChange={e => handleItemChange(idx, 'category_id', e.target.value)}
                          required
                          className="nita-input nita-select"
                        >
                          <option value="">Seleccionar...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="nita-input-group">
                        <label className="nita-label"><FaBox /> Producto</label>
                        <select
                          value={item.product_name}
                          onChange={e => handleItemChange(idx, 'product_name', e.target.value)}
                          required
                          disabled={!item.category_id}
                          className="nita-input nita-select"
                        >
                          <option value="">Seleccionar...</option>
                          {getProductNamesForCategory(item.category_id).map((name, i) => (
                            <option key={i} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="nita-input-group">
                        <label className="nita-label"><FaPalette /> Color</label>
                        <select
                          value={item.color}
                          onChange={e => handleItemChange(idx, 'color', e.target.value)}
                          required
                          disabled={!item.product_name}
                          className="nita-input nita-select"
                        >
                          <option value="">Color...</option>
                          {getColorsForProduct(item.category_id, item.product_name).map((color, i) => (
                            <option key={i} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                      <div className="nita-input-group">
                        <label className="nita-label"><FaRulerVertical /> Talle</label>
                        <select
                          value={item.size}
                          onChange={e => handleItemChange(idx, 'size', e.target.value)}
                          required
                          disabled={!item.color}
                          className="nita-input nita-select"
                        >
                          <option value="">Talle...</option>
                          {getSizesForProductColor(item.category_id, item.product_name, item.color).map((size, i) => (
                            <option key={i} value={size}>{size}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="nita-input-group">
                    <label className="nita-label"><FaPlus /> Cantidad</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="1"
                        max={item.stock_available}
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        required
                        className="nita-input"
                        style={{ paddingRight: '100px' }}
                      />
                      {item.product_id && (
                        <div style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          fontSize: '11px', fontWeight: '800', background: 'var(--bg-tertiary)',
                          padding: '6px 12px', borderRadius: '8px', color: 'var(--text-secondary)'
                        }}>
                          MÁX: {item.stock_available}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="nita-input-group">
                    <label className="nita-label"><FaDollarSign /> Precio Unitario</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: '600' }}>$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                        required
                        className="nita-input"
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                  </div>
                </div>

                {item.product_id && (
                  <div style={{
                    marginTop: '15px', padding: '15px 20px', background: 'var(--bg-tertiary)',
                    borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', gap: '20px' }}>

                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        Producto: <span style={{ color: 'var(--text-primary)' }}>{item.product_name}</span>
                      </span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '850', color: 'var(--accent-pink)' }}>
                      {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem} className="btn-add-item">
            <FaPlus /> AGREGAR OTRO PRODUCTO AL CARRITO
          </button>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="nita-card" style={{ position: 'sticky', top: '30px' }}>
            <div className="summary-header">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: 0.9, marginBottom: '8px' }}>
                <FaCheckCircle style={{ color: 'var(--accent-pink)', fontSize: '12px' }} />
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8' }}>Resumen de Pago</span>
              </div>
              <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '600' }}>Total a pagar</span>
              <span className="summary-total">{formatCurrency(calculateTotal())}</span>
            </div>

            <div style={{ padding: '30px' }}>
              <div className="nita-input-group">
                <label className="nita-label"><FaEnvelope /> Email del Cliente <span style={{ color: 'var(--accent-pink)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <FaEnvelope style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="email"
                    placeholder="mail@cliente.com"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="nita-input"
                    style={{ paddingLeft: '45px' }}
                    required
                  />
                </div>
              </div>

              <div className="nita-input-group">
                <label className="nita-label"><FaCreditCard /> Método de Pago</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { id: 'efectivo', icon: '💵', label: 'Efectivo' },
                    { id: 'tarjeta', icon: '💳', label: 'Tarjeta' },
                    { id: 'transferencia', icon: '🏦', label: 'Transf' }
                  ].map(method => (
                    <div
                      key={method.id}
                      className={`method-card ${paymentMethod === method.id ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className="icon-placeholder">{method.icon}</div>
                      <span className="method-name">{method.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                <div className="nita-input-group">
                  <label className="nita-label"><FaPercent /> Desc. %</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0" max="100"
                      value={discountPercent}
                      onChange={e => setDiscountPercent(e.target.value)}
                      className="nita-input"
                      style={{ paddingRight: '35px' }}
                    />
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-pink)', fontWeight: '800', fontSize: '13px' }}>%</span>
                  </div>
                </div>
                <div className="nita-input-group">
                  <label className="nita-label"><FaDollarSign /> Desc. $</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#f73194', fontWeight: '800', fontSize: '13px' }}>$</span>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(e.target.value)}
                      className="nita-input"
                      style={{ paddingLeft: '28px' }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-register-sale"
              >
                {loading ? 'REGISTRANDO...' : (
                  <>
                    Registrar Venta
                    <FaArrowRight style={{ fontSize: '18px' }} />
                  </>
                )}
              </button>

              <p style={{ marginTop: '20px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', fontWeight: '600' }}>
                Al registrar, el stock se descontará automáticamente.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
