const Booking = require('../models/Booking');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
	toObjectId,
	pushBookingToUser,
	pullBookingFromUser,
} = require('../services/user.service');
const {
	parseBookingBody,
	formatBooking,
	canCancelBooking,
	validateObjectId,
} = require('../utils/bookingHelpers');

/**
 * Overlap: existing.startHour < newEnd AND existing.endHour > newStart
 */
async function findConflictingBooking(roomId, date, startHour, endHour) {
	return Booking.findOne({
		roomId,
		date,
		status: 'confirmed',
		startHour: { $lt: endHour },
		endHour: { $gt: startHour },
	});
}

exports.createBooking = asyncHandler(async (req, res) => {
	let parsed;
	try {
		parsed = parseBookingBody(req.body);
	} catch (err) {
		throw new AppError(err.message, 400);
	}

	const room = await Room.findById(parsed.roomId);
	if (!room) {
		throw new AppError('Room not found', 404);
	}

	const conflict = await findConflictingBooking(
		parsed.roomId,
		parsed.date,
		parsed.startHour,
		parsed.endHour
	);

	if (conflict) {
		throw new AppError(
			'This room is already booked for the selected date and time',
			409
		);
	}

	const totalCost = parsed.durationHours * room.hourlyRate;
	const userId = toObjectId(req.user.id) || req.user.id;

	const booking = await Booking.create({
		roomId: parsed.roomId,
		userId,
		date: parsed.date,
		startHour: parsed.startHour,
		endHour: parsed.endHour,
		totalCost,
		note: parsed.note,
		status: 'confirmed',
	});

	await pushBookingToUser(req.user.id, booking._id);

	await Room.findByIdAndUpdate(parsed.roomId, {
		$inc: { bookingCount: 1 },
	});

	const populated = await Booking.findById(booking._id).populate(
		'roomId',
		'name image hourlyRate'
	);

	res.status(201).json({
		message: 'Room booked successfully!',
		booking: formatBooking(populated),
	});
});

exports.listMyBookings = asyncHandler(async (req, res) => {
	const userId = toObjectId(req.user.id) || req.user.id;

	const bookings = await Booking.find({ userId })
		.populate('roomId', 'name image hourlyRate')
		.sort({ date: -1, startHour: -1 });

	res.json({
		bookings: bookings.map(formatBooking),
		count: bookings.length,
	});
});

exports.cancelBooking = asyncHandler(async (req, res) => {
	const bookingId = validateObjectId(req.params.id);
	if (!bookingId) {
		throw new AppError('Invalid booking id', 400);
	}

	const booking = await Booking.findById(bookingId).populate(
		'roomId',
		'name image hourlyRate'
	);

	if (!booking) {
		throw new AppError('Booking not found', 404);
	}

	const userId = toObjectId(req.user.id) || req.user.id;
	if (booking.userId.toString() !== userId.toString()) {
		throw new AppError('You can only cancel your own bookings', 403);
	}

	if (booking.status === 'cancelled') {
		throw new AppError('Booking is already cancelled', 400);
	}

	if (!canCancelBooking(booking)) {
		throw new AppError(
			'Only confirmed bookings on today or a future date can be cancelled',
			400
		);
	}

	booking.status = 'cancelled';
	await booking.save();

	await pullBookingFromUser(req.user.id, booking._id);

	await Room.findByIdAndUpdate(booking.roomId, {
		$inc: { bookingCount: -1 },
	});

	res.json({
		message: 'Booking cancelled',
		booking: formatBooking(booking),
	});
});
