const notImplemented = (name) => (req, res) => {
	res.status(501).json({ error: `${name} is not implemented yet` });
};

exports.createBooking = notImplemented('createBooking');
exports.listMyBookings = notImplemented('listMyBookings');
exports.cancelBooking = notImplemented('cancelBooking');
