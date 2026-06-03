import { containsDntExpression } from './templateEngine';

export type DailyNoteAction = 'expand-dnt' | 'none';

export interface DailyNoteDecisionInput {
	fileExists: boolean;
	content: string | null;
}

export function decideDailyNoteAction(input: DailyNoteDecisionInput): DailyNoteAction {
	if (!input.fileExists) {
		return 'none';
	}

	const content = input.content ?? '';
	if (containsDntExpression(content)) {
		return 'expand-dnt';
	}

	return 'none';
}
