const Room = require('../models/Room');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
	getBetterAuthUserById,
	toObjectId,
	pullBookingsFromUsers,
} = require('../services/user.service');
const {
	formatRoom,
	buildRoomsFilter,
	parseRoomBody,
	validateObjectId,
	isRoomOwner,
} = require('../utils/roomHelpers');

exports.listRooms = asyncHandler(async (req, res) => {
	const filter = buildRoomsFilter(req.query);
	const rooms = await Room.find(filter).sort({ createdAt: -1 });

	res.json({
		rooms: rooms.map((room) => formatRoom(room)),
		count: rooms.length,
	});
});

exports.getLatestRooms = asyncHandler(async (req, res) => {
	const rooms = await Room.find()
		.sort({ createdAt: -1 })
		.limit(6);

	res.json({
		rooms: rooms.map((room) => formatRoom(room)),
	});
});

exports.listMyRooms = asyncHandler(async (req, res) => {
	const ownerId = toObjectId(req.user.id) || req.user.id;

	const rooms = await Room.find({ 'owner._id': ownerId }).sort({
		createdAt: -1,
	});

	res.json({
		rooms: rooms.map(formatRoom),
		count: rooms.length,
	});
});

exports.getRoomById = asyncHandler(async (req, res) => {
	const roomId = validateObjectId(req.params.id);
	if (!roomId) {
		throw new AppError('Invalid room id', 400);
	}

	const room = await Room.findById(roomId);
	if (!room) {
		throw new AppError('Room not found', 404);
	}

	res.json({ room: formatRoom(room, { includeOwnerEmail: true }) });
});

exports.createRoom = asyncHandler(async (req, res) => {
	let fields;
	try {
		fields = parseRoomBody(req.body);
	} catch (err) {
		throw new AppError(err.message, 400);
	}

	const ownerProfile = await getBetterAuthUserById(req.user.id);

	const room = await Room.create({
		...fields,
		owner: {
			_id: ownerProfile._id,
			name: ownerProfile.name,
			email: ownerProfile.email,
			photo: ownerProfile.photo,
		},
	});

	res.status(201).json({
		message: 'Room added successfully',
		room: formatRoom(room),
	});
});

exports.updateRoom = asyncHandler(async (req, res) => {
	const roomId = validateObjectId(req.params.id);
	if (!roomId) {
		throw new AppError('Invalid room id', 400);
	}

	const room = await Room.findById(roomId);
	if (!room) {
		throw new AppError('Room not found', 404);
	}

	if (!isRoomOwner(room, req.user.id)) {
		throw new AppError('You can only edit your own rooms', 403);
	}

	let fields;
	try {
		fields = parseRoomBody({ ...room.toObject(), ...req.body });
	} catch (err) {
		throw new AppError(err.message, 400);
	}

	room.name = fields.name;
	room.description = fields.description;
	room.image = fields.image;
	room.libraryBranch = fields.libraryBranch;
	room.floor = fields.floor;
	room.capacity = fields.capacity;
	room.hourlyRate = fields.hourlyRate;
	room.roomType = fields.roomType;
	room.amenities = fields.amenities;

	await room.save();

	res.json({
		message: 'Room updated successfully',
		room: formatRoom(room),
	});
});

exports.deleteRoom = asyncHandler(async (req, res) => {
	const roomId = validateObjectId(req.params.id);
	if (!roomId) {
		throw new AppError('Invalid room id', 400);
	}

	const room = await Room.findById(roomId);
	if (!room) {
		throw new AppError('Room not found', 404);
	}

	if (!isRoomOwner(room, req.user.id)) {
		throw new AppError('You can only delete your own rooms', 403);
	}

	const bookings = await Booking.find({ roomId: room._id }).select('_id');
	const bookingIds = bookings.map((b) => b._id);

	await Booking.deleteMany({ roomId: room._id });
	await room.deleteOne();
	await pullBookingsFromUsers(bookingIds);

	res.json({ message: 'Room deleted successfully' });
});
