import React, { useState } from 'react';
import api from '../services/api';
import './ImageUpload.css';

const ImageUpload = ({ productId, onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar tamaño
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} es demasiado grande (máx 5MB)`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
    
    // Crear previsualizaciones
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    setError('');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await api.post(`/images/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Limpiar
      setSelectedFiles([]);
      setPreviews([]);
      
      if (onUploadComplete) {
        onUploadComplete(response.data.images);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al subir imágenes');
    } finally {
      setUploading(false);
    }
  };

  // Limpiar previews al desmontar
  React.useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  return (
    <div className="image-upload-container">
      <div className="upload-section">
        <label htmlFor="image-input" className="upload-label">
          <i className="fas fa-camera"></i>
          <span>Seleccionar Imágenes</span>
          <small>Desde galería o cámara</small>
        </label>
        <input
          id="image-input"
          type="file"
          accept="image/*"
          multiple
          capture="environment" // Permite usar cámara en móviles
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {previews.length > 0 && (
        <div className="previews-section">
          <h4>Imágenes seleccionadas ({previews.length})</h4>
          <div className="preview-grid">
            {previews.map((preview, index) => (
              <div key={index} className="preview-item">
                <img src={preview} alt={`Preview ${index + 1}`} />
                <button
                  className="remove-preview"
                  onClick={() => {
                    const newFiles = [...selectedFiles];
                    const newPreviews = [...previews];
                    URL.revokeObjectURL(newPreviews[index]);
                    newFiles.splice(index, 1);
                    newPreviews.splice(index, 1);
                    setSelectedFiles(newFiles);
                    setPreviews(newPreviews);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Subiendo...
              </>
            ) : (
              <>
                <i className="fas fa-upload"></i> Subir Imágenes
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="upload-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
