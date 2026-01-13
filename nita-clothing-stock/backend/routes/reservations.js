const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/reservationController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', authorizeRoles('admin', 'supervisor', 'vendedor'), ReservationController.createReservation);
router.get('/', ReservationController.getAllReservations);
router.get('/activas', ReservationController.getActiveReservations);
router.get('/proximas-vencer', ReservationController.getExpiringSoon);
router.get('/:id', ReservationController.getReservationById);
router.patch('/:id/completar', authorizeRoles('admin', 'supervisor'), ReservationController.completeReservation);
router.patch('/:id/cancelar', authorizeRoles('admin', 'supervisor'), ReservationController.cancelReservation);
router.patch('/:id/extender', authorizeRoles('admin', 'supervisor'), ReservationController.extendReservation);

module.exports = router;
