import type { CookieSerializeOptions, Signer } from '@fastify/cookie';

import type { ISessionStore } from '@/types/interfaces';

export type FastifySessionCookieOptions = Omit<
	CookieSerializeOptions,
	'signed'
> & {
	originalMaxAge?: number;
	originalExpires?: Date;
	signer: Signer;
};

export type FastifySessionPluginInternalOptions = {
	secret: string | string[] | Buffer | Buffer[] | Signer;
	store: ISessionStore;
	callables: {
		autoRegenerate?: () => boolean;
		generateId: () => string;
	};
	cookie: {
		name: string;
		algorithm: string;
		options: Omit<
			FastifySessionCookieOptions,
			'originalMaxAge' | 'originalExpires' | 'signer'
		>;
	};
	signer: Signer;
	rooling: boolean;
	saveUninitialized: boolean;
	keepIfRegenerationFails: boolean;
};

export type FastifySessionPluginOptions = {
	secret: string | string[] | Buffer | Buffer[] | Signer;
	store?: ISessionStore;
	callables?: {
		autoRegenerate?: () => boolean;
		generateId?: () => string;
	};
	cookie?: {
		name?: string;
		algorithm?: string;
		options?: Omit<
			FastifySessionCookieOptions,
			'originalMaxAge' | 'originalExpires' | 'signer'
		>;
	};
	rooling?: boolean;
	saveUninitialized?: boolean;
	keepIfRegenerationFails?: boolean;
};
