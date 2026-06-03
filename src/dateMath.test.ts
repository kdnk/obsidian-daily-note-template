import { describe, expect, test } from 'vitest';
import { addToDate, formatDate, parseDate } from './dateMath';

describe('date math', () => {
	test('adds days and weeks relative to the base date', () => {
		const base = parseDate('2026-06-03');

		expect(formatDate(addToDate(base, { days: -1 }), 'YYYY-MM-DD')).toBe(
			'2026-06-02',
		);
		expect(formatDate(addToDate(base, { weeks: 1 }), 'YYYY-MM-DD')).toBe(
			'2026-06-10',
		);
	});

	test('adds months and clamps to the last valid day', () => {
		const base = parseDate('2026-01-31');

		expect(formatDate(addToDate(base, { months: 1 }), 'YYYY-MM-DD')).toBe(
			'2026-02-28',
		);
	});

	test('formats supported date tokens', () => {
		const base = parseDate('2026-06-03');

		expect(formatDate(base, 'YYYY/MM/DD')).toBe('2026/06/03');
		expect(formatDate(base, 'YYYY年M月D日')).toBe('2026年6月3日');
	});
});
