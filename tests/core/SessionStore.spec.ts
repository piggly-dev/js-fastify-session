import SessionPayload from '@/core/SessionPayload';
import SessionStore from '@/core/SessionStore';

describe('core -> SessionStore', () => {
	it('should create a store', () => {
		const store = new SessionStore();

		expect(store).toBeDefined();
		expect(store.defaultPayload()).toBeInstanceOf(SessionPayload);
		expect(store.name).toBe('in_memory');
	});

	it('should get an empty session as null', () => {
		const store = new SessionStore();

		store.get('unknown', (err, payload) => {
			expect(err).toBeUndefined();
			expect(payload).toBeNull();
		});
	});

	it('should set and get a session', () => {
		const store = new SessionStore();
		const pld = new SessionPayload();
		pld.set('test', 'value');

		store.set('test', pld, err => {
			expect(err).toBeUndefined();
		});

		store.get('test', (err, payload) => {
			expect(err).toBeUndefined();
			expect(payload).toBeDefined();
			expect(payload).toBe(pld);
		});
	});

	it('should destroy a session', () => {
		const store = new SessionStore();

		store.set('test', new SessionPayload(), err => {
			expect(err).toBeUndefined();
		});

		store.destroy('test', err => {
			expect(err).toBeUndefined();
		});

		store.get('test', (err, payload) => {
			expect(err).toBeUndefined();
			expect(payload).toBeNull();
		});
	});
});
