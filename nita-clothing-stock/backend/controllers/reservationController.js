const Reservation = require('../models/Reservation');

class ReservationController {
    static async createReservation(req, res) {
        try {
            const reservation = await Reservation.create(req.body);
            res.status(201).json({ success: true, data: reservation });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async getAllReservations(req, res) {
        try {
            const reservations = await Reservation.getAll();
            res.status(200).json({ success: true, data: reservations });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getReservationById(req, res) {
        try {
            const { id } = req.params;
            const reservation = await Reservation.getById(id);
            if (!reservation) return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
            res.status(200).json({ success: true, data: reservation });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getActiveReservations(req, res) {
        try {
            const reservations = await Reservation.getActive();
            res.status(200).json({ success: true, data: reservations });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getExpiringSoon(req, res) {
        try {
            const reservations = await Reservation.getExpiringSoon();
            res.status(200).json({ success: true, data: reservations });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async completeReservation(req, res) {
        try {
            const { id } = req.params;
            const result = await Reservation.complete(id);
            res.status(200).json({ success: true, message: 'Reserva completada y venta generada', data: result });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async cancelReservation(req, res) {
        try {
            const { id } = req.params;
            await Reservation.cancel(id);
            res.status(200).json({ success: true, message: 'Reserva cancelada y stock restaurado' });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async extendReservation(req, res) {
        try {
            const { id } = req.params;
            const { new_expiration_date } = req.body;
            const reservation = await Reservation.extend(id, new_expiration_date);
            res.status(200).json({ success: true, message: 'Fecha de vencimiento extendida', data: reservation });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = ReservationController;
