const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Registro de usuario (solo admin)
const { authorizeRoles } = require('../middleware/auth');
router.post('/register', authenticate, authorizeRoles('admin'), authController.register);
// Login
router.post('/login', authController.login);
// Logout
router.post('/logout', authController.logout);
// Recuperar contraseña
router.post('/forgot-password', authController.forgotPassword);
// Resetear contraseña (requiere autenticación de admin)
router.post('/reset-password', authenticate, authController.resetPassword);
// Obtener usuario autenticado
router.get('/me', authController.me);

module.exports = router;

