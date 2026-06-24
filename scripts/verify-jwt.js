/**
 * Quick check: tokens signed like Next (jose) verify on Express (jsonwebtoken).
 * Run: node scripts/verify-jwt.js
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { SignJWT } = require('jose');
const { verifyAccessToken, TOKEN_COOKIE } = require('../src/utils/jwt');

async function main() {
	const secret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET;
	if (!secret) {
		throw new Error('Set JWT_SECRET in .env');
	}

	const key = new TextEncoder().encode(secret);
	const joseToken = await new SignJWT({ userId: 'user_test_123', role: 'user' })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(key);

	const fromJose = verifyAccessToken(joseToken);
	const jsonwebToken = jwt.sign(
		{ userId: 'user_test_456' },
		secret,
		{ algorithm: 'HS256', expiresIn: '7d' }
	);
	const fromJsonweb = verifyAccessToken(jsonwebToken);

	console.log('TOKEN_COOKIE:', TOKEN_COOKIE);
	console.log('jose token verify:', fromJose);
	console.log('jsonwebtoken verify:', fromJsonweb);

	if (!fromJose?.id || !fromJsonweb?.id) {
		process.exit(1);
	}

	console.log('JWT verify OK');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
