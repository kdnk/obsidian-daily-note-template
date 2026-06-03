import { App, EventRef } from 'obsidian';
import { SyncState } from './processing';

interface InternalPluginEntry {
	enabled?: boolean;
	instance?: SyncInstance;
}

interface SyncInstance extends Record<string, unknown> {
	on?: (name: string, callback: (...data: unknown[]) => unknown) => EventRef;
}

interface InternalPluginRegistry {
	getPluginById?: (id: string) => InternalPluginEntry | null | undefined;
	plugins?: Record<string, InternalPluginEntry | undefined>;
}

interface AppWithInternalPlugins extends App {
	internalPlugins?: InternalPluginRegistry;
}

const SYNCED_WORDS = ['synced', 'idle', 'complete', 'completed', 'done'];
const SYNCING_WORDS = ['syncing', 'queued', 'connecting', 'indexing', 'scanning', 'pending'];

export function getSyncState(app: App): SyncState {
	const sync = getSyncPlugin(app);
	if (!sync?.enabled) {
		return 'unknown';
	}

	const instance = sync.instance;
	if (!instance) {
		return 'unknown';
	}

	const pending = getPendingCount(instance);
	if (pending !== null && (pending > 0 || pending === -1)) {
		return 'syncing';
	}

	const status = findStatusValue(instance, 0);
	if (!status) {
		return pending === 0 ? 'synced' : 'unknown';
	}

	const normalized = status.toLowerCase();
	if (SYNCED_WORDS.some((word) => normalized.includes(word))) {
		return 'synced';
	}
	if (SYNCING_WORDS.some((word) => normalized.includes(word))) {
		return 'syncing';
	}

	return 'unknown';
}

export function onSyncComplete(
	app: App,
	callback: () => void,
): EventRef | null {
	const sync = getSyncPlugin(app);
	if (!sync?.enabled || !sync.instance) {
		return null;
	}

	let hasRun = false;
	const runOnce = (): void => {
		if (hasRun || getSyncState(app) !== 'synced') {
			return;
		}
		hasRun = true;
		callback();
	};

	if (getSyncState(app) === 'synced') {
		runOnce();
		return null;
	}

	if (typeof sync.instance.on !== 'function') {
		return null;
	}

	return sync.instance.on('status-change', runOnce);
}

function getSyncPlugin(app: App): InternalPluginEntry | null | undefined {
	const internalPlugins = (app as AppWithInternalPlugins).internalPlugins;
	try {
		return (
			internalPlugins?.getPluginById?.('sync') ??
			internalPlugins?.plugins?.sync
		);
	} catch {
		return null;
	}
}

function getPendingCount(sync: Record<string, unknown>): number | null {
	if (Array.isArray(sync.queue)) {
		return sync.queue.length;
	}

	for (const key of ['pending', 'pendingSync']) {
		const value = sync[key];
		if (typeof value === 'number') {
			return value;
		}
	}

	const syncStatus = sync.syncStatus;
	if (syncStatus && typeof syncStatus === 'object') {
		const record = syncStatus as Record<string, unknown>;
		if (typeof record.pending === 'number') {
			return record.pending;
		}
		if (typeof record.total === 'number' && typeof record.done === 'number') {
			return Math.max(0, record.total - record.done);
		}
	}

	if (sync.syncing || sync.syncInProgress || sync.syncRunning) {
		return -1;
	}

	return null;
}

function findStatusValue(value: unknown, depth: number): string | null {
	if (depth > 2 || value === null || value === undefined) {
		return null;
	}

	if (typeof value === 'string') {
		return value;
	}

	if (typeof value !== 'object') {
		return null;
	}

	for (const [key, nested] of Object.entries(value)) {
		if (/sync|status|state|queue/i.test(key)) {
			const direct = primitiveStatus(nested);
			if (direct) {
				return direct;
			}
		}
	}

	const statusText = callStatusText(value as Record<string, unknown>);
	if (statusText) {
		return statusText;
	}

	for (const nested of Object.values(value)) {
		const found = findStatusValue(nested, depth + 1);
		if (found) {
			return found;
		}
	}

	return null;
}

function callStatusText(value: Record<string, unknown>): string | null {
	const getStatusText = value.getStatusText;
	if (typeof getStatusText !== 'function') {
		return null;
	}

	try {
		const status = (getStatusText as (this: Record<string, unknown>) => unknown).call(value);
		return typeof status === 'string' ? status : null;
	} catch {
		return null;
	}
}

function primitiveStatus(value: unknown): string | null {
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return null;
}
