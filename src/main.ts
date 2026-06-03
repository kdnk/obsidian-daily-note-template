import { Notice, Plugin, TAbstractFile, TFile, normalizePath } from 'obsidian';
import { getDateFromDailyNotePath, getPathForDailyNote } from './dailyNotePath';
import { getDailyNotesCoreSettings } from './dailyNotesSettings';
import {
	DEFAULT_SETTINGS,
	DailyNoteTemplateSettings,
} from './settings';
import { getSyncState, onSyncComplete } from './syncStatus';
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
			this.queueTodayDailyNote();
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

	private queueTodayDailyNote(): void {
		const settings = getDailyNotesCoreSettings(this.app);
		if (!settings || !this.settings.createMissingAfterSync) {
			return;
		}

		const today = window.moment().format('YYYY-MM-DD');
		const path = getPathForDailyNote(today, settings);
		this.queuePath(path, this.settings.retryDelayMs);
	}

	private queueExistingFile(path: string, delayMs: number): void {
		const settings = getDailyNotesCoreSettings(this.app);
		if (!settings || !getDateFromDailyNotePath(path, settings)) {
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
		if (!settings) {
			return;
		}

		const baseDate = getDateFromDailyNotePath(path, settings);
		if (!baseDate) {
			return;
		}

		await sleep(attempt === 0 ? this.settings.emptyFileWaitMs : this.settings.retryDelayMs);

		const file = this.app.vault.getFileByPath(path);
		const content = file ? await this.app.vault.cachedRead(file) : null;
		const action = decideDailyNoteAction({
			fileExists: file !== null,
			content,
			hasTemplate: settings.template.length > 0,
			syncState: getSyncState(this.app),
		});

		if (action === 'wait-for-sync') {
			this.waitForSync(path);
			return;
		}

		if (action === 'none') {
			return;
		}

		if (action === 'expand-dnt' && file && content !== null) {
			await this.writeExpandedContent(file, content, baseDate, attempt);
			return;
		}

		if (action === 'apply-template' && file) {
			const template = await this.readTemplate(settings.template);
			if (template === null) {
				return;
			}
			await this.writeExpandedContent(file, template, baseDate, attempt);
			return;
		}

		if (action === 'create-from-template') {
			await this.createFromTemplate(path, settings.template, baseDate);
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

	private waitForSync(path: string): void {
		const syncEvent = onSyncComplete(this.app, () => {
			this.queuePath(path, this.settings.retryDelayMs);
		});
		if (syncEvent) {
			this.registerEvent(syncEvent);
		}

		const timeout = window.setTimeout(() => {
			void this.processPath(path, 0);
		}, this.settings.syncPollIntervalMs);
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

	private async createFromTemplate(
		path: string,
		templatePath: string,
		baseDate: string,
	): Promise<void> {
		if (getSyncState(this.app) !== 'synced') {
			this.waitForSync(path);
			return;
		}

		if (this.app.vault.getAbstractFileByPath(path)) {
			this.queuePath(path, this.settings.retryDelayMs);
			return;
		}

		const template = await this.readTemplate(templatePath);
		if (template === null) {
			return;
		}

		await this.ensureParentFolder(path);

		if (this.app.vault.getAbstractFileByPath(path)) {
			this.queuePath(path, this.settings.retryDelayMs);
			return;
		}

		await this.app.vault.create(
			path,
			expandDntExpressions(template, { baseDate }),
		);
	}

	private async diagnoseActiveDailyNote(): Promise<void> {
		const activeFile = this.app.workspace.getActiveFile();
		const settings = getDailyNotesCoreSettings(this.app);
		const activePath = activeFile?.path ?? null;
		const baseDate =
			activePath && settings
				? getDateFromDailyNotePath(activePath, settings)
				: null;
		const content = activeFile ? await this.app.vault.cachedRead(activeFile) : null;
		const syncState = getSyncState(this.app);
		const action = decideDailyNoteAction({
			fileExists: activeFile !== null,
			content,
			hasTemplate: (settings?.template.length ?? 0) > 0,
			syncState,
		});

		new Notice(
			formatDiagnosticNotice({
				activePath,
				settings,
				baseDate,
				contentLength: content?.length ?? null,
				hasDntExpression: content?.includes('<% dnt.') ?? false,
				syncState,
				action,
			}),
			20000,
		);
	}

	private async readTemplate(path: string): Promise<string | null> {
		const normalizedPath = normalizePath(path);
		const file =
			this.app.vault.getFileByPath(normalizedPath) ??
			this.app.vault.getFileByPath(`${normalizedPath}.md`);
		if (!file) {
			return null;
		}

		return this.app.vault.cachedRead(file);
	}

	private async ensureParentFolder(path: string): Promise<void> {
		const parts = path.split('/');
		parts.pop();

		let current = '';
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getFolderByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}
