import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import fastifyPlugin from 'fastify-plugin';
import { Signer } from '@fastify/cookie';

import type {
	FastifySessionPluginInternalOptions,
	FastifySessionPluginOptions,
} from '@/types/options';

import {
	evaluateSecret,
	evaluateUrlPath,
	generateId,
	valueOrDefault,
} from '@/utils';
import { ISessionPayload } from '@/types/interfaces';
import FastifySession from '@/core/FastifySession';
import SessionStore from '@/core/SessionStore';

const fastifySession = (
	fastify: FastifyInstance,
	options: FastifySessionPluginOptions,
	next: (err?: Error) => void,
) => {
	const evaluate = evaluateSecret(options);

	if (evaluate !== undefined) {
		next(evaluate);
		return;
	}

	const defaults = (o: FastifySessionPluginOptions) => {
		const opts: any = {
			store: o.store ?? new SessionStore(),
			callables: {
				autoRegenerate: o.callables?.autoRegenerate,
				generateId: o.callables?.generateId ?? generateId,
			},
			cookie: {
				name: o.cookie?.name ?? 'session_id',
				algorithm: o.cookie?.algorithm ?? 'sha256',
				options: o.cookie?.options ?? {},
			},
			rooling: valueOrDefault(o.rooling, false),
			saveUninitialized: valueOrDefault(o.saveUninitialized, false),
			keepIfRegenerationFails: valueOrDefault(
				o.keepIfRegenerationFails,
				true,
			),
		};

		opts.cookie.options.path = valueOrDefault(o.cookie?.options?.path, '/');

		opts.cookie.options.partitioned = valueOrDefault(
			o.cookie?.options?.partitioned,
			true,
		);

		opts.cookie.options.httpOnly = valueOrDefault(
			o.cookie?.options?.httpOnly,
			true,
		);

		opts.cookie.options.secure = valueOrDefault(
			o.cookie?.options?.secure,
			true,
		);

		opts.cookie.options.sameSite = valueOrDefault(
			o.cookie?.options?.sameSite,
			'lax',
		);

		opts.cookie.options.priority = valueOrDefault(
			opts.cookie.options.priority,
			'medium',
		);

		opts.signer =
			typeof o.secret === 'string' || Array.isArray(o.secret)
				? new Signer(o.secret, opts.algorithm)
				: o.secret;

		return opts as FastifySessionPluginInternalOptions;
	};

	const opts = defaults(options);

	const emptySession = (request: FastifyRequest) =>
		new FastifySession({
			request,
			store: opts.store,
			cookie: {
				...opts.cookie.options,
				signer: opts.signer,
			},
			callables: opts.callables,
			keep_session: opts.keepIfRegenerationFails,
		});

	const newSession = (
		request: FastifyRequest,
		payload: ISessionPayload,
		session_id: string,
	) =>
		new FastifySession({
			request,
			store: opts.store,
			cookie: {
				...opts.cookie.options,
				signer: opts.signer,
			},
			callables: opts.callables,
			keep_session: opts.keepIfRegenerationFails,
			session_id,
			payload,
		});

	const shouldSave = (
		request: FastifyRequest,
		cookie_id?: string,
	): boolean => {
		const { session } = request;
		if (!session) {
			return false;
		}

		return cookie_id !== session.encryptedId
			? opts.saveUninitialized || session.modified
			: opts.rooling || session.modified;
	};

	const decryptSession = (
		session_id: string,
		request: FastifyRequest,
		done: (err?: Error) => void,
	) => {
		const unsigned = opts.signer.unsign(session_id);

		if (!unsigned || unsigned.valid === false || !unsigned.value) {
			request.session = emptySession(request);
			done();
			return;
		}

		const current_session_id = unsigned.value;

		opts.store.get(current_session_id, (err, payload) => {
			if (err) {
				done(err);
				return;
			}

			if (!payload) {
				request.session = emptySession(request);
				done();
				return;
			}

			const restored = newSession(request, payload, current_session_id);

			// @todo change expiration rules and apply autoRegenerate
			const expiration =
				restored.cookie.options.originalExpires || restored.cookie.expires;

			if (expiration && expiration.getTime() <= Date.now()) {
				restored.destroy(e => {
					if (e) {
						done(e);
						return;
					}
					// where to regenerate?
					restored.regenerate(done);
				});
			}

			request.session = restored;
			done();
		});
	};

	const handleOnRequest = (
		request: FastifyRequest,
		reply: FastifyReply,
		done: (err?: Error) => void,
	) => {
		request.session = null;

		const url = request.raw.url?.split('?')[0] ?? '';

		if (evaluateUrlPath(url, opts.cookie.options.path ?? '/')) {
			done();
			return;
		}

		const session_id = request.cookies[opts.cookie.name];

		if (!session_id) {
			request.session = emptySession(request);
			done();
			return;
		}

		decryptSession(session_id, request, done);
	};

	const handleOnSend = (
		request: FastifyRequest,
		reply: FastifyReply,
		payload: any,
		done: (err?: Error) => void,
	) => {
		const { session } = request;

		if (!session || !session.id || !session.encryptedId) {
			return done();
		}

		const session_id = request.cookies[opts.cookie.name];

		const unsafe =
			opts.cookie.options.secure === true && request.protocol !== 'https';

		const should_save = shouldSave(request, session_id);

		if (!should_save || !unsafe) {
			// if a session cookie is set, but has a different ID, clear it
			if (session_id && session_id !== session.encryptedId) {
				reply.clearCookie(opts.cookie.name, {
					domain: opts.cookie.options.domain,
				});
			}

			if (session.saved) {
				reply.setCookie(
					opts.cookie.name,
					session.encryptedId,
					session.cookie.toJSON(),
				);
			}

			return done();
		}

		session.save(err => {
			if (err) {
				done(err);
				return;
			}

			reply.setCookie(
				opts.cookie.name,
				session.encryptedId,
				session.cookie.toJSON(),
			);

			done();
		});

		return () => {};
	};

	fastify.decorate('session', null);

	fastify.addHook('onRequest', handleOnRequest);
	fastify.addHook('onSend', handleOnSend);

	next();
};

const fp = fastifyPlugin(fastifySession, {
	fastify: '4.x',
	name: '@piggly/fastify-session',
	dependencies: ['@fastify/cookie'],
});

export { fastifySession, fp };

export default fastifySession;
