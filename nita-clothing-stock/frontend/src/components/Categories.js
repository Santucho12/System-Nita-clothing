import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { toast } from 'react-toastify';
import {
  FaFolderOpen, FaPlus, FaEdit, FaTrash, FaFolder, FaTimes,
  FaSave, FaToggleOn, FaToggleOff, FaCalendarAlt, FaSearch,
  FaLayerGroup
} from 'react-icons/fa';

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
    <div style={{
      padding: '40px',
      background: '#f8fafc',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>
        {`
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .categories-header {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            animation: slideInUp 0.6s ease-out;
          }

          .category-card-premium {
            background: white;
            border-radius: 20px;
            padding: 24px;
            border: 1px solid #f1f5f9;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: slideInUp 0.6s ease-out both;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .category-card-premium:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-color: #f73194;
          }

          .category-icon-bg {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            background: #fff0f7;
            color: #f73194;
            transition: all 0.3s;
          }

          .category-card-premium:hover .category-icon-bg {
            background: #f73194;
            color: white;
            transform: scale(1.1) rotate(5deg);
          }

          .search-wrapper-premium {
            background: white;
            border-radius: 12px;
            padding: 4px 12px;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          }

          .search-wrapper-premium:focus-within {
            border-color: #f73194;
            box-shadow: 0 0 0 3px rgba(247, 49, 148, 0.1);
          }

          .search-input-premium {
            border: none;
            padding: 10px 0;
            flex-grow: 1;
            font-size: 14px;
            font-weight: 500;
            color: #1e293b;
            outline: none;
          }

          .btn-add-premium {
            padding: 12px 24px;
            background: #f73194;
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 6px rgba(247, 49, 148, 0.2);
          }

          .btn-add-premium:hover {
            background: #d42079;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(247, 49, 148, 0.3);
          }

          .btn-action-premium {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            border: 1px solid #f1f5f9;
            background: #f8fafc;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-action-premium:hover {
            background: #fff0f7;
            color: #f73194;
            border-color: #f73194;
            transform: scale(1.1);
          }

          .btn-delete-premium:hover {
            background: #fef2f2;
            color: #ef4444;
            border-color: #fecaca;
          }
          
          @keyframes spin { to { transform: rotate(360deg); } }
        `}
      </style>

      {/* Header Sección */}
      <div className="categories-header" style={{
        padding: '30px',
        borderRadius: '24px',
        marginBottom: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#1e293b', fontSize: '32px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f73194', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaLayerGroup size={28} />
              </div>
              Categorías
            </h1>
            <p style={{ margin: '8px 0 0 71px', color: '#64748b', fontWeight: '500' }}>Administra y organiza tus productos por Categorias</p>
          </div>
          <button className="btn-add-premium" onClick={() => setShowForm(true)}>
            <FaPlus /> Nueva Categoría
          </button>
        </div>

        <div className="search-wrapper-premium">
          <FaSearch color="#94a3b8" size={18} />
          <input
            className="search-input-premium"
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="categories-header" style={{ width: '100%', maxWidth: '500px', padding: '35px', borderRadius: '24px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>
                {editingCategory ? '✏️ Editar Categoría' : '📂 Nueva Categoría'}
              </h2>
              <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}><FaTimes /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px' }}
                  placeholder="Ej: Accesorios"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '15px', minHeight: '100px', resize: 'vertical' }}
                  placeholder="Describe esta categoría..."
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={handleCancel} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="btn-add-premium" style={{ flex: 2, justifyContent: 'center' }}>
                  <FaSave /> {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listado de Categorías */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f73194', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '20px', color: '#64748b', fontWeight: '600' }}>Cargando colecciones...</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {filteredCategories.map((cat, index) => (
            <div key={cat.id} className="category-card-premium" style={{
              animationDelay: `${index * 0.05}s`,
              position: 'relative',
              overflow: 'hidden',
              padding: '24px 24px 20px 24px'
            }}>
              {/* Barra lateral de estado - Estética anterior */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '6px',
                height: '100%',
                background: cat.status === 'activa' ? '#f73194' : '#94a3b8'
              }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: '800' }}>{cat.name}</h3>
                  <span style={{
                    fontSize: '10px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    background: cat.status === 'activa' ? '#fff0f7' : '#f1f5f9',
                    color: cat.status === 'activa' ? '#f73194' : '#64748b',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    marginTop: '6px',
                    display: 'inline-block'
                  }}>
                    {cat.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-action-premium" onClick={() => handleEdit(cat)} title="Editar"><FaEdit /></button>
                  <button className="btn-action-premium btn-delete-premium" onClick={() => handleDelete(cat.id)} title="Eliminar"><FaTrash /></button>
                </div>
              </div>

              <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px', lineHeight: '1.6', minHeight: '44px' }}>
                {cat.description || <em style={{ color: '#cbd5e1' }}>Sin descripción detallada.</em>}
              </p>

              <div style={{
                marginTop: 'auto',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px', fontWeight: '600' }}>
                  <FaCalendarAlt size={14} />
                  {new Date(cat.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                <div
                  onClick={() => handleToggleStatus(cat)}
                  style={{
                    cursor: 'pointer',
                    color: cat.status === 'activa' ? '#f73194' : '#cbd5e1',
                    fontSize: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.3s'
                  }}
                >
                  {cat.status === 'activa' ? <FaToggleOn /> : <FaToggleOff />}
                </div>
              </div>
            </div>
          ))}

          {/* Tarjeta de Acceso Rápido para Añadir */}
          <div
            onClick={() => setShowForm(true)}
            className="category-card-premium"
            style={{
              border: '2px dashed #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              minHeight: '210px',
              padding: '24px',
              boxShadow: 'none'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'white',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: '#f73194',
                fontSize: '20px'
              }}>
                <FaPlus />
              </div>
              <h4 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Nueva Categoría</h4>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px', fontWeight: '500' }}>Click para empezar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;