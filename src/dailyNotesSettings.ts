import { App, normalizePath } from 'obsidian';
import { DailyNoteSettings } from './dailyNotePath';

export interface DailyNotesCoreSettings extends DailyNoteSettings {
	template: string;
}

interface InternalPluginEntry {
	enabled?: boolean;
	options?: Partial<DailyNotesCoreSettings>;
	instance?: {
		options?: Partial<DailyNotesCoreSettings>;
	};
}

interface InternalPluginRegistry {
	getEnabledPluginById?: (id: string) => InternalPluginEntry | null | undefined;
	getPluginById?: (id: string) => InternalPluginEntry | null | undefined;
	plugins?: Record<string, InternalPluginEntry | undefined>;
}

interface AppWithInternalPlugins extends App {
	internalPlugins?: InternalPluginRegistry;
}

export function getDailyNotesCoreSettings(app: App): DailyNotesCoreSettings | null {
	const dailyNotes = getDailyNotesPlugin(app);
	if (!dailyNotes) {
		return null;
	}

	const options = dailyNotes.options ?? dailyNotes.instance?.options;
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

function getDailyNotesPlugin(app: App): InternalPluginEntry | null | undefined {
	const internalPlugins = (app as AppWithInternalPlugins).internalPlugins;
	try {
		const enabledPlugin = internalPlugins?.getEnabledPluginById?.('daily-notes');
		if (enabledPlugin) {
			return enabledPlugin;
		}

		const plugin = internalPlugins?.getPluginById?.('daily-notes');
		if (plugin?.enabled) {
			return plugin;
		}

		const registryPlugin = internalPlugins?.plugins?.['daily-notes'];
		return registryPlugin?.enabled ? registryPlugin : null;
	} catch {
		return null;
	}
}

function normalizeString(value: unknown): string | null {
	return typeof value === 'string' ? value.trim() : null;
}
