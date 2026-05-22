const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: env.CLIENT_URL,
		credentials: true,
	})
);
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));

const writeLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 120,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: 'Too many requests, please try again later.' },
});

app.use('/api/rooms', (req, res, next) => {
	if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
		return writeLimiter(req, res, next);
	}
	return next();
});

app.use('/api/bookings', (req, res, next) => {
	if (['POST', 'PATCH'].includes(req.method)) {
		return writeLimiter(req, res, next);
	}
	return next();
});

app.get('/', (req, res) => {
	res.json({ message: 'StudyNook API is running' });
});

app.get('/api/health', (req, res) => {
	res.json({ ok: true, service: 'studynook-server' });
});

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
