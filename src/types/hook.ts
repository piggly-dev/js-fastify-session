import type { TOrNullable, TOrUndefined } from '@/types/types';
import type { ISessionPayload } from '@/types/interfaces';

export type OnSessionGetHook<Payload extends ISessionPayload> = (
	error: TOrUndefined<Error>,
	payload: TOrNullable<Payload>,
) => void;

export type OnSessionModifyHook = (error: TOrUndefined<Error>) => void;
