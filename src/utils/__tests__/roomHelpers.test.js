const mongoose = require('mongoose');
const {
	buildRoomsFilter,
	formatRoom,
	parseRoomBody,
	normalizeFloor,
} = require('../roomHelpers');

describe('buildRoomsFilter', () => {
	it('escapes regex special characters in search', () => {
		const filter = buildRoomsFilter({ search: 'room (test)+' });
		const orClause = filter.$or || filter.$and?.[0]?.$or;
		expect(orClause).toBeDefined();
		const nameRegex = orClause[0].name.$regex;
		expect(nameRegex).toContain('\\(');
		expect(nameRegex).toContain('\\+');
	});

	it('does not filter by ownerId on public list', () => {
		const filter = buildRoomsFilter({
			owner: 'me',
			ownerId: new mongoose.Types.ObjectId().toString(),
		});
		expect(filter['owner._id']).toBeUndefined();
	});
});

describe('formatRoom', () => {
	const baseRoom = {
		_id: new mongoose.Types.ObjectId(),
		name: 'Focus Pod',
		description: 'Quiet space',
		image: '/images/room.jpg',
		libraryBranch: 'Central Library',
		floor: '2nd Floor',
		capacity: 4,
		hourlyRate: 12,
		amenities: ['Wi-Fi'],
		owner: {
			_id: new mongoose.Types.ObjectId(),
			name: 'Alex',
			email: 'alex@example.com',
			photo: '',
		},
		bookingCount: 2,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	it('omits owner email by default', () => {
		const formatted = formatRoom(baseRoom);
		expect(formatted.owner.name).toBe('Alex');
		expect(formatted.owner.email).toBeUndefined();
	});

	it('includes owner email when requested', () => {
		const formatted = formatRoom(baseRoom, { includeOwnerEmail: true });
		expect(formatted.owner.email).toBe('alex@example.com');
	});
});

describe('parseRoomBody', () => {
	it('normalizes floor and validates required fields', () => {
		const parsed = parseRoomBody({
			name: 'Study Hub',
			floor: '3',
			capacity: 6,
			hourlyRate: 15,
			image: '/images/uploads/test.jpg',
			amenities: ['Wi-Fi'],
		});
		expect(parsed.name).toBe('Study Hub');
		expect(parsed.floor).toBe('3rd Floor');
		expect(parsed.capacity).toBe(6);
	});
});

describe('normalizeFloor', () => {
	it('formats numeric floor with ordinal suffix', () => {
		expect(normalizeFloor('2')).toBe('2nd Floor');
	});
});
