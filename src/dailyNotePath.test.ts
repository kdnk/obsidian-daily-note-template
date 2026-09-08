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

	test.each([
		['YYYY/MM/YYYY-MM-DD', 'journals/2026/06/2026-06-03.md'],
		['YYYY/M/YYYY-MM-DD', 'journals/2026/6/2026-06-03.md'],
		['YYYY/MM/DD/YYYY-M-D', 'journals/2026/06/03/2026-6-3.md'],
	])('parses consistent repeated date fields in %s', (format, path) => {
		expect(getDateFromDailyNotePath(path, { folder: 'journals', format })).toBe(
			'2026-06-03',
		);
	});

	test.each([
		'journals/2025/06/2026-06-03.md',
		'journals/2026/05/2026-06-03.md',
	])('rejects conflicting date fields in %s', (path) => {
		expect(getDateFromDailyNotePath(path, {
			folder: 'journals', format: 'YYYY/MM/YYYY-MM-DD',
		})).toBeNull();
	});

	test.each(['2026-02-30', '2026-13-01', '2026-00-01'])(
		'ignores invalid date filenames without throwing: %s', (date) => {
			expect(getDateFromDailyNotePath(`journals/${date}.md`, {
				folder: 'journals', format: 'YYYY-MM-DD',
			})).toBeNull();
		},
	);

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
