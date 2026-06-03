# Daily Note Template Design

## Goal

Build an Obsidian community plugin that expands DNT template expressions in daily notes, while respecting Obsidian's Daily notes and Templates core plugin responsibilities.

## Responsibility boundary

Obsidian Daily notes and Templates remain responsible for creating daily notes and applying standard template content. This plugin acts as a conservative finishing step:

- Expand only `<% dnt... %>` expressions left in daily-note content.
- Apply the configured Daily notes template only when a target daily note exists and remains empty after sync-safe waiting.
- Never insert a full template into a note that already has content.

## Daily note detection

The plugin reads Daily notes core plugin settings when available:

- `folder`
- `format`
- `template`

For example, `folder = journals` and `format = YYYY-MM-DD` make `journals/2026-06-03.md` a daily note for June 3, 2026.

If the settings cannot be read, the plugin does not create missing notes. It can still process an already-open file when its path matches the default daily-note shape.

## Sync safety

Creating a missing daily note is allowed only after sync completion is positively detected. If sync state is syncing, queued, connecting, unknown, or unreadable, the plugin must not create a missing file.

The safe path is:

1. Observe startup, file-open, create, and modify events.
2. If a target daily note is missing, wait for a positive synced or idle state.
3. Debounce after sync completion.
4. Re-check the vault path immediately before creating.
5. Create only if the file is still absent.

If a target file exists but is empty, the plugin waits and re-reads before applying the template. This protects against the case where another device created the note and its content has not arrived yet. Sync waiting is not counted as a normal DNT expansion retry; the plugin keeps polling while it is loaded until a positive synced state is observed.

## DNT expressions

Expressions use the target file path as the base date:

```md
<% dnt.today() %>
<% dnt.yesterday() %>
<% dnt.tomorrow() %>
<% dnt.addDays(7) %>
<% dnt.addWeeks(-1) %>
<% dnt.addMonths(1) %>
<% dnt.addYears(-1) %>
<% dnt.format("YYYY/MM/DD") %>
```

Expansion is idempotent because the expression text is replaced with a plain date string. If `<% dnt.` remains after a pass, the plugin may retry a small number of times; it must never re-apply the full template on a retry.

## Tests

The first implementation pass covers:

- Daily-note path parsing from Daily notes settings.
- Date arithmetic.
- DNT template expansion.
- Processing decisions for empty notes, existing notes with DNT expressions, existing notes without DNT expressions, and missing notes with or without positive sync completion.
