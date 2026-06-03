export interface DailyNoteTemplateSettings {
	retryDelayMs: number;
	maxRetries: number;
}

export const DEFAULT_SETTINGS: DailyNoteTemplateSettings = {
	retryDelayMs: 750,
	maxRetries: 3,
};
