import { describe, expect, test } from 'vitest';
import { getSyncState, onSyncComplete } from './syncStatus';

function appWithSyncInstance(instance: Record<string, unknown>, enabled = true) {
	return {
		internalPlugins: {
			getPluginById(id: string) {
				if (id !== 'sync') {
					return null;
				}
				return { enabled, instance };
			},
		},
	};
}

describe('sync status', () => {
	test('reads the Obsidian Sync core plugin through getPluginById', () => {
		const app = appWithSyncInstance({ statusMessage: 'Fully synced' });

		expect(getSyncState(app as never)).toBe('synced');
	});

	test('recognizes the syncStatus value used by Obsidian Sync', () => {
		const app = appWithSyncInstance({ syncStatus: 'fully synced' });

		expect(getSyncState(app as never)).toBe('synced');
	});

	test('treats pending sync work as syncing', () => {
		const app = appWithSyncInstance({ pending: 2 });

		expect(getSyncState(app as never)).toBe('syncing');
	});

	test('treats unavailable Sync as unknown instead of safe to create', () => {
		const app = appWithSyncInstance({}, false);

		expect(getSyncState(app as never)).toBe('unknown');
	});

	test('registers a status-change handler for sync completion', () => {
		const handlers: Array<() => void> = [];
		let syncStatus = 'syncing';
		let calls = 0;
		const eventRef = {};
		const app = appWithSyncInstance({
			get syncStatus() {
				return syncStatus;
			},
			on(eventName: string, callback: () => void) {
				if (eventName === 'status-change') {
					handlers.push(callback);
				}
				return eventRef;
			},
		});

		const ref = onSyncComplete(app as never, () => {
			calls += 1;
		});

		expect(ref).toBe(eventRef);
		expect(calls).toBe(0);

		syncStatus = 'fully synced';
		const statusHandler = handlers[0];
		if (!statusHandler) {
			throw new Error('Expected status-change handler to be registered');
		}
		statusHandler();
		statusHandler();

		expect(calls).toBe(1);
	});
});
