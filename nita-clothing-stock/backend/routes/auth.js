const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registro de usuario (solo admin)
router.post('/register', authController.register);
// Login
router.post('/login', authController.login);
// Logout
router.post('/logout', authController.logout);
// Recuperar contraseña
router.post('/forgot-password', authController.forgotPassword);
// Resetear contraseña
router.post('/reset-password', authController.resetPassword);
// Obtener usuario autenticado
router.get('/me', authController.me);

module.exports = router;
