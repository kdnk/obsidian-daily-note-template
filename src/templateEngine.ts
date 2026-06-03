import { addToDate, formatDate, parseDate } from './dateMath';

export interface ExpandDntOptions {
	baseDate: string;
}

export function expandDntExpressions(
	content: string,
	options: ExpandDntOptions,
): string {
	const baseDate = parseDate(options.baseDate);

	return content.replace(/<%\s*dnt\.([A-Za-z]+)\(([^)]*)\)\s*%>/g, (match, name, rawArgs) => {
		const args = parseArgs(String(rawArgs));

		switch (String(name)) {
			case 'today':
				return formatDate(baseDate, 'YYYY-MM-DD');
			case 'yesterday':
				return formatDate(addToDate(baseDate, { days: -1 }), 'YYYY-MM-DD');
			case 'tomorrow':
				return formatDate(addToDate(baseDate, { days: 1 }), 'YYYY-MM-DD');
			case 'addDays':
				return formatDate(addToDate(baseDate, { days: numberArg(args) }), 'YYYY-MM-DD');
			case 'addWeeks':
				return formatDate(addToDate(baseDate, { weeks: numberArg(args) }), 'YYYY-MM-DD');
			case 'addMonths':
				return formatDate(addToDate(baseDate, { months: numberArg(args) }), 'YYYY-MM-DD');
			case 'addYears':
				return formatDate(addToDate(baseDate, { years: numberArg(args) }), 'YYYY-MM-DD');
			case 'format':
				return formatDate(baseDate, stringArg(args));
			default:
				return match;
		}
	});
}

export function containsDntExpression(content: string): boolean {
	return /<%\s*dnt\./.test(content);
}

function parseArgs(rawArgs: string): string[] {
	const trimmed = rawArgs.trim();
	if (!trimmed) {
		return [];
	}

	const stringMatch = /^["']([^"']+)["']$/.exec(trimmed);
	if (stringMatch?.[1]) {
		return [stringMatch[1]];
	}

	return trimmed.split(',').map((arg) => arg.trim());
}

function numberArg(args: string[]): number {
	const value = Number(args[0]);
	if (!Number.isFinite(value)) {
		throw new Error('DNT expression requires a numeric argument');
	}
	return value;
}

function stringArg(args: string[]): string {
	const value = args[0];
	if (!value) {
		throw new Error('DNT expression requires a string argument');
	}
	return value;
}
