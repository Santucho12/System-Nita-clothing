import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { toast } from 'react-toastify';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAll();
      setCategories(response.data || []);
    } catch (error) {
      toast.error('Error cargando categorías: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de la categoría
  const handleToggleStatus = async (category) => {
    const newStatus = category.status === 'activa' ? 'inactiva' : 'activa';
    try {
      await categoryService.changeStatus(category.id, newStatus);
      toast.success(`Categoría ${newStatus === 'activa' ? 'activada' : 'desactivada'} correctamente`);
      loadCategories();
    } catch (error) {
      toast.error('Error cambiando estado: ' + error.message);
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
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, formData);
        toast.success('Categoría actualizada exitosamente');
      } else {
        await categoryService.create(formData);
        toast.success('Categoría creada exitosamente');
      }
      
      setFormData({ name: '', description: '' });
      setShowForm(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await categoryService.delete(id);
        toast.success('Categoría eliminada exitosamente');
        loadCategories();
      } catch (error) {
        toast.error('Error eliminando categoría: ' + error.message);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setShowForm(false);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Cargando categorías...</p>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-folder"></i>
          Gestión de Categorías
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          <i className="fas fa-plus"></i>
          Nueva Categoría
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-header">
            <h3>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <button 
              className="btn btn-ghost"
              onClick={handleCancel}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nombre *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Remeras, Pantalones, Accesorios..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descripción opcional de la categoría"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-save"></i>
                {editingCategory ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="categories-grid">
        {categories.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-folder-open"></i>
            <h3>No hay categorías</h3>
            <p>Crea tu primera categoría para empezar a organizar tus productos</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <i className="fas fa-plus"></i>
              Crear Primera Categoría
            </button>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className={`category-card ${category.status === 'inactiva' ? 'inactive' : ''}`}>
              <div className="category-header">
                <h3>{category.name}</h3>
                <div className="category-actions">
                  <button 
                    className="btn btn-icon btn-edit"
                    onClick={() => handleEdit(category)}
                    title="Editar categoría"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="btn btn-icon btn-delete"
                    onClick={() => handleDelete(category.id)}
                    title="Eliminar categoría"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                  <button
                    className={`btn btn-icon btn-status ${category.status === 'activa' ? 'btn-inactive' : 'btn-active'}`}
                    onClick={() => handleToggleStatus(category)}
                    title={category.status === 'activa' ? 'Desactivar' : 'Activar'}
                  >
                    <i className={`fas fa-toggle-${category.status === 'activa' ? 'on' : 'off'}`}></i>
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
              <div className="category-meta">
                <small>
                  <i className="fas fa-calendar"></i>
                  Creada: {new Date(category.created_at).toLocaleDateString()}
                </small>
                <span className={`category-status ${category.status}`}>{category.status === 'activa' ? 'Activa' : 'Inactiva'}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Categories;