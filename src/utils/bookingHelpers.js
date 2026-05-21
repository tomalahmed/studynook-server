const mongoose = require('mongoose');

const MIN_START_HOUR = 8;
const MAX_START_HOUR = 20;
const MIN_END_HOUR = 9;
const MAX_END_HOUR = 21;

function normalizeToUtcMidnight(value) {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		return null;
	}
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	);
}

function parseBookingBody(body) {
	const roomId = body.roomId?.trim?.() || body.roomId;
	const dateInput = body.date;
	const startHour = Number(body.startHour);
	const endHour = Number(body.endHour);
	const note = body.note?.trim?.() ?? '';

	if (!roomId) {
		throw new Error('Room is required');
	}

	if (!mongoose.Types.ObjectId.isValid(roomId)) {
		throw new Error('Invalid room id');
	}

	const date = normalizeToUtcMidnight(dateInput);
	if (!date) {
		throw new Error('Valid booking date is required');
	}

	const today = normalizeToUtcMidnight(new Date());
	if (date < today) {
		throw new Error('Booking date must be today or a future date');
	}

	if (
		!Number.isInteger(startHour) ||
		startHour < MIN_START_HOUR ||
		startHour > MAX_START_HOUR
	) {
		throw new Error(`Start time must be between ${MIN_START_HOUR}:00 and ${MAX_START_HOUR}:00`);
	}

	if (
		!Number.isInteger(endHour) ||
		endHour < MIN_END_HOUR ||
		endHour > MAX_END_HOUR
	) {
		throw new Error(`End time must be between ${MIN_END_HOUR}:00 and ${MAX_END_HOUR}:00`);
	}

	if (endHour <= startHour) {
		throw new Error('End time must be after start time (minimum 1 hour)');
	}

	return {
		roomId: new mongoose.Types.ObjectId(roomId),
		date,
		startHour,
		endHour,
		note,
		durationHours: endHour - startHour,
	};
}

function formatBooking(booking) {
	const doc = booking.toObject ? booking.toObject() : booking;
	const room = doc.roomId;

	const roomData =
		room && typeof room === 'object' && room._id
			? {
					id: room._id.toString(),
					name: room.name,
					image: room.image || '',
					hourlyRate: room.hourlyRate,
				}
			: null;

	return {
		id: doc._id.toString(),
		roomId: doc.roomId?._id?.toString() || doc.roomId?.toString(),
		room: roomData,
		userId: doc.userId.toString(),
		date: doc.date,
		startHour: doc.startHour,
		endHour: doc.endHour,
		totalCost: doc.totalCost,
		note: doc.note || '',
		status: doc.status,
		canCancel: canCancelBooking(doc),
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
	};
}

function canCancelBooking(booking) {
	if (booking.status !== 'confirmed') {
		return false;
	}

	const today = normalizeToUtcMidnight(new Date());
	const bookingDate = normalizeToUtcMidnight(booking.date);

	return bookingDate >= today;
}

function validateObjectId(id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return null;
	}
	return new mongoose.Types.ObjectId(id);
}

module.exports = {
	parseBookingBody,
	formatBooking,
	canCancelBooking,
	normalizeToUtcMidnight,
	validateObjectId,
};
