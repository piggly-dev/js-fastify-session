import { evaluateSecret } from '@/utils';

describe('utils -> evaluateSecret', () => {
	const validStringScret =
		'b8yMViFJz3LHKi417lCWDDx891DA0Gz5RiBr0PwDtAZGp4l9korX1MFxLdwBrb2U';

	const validArraySecret = [
		'b8yMViFJz3LHKi417lCWDDx891DA0Gz5RiBr0PwDtAZGp4l9korX1MFxLdwBrb2U',
		'hOMabYbE/jifXpUE9tLrWgLxCsgMYiTAY9am0DzqQZMjz6vTmTrbNML+PP8mO6Cm',
	];

	it.each([
		{ options: 'any', expected: false },
		{ options: {}, expected: false },
		{ options: { secret: true }, expected: false },
		{ options: { secret: 'invalid' }, expected: false },
		{ options: { secret: [] }, expected: false },
		{ options: { secret: ['invalid'] }, expected: false },

		{
			options: {
				secret: validStringScret,
			},
			expected: true,
		},
		{
			options: {
				secret: validArraySecret,
			},
			expected: true,
		},
	])('should return $expected', ({ options, expected }) => {
		if (expected === true) {
			expect(evaluateSecret(options)).toBe(undefined);
			return;
		}

		expect(evaluateSecret(options)).toEqual(
			expect.objectContaining({
				message: expect.any(String),
			}),
		);
	});
});
