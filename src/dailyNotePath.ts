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

export function getDateFromIsoDateFilename(path: string): string | null {
	if (!path.endsWith('.md')) {
		return null;
	}

	const filename = path.split('/').pop();
	if (!filename) {
		return null;
	}

	const basename = filename.slice(0, -3);
	try {
		parseDate(basename);
		return basename;
	} catch {
		return null;
	}
}

function normalizeFolder(folder: string): string {
	return folder.replace(/^\/+|\/+$/g, '');
}

function formatToRegExp(format: string): RegExp {
	const pattern = format.replace(
		/dddd|ddd|YYYY|MM|M|DD|D|[.*+?^${}()|[\]\\]/g,
		(token) => {
			switch (token) {
				case 'dddd':
					return '(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)';
				case 'ddd':
					return '(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)';
				case 'YYYY':
					return '(?<year>\\d{4})';
				case 'MM':
					return '(?<month>\\d{2})';
				case 'M':
					return '(?<month>\\d{1,2})';
				case 'DD':
					return '(?<day>\\d{2})';
				case 'D':
					return '(?<day>\\d{1,2})';
				default:
					return `\\${token}`;
			}
		},
	);
	return new RegExp(`^${pattern}$`);
}
