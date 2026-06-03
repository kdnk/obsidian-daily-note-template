import { describe, expect, test } from 'vitest';
import { getDateFromDailyNotePath, getPathForDailyNote } from './dailyNotePath';

describe('daily note path', () => {
	test('parses a date from the Daily notes folder and format', () => {
		const date = getDateFromDailyNotePath('journals/2026-06-03.md', {
			folder: 'journals',
			format: 'YYYY-MM-DD',
		});

		expect(date).toBe('2026-06-03');
	});

	test('rejects paths outside the configured Daily notes folder', () => {
		const date = getDateFromDailyNotePath('notes/2026-06-03.md', {
			folder: 'journals',
			format: 'YYYY-MM-DD',
		});

		expect(date).toBeNull();
	});

	test('builds the configured path for a daily note date', () => {
		const path = getPathForDailyNote('2026-06-03', {
			folder: 'journals',
			format: 'YYYY-MM-DD',
		});

		expect(path).toBe('journals/2026-06-03.md');
	});
});
