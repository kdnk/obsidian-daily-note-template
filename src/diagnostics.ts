import { DailyNoteAction } from './processing';
import {
	DailyNotesCoreSettings,
	DailyNotesInternalShape,
} from './dailyNotesSettings';

export interface DiagnosticNoticeInput {
	activePath: string | null;
	settings: DailyNotesCoreSettings | null;
	baseDate: string | null;
	contentLength: number | null;
	hasDntExpression: boolean;
	action: DailyNoteAction;
	internalShape?: DailyNotesInternalShape;
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
		`action: ${input.action}`,
		...formatInternalShape(input.internalShape),
	].join('\n');
}

function formatInternalShape(shape: DailyNotesInternalShape | undefined): string[] {
	if (!shape) {
		return [];
	}

	return [
		`internal plugins: ${shape.hasInternalPlugins ? 'yes' : 'no'}`,
		`get enabled: ${shape.hasGetEnabledPluginById ? 'yes' : 'no'}`,
		`get plugin: ${shape.hasGetPluginById ? 'yes' : 'no'}`,
		`registry daily: ${shape.hasRegistryEntry ? 'yes' : 'no'}`,
		`enabled keys: ${joinKeys(shape.enabledPluginKeys)}`,
		`plugin keys: ${joinKeys(shape.pluginKeys)}`,
		`instance keys: ${joinKeys(shape.instanceKeys)}`,
		`options keys: ${joinKeys(shape.optionsKeys)}`,
	];
}

function joinKeys(keys: string[]): string {
	return keys.length > 0 ? keys.join(',') : 'none';
}
