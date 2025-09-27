import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '../services/api';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    quantity: '',
    photo_url: '',
    category_id: ''
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtrar productos cuando cambia la categoría seleccionada o término de búsqueda
  useEffect(() => {
    if (selectedCategory || searchTerm) {
      filterProducts();
    } else {
      loadProducts();
    }
  }, [selectedCategory, searchTerm]);

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

  const filterProducts = async () => {
    try {
      if (searchTerm) {
        const response = await productService.search(searchTerm);
        setProducts(response.data || []);
      } else if (selectedCategory) {
        const response = await productService.getByCategory(selectedCategory);
        setProducts(response.data || []);
      }
    } catch (error) {
      toast.error('Error filtrando productos: ' + error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.color.trim() || !formData.category_id) {
      toast.error('Nombre, color y categoría son requeridos');
      return;
    }

    if (formData.quantity === '' || parseInt(formData.quantity) < 0) {
      toast.error('La cantidad debe ser un número mayor o igual a 0');
      return;
    }

    try {
      const productData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        category_id: parseInt(formData.category_id)
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

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      color: product.color,
      quantity: product.quantity.toString(),
      photo_url: product.photo_url || '',
      category_id: product.category_id.toString()
    });
    setShowForm(true);
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
      quantity: '',
      photo_url: '',
      category_id: ''
    });
    setShowForm(false);
    setEditingProduct(null);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 5) return 'low-stock';
    return 'in-stock';
  };

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="products-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-tshirt"></i>
          Gestión de Productos
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <i className="fas fa-plus"></i>
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="search">Buscar productos:</label>
          <input
            type="text"
            id="search"
            placeholder="Buscar por nombre o color..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="category-filter">Filtrar por categoría:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {(selectedCategory || searchTerm) && (
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSelectedCategory('');
              setSearchTerm('');
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
                  placeholder="0"
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
            </div>

            <div className="form-group">
              <label htmlFor="photo_url">URL de la foto</label>
              <input
                type="url"
                id="photo_url"
                name="photo_url"
                value={formData.photo_url}
                onChange={handleInputChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
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
              {product.photo_url && (
                <div className="product-image">
                  <img src={product.photo_url} alt={product.name} />
                </div>
              )}
              
              <div className="product-content">
                <div className="product-header">
                  <h3>{product.name}</h3>
                  <div className="product-actions">
                    <button 
                      className="btn btn-icon btn-edit"
                      onClick={() => handleEdit(product)}
                      title="Editar producto"
                    >
                      <i className="fas fa-edit"></i>
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
                    <span className={`stock-badge ${getStockStatus(product.quantity)}`}>
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
    </div>
  );
};

export default Products;