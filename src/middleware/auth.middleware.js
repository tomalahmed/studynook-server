const { TOKEN_COOKIE, verifyAccessToken } = require('../utils/jwt');

/**
 * Requires valid JWT in httpOnly `token` cookie (issued by Next /api/auth/set-token).
 * Sets req.user = { id, role? }.
 */
function authMiddleware(req, res, next) {
	const token = req.cookies[TOKEN_COOKIE];
	const user = verifyAccessToken(token);

	if (!user) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	req.user = user;
	next();
}

module.exports = {
	authMiddleware,
	TOKEN_COOKIE,
};
