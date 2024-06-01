import { FastifyRequest } from 'fastify';

import { Signer } from '@fastify/cookie';

import SessionCookie from '@/core/SessionCookie';
import { SessionCookieOptions } from '@/types';

describe('SessionCookie', () => {
	// Mock Signer
	const mockSigner = {
		sign: jest.fn().mockReturnValue('signed-value'),
		unsign: jest
			.fn()
			.mockReturnValue({ valid: true, value: 'unsigned-value' }),
	} as unknown as Signer;

	// Mock FastifyRequest
	const mockRequest = {
		protocol: 'https',
	} as FastifyRequest;

	describe('constructor', () => {
		it('should throw an error if no signer is provided', () => {
			expect(
				() => new SessionCookie({} as SessionCookieOptions, mockRequest),
			).toThrow('Cookie signer is required.');
		});

		it('should initialize with default values and handle secure:auto', () => {
			const cookie = new SessionCookie({ signer: mockSigner }, mockRequest);
			expect(cookie.options).toEqual({
				path: '/',
				secure: true, // Changed to true due to secure:auto and https protocol
				sameSite: 'lax',
				domain: undefined,
				httpOnly: true,
				partitioned: undefined,
				maxAge: undefined,
				expires: undefined,
				originalMaxAge: undefined,
				originalExpires: undefined,
				signer: mockSigner,
			});
		});

		it('should initialize with provided values and originalMaxAge', () => {
			const options: SessionCookieOptions = {
				path: '/test',
				secure: false,
				sameSite: 'strict',
				domain: 'example.com',
				httpOnly: false,
				partitioned: true,
				originalMaxAge: 3600000,
				signer: mockSigner,
			};

			const cookie = new SessionCookie(options, mockRequest);

			expect(cookie.options).toEqual({
				...options,
				maxAge: undefined,
				expires: undefined,
				originalMaxAge: 3600000,
				originalExpires: undefined,
			}); // maxAge is calculated
		});

		it('should initialize with provided values and expires (overriding maxAge)', () => {
			const expires = new Date(Date.now() + 3600000);
			const options: SessionCookieOptions = {
				expires,
				maxAge: 12345, // will be ignored
				signer: mockSigner,
			};

			const cookie = new SessionCookie(options, mockRequest);

			expect(cookie.maxAge).not.toBe(12345);

			expect(cookie.options).toEqual({
				path: '/',
				secure: true,
				sameSite: 'lax',
				domain: undefined,
				httpOnly: true,
				partitioned: undefined,
				signer: mockSigner,
				// changes
				expires: undefined,
				maxAge: undefined,
				originalMaxAge: 12345,
				originalExpires: expires,
			});
		});

		it('should set secure to false and sameSite to lax for insecure connection', () => {
			const request = { protocol: 'http' } as FastifyRequest;
			const options: SessionCookieOptions = {
				secure: 'auto',
				signer: mockSigner,
			};
			const cookie = new SessionCookie(options, request);
			expect(cookie.options.secure).toBe(false);
			expect(cookie.options.sameSite).toBe('lax');
		});
	});

	describe('expires', () => {
		it('should get and set expires correctly', () => {
			const cookie = new SessionCookie({ signer: mockSigner }, mockRequest);
			const newExpires = new Date(Date.now() + 3600000); // 1 hour on future
			cookie.expires = newExpires;
			expect(cookie.expires).toEqual(newExpires);
		});
	});

	describe('maxAge', () => {
		it('should get and set maxAge correctly and update expires', () => {
			const cookie = new SessionCookie({ signer: mockSigner }, mockRequest);
			cookie.maxAge = 3600000; // 1 hour
			expect(cookie.maxAge).toBeGreaterThanOrEqual(3599999); // test margin
			expect(cookie.expires).toBeInstanceOf(Date);
		});
	});

	describe('toJSON', () => {
		it('should return the correct JSON representation', () => {
			const expires = new Date(Date.now() + 3600000);
			const options: SessionCookieOptions = {
				path: '/test',
				secure: false,
				sameSite: 'strict',
				domain: 'example.com',
				httpOnly: false,
				partitioned: true,
				expires,
				signer: mockSigner,
			};
			const cookie = new SessionCookie(options, mockRequest);
			const json = cookie.toJSON();

			expect(json).toEqual({
				path: '/test',
				secure: false,
				sameSite: 'strict',
				domain: 'example.com',
				httpOnly: false,
				partitioned: true,
				expires: cookie.expires,
				maxAge: cookie.maxAge, // maxAge deve ser calculado
				originalMaxAge: undefined,
				originalExpires: expires,
			});
		});
	});

	describe('getters', () => {
		it('should get the signer correctly', () => {
			const cookie = new SessionCookie({ signer: mockSigner }, mockRequest);
			expect(cookie.signer).toBe(mockSigner);
		});

		it('should get the options correctly', () => {
			const options: SessionCookieOptions = {
				path: '/test',
				secure: false,
				sameSite: 'strict',
				domain: 'example.com',
				httpOnly: false,
				partitioned: true,
				originalMaxAge: 3600000,
				signer: mockSigner,
			};
			const cookie = new SessionCookie(options, mockRequest);
			expect(cookie.options).toEqual({
				...options,
				maxAge: undefined,
				expires: undefined,
				originalMaxAge: 3600000,
				originalExpires: undefined,
			});
		});
	});
});
