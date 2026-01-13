const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Crear carpetas si no existen
const uploadDir = path.join(__dirname, '../../uploads/products');
const thumbsDir = path.join(__dirname, '../../uploads/products/thumbs');

[uploadDir, thumbsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WEBP, GIF)'));
  }
};

// Configuración final
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter
});

// Procesar imagen: crear thumbnail y optimizar
const processImage = async (filePath) => {
  const filename = path.basename(filePath);
  const thumbPath = path.join(thumbsDir, filename);

  try {
    // Crear thumbnail (300x300)
    await sharp(filePath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);

    // Optimizar imagen original
    await sharp(filePath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(filePath + '.tmp');

    // Reemplazar original con optimizada
    fs.renameSync(filePath + '.tmp', filePath);

    return {
      url: `/uploads/products/${filename}`,
      thumbnail: `/uploads/products/thumbs/${filename}`
    };
  } catch (error) {
    console.error('Error procesando imagen:', error);
    throw error;
  }
};

// Eliminar imagen y thumbnail
const deleteImage = (filename) => {
  const imagePath = path.join(uploadDir, filename);
  const thumbPath = path.join(thumbsDir, filename);

  try {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }
    return true;
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    return false;
  }
};

module.exports = {
  upload,
  processImage,
  deleteImage,
  uploadDir,
  thumbsDir
};
