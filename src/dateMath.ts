export interface DateParts {
	year: number;
	month: number;
	day: number;
}

export interface DateDelta {
	days?: number;
	weeks?: number;
	months?: number;
	years?: number;
}

export function parseDate(value: string): DateParts {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) {
		throw new Error(`Invalid date: ${value}`);
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const maxDay = daysInMonth(year, month);

	if (month < 1 || month > 12 || day < 1 || day > maxDay) {
		throw new Error(`Invalid date: ${value}`);
	}

	return { year, month, day };
}

export function addToDate(date: DateParts, delta: DateDelta): DateParts {
	const years = delta.years ?? 0;
	const months = delta.months ?? 0;
	const weeks = delta.weeks ?? 0;
	const days = delta.days ?? 0;

	let year = date.year + years;
	let month = date.month + months;

	while (month > 12) {
		year += 1;
		month -= 12;
	}
	while (month < 1) {
		year -= 1;
		month += 12;
	}

	const day = Math.min(date.day, daysInMonth(year, month));
	const shifted = new Date(Date.UTC(year, month - 1, day + weeks * 7 + days));

	return {
		year: shifted.getUTCFullYear(),
		month: shifted.getUTCMonth() + 1,
		day: shifted.getUTCDate(),
	};
}

export function formatDate(date: DateParts, format: string): string {
	const replacements: Record<string, string> = {
		YYYY: String(date.year).padStart(4, '0'),
		YY: String(date.year).slice(-2),
		MM: String(date.month).padStart(2, '0'),
		M: String(date.month),
		DD: String(date.day).padStart(2, '0'),
		D: String(date.day),
	};

	return format.replace(/YYYY|YY|MM|M|DD|D/g, (token) => replacements[token] ?? token);
}

function daysInMonth(year: number, month: number): number {
	return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
