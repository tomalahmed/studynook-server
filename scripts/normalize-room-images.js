/**
 * One-time fix: set invalid/empty room.image to /images/library.png in MongoDB.
 * Run: node scripts/normalize-room-images.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('../src/models/Room');
const { normalizeRoomImage } = require('../src/utils/images');
const env = require('../src/config/env');

async function main() {
	await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });

	const rooms = await Room.find({});
	let updated = 0;

	for (const room of rooms) {
		const next = normalizeRoomImage(room.image);
		if (room.image !== next) {
			room.image = next;
			await room.save();
			updated += 1;
			console.log('Updated', room._id.toString(), '->', next);
		}
	}

	console.log(`Done. ${updated} of ${rooms.length} rooms updated.`);
	await mongoose.disconnect();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
