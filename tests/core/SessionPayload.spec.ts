import SessionPayload from '@/core/SessionPayload';

describe('core -> SessionPayload', () => {
	it('should be empty', () => {
		const payload = new SessionPayload();
		expect(payload).toBeDefined();
		expect(payload.empty).toBe(true);
		expect(payload.get('test')).toBe(null);
		expect(payload.toJSON()).toEqual({});
	});

	it('should set and get data', () => {
		const payload = new SessionPayload();
		payload.set('test', 'value');
		expect(payload.get('test')).toBe('value');
		expect(payload.empty).toBe(false);
		expect(payload.toJSON()).toEqual({ test: 'value' });
	});
});
