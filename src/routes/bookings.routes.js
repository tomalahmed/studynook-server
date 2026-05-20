const express = require('express');
const bookingsController = require('../controllers/bookings.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/mine', bookingsController.listMyBookings);
router.post('/', bookingsController.createBooking);
router.patch('/:id/cancel', bookingsController.cancelBooking);

module.exports = router;
