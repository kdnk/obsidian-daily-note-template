import { formatDate, parseDate } from './dateMath';

export interface DailyNoteSettings {
	folder: string;
	format: string;
}

export function getDateFromDailyNotePath(
	path: string,
	settings: DailyNoteSettings,
): string | null {
	const prefix = normalizeFolder(settings.folder);
	if (prefix && !path.startsWith(`${prefix}/`)) {
		return null;
	}

	const relativePath = prefix ? path.slice(prefix.length + 1) : path;
	if (!relativePath.endsWith('.md')) {
		return null;
	}

	const basename = relativePath.slice(0, -3);
	const regexp = formatToRegExp(settings.format);
	const match = regexp.exec(basename);
	if (!match?.groups) {
		return null;
	}

	const year = match.groups.year;
	const month = match.groups.month;
	const day = match.groups.day;
	if (!year || !month || !day) {
		return null;
	}

	const normalized = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	parseDate(normalized);
	return normalized;
}

export function getPathForDailyNote(
	date: string,
	settings: DailyNoteSettings,
): string {
	const formatted = formatDate(parseDate(date), settings.format);
	const folder = normalizeFolder(settings.folder);
	return folder ? `${folder}/${formatted}.md` : `${formatted}.md`;
}

function normalizeFolder(folder: string): string {
	return folder.replace(/^\/+|\/+$/g, '');
}

function formatToRegExp(format: string): RegExp {
	let pattern = escapeRegExp(format);
	pattern = pattern
		.replace(/YYYY/g, '(?<year>\\d{4})')
		.replace(/MM/g, '(?<month>\\d{2})')
		.replace(/M/g, '(?<month>\\d{1,2})')
		.replace(/DD/g, '(?<day>\\d{2})')
		.replace(/D/g, '(?<day>\\d{1,2})');

	return new RegExp(`^${pattern}$`);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
