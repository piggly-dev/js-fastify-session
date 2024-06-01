import { configure as configureStringifier } from 'safe-stable-stringify';
import crypto from 'crypto';

import { TOrNullable, TOrUndefined } from '@/types/types';

/* eslint-disable-next-line no-bitwise */
const cache_size = 24 << 7;
let pos = 0;
let cache = crypto.randomBytes(cache_size);

const stringify = configureStringifier({ bigint: false });

export const valueOrDefault = <T>(value: T | undefined, defaultValue: T): T =>
	value !== undefined ? value : defaultValue;

export const evaluateSecret = (options: any): TOrUndefined<Error> => {
	if (typeof options !== 'object') {
		return new Error('Invalid options provided.');
	}

	if (typeof options.secret === 'string') {
		if (options.secret.length < 32) {
			return new Error('Session secret must have length 32 or greater.');
		}

		return undefined;
	}

	if (Array.isArray(options.secret)) {
		if (options.secret.length === 0) {
			return new Error(
				'At least one secret is required for session secret.',
			);
		}

		let error;

		options.secret.forEach((secret: any) => {
			if (typeof secret === 'string' && secret.length < 32) {
				error = new Error('Session secret must have length 32 or greater.');
			}
		});

		return error;
	}

	if (
		typeof options.secret?.sign === 'function' &&
		typeof options.secret?.unsign === 'function'
	) {
		return undefined;
	}

	return new Error(
		'The session secret option is required, and must be a String, Array of Strings, or a signer object with .sign and .unsign methods.',
	);
};

export const hashSession = (session: {
	id: string;
	encrypted_id: string;
	store: string;
	payload: TOrNullable<Record<string, any>>;
}) =>
	crypto.createHash('sha256').update(stringify(session), 'utf8').digest('hex');

export const autoRegenerate = () => Math.random() >= 0.8;

export const generateId = () => {
	if (pos + 24 > cache_size) {
		cache = crypto.randomBytes(cache_size);
		pos = 0;
	}

	const buf = Buffer.allocUnsafe(24);
	cache.copy(buf, 0, pos, (pos += 24));

	if (Buffer.isEncoding('base64url') === false) {
		return buf
			.toString('base64')
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
	}

	return buf.toString('base64url');
};

export const evaluateUrlPath = (path: string, cookie_path: string): boolean => {
	if (path === cookie_path) {
		return true;
	}
	const pathLength = path.length;
	const cookiePathLength = cookie_path.length;

	if (pathLength < cookiePathLength) {
		return false;
	}

	if (path.startsWith(cookie_path)) {
		if (path[cookiePathLength] === '/') {
			return true;
		}

		if (cookie_path[cookiePathLength - 1] === '/') {
			return true;
		}
	}

	return false;
};
