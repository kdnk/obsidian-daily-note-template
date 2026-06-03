import { Notice, Plugin, TAbstractFile, TFile, normalizePath } from 'obsidian';
import {
	getDateFromDailyNotePath,
	getDateFromIsoDateFilename,
} from './dailyNotePath';
import {
	getDailyNotesCoreSettings,
	getDailyNotesInternalShape,
} from './dailyNotesSettings';
import {
	DEFAULT_SETTINGS,
	DailyNoteTemplateSettings,
} from './settings';
import { expandDntExpressions } from './templateEngine';
import { decideDailyNoteAction } from './processing';
import { formatDiagnosticNotice } from './diagnostics';

export default class DailyNoteTemplatePlugin extends Plugin {
	settings!: DailyNoteTemplateSettings;
	private readonly queuedPaths = new Map<string, number>();
	private readonly processingPaths = new Set<string>();

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				if (file) {
					this.queueExistingFile(file.path, 0);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on('create', (file) => this.queueIfMarkdownFile(file, 0)),
		);

		this.registerEvent(
			this.app.vault.on('modify', (file) =>
				this.queueIfMarkdownFile(file, this.settings.retryDelayMs),
			),
		);

		this.app.workspace.onLayoutReady(() => {
			this.queueActiveDailyNote();
		});

		this.addCommand({
			id: 'process-active-daily-note',
			name: 'Process active template',
			callback: () => this.queueActiveDailyNote(),
		});

		this.addCommand({
			id: 'diagnose-active-template',
			name: 'Diagnose active template',
			callback: () => {
				void this.diagnoseActiveDailyNote();
			},
		});
	}

	private async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<DailyNoteTemplateSettings>,
		);
	}

	private queueIfMarkdownFile(file: TAbstractFile, delayMs: number): void {
		if (file instanceof TFile && file.extension === 'md') {
			this.queueExistingFile(file.path, delayMs);
		}
	}

	private queueActiveDailyNote(): void {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			this.queueExistingFile(activeFile.path, this.settings.retryDelayMs);
		}
	}

	private queueExistingFile(path: string, delayMs: number): void {
		const settings = getDailyNotesCoreSettings(this.app);
		if (!getBaseDate(path, settings)) {
			return;
		}

		this.queuePath(path, delayMs);
	}

	private queuePath(path: string, delayMs: number): void {
		const normalizedPath = normalizePath(path);
		const previous = this.queuedPaths.get(normalizedPath);
		if (previous !== undefined) {
			window.clearTimeout(previous);
		}

		const timeout = window.setTimeout(() => {
			this.queuedPaths.delete(normalizedPath);
			void this.processPath(normalizedPath, 0);
		}, delayMs);

		this.queuedPaths.set(normalizedPath, timeout);
	}

	private async processPath(path: string, attempt: number): Promise<void> {
		if (this.processingPaths.has(path)) {
			return;
		}

		this.processingPaths.add(path);
		try {
			await this.processPathOnce(path, attempt);
		} catch (error) {
			console.error('Daily Note Template failed to process', path, error);
			new Notice(`Daily Note Template failed: ${path}`);
		} finally {
			this.processingPaths.delete(path);
		}
	}

	private async processPathOnce(path: string, attempt: number): Promise<void> {
		const settings = getDailyNotesCoreSettings(this.app);
		const baseDate = getBaseDate(path, settings);
		if (!baseDate) {
			return;
		}

		await sleep(this.settings.retryDelayMs);

		const file = this.app.vault.getFileByPath(path);
		const content = file ? await this.app.vault.cachedRead(file) : null;
		const action = decideDailyNoteAction({
			fileExists: file !== null,
			content,
		});

		if (action === 'none') {
			return;
		}

		if (action === 'expand-dnt' && file && content !== null) {
			await this.writeExpandedContent(file, content, baseDate, attempt);
		}
	}

	private retry(path: string, attempt: number): void {
		if (attempt >= this.settings.maxRetries) {
			return;
		}

		const timeout = window.setTimeout(() => {
			void this.processPath(path, attempt + 1);
		}, this.settings.retryDelayMs);
		this.registerInterval(timeout);
	}

	private async writeExpandedContent(
		file: TFile,
		content: string,
		baseDate: string,
		attempt: number,
	): Promise<void> {
		const expanded = expandDntExpressions(content, { baseDate });
		if (expanded !== content) {
			await this.app.vault.modify(file, expanded);
		}

		if (expanded.includes('<% dnt.') && attempt < this.settings.maxRetries) {
			this.retry(file.path, attempt);
		}
	}

	private async diagnoseActiveDailyNote(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		const settings = getDailyNotesCoreSettings(this.app);
		const activePath = activeFile?.path ?? null;
		const baseDate = activePath ? getBaseDate(activePath, settings) : null;
		const content = activeFile ? await this.app.vault.cachedRead(activeFile) : null;
		const action = decideDailyNoteAction({
			fileExists: activeFile !== null,
			content,
		});

		new Notice(
			formatDiagnosticNotice({
				activePath,
				settings,
				baseDate,
				contentLength: content?.length ?? null,
				hasDntExpression: content?.includes('<% dnt.') ?? false,
				action,
				internalShape: getDailyNotesInternalShape(this.app),
			}),
			20000,
		);
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getBaseDate(
	path: string,
	settings: ReturnType<typeof getDailyNotesCoreSettings>,
): string | null {
	return settings
		? getDateFromDailyNotePath(path, settings)
		: getDateFromIsoDateFilename(path);
}
