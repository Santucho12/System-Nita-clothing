import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { toast } from 'react-toastify';
import { FaFolderOpen, FaPlus, FaEdit, FaTrash, FaFolder, FaTimes, FaSave, FaToggleOn, FaToggleOff, FaCalendarAlt, FaSearch } from 'react-icons/fa';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

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
    setFormData(prev => ({ ...prev, [name]: value }));
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
      handleCancel();
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '30px', background: 'var(--bg-gradient)', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes perspective3DFlip {
            0% { opacity: 0; transform: perspective(1000px) rotateY(-15deg) rotateX(10deg); }
            100% { opacity: 1; transform: perspective(1000px) rotateY(0deg) rotateX(0deg); }
          }
          .page-header { animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          .form-card { animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both; }
          .category-card { 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: perspective3DFlip 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          .category-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important; }
          .btn-pink { background: #f73194; color: white; border: none; transition: all 0.3s; }
          .btn-pink:hover { transform: scale(1.05); background: #d6267d; }
          .btn-outline-pink { border: 2px solid #f73194; color: #f73194; background: transparent; transition: all 0.3s; }
          .btn-outline-pink:hover { background: #f73194; color: white; }
          .input-focus:focus { border-color: #f73194 !important; box-shadow: 0 0 0 4px rgba(247, 49, 148, 0.1) !important; outline: none !important; }
        `}
      </style>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', margin: 0, fontSize: '28px', color: '#333', fontWeight: '700' }}>
          <FaFolderOpen style={{ marginRight: '15px', color: '#f73194', fontSize: '32px' }} />
          Gestión de Categorías
        </h1>
        <button
          className="btn-pink"
          onClick={() => setShowForm(true)}
          style={{ padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600' }}
        >
          <FaPlus /> Nueva Categoría
        </button>
      </div>

      <div style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#f73194' }} />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-focus"
            style={{ width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px', border: '2px solid #eee', fontSize: '15px' }}
          />
        </div>
      </div>

      {showForm && (
        <div className="form-card" style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f8f9fa', paddingBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>
              {editingCategory ? '✏️ Editar Categoría' : '📂 Nueva Categoría'}
            </h3>
            <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '20px' }}><FaTimes /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>Nombre</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="input-focus"
                placeholder="Ej: Accesorios"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #eee' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>Descripción</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input-focus"
                placeholder="Descripción opcional..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #eee' }}
              />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={handleCancel} style={{ padding: '12px 25px', borderRadius: '8px', border: 'none', background: '#eee', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
              <button type="submit" className="btn-pink" style={{ padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaSave /> {editingCategory ? 'Actualizar' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ width: '50px', height: '50px', border: '5px solid #f73194', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: '15px', color: '#666' }}>Cargando categorías...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
          {filteredCategories.map((cat, index) => (
            <div key={cat.id} className="category-card" style={{
              background: 'white',
              borderRadius: '15px',
              padding: '25px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              position: 'relative',
              overflow: 'hidden',
              animationDelay: `${index * 0.05}s`
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: cat.status === 'activa' ? '#f73194' : '#6c757d' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#333', fontWeight: '700' }}>{cat.name}</h3>
                  <span style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: cat.status === 'activa' ? '#ffeaf3' : '#eee',
                    color: cat.status === 'activa' ? '#f73194' : '#666',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    marginTop: '5px',
                    display: 'inline-block'
                  }}>
                    {cat.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(cat)} style={{ background: '#f8f9fa', border: 'none', padding: '8px', borderRadius: '8px', color: '#f73194', cursor: 'pointer', transition: '0.3s' }} className="btn-outline-pink"><FaEdit /></button>
                  <button onClick={() => handleDelete(cat.id)} style={{ background: '#f8f9fa', border: 'none', padding: '8px', borderRadius: '8px', color: '#dc3545', cursor: 'pointer', transition: '0.3s' }}><FaTrash /></button>
                </div>
              </div>

              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', minHeight: '40px', lineHeight: '1.5' }}>
                {cat.description || <em style={{ color: '#ccc' }}>Sin descripción disponible</em>}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                <span style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FaCalendarAlt /> {new Date(cat.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleToggleStatus(cat)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: cat.status === 'activa' ? '#f73194' : '#999',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: '0.3s'
                  }}
                >
                  {cat.status === 'activa' ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;