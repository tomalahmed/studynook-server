const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(5000),
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
	MONGODB_DB_NAME: z.string().min(1).default('StudyNook'),
	JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
	CLIENT_URL: z.string().url().default('http://localhost:3000'),
});

const rawEnv = {
	...process.env,
	MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
	JWT_SECRET:
		process.env.JWT_SECRET?.trim() ||
		process.env.BETTER_AUTH_SECRET?.trim(),
	CLIENT_URL:
		process.env.CLIENT_URL?.trim() ||
		process.env.BETTER_AUTH_URL?.trim() ||
		'http://localhost:3000',
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
	console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
	throw new Error('Invalid environment configuration');
}

const data = parsedEnv.data;

module.exports = Object.freeze({
	...data,
	CLIENT_URL: data.CLIENT_URL.replace(/\/$/, ''),
});
