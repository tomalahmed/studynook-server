/**
 * Room image URLs — must align with studynook-client public/images paths.
 */

/** Client-served fallback (Next.js public folder). */
const DEFAULT_ROOM_IMAGE = '/images/library.png';

const BLOCKED_PREFIXES = ['blob:', 'data:', 'javascript:', 'file:'];

/**
 * Validate image on create/update (assignment: image URL from internet or app path).
 * @throws {Error}
 */
function validateRoomImage(image) {
	const value = typeof image === 'string' ? image.trim() : '';

	if (!value) {
		throw new Error('Room image URL is required');
	}

	const lower = value.toLowerCase();
	for (const prefix of BLOCKED_PREFIXES) {
		if (lower.startsWith(prefix)) {
			throw new Error('Image must be a public http(s) URL or site path, not a local file');
		}
	}

	if (value.startsWith('/')) {
		if (!value.startsWith('/images/') && value !== DEFAULT_ROOM_IMAGE) {
			throw new Error('Local image path must be under /images/');
		}
		return value;
	}

	try {
		const parsed = new URL(value);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			throw new Error('Image URL must use http or https');
		}
		return value;
	} catch (err) {
		if (err.message?.includes('http')) {
			throw err;
		}
		throw new Error('Please provide a valid image URL (https://...) or /images/... path');
	}
}

/**
 * Normalize stored/read image for API JSON (never return empty or invalid values).
 */
function normalizeRoomImage(image) {
	if (image == null || typeof image !== 'string') {
		return DEFAULT_ROOM_IMAGE;
	}

	const trimmed = image.trim();
	if (!trimmed) {
		return DEFAULT_ROOM_IMAGE;
	}

	const lower = trimmed.toLowerCase();
	for (const prefix of BLOCKED_PREFIXES) {
		if (lower.startsWith(prefix)) {
			return DEFAULT_ROOM_IMAGE;
		}
	}

	if (trimmed.startsWith('/')) {
		return trimmed;
	}

	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
			return trimmed;
		}
	} catch {
		// fall through to default
	}

	return DEFAULT_ROOM_IMAGE;
}

/**
 * Owner profile photo from Better Auth (optional).
 */
function normalizeUserPhoto(photo) {
	if (photo == null || typeof photo !== 'string') {
		return '';
	}

	const trimmed = photo.trim();
	if (!trimmed) {
		return '';
	}

	const lower = trimmed.toLowerCase();
	for (const prefix of BLOCKED_PREFIXES) {
		if (lower.startsWith(prefix)) {
			return '';
		}
	}

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return trimmed;
	}

	return '';
}

module.exports = {
	DEFAULT_ROOM_IMAGE,
	validateRoomImage,
	normalizeRoomImage,
	normalizeUserPhoto,
};
