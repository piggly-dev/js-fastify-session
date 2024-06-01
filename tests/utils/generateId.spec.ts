import { generateId } from '@/utils';

/* eslint-disable-next-line no-bitwise */
const cache_size = 1 << (7 + 1);

describe('utils -> generateId', () => {
	it('should have no collisions', () => {
		const ids = new Set<string>();

		for (let i = 0; i < cache_size; i += 1) {
			const id = generateId();

			if (ids.has(id)) {
				fail(`Collision detected: ${id}`);
			}

			ids.add(id);
			expect(id.length).toBe(32);
		}
	});
});
