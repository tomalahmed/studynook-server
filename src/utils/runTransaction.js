const mongoose = require('mongoose');

/**
 * Run fn inside a MongoDB transaction when supported (replica set / Atlas).
 * Falls back to fn(null) on standalone dev instances.
 */
async function runTransaction(fn) {
	const session = await mongoose.startSession();

	try {
		let result;
		await session.withTransaction(async () => {
			result = await fn(session);
		});
		return result;
	} catch (err) {
		const msg = String(err?.message || err);
		const noTxn =
			err?.code === 20 ||
			msg.includes('Transaction numbers are only allowed') ||
			msg.includes('replica set');

		if (noTxn) {
			return fn(null);
		}

		throw err;
	} finally {
		await session.endSession();
	}
}

module.exports = { runTransaction };
