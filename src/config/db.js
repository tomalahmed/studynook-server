const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
	try {
		await mongoose.connect(env.MONGODB_URI, {
			dbName: env.MONGODB_DB_NAME,
		});
		console.log(`MongoDB connected (${env.MONGODB_DB_NAME})`);
	} catch (error) {
		console.error('Error connecting to MongoDB:', error);
		process.exit(1);
	}
};

module.exports = connectDB;
