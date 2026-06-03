import { describe, expect, test } from 'vitest';
import { expandDntExpressions } from './templateEngine';

describe('template engine', () => {
	test('expands DNT expressions relative to the target file date', () => {
		const result = expandDntExpressions(
			[
				'today: <% dnt.today() %>',
				'yesterday: <% dnt.yesterday() %>',
				'next week: <% dnt.addWeeks(1) %>',
				'month label: <% dnt.format("YYYY/MM") %>',
			].join('\n'),
			{ baseDate: '2026-06-03' },
		);

		expect(result).toBe(
			[
				'today: 2026-06-03',
				'yesterday: 2026-06-02',
				'next week: 2026-06-10',
				'month label: 2026/06',
			].join('\n'),
		);
	});

	test('leaves unsupported expressions untouched', () => {
		const result = expandDntExpressions('<% tp.date.now() %>', {
			baseDate: '2026-06-03',
		});

		expect(result).toBe('<% tp.date.now() %>');
	});
});
