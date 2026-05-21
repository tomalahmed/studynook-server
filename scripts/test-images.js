require('dotenv').config();
const {
	validateRoomImage,
	normalizeRoomImage,
	DEFAULT_ROOM_IMAGE,
} = require('../src/utils/images');

const cases = [
	['', DEFAULT_ROOM_IMAGE, false],
	['blob:http://x', DEFAULT_ROOM_IMAGE, false],
	['/images/library.png', '/images/library.png', true],
	['https://images.unsplash.com/a.jpg', 'https://images.unsplash.com/a.jpg', true],
	['  https://x.com/a.png  ', 'https://x.com/a.png', true],
	['not-a-url', DEFAULT_ROOM_IMAGE, false],
];

let ok = true;
for (const [input, expectedNorm, shouldValidate] of cases) {
	const norm = normalizeRoomImage(input);
	if (norm !== expectedNorm) {
		console.error('normalize fail:', input, '->', norm, 'expected', expectedNorm);
		ok = false;
	}
	if (shouldValidate) {
		try {
			validateRoomImage(input);
		} catch (e) {
			console.error('validate should pass:', input, e.message);
			ok = false;
		}
	}
}

try {
	validateRoomImage('');
	console.error('empty should fail validate');
	ok = false;
} catch {
	// expected
}

console.log(ok ? 'Image utils OK' : 'Image utils FAILED');
process.exit(ok ? 0 : 1);
