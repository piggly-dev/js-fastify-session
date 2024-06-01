import { ISessionPayload } from '@/types/interfaces';

export default class SessionPayload implements ISessionPayload {
	private _data: Record<string, any>;

	constructor(data: Record<string, any> = {}) {
		this._data = data;
	}

	get<T = any>(key: string): T | null {
		return this._data[key] ?? null;
	}

	set<T = any>(key: string, value: T): void {
		this._data[key] = value;
	}

	get empty(): boolean {
		return Object.keys(this._data).length === 0;
	}

	toJSON(): Record<string, any> {
		return this._data;
	}
}
