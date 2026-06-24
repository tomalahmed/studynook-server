const express = require('express');
const roomsController = require('../controllers/rooms.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/latest', roomsController.getLatestRooms);
router.get('/', roomsController.listRooms);

router.get('/mine', authMiddleware, roomsController.listMyRooms);
router.get('/:id', roomsController.getRoomById);
router.post('/', authMiddleware, roomsController.createRoom);
router.put('/:id', authMiddleware, roomsController.updateRoom);
router.delete('/:id', authMiddleware, roomsController.deleteRoom);

module.exports = router;
