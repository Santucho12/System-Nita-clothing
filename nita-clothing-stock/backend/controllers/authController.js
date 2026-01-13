const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SECRET = process.env.JWT_SECRET || 'nita-secret-key';

exports.register = async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;
        if (!username || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
        }
        const userExists = await User.findByEmail(email);
        if (userExists) {
            return res.status(409).json({ success: false, message: 'El email ya está registrado' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword, full_name, role, status: 'activo' });
        res.status(201).json({ success: true, user: { id: user.id, username, email, full_name, role } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error registrando usuario', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email y contraseña requeridos' });
        }
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '8h' });
        await User.updateLastLogin(user.id);
        res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error en login', error: err.message });
    }
};

exports.logout = (req, res) => {
    // El logout se maneja en frontend eliminando el token
    res.json({ success: true, message: 'Sesión cerrada' });
};

exports.forgotPassword = async (req, res) => {
    // Implementación básica: solo simula el envío
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requerido' });
    // Aquí se enviaría un email real
    res.json({ success: true, message: 'Si el email existe, se enviará un enlace para restablecer la contraseña' });
};

exports.resetPassword = async (req, res) => {
    // Implementación básica: requiere email y nueva contraseña
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ success: false, message: 'Datos incompletos' });
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(user.id, hashed);
    res.json({ success: true, message: 'Contraseña actualizada' });
};

exports.me = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'Token requerido' });
        const decoded = jwt.verify(token, SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }
};
