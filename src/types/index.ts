import type FastifySession from '@/core/FastifySession';
import type { TOrNullable } from '@/types/types';

export * from './interfaces';
export * from './options';
export * from './hook';

declare module 'fastify' {
	interface FastifyRequest {
		session: TOrNullable<FastifySession>;
	}
}
