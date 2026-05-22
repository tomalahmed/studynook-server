const mongoose = require('mongoose');
const {
	parseBookingBody,
	canCancelBooking,
	normalizeToUtcMidnight,
} = require('../bookingHelpers');

describe('parseBookingBody', () => {
	const roomId = new mongoose.Types.ObjectId().toString();
	const tomorrow = new Date();
	tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
	const dateStr = tomorrow.toISOString().slice(0, 10);

	it('parses valid booking payload', () => {
		const parsed = parseBookingBody({
			roomId,
			date: dateStr,
			startHour: 9,
			endHour: 11,
			note: 'Group study',
		});
		expect(parsed.startHour).toBe(9);
		expect(parsed.endHour).toBe(11);
		expect(parsed.durationHours).toBe(2);
		expect(parsed.note).toBe('Group study');
	});

	it('rejects end time before start time', () => {
		expect(() =>
			parseBookingBody({
				roomId,
				date: dateStr,
				startHour: 12,
				endHour: 10,
			})
		).toThrow(/after start time/i);
	});
});

describe('canCancelBooking', () => {
	it('allows cancel for confirmed future bookings', () => {
		const future = new Date();
		future.setUTCDate(future.getUTCDate() + 2);
		expect(
			canCancelBooking({
				status: 'confirmed',
				date: normalizeToUtcMidnight(future),
			})
		).toBe(true);
	});

	it('disallows cancel for already cancelled bookings', () => {
		const future = new Date();
		future.setUTCDate(future.getUTCDate() + 2);
		expect(
			canCancelBooking({
				status: 'cancelled',
				date: normalizeToUtcMidnight(future),
			})
		).toBe(false);
	});
});
