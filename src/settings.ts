export interface DailyNoteTemplateSettings {
	emptyFileWaitMs: number;
	retryDelayMs: number;
	syncPollIntervalMs: number;
	maxRetries: number;
	createMissingAfterSync: boolean;
}

export const DEFAULT_SETTINGS: DailyNoteTemplateSettings = {
	emptyFileWaitMs: 1500,
	retryDelayMs: 750,
	syncPollIntervalMs: 2000,
	maxRetries: 3,
	createMissingAfterSync: true,
};
