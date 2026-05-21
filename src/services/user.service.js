const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

const USER_COLLECTION = 'user';

function toObjectId(id) {
	if (!id) {
		return null;
	}

	if (id instanceof mongoose.Types.ObjectId) {
		return id;
	}

	const str = String(id);
	if (mongoose.Types.ObjectId.isValid(str)) {
		return new mongoose.Types.ObjectId(str);
	}

	return null;
}

/**
 * Load owner profile from Better Auth `user` collection (same DB as client).
 */
async function getBetterAuthUserById(userId) {
	const db = mongoose.connection.db;
	const id = String(userId);
	const objectId = toObjectId(id);

	const queries = [{ _id: id }, { id }];
	if (objectId) {
		queries.unshift({ _id: objectId });
	}

	const user = await db.collection(USER_COLLECTION).findOne({ $or: queries });

	if (!user) {
		throw new AppError('User not found', 404);
	}

	const ownerId = objectId || toObjectId(user._id) || user._id;

	return {
		_id: ownerId,
		name: user.name?.trim() || 'User',
		email: (user.email || '').toLowerCase().trim(),
		photo: user.image || user.photo || '',
	};
}

function buildUserFilter(userId) {
	const id = String(userId);
	const objectId = toObjectId(id);
	const queries = [{ _id: id }, { id }];
	if (objectId) {
		queries.unshift({ _id: objectId });
	}
	return { $or: queries };
}

/**
 * $push booking id onto Better Auth user document.
 */
async function pushBookingToUser(userId, bookingId) {
	const db = mongoose.connection.db;
	const result = await db
		.collection(USER_COLLECTION)
		.updateOne(buildUserFilter(userId), { $push: { bookings: bookingId } });

	if (result.matchedCount === 0) {
		throw new AppError('User not found', 404);
	}
}

/**
 * $pull booking id from Better Auth user document on cancel.
 */
async function pullBookingFromUser(userId, bookingId) {
	const db = mongoose.connection.db;
	await db
		.collection(USER_COLLECTION)
		.updateOne(buildUserFilter(userId), { $pull: { bookings: bookingId } });
}

module.exports = {
	getBetterAuthUserById,
	toObjectId,
	pushBookingToUser,
	pullBookingFromUser,
};
