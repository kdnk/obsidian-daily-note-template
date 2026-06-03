# Daily Note Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a sync-safe Daily Note Template plugin that expands `<% dnt... %>` expressions based on the target daily-note file path.

**Architecture:** Keep `src/main.ts` focused on lifecycle and event registration. Put date parsing/arithmetic, template expansion, Daily notes settings access, and sync-safe processing decisions in focused modules that are unit-testable without Obsidian.

**Tech Stack:** TypeScript, Obsidian API types, esbuild, ESLint, Vitest.

---

### Task 1: Test Harness

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `src/dateMath.test.ts`
- Create: `src/templateEngine.test.ts`
- Create: `src/dailyNotePath.test.ts`
- Create: `src/processing.test.ts`

- [ ] Add Vitest and a `test` npm script.
- [ ] Write failing tests for date arithmetic, path parsing, template expansion, and sync-safe processing decisions.
- [ ] Run targeted tests and confirm they fail for missing modules.

### Task 2: Date Math

**Files:**
- Create: `src/dateMath.ts`

- [ ] Implement UTC-safe local date parsing, formatting, and add days/weeks/months/years.
- [ ] Run `npm test -- src/dateMath.test.ts` and confirm it passes.

### Task 3: Template Expansion

**Files:**
- Create: `src/templateEngine.ts`

- [ ] Implement `<% dnt... %>` expression expansion using the target daily-note date.
- [ ] Support `today`, `yesterday`, `tomorrow`, `addDays`, `addWeeks`, `addMonths`, `addYears`, and `format`.
- [ ] Run `npm test -- src/templateEngine.test.ts` and confirm it passes.

### Task 4: Daily Note Path Parsing

**Files:**
- Create: `src/dailyNotePath.ts`

- [ ] Convert a Daily notes format like `YYYY-MM-DD` into a parser.
- [ ] Parse paths like `journals/2026-06-03.md`.
- [ ] Run `npm test -- src/dailyNotePath.test.ts` and confirm it passes.

### Task 5: Sync-Safe Processing Decisions

**Files:**
- Create: `src/processing.ts`

- [ ] Implement pure decision logic for existing empty notes, notes with DNT expressions, notes without DNT expressions, and missing notes.
- [ ] Require positive sync completion before creating a missing note.
- [ ] Run `npm test -- src/processing.test.ts` and confirm it passes.

### Task 6: Obsidian Integration

**Files:**
- Replace sample code in `src/main.ts`
- Create: `src/dailyNotesSettings.ts`
- Create: `src/syncStatus.ts`
- Modify: `src/settings.ts`
- Modify: `manifest.json`
- Modify: `README.md`

- [ ] Register startup and vault/workspace event handlers.
- [ ] Read Daily notes settings conservatively.
- [ ] Process only daily-note Markdown files.
- [ ] Avoid missing-note creation unless sync completion is positively detected.
- [ ] Remove sample plugin UI and commands.
- [ ] Run `npm run build`, `npm run lint`, and `npm test`.
