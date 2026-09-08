import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import DailyNoteTemplatePlugin from './main';
import { createFileEvents, TFile } from './testUtils/obsidianMock';

vi.mock('obsidian', () => import('./testUtils/obsidianMock'));

function deferred() {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => { resolve = done; });
	return { promise, resolve };
}

async function setup(content = 'Today: <% dnt.today() %>') {
	const file = new TFile('journals/2026-06-03.md');
	const events = createFileEvents();
	const state = {
		content,
		writes: 0,
		reads: 0,
		processingReads: 0,
		beforeRead: async () => {},
		beforeProcess: async () => {},
	};
	const save = (text: string) => {
		state.content = text;
		state.writes += 1;
		events.emit('modify', file);
	};
	const vault = {
		...events,
		getFileByPath: (path: string) => path === file.path ? file : null,
		cachedRead: async () => {
			state.reads += 1;
			const snapshot = state.content;
			await state.beforeRead();
			return snapshot;
		},
		modify: async (_file: TFile, text: string) => { save(text); },
		process: async (_file: TFile, transform: (text: string) => string) => {
			state.processingReads += 1;
			await state.beforeProcess();
			const result = transform(state.content);
			save(result);
			return result;
		},
	};
	let ready!: () => void;
	const app = {
		vault,
		workspace: {
			...createFileEvents(),
			getActiveFile: () => file,
			onLayoutReady: (callback: () => void) => { ready = callback; },
		},
		internalPlugins: {
			getEnabledPluginById: () => ({
				options: { folder: 'journals', format: 'YYYY-MM-DD' },
			}),
		},
	};
	const plugin = new DailyNoteTemplatePlugin(app as never, {} as never);
	await plugin.onload();
	return { plugin, state, file, events, ready: () => ready() };
}

describe('daily note lifecycle', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal('window', { setTimeout, clearTimeout, clearInterval });
	});
	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	test('preserves edits saved while the initial read is pending', async () => {
		const { state, events, file } = await setup();
		const read = deferred();
		state.beforeRead = () => read.promise;
		events.emit('create', file);
		await vi.advanceTimersByTimeAsync(750);
		state.content += '\nSaved by another editor';
		read.resolve();
		await vi.runAllTimersAsync();
		expect(state.content).toBe('Today: 2026-06-03\nSaved by another editor');
	});

	test('cancels queued processing on unload', async () => {
		const { plugin, state, events, file } = await setup();
		events.emit('create', file);
		plugin.unload();
		expect(vi.getTimerCount()).toBe(0);
		await vi.runAllTimersAsync();
		expect(state.content).toBe('Today: <% dnt.today() %>');
		expect(state.writes).toBe(0);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('does not write when unloaded during a pending read', async () => {
		const { plugin, state, events, file } = await setup();
		const read = deferred();
		state.beforeRead = () => read.promise;
		events.emit('create', file);
		await vi.advanceTimersByTimeAsync(750);
		expect(state.reads).toBe(1);
		plugin.unload();
		read.resolve();
		await vi.runAllTimersAsync();
		expect(state.content).toBe('Today: <% dnt.today() %>');
		expect(state.writes).toBe(0);
	});

	test('does not transform a note if unloaded while its atomic read is pending', async () => {
		const { plugin, state, events, file } = await setup();
		const read = deferred();
		state.beforeProcess = () => read.promise;
		events.emit('create', file);
		await vi.advanceTimersByTimeAsync(750);
		expect(state.processingReads).toBe(1);
		plugin.unload();
		read.resolve();
		await vi.runAllTimersAsync();
		expect(state.content).toBe('Today: <% dnt.today() %>');
		expect(state.writes).toBe(0);
	});

	test('ignores layout-ready callbacks delivered after unload', async () => {
		const { plugin, state, ready } = await setup();
		plugin.unload();
		ready();
		await vi.runAllTimersAsync();
		expect(state.writes).toBe(0);
		expect(state.reads).toBe(0);
	});

	test('cancels retries on unload', async () => {
		const { plugin, state, events, file } = await setup('<% dnt.unknown() %>');
		events.emit('create', file);
		await vi.advanceTimersByTimeAsync(750);
		const readsBeforeUnload = state.reads;
		plugin.unload();
		await vi.runAllTimersAsync();
		expect(state.reads).toBe(readsBeforeUnload);
		expect(state.writes).toBe(0);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('processes modifications that arrive while a previous read is pending', async () => {
		const { state, events, file } = await setup('Waiting for template');
		const read = deferred();
		state.beforeRead = () => read.promise;
		events.emit('create', file);
		await vi.advanceTimersByTimeAsync(750);
		state.content = 'Today: <% dnt.today() %>';
		events.emit('modify', file);
		await vi.advanceTimersByTimeAsync(1500);
		read.resolve();
		await vi.runAllTimersAsync();
		expect(state.content).toBe('Today: 2026-06-03');
	});

	test('does not save when another editor has already removed the expression', async () => {
		const { state, events, file } = await setup();
		const read = deferred();
		state.beforeRead = () => read.promise;
		events.emit('create', file);
		await vi.advanceTimersByTimeAsync(750);
		state.content = 'Replaced by another editor';
		read.resolve();
		await vi.runAllTimersAsync();
		expect(state.content).toBe('Replaced by another editor');
		expect(state.writes).toBe(0);
	});

	test('stops unsupported-expression retries at the configured limit without writing', async () => {
		const { state, events, file } = await setup('<%dnt.unknown()%>');
		events.emit('create', file);
		await vi.runAllTimersAsync();
		expect(state.content).toBe('<%dnt.unknown()%>');
		expect(state.writes).toBe(0);
		expect(state.reads).toBe(4);
		expect(vi.getTimerCount()).toBe(0);
	});

	test('coalesces repeated modify events into one template update', async () => {
		const { state, events, file } = await setup();
		events.emit('modify', file);
		await vi.advanceTimersByTimeAsync(500);
		events.emit('modify', file);
		await vi.advanceTimersByTimeAsync(1000);
		expect(state.reads).toBe(0);
		await vi.runAllTimersAsync();
		expect(state.content).toBe('Today: 2026-06-03');
		expect(state.writes).toBe(1);
	});
});
