import { describe, expect, test, vi } from 'vitest';
import {
	getDailyNotesCoreSettings,
	getDailyNotesInternalShape,
} from './dailyNotesSettings';

vi.mock('obsidian', () => ({
	normalizePath: (path: string) => path.replace(/\/+/g, '/').replace(/^\/|\/$/g, ''),
}));

describe('daily notes core settings', () => {
	test('reads settings from getEnabledPluginById options', () => {
		const app = {
			internalPlugins: {
				getEnabledPluginById(id: string) {
					if (id !== 'daily-notes') {
						return null;
					}
					return {
						options: {
							folder: 'journals',
							format: 'YYYY-MM-DD',
							template: 'templates/daily',
						},
					};
				},
			},
		};

		expect(getDailyNotesCoreSettings(app as never)).toEqual({
			folder: 'journals',
			format: 'YYYY-MM-DD',
			template: 'templates/daily',
		});
	});

	test('uses the Daily notes default format when Obsidian omits format from options', () => {
		const app = {
			internalPlugins: {
				getEnabledPluginById(id: string) {
					if (id !== 'daily-notes') {
						return null;
					}
					return {
						instance: {
							options: {
								folder: 'journals',
								template: 'templates/daily',
							},
						},
					};
				},
			},
		};

		expect(getDailyNotesCoreSettings(app as never)).toEqual({
			folder: 'journals',
			format: 'YYYY-MM-DD',
			template: 'templates/daily',
		});
	});

	test('uses the Daily notes default format when Obsidian stores a blank format', () => {
		const app = {
			internalPlugins: {
				getEnabledPluginById(id: string) {
					if (id !== 'daily-notes') {
						return null;
					}
					return {
						instance: {
							options: {
								folder: 'journals',
								format: '   ',
								template: 'templates/daily',
							},
						},
					};
				},
			},
		};

		expect(getDailyNotesCoreSettings(app as never)).toEqual({
			folder: 'journals',
			format: 'YYYY-MM-DD',
			template: 'templates/daily',
		});
	});

	test('summarizes internal plugin shape for mobile diagnostics', () => {
		const app = {
			internalPlugins: {
				getEnabledPluginById() {
					return {
						options: {
							folder: 'journals',
							format: 'YYYY-MM-DD',
							template: 'templates/daily',
						},
					};
				},
				getPluginById() {
					return null;
				},
				plugins: {},
			},
		};

		expect(getDailyNotesInternalShape(app as never)).toMatchObject({
			hasInternalPlugins: true,
			hasGetEnabledPluginById: true,
			hasGetPluginById: true,
			hasRegistryEntry: false,
			enabledPluginKeys: ['options'],
			optionsKeys: ['folder', 'format', 'template'],
		});
	});
});
