const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const { normalizeUserPhoto } = require('../utils/images');

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
		photo: normalizeUserPhoto(user.image || user.photo),
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

/**
 * Remove booking ids from Better Auth users who reference them (e.g. when a room is deleted).
 */
async function pullBookingsFromUsers(bookingIds) {
	if (!bookingIds?.length) {
		return;
	}

	const db = mongoose.connection.db;
	const ids = bookingIds.map((id) =>
		id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id)
	);

	await db.collection(USER_COLLECTION).updateMany(
		{ bookings: { $in: ids } },
		{ $pull: { bookings: { $in: ids } } }
	);
}

module.exports = {
	getBetterAuthUserById,
	toObjectId,
	pushBookingToUser,
	pullBookingFromUser,
	pullBookingsFromUsers,
};
