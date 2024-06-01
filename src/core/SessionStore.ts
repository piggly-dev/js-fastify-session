import { EventEmitter } from 'events';

import type { ISessionStore } from '@/types/interfaces';

import { OnSessionGetHook, OnSessionModifyHook } from '@/types/hook';
import SessionPayload from '@/core/SessionPayload';

export default class SessionStore
	extends EventEmitter
	implements ISessionStore
{
	// In-memory storage for session data
	private _sessions: Map<string, SessionPayload>;

	constructor(initialState = new Map<string, SessionPayload>()) {
		super();
		this._sessions = initialState;
	}

	public get(
		session_id: string,
		next: OnSessionGetHook<SessionPayload>,
	): void {
		const payload = this._sessions.get(session_id) ?? null;
		next(undefined, payload);
	}

	public set(
		session_id: string,
		value: SessionPayload,
		next: OnSessionModifyHook,
	): void {
		this._sessions.set(session_id, value);
		next(undefined);
	}

	public destroy(session_id: string, next: OnSessionModifyHook): void {
		this._sessions.delete(session_id);
		next(undefined);
	}

	public defaultPayload(): SessionPayload {
		return new SessionPayload();
	}

	public get name(): string {
		return 'in_memory';
	}
}
