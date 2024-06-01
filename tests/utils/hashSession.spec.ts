import { hashSession } from '@/utils';

describe('utils -> hashSession', () => {
	it('should create a hash', () => {
		expect(
			hashSession({
				id: 'id',
				encrypted_id: 'encrypted_id',
				store: 'store',
				payload: { key: 'value' },
			}),
		).toBe(
			'fbef07b605f57831a8aaccc458c495fb35c7935a8e40d1c0cdfd50572a3d5fbe',
		);
	});

	it('should produce a new hash', () => {
		expect(
			hashSession({
				id: 'id',
				encrypted_id: 'encrypted_id',
				store: 'store',
				payload: { key: true },
			}),
		).not.toBe(
			hashSession({
				id: 'id',
				encrypted_id: 'encrypted_id',
				store: 'store',
				payload: { key: 'true' },
			}),
		);
	});
});
