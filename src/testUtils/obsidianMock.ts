// Obsidian ships only type definitions to npm. Model the lifecycle and event
// boundaries used by the plugin while keeping all template processing real.
export class Plugin {
	private cleanups: (() => void)[] = [];
	constructor(public app: unknown) {}
	async loadData(): Promise<null> { return null; }
	register(cleanup: () => void): void { this.cleanups.push(cleanup); }
	registerEvent(ref: { off: () => void }): void { this.register(ref.off); }
	registerInterval(id: number): number {
		this.register(() => window.clearInterval(id));
		return id;
	}
	addCommand(): void {}
	unload(): void {
		this.cleanups.forEach((cleanup) => cleanup());
		this.cleanups = [];
	}
}

export class TAbstractFile {}
export class TFile extends TAbstractFile {
	extension = 'md';
	constructor(public path: string) { super(); }
}
export class Notice {}
export const normalizePath = (path: string): string => path.replace(/\/+/g, '/');

export function createFileEvents() {
	const listeners = new Map<string, Set<(file: TFile) => void>>();
	return {
		on(name: string, callback: (file: TFile) => void) {
			const callbacks = listeners.get(name) ?? new Set();
			callbacks.add(callback);
			listeners.set(name, callbacks);
			return { off: () => { callbacks.delete(callback); } };
		},
		emit(name: string, file: TFile) {
			listeners.get(name)?.forEach((callback) => callback(file));
		},
	};
}
