const Booking = require('../models/Booking');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { runTransaction } = require('../utils/runTransaction');
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
	findConflictingBooking,
} = require('../utils/bookingHelpers');

exports.createBooking = asyncHandler(async (req, res) => {
	let parsed;
	try {
		parsed = parseBookingBody(req.body);
	} catch (err) {
		throw new AppError(err.message, 400);
	}

	const result = await runTransaction(async (session) => {
		const roomQuery = Room.findById(parsed.roomId);
		if (session) {
			roomQuery.session(session);
		}
		const room = await roomQuery;
		if (!room) {
			throw new AppError('Room not found', 404);
		}

		const conflict = await findConflictingBooking(
			parsed.roomId,
			parsed.date,
			parsed.startHour,
			parsed.endHour,
			session
		);

		if (conflict) {
			throw new AppError(
				'This room is already booked for the selected date and time',
				409
			);
		}

		const totalCost = parsed.durationHours * room.hourlyRate;
		const userId = toObjectId(req.user.id) || req.user.id;

		const createOptions = session ? { session } : {};
		const [booking] = await Booking.create(
			[
				{
					roomId: parsed.roomId,
					userId,
					date: parsed.date,
					startHour: parsed.startHour,
					endHour: parsed.endHour,
					totalCost,
					note: parsed.note,
					status: 'confirmed',
				},
			],
			createOptions
		);

		const roomUpdate = Room.findByIdAndUpdate(
			parsed.roomId,
			{ $inc: { bookingCount: 1 } },
			{ new: true }
		);
		if (session) {
			roomUpdate.session(session);
		}
		await roomUpdate;

		return booking;
	});

	await pushBookingToUser(req.user.id, result._id);

	const populated = await Booking.findById(result._id).populate(
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

	const booking = await runTransaction(async (session) => {
		const findQuery = Booking.findById(bookingId).populate(
			'roomId',
			'name image hourlyRate'
		);
		if (session) {
			findQuery.session(session);
		}

		const doc = await findQuery;
		if (!doc) {
			throw new AppError('Booking not found', 404);
		}

		const userId = toObjectId(req.user.id) || req.user.id;
		if (doc.userId.toString() !== userId.toString()) {
			throw new AppError('You can only cancel your own bookings', 403);
		}

		if (doc.status === 'cancelled') {
			throw new AppError('Booking is already cancelled', 400);
		}

		if (!canCancelBooking(doc)) {
			throw new AppError(
				'Only confirmed bookings on today or a future date can be cancelled',
				400
			);
		}

		doc.status = 'cancelled';
		const saveOptions = session ? { session } : {};
		await doc.save(saveOptions);

		const roomUpdate = Room.findByIdAndUpdate(doc.roomId, {
			$inc: { bookingCount: -1 },
		});
		if (session) {
			roomUpdate.session(session);
		}
		await roomUpdate;

		return doc;
	});

	await pullBookingFromUser(req.user.id, booking._id);

	res.json({
		message: 'Booking cancelled',
		booking: formatBooking(booking),
	});
});
