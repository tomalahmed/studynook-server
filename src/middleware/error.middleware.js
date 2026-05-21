function notFoundHandler(req, res) {
	res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
	if (err.name === 'ValidationError') {
		const message = Object.values(err.errors)
			.map((e) => e.message)
			.join(', ');
		return res.status(400).json({ error: message });
	}

	if (err.name === 'CastError') {
		return res.status(400).json({ error: 'Invalid id' });
	}

	console.error(err);

	const statusCode = err.statusCode || 500;
	const message =
		process.env.NODE_ENV === 'production' && statusCode === 500
			? 'Internal server error'
			: err.message || 'Internal server error';

	res.status(statusCode).json({ error: message });
}

module.exports = {
	notFoundHandler,
	errorHandler,
};
