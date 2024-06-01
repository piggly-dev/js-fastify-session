import type { TOrNullable } from '@/types/types';

import { OnSessionGetHook, OnSessionModifyHook } from '@/types/hook';

export interface ISessionPayload {
	get<T = any>(key: string): TOrNullable<T>;
	set<T = any>(key: string, value: T): void;
	get empty(): boolean;
	toJSON(): Record<string, any>;
}

export interface ISessionStore {
	get(session_id: string, next: OnSessionGetHook<ISessionPayload>): void;

	set(
		session_id: string,
		value: ISessionPayload,
		next: OnSessionModifyHook,
	): void;

	destroy(session_id: string, next: OnSessionModifyHook): void;

	defaultPayload(): ISessionPayload;

	get name(): string;
}
