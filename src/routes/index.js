const express = require('express');
const roomsRoutes = require('./rooms.routes');
const bookingsRoutes = require('./bookings.routes');
const meRoutes = require('./me.routes');

const router = express.Router();

router.use('/me', meRoutes);
router.use('/rooms', roomsRoutes);
router.use('/bookings', bookingsRoutes);

module.exports = router;
