import { describe, expect, test } from 'vitest';
import { decideDailyNoteAction } from './processing';

describe('daily note processing decision', () => {
	test('expands DNT expressions in existing content without applying the full template', () => {
		expect(
			decideDailyNoteAction({
				fileExists: true,
				content: 'Today: <% dnt.today() %>',
				hasTemplate: true,
				syncState: 'synced',
			}),
		).toBe('expand-dnt');
	});

	test('applies the template only to an existing empty file after sync is complete', () => {
		expect(
			decideDailyNoteAction({
				fileExists: true,
				content: '',
				hasTemplate: true,
				syncState: 'synced',
			}),
		).toBe('apply-template');
	});

	test('does not create missing notes while sync is active or unknown', () => {
		expect(
			decideDailyNoteAction({
				fileExists: false,
				content: null,
				hasTemplate: true,
				syncState: 'syncing',
			}),
		).toBe('wait-for-sync');

		expect(
			decideDailyNoteAction({
				fileExists: false,
				content: null,
				hasTemplate: true,
				syncState: 'unknown',
			}),
		).toBe('wait-for-sync');
	});

	test('allows missing-note creation only after positive sync completion', () => {
		expect(
			decideDailyNoteAction({
				fileExists: false,
				content: null,
				hasTemplate: true,
				syncState: 'synced',
			}),
		).toBe('create-from-template');
	});
});
