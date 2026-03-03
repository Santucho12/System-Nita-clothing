import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { productService, categoryService } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { FaShoppingCart, FaPlus, FaTrash, FaBox, FaHashtag, FaDollarSign, FaEnvelope, FaCreditCard, FaPercent, FaCheckCircle, FaTimesCircle, FaBarcode, FaTshirt, FaPalette, FaRulerVertical, FaTag } from 'react-icons/fa';
import { toast } from 'react-toastify';

const initialItem = {
  searchMethod: 'sku', // 'sku' o 'details'
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

  useEffect(() => {
    loadCategories();
    loadProducts();
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

          .sale-form-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both;
          }

          .total-card {
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both;
          }

          .btn-pink {
            background: #f73194;
            transition: all 0.3s ease;
          }
          .btn-pink:hover {
            transform: scale(1.1);
          }
          .btn-secondary {
            background: #2d2d2d;
            transition: all 0.6s ease;
          }
          .btn-secondary:hover {
            transform: scale(1.1);
          }
          .btn-danger {
            background: #dc3545;
            transition: all 0.3s ease;
          }
          .btn-danger:hover {
            transform: scale(1.1);
          }
          .form-input {
            transition: all 0.3s ease;
          }
          .form-input:focus {
            border-color: #f73194 !important;
            box-shadow: 0 0 0 3px rgba(247, 49, 148, 0.1) !important;
            outline: none !important;
          }
          .item-card {
            transition: all 0.3s ease;
          }
          .item-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
          }
        `}
      </style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '28px', color: '#333', fontWeight: '600' }}>
          <FaShoppingCart style={{ marginRight: '12px', color: '#f73194', fontSize: '32px' }} />
          Registrar Venta
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div className="sale-form-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>
              <FaBox style={{ color: '#f73194' }} />
              Productos
            </h3>

            {items.map((item, idx) => (
              <div key={idx} className="item-card" style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '15px', border: '2px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
                {/* Div superior: Botones de método */}
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleItemChange(idx, 'searchMethod', 'sku')}
                      style={{
                        flex: 1,
                        maxWidth: '240px',
                        padding: '14px 20px',
                        background: item.searchMethod === 'sku' ? '#f73194' : 'white',
                        color: item.searchMethod === 'sku' ? 'white' : '#666',
                        border: `2px solid ${item.searchMethod === 'sku' ? '#f73194' : '#e0e0e0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.3s',
                        boxShadow: item.searchMethod === 'sku' ? '0 2px 8px rgba(247, 49, 148, 0.3)' : 'none'
                      }}
                    >
                      <FaBarcode />
                      SKU
                    </button>
                    <button
                      type="button"
                      onClick={() => handleItemChange(idx, 'searchMethod', 'details')}
                      style={{
                        flex: 1,
                        maxWidth: '240px',
                        padding: '14px 20px',
                        background: item.searchMethod === 'details' ? '#f73194' : 'white',
                        color: item.searchMethod === 'details' ? 'white' : '#666',
                        border: `2px solid ${item.searchMethod === 'details' ? '#f73194' : '#e0e0e0'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.3s',
                        boxShadow: item.searchMethod === 'details' ? '0 2px 8px rgba(247, 49, 148, 0.3)' : 'none'
                      }}
                    >
                      <FaTshirt />
                      Categoría + Detalles
                    </button>
                  </div>
                </div>

                {/* Div inferior: Campos y subtotal */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', width: '100%' }}>
                  {/* Campos según el método seleccionado */}
                  {item.searchMethod === 'sku' ? (
                    // Búsqueda por SKU
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaBarcode style={{ marginRight: '8px', color: '#f73194' }} />
                            SKU
                          </label>
                          <input
                            type="text"
                            placeholder="1,2,3,etc"
                            value={item.sku}
                            onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                            required
                            className="form-input"
                            style={{ width: '100%', padding: '14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaBox style={{ marginRight: '8px', color: '#f73194' }} />
                            Cantidad
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              min="1"
                              max={item.stock_available}
                              placeholder="Ej: 2"
                              value={item.quantity}
                              onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                              required
                              className="form-input"
                              style={{
                                width: '100%',
                                padding: '14px 85px 14px 14px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '15px',
                                borderColor: item.quantity > item.stock_available ? '#dc3545' : '#e0e0e0'
                              }}
                            />
                            {item.product_id && (
                              <div style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '11px',
                                fontWeight: '800',
                                color: item.stock_available <= 0 ? '#dc3545' : item.stock_available <= 5 ? '#ff8c00' : '#4CAF50',
                                pointerEvents: 'none',
                                background: item.stock_available <= 5 ? '#fff3e0' : '#e8f5e9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${item.stock_available <= 5 ? '#ffe0b2' : '#c8e6c9'}`
                              }}>
                                Stock: {item.stock_available}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaDollarSign style={{ marginRight: '8px', color: '#f73194' }} />
                            Precio
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.unit_price}
                            onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                            required
                            className="form-input"
                            style={{ width: '100%', padding: '14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px' }}
                          />
                        </div>
                      </div>

                      {/* Visualización de detalles del producto encontrado por SKU */}
                      {item.product_id && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 2fr 1fr',
                          gap: '12px',
                          padding: '12px',
                          background: '#f0f4f8',
                          borderRadius: '8px',
                          borderLeft: '4px solid #f73194'
                        }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Categoría</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                              {categories.find(c => c.id == item.category_id)?.name || 'Cargando...'}
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Producto</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{item.product_name}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '11px', color: '#888', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Talle</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>{item.size || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Búsqueda por categoría + detalles (en 3 filas más espaciosas)
                    <div style={{ marginBottom: '20px' }}>
                      {/* Fila 1: Categoría y Producto */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaTag style={{ marginRight: '8px', color: '#f73194' }} />
                            Categoría
                          </label>
                          <select
                            value={item.category_id}
                            onChange={e => handleItemChange(idx, 'category_id', e.target.value)}
                            required
                            className="form-input"
                            style={{ width: '100%', padding: '14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}
                          >
                            <option value="">Selecciona categoría</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaTshirt style={{ marginRight: '8px', color: '#f73194' }} />
                            Producto
                          </label>
                          <select
                            value={item.product_name}
                            onChange={e => handleItemChange(idx, 'product_name', e.target.value)}
                            required
                            disabled={!item.category_id}
                            className="form-input"
                            style={{ width: '100%', padding: '14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', cursor: item.category_id ? 'pointer' : 'not-allowed', opacity: item.category_id ? 1 : 0.6 }}
                          >
                            <option value="">Selecciona producto</option>
                            {getProductNamesForCategory(item.category_id).map((name, i) => (
                              <option key={i} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Fila 2: Color y Talle */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaPalette style={{ marginRight: '8px', color: '#f73194' }} />
                            Color
                          </label>
                          <select
                            value={item.color}
                            onChange={e => handleItemChange(idx, 'color', e.target.value)}
                            required
                            disabled={!item.product_name}
                            className="form-input"
                            style={{ width: '100%', padding: '14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', cursor: item.product_name ? 'pointer' : 'not-allowed', opacity: item.product_name ? 1 : 0.6 }}
                          >
                            <option value="">Selecciona color</option>
                            {getColorsForProduct(item.category_id, item.product_name).map((color, i) => (
                              <option key={i} value={color}>{color}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaRulerVertical style={{ marginRight: '8px', color: '#f73194' }} />
                            Talle
                          </label>
                          <select
                            value={item.size}
                            onChange={e => handleItemChange(idx, 'size', e.target.value)}
                            required
                            disabled={!item.color}
                            className="form-input"
                            style={{ width: '100%', padding: '14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px', cursor: item.color ? 'pointer' : 'not-allowed', opacity: item.color ? 1 : 0.6 }}
                          >
                            <option value="">Selecciona talle</option>
                            {getSizesForProductColor(item.category_id, item.product_name, item.color).map((size, i) => (
                              <option key={i} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Fila 3: Cantidad y Precio */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaBox style={{ marginRight: '8px', color: '#f73194' }} />
                            Cantidad
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="number"
                              min="1"
                              max={item.stock_available}
                              placeholder="Ej: 2"
                              value={item.quantity}
                              onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                              required
                              className="form-input"
                              style={{
                                width: '100%',
                                padding: '14px 85px 14px 14px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '8px',
                                fontSize: '15px',
                                borderColor: item.quantity > item.stock_available ? '#dc3545' : '#e0e0e0'
                              }}
                            />
                            {item.product_id && (
                              <div style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '11px',
                                fontWeight: '800',
                                color: item.stock_available <= 0 ? '#dc3545' : item.stock_available <= 5 ? '#ff8c00' : '#4CAF50',
                                pointerEvents: 'none',
                                background: item.stock_available <= 5 ? '#fff3e0' : '#e8f5e9',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${item.stock_available <= 5 ? '#ffe0b2' : '#c8e6c9'}`
                              }}>
                                Stock: {item.stock_available}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#555' }}>
                            <FaDollarSign style={{ marginRight: '8px', color: '#f73194' }} />
                            Precio
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.unit_price}
                            onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                            required
                            className="form-input"
                            style={{ width: '100%', padding: '14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '15px' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fila final: Subtotal y botón eliminar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', paddingTop: '15px', borderTop: '2px dashed #e0e0e0' }}>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="btn-danger"
                        style={{ padding: '10px 16px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}
                      >
                        <FaTrash />
                        Eliminar
                      </button>
                    )}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Subtotal:</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#4CAF50' }}>
                        {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="btn-secondary"
              style={{ padding: '12px 24px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '500', marginBottom: '30px', width: '100%', justifyContent: 'center' }}
            >
              <FaPlus />
              Agregar Producto
            </button>

            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>
              <FaEnvelope style={{ color: '#f73194' }} />
              Datos del Cliente
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaEnvelope style={{ marginRight: '6px', color: '#f73194' }} />
                  Email del Cliente
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                <FaCreditCard style={{ marginRight: '6px', color: '#f73194' }} />
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="form-input"
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="transferencia">🏦 Transferencia</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaPercent style={{ marginRight: '6px', color: '#f73194' }} />
                  Descuento %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#555' }}>
                  <FaDollarSign style={{ marginRight: '6px', color: '#f73194' }} />
                  Descuento $
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-pink"
              style={{ padding: '16px', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px', fontWeight: '600', width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div style={{ width: '20px', height: '20px', border: '3px solid white', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); }}`}</style>
                  </div>
                  Registrando...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Registrar Venta
                </>
              )}
            </button>
          </form>
        </div>

        <div className="total-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: 'fit-content', position: 'sticky', top: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#333', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f5f5f5', paddingBottom: '15px' }}>
            <FaDollarSign style={{ color: '#f73194' }} />
            Resumen
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Productos:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Subtotal:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                {formatCurrency(items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0))}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#ffe0f0', borderRadius: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#f73194' }}>Descuento:</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#f73194' }}>
                -{formatCurrency(
                  items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0) * (Number(discountPercent) / 100) +
                  Number(discountAmount)
                )}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '3px solid #f73194', paddingTop: '20px', marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px', background: 'linear-gradient(135deg, #ffeef8 0%, #ffe0f0 100%)', borderRadius: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>Total:</span>
              <span style={{ fontSize: '32px', fontWeight: '700', color: '#f73194' }}>
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <FaCheckCircle style={{ color: '#2196F3', fontSize: '18px', marginTop: '2px' }} />
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: '600', color: '#1976D2' }}>Información</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#555', lineHeight: '1.5' }}>
                  Completa todos los campos y presiona "Registrar Venta" para finalizar la transacción.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}
