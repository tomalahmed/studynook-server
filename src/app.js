const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.use(
	cors({
		origin: env.CLIENT_URL,
		credentials: true,
	})
);
app.use(cookieParser());
app.use(express.json());

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
