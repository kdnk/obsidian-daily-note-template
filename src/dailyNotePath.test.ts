import { describe, expect, test } from 'vitest';
import {
	getDateFromDailyNotePath,
	getDateFromIsoDateFilename,
	getPathForDailyNote,
} from './dailyNotePath';

describe('daily note path', () => {
	test('parses a date from the Daily notes folder and format', () => {
		const date = getDateFromDailyNotePath('journals/2026-06-03.md', {
			folder: 'journals',
			format: 'YYYY-MM-DD',
		});

		expect(date).toBe('2026-06-03');
	});

	test('parses a date from a Daily notes format that includes weekday tokens', () => {
		const date = getDateFromDailyNotePath('journals/2026-06-03 Wed.md', {
			folder: 'journals',
			format: 'YYYY-MM-DD ddd',
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

	test('parses a date from an ISO date filename without Daily notes settings', () => {
		expect(getDateFromIsoDateFilename('journals/2026-06-03.md')).toBe(
			'2026-06-03',
		);
		expect(getDateFromIsoDateFilename('notes/not-a-daily-note.md')).toBeNull();
	});
});
