import { normalizePath, Vault } from 'obsidian';
import { DailyNoteTemplateSettings } from './settings';
import { containsDntExpression, expandDntExpressions } from './templateEngine';

const SKIP_WRITE = new Error('No template update needed');

export class DailyNoteProcessor {
	private readonly queuedPaths = new Map<string, number>();
	private readonly processingPaths = new Set<string>();
	private readonly pendingAttempts = new Map<string, number>();
	private disposed = false;

	constructor(
		private readonly vault: Vault,
		private readonly settings: DailyNoteTemplateSettings,
		private readonly getBaseDate: (path: string) => string | null,
		private readonly onError: (path: string, error: unknown) => void,
	) {}

	queue(path: string, delayMs: number): void {
		if (this.disposed || !this.getBaseDate(path)) {
			return;
		}
		this.queuePath(normalizePath(path), delayMs, 0);
	}

	dispose(): void {
		this.disposed = true;
		for (const timeout of this.queuedPaths.values()) {
			window.clearTimeout(timeout);
		}
		this.queuedPaths.clear();
		this.pendingAttempts.clear();
	}

	private queuePath(path: string, delayMs: number, attempt: number): void {
		if (this.disposed) {
			return;
		}
		const previous = this.queuedPaths.get(path);
		if (previous !== undefined) {
			window.clearTimeout(previous);
		}
		// Keep the template-settling delay inside the cancellable queue.
		const timeout = window.setTimeout(() => {
			this.queuedPaths.delete(path);
			void this.processPath(path, attempt);
		}, delayMs + this.settings.retryDelayMs);
		this.queuedPaths.set(path, timeout);
	}

	private async processPath(path: string, attempt: number): Promise<void> {
		if (this.disposed) {
			return;
		}
		if (this.processingPaths.has(path)) {
			this.pendingAttempts.set(path, attempt);
			return;
		}
		this.processingPaths.add(path);
		try {
			await this.processPathOnce(path, attempt);
		} catch (error) {
			if (!this.disposed) {
				this.onError(path, error);
			}
		} finally {
			this.processingPaths.delete(path);
			const pending = this.pendingAttempts.get(path);
			this.pendingAttempts.delete(path);
			if (pending !== undefined) {
				this.queuePath(path, 0, pending);
			}
		}
	}

	private async processPathOnce(path: string, attempt: number): Promise<void> {
		const baseDate = this.getBaseDate(path);
		const file = this.vault.getFileByPath(path);
		if (!baseDate || !file) {
			return;
		}

		// The cache is only a filter. Never use its snapshot as the update's input.
		const snapshot = await this.vault.cachedRead(file);
		if (this.disposed || !containsDntExpression(snapshot)) {
			return;
		}

		let expanded: string | undefined;
		try {
			await this.vault.process(file, (content) => {
				// Unloading can happen while Vault.process is waiting to read.
				if (this.disposed) {
					throw SKIP_WRITE;
				}
				expanded = expandDntExpressions(content, { baseDate });
				if (expanded === content) {
					// Avoid no-op writes and their modify events, including retry loops.
					throw SKIP_WRITE;
				}
				return expanded;
			});
		} catch (error) {
			if (error !== SKIP_WRITE) {
				throw error;
			}
		}

		if (expanded && containsDntExpression(expanded) && attempt < this.settings.maxRetries) {
			this.queuePath(path, this.settings.retryDelayMs, attempt + 1);
		}
	}
}
