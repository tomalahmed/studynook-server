const express = require('express');
const roomsController = require('../controllers/rooms.controller');

const router = express.Router();

router.get('/latest', roomsController.getLatestRooms);
router.get('/mine', roomsController.listMyRooms);
router.get('/', roomsController.listRooms);
router.get('/:id', roomsController.getRoomById);
router.post('/', roomsController.createRoom);
router.put('/:id', roomsController.updateRoom);
router.delete('/:id', roomsController.deleteRoom);

module.exports = router;
