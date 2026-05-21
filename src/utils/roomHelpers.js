const mongoose = require('mongoose');
const { normalizeRoomImage, validateRoomImage } = require('./images');

const AMENITIES = [
	'Whiteboard',
	'Projector',
	'Wi-Fi',
	'Power Outlets',
	'Quiet Zone',
	'Air Conditioning',
];

function formatRoom(room) {
	if (!room) {
		return null;
	}

	const doc = room.toObject ? room.toObject() : room;

	return {
		id: doc._id.toString(),
		name: doc.name,
		description: doc.description,
		image: normalizeRoomImage(doc.image),
		floor: doc.floor,
		capacity: doc.capacity,
		hourlyRate: doc.hourlyRate,
		amenities: doc.amenities || [],
		owner: {
			id: doc.owner._id.toString(),
			name: doc.owner.name,
			email: doc.owner.email,
			photo: doc.owner.photo || '',
		},
		bookingCount: doc.bookingCount ?? 0,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
	};
}

function buildRoomsFilter(query) {
	const filter = {};

	const { search, amenities, minRate, maxRate, floor, owner } = query;

	if (search && String(search).trim()) {
		filter.name = { $regex: String(search).trim(), $options: 'i' };
	}

	if (amenities) {
		const list = Array.isArray(amenities)
			? amenities
			: String(amenities)
					.split(',')
					.map((a) => a.trim())
					.filter(Boolean);

		if (list.length > 0) {
			filter.amenities = { $in: list };
		}
	}

	if (minRate != null && minRate !== '') {
		filter.hourlyRate = { ...filter.hourlyRate, $gte: Number(minRate) };
	}

	if (maxRate != null && maxRate !== '') {
		filter.hourlyRate = { ...filter.hourlyRate, $lte: Number(maxRate) };
	}

	if (floor && String(floor).trim()) {
		filter.floor = { $regex: String(floor).trim(), $options: 'i' };
	}

	if (owner === 'me' && query.ownerId) {
		const ownerObjectId = mongoose.Types.ObjectId.isValid(query.ownerId)
			? new mongoose.Types.ObjectId(query.ownerId)
			: query.ownerId;
		filter['owner._id'] = ownerObjectId;
	}

	return filter;
}

function parseRoomBody(body) {
	const name = body.name?.trim();
	const description = body.description?.trim() ?? '';
	const floor = body.floor != null ? String(body.floor).trim() : '';
	const capacity = Number(body.capacity);
	const hourlyRate = Number(body.hourlyRate);

	let amenities = body.amenities;
	if (typeof amenities === 'string') {
		amenities = amenities.split(',').map((a) => a.trim()).filter(Boolean);
	}
	if (!Array.isArray(amenities)) {
		amenities = [];
	}

	amenities = amenities.filter((a) => AMENITIES.includes(a));

	if (!name) {
		throw new Error('Room name is required');
	}
	if (!floor) {
		throw new Error('Floor is required');
	}
	if (!Number.isFinite(capacity) || capacity < 1) {
		throw new Error('Capacity must be at least 1');
	}
	if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
		throw new Error('Hourly rate must be 0 or greater');
	}

	let image;
	try {
		image = validateRoomImage(body.image);
	} catch (err) {
		throw new Error(err.message);
	}

	return {
		name,
		description,
		image,
		floor,
		capacity,
		hourlyRate,
		amenities,
	};
}

function validateObjectId(id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return null;
	}
	return new mongoose.Types.ObjectId(id);
}

function isRoomOwner(room, userId) {
	return room.owner._id.toString() === String(userId);
}

module.exports = {
	AMENITIES,
	formatRoom,
	buildRoomsFilter,
	parseRoomBody,
	validateObjectId,
	isRoomOwner,
};
