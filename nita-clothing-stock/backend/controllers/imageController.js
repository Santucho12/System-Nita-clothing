const ProductImage = require('../models/ProductImage');
const { upload, processImage, deleteImage } = require('../middleware/imageUpload');

// Subir imágenes (múltiples)
exports.uploadImages = [
  upload.array('images', 10), // Máximo 10 imágenes
  async (req, res) => {
    try {
      const productId = req.params.id;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No se enviaron imágenes' });
      }

      const uploadedImages = [];

      for (const file of files) {
        // Procesar imagen (crear thumbnail y optimizar)
        const { url, thumbnail } = await processImage(file.path);

        // Guardar en base de datos
        const image = await ProductImage.create({
          product_id: productId,
          url,
          thumbnail_url: thumbnail,
          is_primary: uploadedImages.length === 0 ? 1 : 0, // Primera es primaria
          order: uploadedImages.length,
          uploaded_by: req.user?.id || null
        });

        uploadedImages.push(image);
      }

      res.json({
        message: `${uploadedImages.length} imagen(es) subida(s) exitosamente`,
        images: uploadedImages
      });
    } catch (error) {
      console.error('Error subiendo imágenes:', error);
      res.status(500).json({ message: 'Error al subir imágenes', error: error.message });
    }
  }
];

// Obtener imágenes de un producto
exports.getProductImages = async (req, res) => {
  try {
    const productId = req.params.id;
    const images = await ProductImage.findByProduct(productId);
    res.json(images);
  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    res.status(500).json({ message: 'Error al obtener imágenes', error: error.message });
  }
};

// Establecer imagen como primaria
exports.setPrimaryImage = async (req, res) => {
  try {
    const { id, productId } = req.params;
    const image = await ProductImage.setPrimary(id, productId);
    res.json({ message: 'Imagen establecida como primaria', image });
  } catch (error) {
    console.error('Error estableciendo imagen primaria:', error);
    res.status(500).json({ message: 'Error al establecer imagen primaria', error: error.message });
  }
};

// Eliminar imagen
exports.deleteImage = async (req, res) => {
  try {
    const imageId = req.params.imageId;
    
    // Obtener info de la imagen
    const image = await ProductImage.findById(imageId);
    if (!image) {
      return res.status(404).json({ message: 'Imagen no encontrada' });
    }

    // Eliminar archivos físicos
    const filename = image.url.split('/').pop();
    deleteImage(filename);

    // Eliminar de base de datos
    await ProductImage.delete(imageId);

    res.json({ message: 'Imagen eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    res.status(500).json({ message: 'Error al eliminar imagen', error: error.message });
  }
};
