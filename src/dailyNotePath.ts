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
	const { regexp, fields } = formatToRegExp(settings.format);
	const match = regexp.exec(basename);
	if (!match) {
		return null;
	}

	const date: Partial<Record<DateField, number>> = {};
	for (const [index, field] of fields.entries()) {
		const value = Number(match[index + 1]);
		if (date[field] !== undefined && date[field] !== value) {
			return null;
		}
		date[field] = value;
	}
	const { year, month, day } = date;
	if (year === undefined || month === undefined || day === undefined) {
		return null;
	}

	const normalized = formatDate({ year, month, day }, 'YYYY-MM-DD');
	try {
		parseDate(normalized);
		return normalized;
	} catch {
		return null;
	}
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

type DateField = 'year' | 'month' | 'day';

function formatToRegExp(format: string): { regexp: RegExp; fields: DateField[] } {
	const fields: DateField[] = [];
	const capture = (field: DateField, pattern: string): string => {
		fields.push(field);
		return `(${pattern})`;
	};
	const pattern = format.replace(
		/dddd|ddd|YYYY|MM|M|DD|D|[.*+?^${}()|[\]\\]/g,
		(token) => {
			switch (token) {
				case 'dddd':
					return '(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)';
				case 'ddd':
					return '(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)';
				case 'YYYY':
					return capture('year', '\\d{4}');
				case 'MM':
					return capture('month', '\\d{2}');
				case 'M':
					return capture('month', '\\d{1,2}');
				case 'DD':
					return capture('day', '\\d{2}');
				case 'D':
					return capture('day', '\\d{1,2}');
				default:
					return `\\${token}`;
			}
		},
	);
	return { regexp: new RegExp(`^${pattern}$`), fields };
}
