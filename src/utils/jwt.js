const jwt = require('jsonwebtoken');
const env = require('../config/env');

/** Must match studynook-client src/lib/jwt-token.js */
const TOKEN_COOKIE = 'token';

const VERIFY_OPTIONS = {
	algorithms: ['HS256'],
};

/**
 * Verify JWT from Next set-token route. Payload: { userId, role? }.
 * @returns {{ id: string, role?: string } | null}
 */
function verifyAccessToken(token) {
	if (!token) {
		return null;
	}

	try {
		const payload = jwt.verify(token, env.JWT_SECRET, VERIFY_OPTIONS);
		const userId = payload.userId;

		if (userId == null || userId === '') {
			return null;
		}

		return {
			id: String(userId),
			role: payload.role != null ? String(payload.role) : undefined,
		};
	} catch {
		return null;
	}
}

module.exports = {
	TOKEN_COOKIE,
	verifyAccessToken,
};
