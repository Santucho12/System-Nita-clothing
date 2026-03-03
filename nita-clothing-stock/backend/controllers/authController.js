const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRATION } = require('../config/jwtConfig');

exports.register = async (req, res, next) => {
    try {
        const { username, email, password, full_name, role } = req.body;
        if (!username || !email || !password || !role) {
            const error = new Error('Faltan campos obligatorios');
            error.status = 400;
            throw error;
        }
        const userExists = await User.findByEmail(email);
        if (userExists) {
            const error = new Error('El email ya está registrado');
            error.status = 409;
            throw error;
        }
        const user = await User.create({ username, email, password, full_name, role, status: 'activo' });
        res.status(201).json({ success: true, user: { id: user.id, username, email, full_name, role } });
    } catch (err) {
        next(err);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            const error = new Error('Email y contraseña requeridos');
            error.status = 400;
            throw error;
        }
        const user = await User.findByEmail(email);
        if (!user) {
            const error = new Error('Credenciales inválidas');
            error.status = 401;
            throw error;
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            const error = new Error('Credenciales inválidas');
            error.status = 401;
            throw error;
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        await User.updateLastLogin(user.id);
        res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    res.json({ success: true, message: 'Sesión cerrada' });
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            const error = new Error('Email requerido');
            error.status = 400;
            throw error;
        }
        res.json({ success: true, message: 'Si el email existe, se enviará un enlace para restablecer la contraseña' });
    } catch (err) {
        next(err);
    }
};

/**
 * Reset password — REQUIERE autenticación y rol admin.
 * Solo un admin puede resetear la contraseña de otro usuario.
 */
exports.resetPassword = async (req, res, next) => {
    try {
        // Verificar que el usuario está autenticado (el middleware de auth ya lo hace)
        if (!req.user) {
            const error = new Error('Autenticación requerida para resetear contraseñas');
            error.status = 401;
            throw error;
        }

        // Solo admin puede resetear contraseñas de otros usuarios
        if (req.user.role !== 'admin') {
            const error = new Error('Solo los administradores pueden resetear contraseñas');
            error.status = 403;
            throw error;
        }

        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            const error = new Error('Datos incompletos');
            error.status = 400;
            throw error;
        }

        if (newPassword.length < 6) {
            const error = new Error('La contraseña debe tener al menos 6 caracteres');
            error.status = 400;
            throw error;
        }

        const user = await User.findByEmail(email);
        if (!user) {
            const error = new Error('Usuario no encontrado');
            error.status = 404;
            throw error;
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(user.id, hashed);
        res.json({ success: true, message: 'Contraseña actualizada' });
    } catch (err) {
        next(err);
    }
};

exports.me = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            const error = new Error('Token requerido');
            error.status = 401;
            throw error;
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            const error = new Error('Usuario no encontrado');
            error.status = 404;
            throw error;
        }
        res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            const error = new Error('Token inválido o expirado');
            error.status = 401;
            return next(error);
        }
        next(err);
    }
};


