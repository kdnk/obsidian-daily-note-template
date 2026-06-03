import { containsDntExpression } from './templateEngine';

export type SyncState = 'synced' | 'syncing' | 'unknown';

export type DailyNoteAction =
	| 'apply-template'
	| 'create-from-template'
	| 'expand-dnt'
	| 'none'
	| 'wait-for-sync';

export interface DailyNoteDecisionInput {
	fileExists: boolean;
	content: string | null;
	hasTemplate: boolean;
	syncState: SyncState;
}

export function decideDailyNoteAction(input: DailyNoteDecisionInput): DailyNoteAction {
	if (!input.fileExists) {
		return input.syncState === 'synced' && input.hasTemplate
			? 'create-from-template'
			: 'wait-for-sync';
	}

	const content = input.content ?? '';
	if (content.length === 0) {
		return input.syncState === 'synced' && input.hasTemplate
			? 'apply-template'
			: 'wait-for-sync';
	}

	if (containsDntExpression(content)) {
		return 'expand-dnt';
	}

	return 'none';
}
