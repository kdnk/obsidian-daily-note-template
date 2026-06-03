import { describe, expect, test } from 'vitest';
import { decideDailyNoteAction } from './processing';

describe('daily note processing decision', () => {
	test('expands DNT expressions in existing content without applying the full template', () => {
		expect(
			decideDailyNoteAction({
				fileExists: true,
				content: 'Today: <% dnt.today() %>',
			}),
		).toBe('expand-dnt');
	});

	test('does nothing for existing empty files because Obsidian owns template application', () => {
		expect(
			decideDailyNoteAction({
				fileExists: true,
				content: '',
			}),
		).toBe('none');
	});

	test('does not create missing notes because Obsidian owns daily-note creation', () => {
		expect(
			decideDailyNoteAction({
				fileExists: false,
				content: null,
			}),
		).toBe('none');

		expect(
			decideDailyNoteAction({
				fileExists: false,
				content: null,
			}),
		).toBe('none');
	});

	test('does nothing for existing content without DNT expressions', () => {
		expect(
			decideDailyNoteAction({
				fileExists: true,
				content: 'No DNT here',
			}),
		).toBe('none');
	});
});
