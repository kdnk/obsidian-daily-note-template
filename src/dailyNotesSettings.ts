import { App, normalizePath } from 'obsidian';
import { DailyNoteSettings } from './dailyNotePath';

const DEFAULT_DAILY_NOTE_FORMAT = 'YYYY-MM-DD';

export interface DailyNotesCoreSettings extends DailyNoteSettings {
	template: string;
}

export interface DailyNotesInternalShape {
	hasInternalPlugins: boolean;
	hasGetEnabledPluginById: boolean;
	hasGetPluginById: boolean;
	hasRegistryEntry: boolean;
	enabledPluginKeys: string[];
	pluginKeys: string[];
	instanceKeys: string[];
	optionsKeys: string[];
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

	const options = {
		...(dailyNotes.instance?.options ?? {}),
		...(dailyNotes.options ?? {}),
	};
	const format = normalizeString(options.format) ?? DEFAULT_DAILY_NOTE_FORMAT;

	return {
		folder: normalizePath(normalizeString(options?.folder) ?? ''),
		format,
		template: normalizePath(normalizeString(options?.template) ?? ''),
	};
}

export function getDailyNotesInternalShape(app: App): DailyNotesInternalShape {
	const internalPlugins = (app as AppWithInternalPlugins).internalPlugins;
	const enabledPlugin = safeGetPlugin(
		internalPlugins?.getEnabledPluginById,
		'daily-notes',
	);
	const plugin = safeGetPlugin(internalPlugins?.getPluginById, 'daily-notes');
	const registryPlugin = internalPlugins?.plugins?.['daily-notes'];
	const entry = enabledPlugin ?? plugin ?? registryPlugin;

	return {
		hasInternalPlugins: Boolean(internalPlugins),
		hasGetEnabledPluginById: typeof internalPlugins?.getEnabledPluginById === 'function',
		hasGetPluginById: typeof internalPlugins?.getPluginById === 'function',
		hasRegistryEntry: Boolean(registryPlugin),
		enabledPluginKeys: objectKeys(enabledPlugin),
		pluginKeys: objectKeys(plugin),
		instanceKeys: objectKeys(entry?.instance),
		optionsKeys: objectKeys(entry?.options ?? entry?.instance?.options),
	};
}

function getDailyNotesPlugin(app: App): InternalPluginEntry | null | undefined {
	const internalPlugins = (app as AppWithInternalPlugins).internalPlugins;
	try {
		const enabledPlugin = safeGetPlugin(
			internalPlugins?.getEnabledPluginById,
			'daily-notes',
		);
		if (enabledPlugin) {
			return enabledPlugin;
		}

		const plugin = safeGetPlugin(internalPlugins?.getPluginById, 'daily-notes');
		if (plugin?.enabled) {
			return plugin;
		}

		const registryPlugin = internalPlugins?.plugins?.['daily-notes'];
		return registryPlugin?.enabled ? registryPlugin : null;
	} catch {
		return null;
	}
}

function safeGetPlugin(
	getPlugin: ((id: string) => InternalPluginEntry | null | undefined) | undefined,
	id: string,
): InternalPluginEntry | null | undefined {
	try {
		return getPlugin?.(id);
	} catch {
		return null;
	}
}

function objectKeys(value: unknown): string[] {
	if (!value || typeof value !== 'object') {
		return [];
	}
	return Object.keys(value).sort();
}

function normalizeString(value: unknown): string | null {
	return typeof value === 'string' ? value.trim() : null;
}
