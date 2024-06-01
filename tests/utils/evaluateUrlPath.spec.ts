import { evaluateUrlPath } from '@/utils';

describe('utils -> evaluateUrlPath', () => {
	it.each([
		{ path: '/path', cookie_path: '/path', expected: true },
		{ path: '/path', cookie_path: '/path/to', expected: false },
		{ path: '/path/to', cookie_path: '/path', expected: true },
		{ path: '/path/to/', cookie_path: '/path', expected: true },
		{ path: '/path/to', cookie_path: '/', expected: true },
		{ path: '/', cookie_path: '/path', expected: false },
		{ path: '/', cookie_path: '/path/to', expected: false },
		{ path: '/to', cookie_path: '/path', expected: false },
		{ path: '/to/', cookie_path: '/path', expected: false },
		{ path: '/to', cookie_path: '/', expected: true },
	])('should return $expected', ({ path, cookie_path, expected }) => {
		expect(evaluateUrlPath(path, cookie_path)).toBe(expected);
	});
});
