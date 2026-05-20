const notImplemented = (name) => (req, res) => {
	res.status(501).json({ error: `${name} is not implemented yet` });
};

exports.listRooms = notImplemented('listRooms');
exports.getLatestRooms = notImplemented('getLatestRooms');
exports.listMyRooms = notImplemented('listMyRooms');
exports.getRoomById = notImplemented('getRoomById');
exports.createRoom = notImplemented('createRoom');
exports.updateRoom = notImplemented('updateRoom');
exports.deleteRoom = notImplemented('deleteRoom');
