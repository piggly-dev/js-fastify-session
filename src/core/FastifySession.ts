import { FastifyRequest } from 'fastify';

import type { ISessionPayload, ISessionStore } from '@/types/interfaces';
import type { SessionCookieOptions } from '@/types/options';
import type { TOrNullable } from '@/types/types';

import { OnSessionModifyHook } from '@/types/hook';
import { generateId, hashSession } from '@/utils';
import SessionCookie from '@/core/SessionCookie';
import SessionStore from '@/core/SessionStore';

export type FastifySessionOptions = {
	request: FastifyRequest;
	store?: ISessionStore;
	keep_session: boolean;
	session_id?: string;
	payload?: ISessionPayload;
	cookie?: SessionCookieOptions;
	previous?: FastifySession;
	callables?: Partial<SessionCallables>;
};

export type SessionCallables = {
	autoRegenerate?: () => boolean;
	generateId: () => string;
};

export default class FastifySession {
	private _id: string;

	private _encrypted_id: string;

	private _request: FastifyRequest;

	private _store: ISessionStore;

	private _payload: ISessionPayload;

	private _cookie: SessionCookie;

	private _keep_session: boolean;

	private _persisted_hash: string;

	private _callables: SessionCallables;

	private _saved: boolean;

	constructor(options: FastifySessionOptions) {
		const {
			request,
			store,
			cookie,
			callables,
			session_id,
			previous,
			payload,
			keep_session = true,
		} = options;

		this._request = request;
		this._store = previous?._store ?? store ?? new SessionStore();
		this._payload =
			payload ?? previous?._payload ?? this._store.defaultPayload();

		this._saved = false;
		this._keep_session = keep_session;

		this._callables = {
			autoRegenerate: callables?.autoRegenerate,
			generateId: callables?.generateId ?? generateId,
		};

		const cookieOptions = previous?._cookie.options ?? cookie;

		if (!cookieOptions) {
			throw new Error('Cookie options are required for new sessions.');
		}

		this._cookie = new SessionCookie(cookieOptions, request);

		this._id = session_id ?? this._callables.generateId();

		this._encrypted_id =
			(previous && previous._id === session_id && previous._encrypted_id) ||
			this._cookie.signer.sign(this._id);

		this._persisted_hash = hashSession({
			id: this._id,
			encrypted_id: this._encrypted_id,
			store: this._store.name,
			// @todo may add request?
			payload: this._payload ? this._payload.toJSON() : null,
		});
	}

	public get<T = any>(key: string): TOrNullable<T> {
		if (!this._payload) {
			return null;
		}

		return this._payload.get(key);
	}

	public set<T = any>(key: string, value: T): void {
		if (!this._payload) {
			return;
		}

		this._payload.set(key, value);
	}

	public reload(callback?: OnSessionModifyHook): Promise<boolean> {
		return new Promise(res => {
			this._store.get(this._id, (error, payload) => {
				const session = new FastifySession({
					session_id: this._id,
					request: this._request,
					store: this._store,
					cookie: this._cookie.options,
					callables: this._callables,
					previous: this,
					keep_session: this._keep_session,
				});

				session._payload = payload ?? this._store.defaultPayload();

				if (error) {
					this._request.session = session;

					if (callback) {
						callback(error);
					}

					return res(false);
				}

				this._request.session = session;

				if (callback) {
					callback(undefined);
				}

				return res(true);
			});
		});
	}

	/**
	 * If autoRegenerate function is provided and returns false, do not regenerate
	 * otherwise, always regenerate when this function is called.
	 */
	public regenerate(callback: OnSessionModifyHook): Promise<boolean> {
		const session: FastifySession = new FastifySession({
			request: this._request,
			store: this._store,
			callables: this._callables,
			previous: this,
			keep_session: this._keep_session,
		});

		return new Promise(res => {
			this._store.set(session._id, session._payload, error => {
				if (error) {
					if (this._keep_session === false) {
						this._request.session = null;
					}

					if (callback) {
						callback(error);
					}

					return res(false);
				}

				this._request.session = session;

				if (callback) {
					callback(undefined);
				}

				return res(true);
			});
		});
	}

	public destroy(callback?: OnSessionModifyHook): Promise<boolean> {
		return new Promise(res => {
			this._store.destroy(this._id, error => {
				this._request.session = null;

				if (error) {
					if (callback) {
						callback(error);
					}

					return res(false);
				}

				if (callback) {
					callback(undefined);
				}

				return res(true);
			});
		});
	}

	public save(callback?: OnSessionModifyHook): Promise<boolean> {
		return new Promise(res => {
			this._store.set(this._id, this._payload, error => {
				if (error) {
					if (callback) {
						callback(error);
					}

					return res(false);
				}

				this._saved = true;
				this._persisted_hash = hashSession({
					id: this._id,
					encrypted_id: this._encrypted_id,
					store: this._store.name,
					payload: this._payload.toJSON(),
				});

				if (callback) {
					callback(undefined);
				}

				return res(true);
			});
		});
	}

	public touch(ms: number) {
		this._cookie.expires = new Date(Date.now() + ms);
	}

	public get id() {
		return this._id;
	}

	public get encryptedId() {
		return this._encrypted_id;
	}

	public get cookie() {
		return this._cookie;
	}

	public get modified() {
		return (
			this._persisted_hash !==
			hashSession({
				id: this._id,
				encrypted_id: this._encrypted_id,
				store: this._store.name,
				payload: this._payload.toJSON(),
			})
		);
	}

	public get saved() {
		return this._saved;
	}
}
