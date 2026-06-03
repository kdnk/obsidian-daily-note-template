import { describe, expect, test } from 'vitest';
import { formatDiagnosticNotice } from './diagnostics';

describe('diagnostics', () => {
	test('formats active daily note processing details for a mobile Notice', () => {
		expect(
			formatDiagnosticNotice({
				activePath: 'journals/2026-06-03.md',
				settings: {
					folder: 'journals',
					format: 'YYYY-MM-DD',
					template: 'templates/daily',
				},
				baseDate: '2026-06-03',
				contentLength: 37,
				hasDntExpression: true,
				action: 'expand-dnt',
			}),
		).toBe(
			[
				'DNT diagnosis',
				'path: journals/2026-06-03.md',
				'daily settings: OK',
				'folder: journals',
				'format: YYYY-MM-DD',
				'template: templates/daily',
				'base date: 2026-06-03',
				'content length: 37',
				'has dnt: yes',
				'action: expand-dnt',
			].join('\n'),
		);
	});

	test('formats missing settings and path mismatch clearly', () => {
		expect(
			formatDiagnosticNotice({
				activePath: 'notes/2026-06-03.md',
				settings: null,
				baseDate: null,
				contentLength: null,
				hasDntExpression: false,
				action: 'none',
			}),
		).toContain('daily settings: NOT FOUND');
	});
});
