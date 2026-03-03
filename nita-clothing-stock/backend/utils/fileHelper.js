const fs = require('fs');
const path = require('path');

/**
 * Borra un archivo físico del disco de forma segura
 * @param {string} filePath - Ruta relativa o absoluta del archivo
 */
const deletePhysicalFile = (filePath) => {
    if (!filePath) return false;

    // Obtener solo el nombre del archivo para evitar navegación por directorios (Path Traversal)
    const fileName = path.basename(filePath);

    // Construir la ruta absoluta asegurando que esté dentro de la carpeta uploads
    // Asumimos que todos los archivos borrables por este helper están en backend/uploads/
    const absolutePath = path.join(__dirname, '../../uploads', fileName);

    // Verificación de seguridad adicional: el path resultante debe empezar con el directorio de uploads esperado
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!absolutePath.startsWith(uploadsDir)) {
        console.error(`[FileHelper] Intento de Path Traversal bloqueado: ${absolutePath}`);
        return false;
    }

    if (fs.existsSync(absolutePath)) {
        try {
            fs.unlinkSync(absolutePath);
            console.log(`[FileHelper] Archivo borrado físicamente: ${absolutePath}`);
            return true;
        } catch (e) {
            console.error(`[FileHelper] Error borrando archivo ${absolutePath}:`, e.message);
            return false;
        }
    } else {
        console.warn(`[FileHelper] El archivo no existe: ${absolutePath}`);
    }
    return false;
};

/**
 * Limpieza de archivos huérfanos (Place holder para futura implementación)
 * Compara archivos en carpetas de upload vs registros en base de datos
 */
const cleanupOrphanedFiles = async () => {
    console.log('[FileHelper] Iniciando limpieza de archivos huérfanos (Not implemented yet)');
};

module.exports = { deletePhysicalFile, cleanupOrphanedFiles };
