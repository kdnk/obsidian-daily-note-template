# Daily Note Template

Daily Note Template expands DNT expressions in Obsidian daily notes.

It uses Obsidian's Daily notes settings to identify daily-note paths and templates. The plugin is intentionally conservative around Obsidian Sync:

- It expands `<% dnt... %>` expressions in existing daily notes.
- It applies the configured Daily notes template only to an existing empty daily note after sync-safe waiting.
- It creates a missing daily note only after Obsidian Sync is positively detected as complete.
- If Sync state cannot be read while Sync is enabled, it waits instead of creating a note.
- It never inserts the full template into a note that already has content.

## Expressions

Expressions are evaluated relative to the date parsed from the target daily-note path.

For `journals/2026-06-03.md`:

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

## Development

```bash
npm install
npm test
npm run lint
npm run build
```
