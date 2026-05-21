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

const LIBRARY_BRANCHES = [
	'Central Library',
	'West Wing Commons',
	'North Heights Archive',
	'The Creative Hub',
];

const ROOM_TYPES = ['quiet', 'collaborative', 'tech-heavy'];

function inferRoomType(amenities = []) {
	if (amenities.includes('Quiet Zone')) {
		return 'quiet';
	}
	if (amenities.includes('Projector')) {
		return 'tech-heavy';
	}
	return 'collaborative';
}

function normalizeFloor(floorInput) {
	const trimmed = String(floorInput ?? '').trim();
	if (!trimmed) {
		return '';
	}
	if (/floor/i.test(trimmed)) {
		return trimmed;
	}
	const digits = trimmed.replace(/\D/g, '');
	if (digits) {
		const n = Number.parseInt(digits, 10);
		if (Number.isFinite(n)) {
			const suffix =
				n % 10 === 1 && n % 100 !== 11
					? 'st'
					: n % 10 === 2 && n % 100 !== 12
						? 'nd'
						: n % 10 === 3 && n % 100 !== 13
							? 'rd'
							: 'th';
			return `${n}${suffix} Floor`;
		}
	}
	return `Floor ${trimmed}`;
}

function syncAmenitiesForRoomType(roomType, amenities) {
	const list = [...amenities];
	if (roomType === 'quiet' && !list.includes('Quiet Zone')) {
		list.push('Quiet Zone');
	}
	if (roomType === 'tech-heavy' && !list.includes('Projector')) {
		list.push('Projector');
	}
	return list.filter((a) => AMENITIES.includes(a));
}

function buildFloorRegex(floorParam) {
	const raw = String(floorParam).trim().toLowerCase();
	const digit = raw.replace(/(st|nd|rd|th)/g, '').replace(/\D/g, '') || raw;
	if (!digit) {
		return null;
	}
	return {
		$regex: `\\b${digit}(st|nd|rd|th)?\\b|floor\\s*[-:]?\\s*${digit}\\b`,
		$options: 'i',
	};
}

function buildRoomTypeCondition(roomType) {
	const legacyMissingType = {
		$or: [{ roomType: { $exists: false } }, { roomType: null }, { roomType: '' }],
	};

	if (roomType === 'quiet') {
		return {
			$or: [{ roomType: 'quiet' }, { ...legacyMissingType, amenities: 'Quiet Zone' }],
		};
	}

	if (roomType === 'tech-heavy') {
		return {
			$or: [
				{ roomType: 'tech-heavy' },
				{
					...legacyMissingType,
					amenities: { $all: ['Projector'], $nin: ['Quiet Zone'] },
				},
			],
		};
	}

	return {
		$or: [
			{ roomType: 'collaborative' },
			{
				...legacyMissingType,
				amenities: { $nin: ['Quiet Zone', 'Projector'] },
			},
		],
	};
}

function formatRoom(room) {
	if (!room) {
		return null;
	}

	const doc = room.toObject ? room.toObject() : room;
	const amenities = doc.amenities || [];
	const roomType = doc.roomType || inferRoomType(amenities);

	return {
		id: doc._id.toString(),
		name: doc.name,
		description: doc.description,
		image: normalizeRoomImage(doc.image),
		libraryBranch: doc.libraryBranch || LIBRARY_BRANCHES[0],
		floor: doc.floor,
		capacity: doc.capacity,
		hourlyRate: doc.hourlyRate,
		roomType,
		amenities,
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
	const and = [];
	const {
		search,
		amenities,
		minRate,
		maxRate,
		floor,
		libraryBranch,
		roomType,
		minCapacity,
		owner,
	} = query;

	if (search && String(search).trim()) {
		const term = String(search).trim();
		and.push({
			$or: [
				{ name: { $regex: term, $options: 'i' } },
				{ description: { $regex: term, $options: 'i' } },
			],
		});
	}

	if (libraryBranch && LIBRARY_BRANCHES.includes(String(libraryBranch).trim())) {
		const branchValue = String(libraryBranch).trim();
		const branchMatch = [{ libraryBranch: branchValue }];
		if (branchValue === LIBRARY_BRANCHES[0]) {
			branchMatch.push(
				{ libraryBranch: { $exists: false } },
				{ libraryBranch: null },
				{ libraryBranch: '' }
			);
		}
		and.push({ $or: branchMatch });
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

	if (roomType && ROOM_TYPES.includes(String(roomType).trim())) {
		and.push(buildRoomTypeCondition(String(roomType).trim()));
	}

	if (minCapacity != null && minCapacity !== '') {
		const min = Number(minCapacity);
		if (Number.isFinite(min) && min > 1) {
			filter.capacity = { $gte: min };
		}
	}

	if (minRate != null && minRate !== '') {
		filter.hourlyRate = { ...filter.hourlyRate, $gte: Number(minRate) };
	}

	if (maxRate != null && maxRate !== '') {
		filter.hourlyRate = { ...filter.hourlyRate, $lte: Number(maxRate) };
	}

	if (floor && String(floor).trim()) {
		const floorRegex = buildFloorRegex(floor);
		if (floorRegex) {
			filter.floor = floorRegex;
		}
	}

	if (owner === 'me' && query.ownerId) {
		const ownerObjectId = mongoose.Types.ObjectId.isValid(query.ownerId)
			? new mongoose.Types.ObjectId(query.ownerId)
			: query.ownerId;
		filter['owner._id'] = ownerObjectId;
	}

	if (and.length === 1) {
		Object.assign(filter, and[0]);
	} else if (and.length > 1) {
		filter.$and = and;
	}

	return filter;
}

function parseRoomBody(body) {
	const name = body.name?.trim();
	const description = body.description?.trim() ?? '';
	const floor = normalizeFloor(body.floor);
	const capacity = Number(body.capacity);
	const hourlyRate = Number(body.hourlyRate);

	let libraryBranch = body.libraryBranch?.trim();
	if (!LIBRARY_BRANCHES.includes(libraryBranch)) {
		libraryBranch = LIBRARY_BRANCHES[0];
	}

	let roomType = body.roomType?.trim();
	if (!ROOM_TYPES.includes(roomType)) {
		roomType = inferRoomType(
			Array.isArray(body.amenities)
				? body.amenities
				: String(body.amenities || '')
						.split(',')
						.map((a) => a.trim())
		);
	}

	let amenities = body.amenities;
	if (typeof amenities === 'string') {
		amenities = amenities.split(',').map((a) => a.trim()).filter(Boolean);
	}
	if (!Array.isArray(amenities)) {
		amenities = [];
	}

	amenities = syncAmenitiesForRoomType(roomType, amenities);

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
		libraryBranch,
		floor,
		capacity,
		hourlyRate,
		roomType,
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
	LIBRARY_BRANCHES,
	ROOM_TYPES,
	formatRoom,
	buildRoomsFilter,
	parseRoomBody,
	validateObjectId,
	isRoomOwner,
	normalizeFloor,
};
