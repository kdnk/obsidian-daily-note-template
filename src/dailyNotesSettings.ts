import { App, normalizePath } from 'obsidian';
import { DailyNoteSettings } from './dailyNotePath';

export interface DailyNotesCoreSettings extends DailyNoteSettings {
	template: string;
}

interface InternalPluginEntry {
	enabled?: boolean;
	instance?: {
		options?: Partial<DailyNotesCoreSettings>;
	};
}

interface InternalPluginRegistry {
	plugins?: Record<string, InternalPluginEntry | undefined>;
}

interface AppWithInternalPlugins extends App {
	internalPlugins?: InternalPluginRegistry;
}

export function getDailyNotesCoreSettings(app: App): DailyNotesCoreSettings | null {
	const dailyNotes = (app as AppWithInternalPlugins).internalPlugins?.plugins?.['daily-notes'];
	if (!dailyNotes?.enabled) {
		return null;
	}

	const options = dailyNotes.instance?.options;
	const format = normalizeString(options?.format);
	if (!format) {
		return null;
	}

	return {
		folder: normalizePath(normalizeString(options?.folder) ?? ''),
		format,
		template: normalizePath(normalizeString(options?.template) ?? ''),
	};
}

function normalizeString(value: unknown): string | null {
	return typeof value === 'string' ? value.trim() : null;
}
