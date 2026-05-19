const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(5000),
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
});

const rawEnv = {
	...process.env,
	MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
	console.error('Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
	throw new Error('Invalid environment configuration');
}

module.exports = Object.freeze(parsedEnv.data);
