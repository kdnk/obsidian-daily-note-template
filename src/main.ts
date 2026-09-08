import { Notice, Plugin, TAbstractFile, TFile } from 'obsidian';
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
import { DailyNoteProcessor } from './dailyNoteProcessor';
import { decideDailyNoteAction } from './processing';
import { formatDiagnosticNotice } from './diagnostics';

export default class DailyNoteTemplatePlugin extends Plugin {
	settings!: DailyNoteTemplateSettings;
	private processor: DailyNoteProcessor | undefined;
	private unloaded = false;

	async onload(): Promise<void> {
		this.register(() => {
			this.unloaded = true;
			this.processor?.dispose();
		});
		await this.loadSettings();
		if (this.unloaded) {
			return;
		}
		this.processor = new DailyNoteProcessor(
			this.app.vault,
			this.settings,
			(path) => getBaseDate(path, getDailyNotesCoreSettings(this.app)),
			(path, error) => {
				console.error('Daily Note Template failed to process', path, error);
				new Notice(`Daily Note Template failed: ${path}`);
			},
		);

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
		this.processor?.queue(path, delayMs);
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

function getBaseDate(
	path: string,
	settings: ReturnType<typeof getDailyNotesCoreSettings>,
): string | null {
	return settings
		? getDateFromDailyNotePath(path, settings)
		: getDateFromIsoDateFilename(path);
}
