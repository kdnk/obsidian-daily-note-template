import { DailyNoteAction, SyncState } from './processing';
import { DailyNotesCoreSettings } from './dailyNotesSettings';

export interface DiagnosticNoticeInput {
	activePath: string | null;
	settings: DailyNotesCoreSettings | null;
	baseDate: string | null;
	contentLength: number | null;
	hasDntExpression: boolean;
	syncState: SyncState;
	action: DailyNoteAction;
}

export function formatDiagnosticNotice(input: DiagnosticNoticeInput): string {
	return [
		'DNT diagnosis',
		`path: ${input.activePath ?? 'NONE'}`,
		`daily settings: ${input.settings ? 'OK' : 'NOT FOUND'}`,
		`folder: ${input.settings?.folder ?? 'N/A'}`,
		`format: ${input.settings?.format ?? 'N/A'}`,
		`template: ${input.settings?.template ?? 'N/A'}`,
		`base date: ${input.baseDate ?? 'NO MATCH'}`,
		`content length: ${input.contentLength ?? 'N/A'}`,
		`has dnt: ${input.hasDntExpression ? 'yes' : 'no'}`,
		`sync: ${input.syncState}`,
		`action: ${input.action}`,
	].join('\n');
}
