import { describe, expect, test, vi } from 'vitest';
import { getDailyNotesCoreSettings } from './dailyNotesSettings';

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
});
