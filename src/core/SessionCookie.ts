import { FastifyRequest } from 'fastify';

import type { Signer } from '@fastify/cookie';

import { SessionCookieOptions } from '@/types/options';

export default class SessionCookie {
	private _props: Omit<
		SessionCookieOptions,
		'originalMaxAge' | 'originalExpires'
	>;

	private _original: Pick<SessionCookieOptions, 'maxAge' | 'expires'>;

	private _expires?: Date;

	constructor(options: SessionCookieOptions, request: FastifyRequest) {
		if (!options.signer) {
			throw new Error('Cookie signer is required.');
		}

		this._props = {
			path: options.path || '/',
			secure: options.secure ?? undefined,
			sameSite: options.sameSite || 'lax',
			domain: options.domain || undefined,
			httpOnly: options.httpOnly !== undefined ? options.httpOnly : true,
			partitioned: options.partitioned,
			maxAge: undefined,
			expires: undefined,
			signer: options.signer,
		};

		this._original = {
			maxAge: options.originalMaxAge || options.maxAge || undefined,
			expires: options.expires ? new Date(options.expires) : undefined,
		};

		if (options.originalMaxAge) {
			this._props.maxAge = this._original.maxAge;
		}

		if (options.expires) {
			this._props.expires = new Date(options.expires);
			this._original.maxAge = undefined;
		}

		if (this._props.secure === 'auto') {
			if (request.protocol.includes('https')) {
				this._props.secure = true;
			} else {
				this._props.secure = false;
				this._props.sameSite = 'lax';
			}
		}

		this._expires = undefined;
	}

	public set expires(date: Date) {
		this._expires = date;
	}

	public get expires(): Date | undefined {
		return this._expires;
	}

	public set maxAge(ms: number) {
		this.expires = new Date(Date.now() + ms);
		this._original.maxAge = ms;
	}

	public get maxAge(): number | undefined {
		if (this.expires instanceof Date) {
			return this.expires.valueOf() - Date.now();
		}

		return undefined;
	}

	public get signer(): Signer {
		return this._props.signer;
	}

	public get options(): SessionCookieOptions {
		return {
			path: this._props.path,
			secure: this._props.secure,
			sameSite: this._props.sameSite,
			domain: this._props.domain,
			httpOnly: this._props.httpOnly,
			partitioned: this._props.partitioned,
			maxAge: this.maxAge,
			expires: this.expires,
			originalMaxAge: this._original.maxAge,
			originalExpires: this._original.expires,
			signer: this._props.signer,
		};
	}

	public toJSON() {
		return {
			path: this._props.path,
			secure: this._props.secure,
			sameSite: this._props.sameSite,
			domain: this._props.domain,
			httpOnly: this._props.httpOnly,
			partitioned: this._props.partitioned,
			maxAge: this._props.maxAge,
			originalMaxAge: this._original.maxAge,
			originalExpires: this._original.expires,
			expires: this._expires,
		};
	}
}
