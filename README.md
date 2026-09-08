# Daily Note Template

Daily Note Template expands DNT expressions in Obsidian daily notes.

It uses Obsidian's Daily notes settings to identify daily-note paths. Obsidian's Daily notes and Templates plugins remain responsible for creating notes and applying the normal note template.

- It expands `<% dnt... %>` expressions in existing daily notes.
- It does not create missing daily notes.
- It does not apply the full Daily notes template to empty notes.
- It never waits on Obsidian Sync before expanding visible DNT expressions.

Template updates use Obsidian's atomic vault processing so edits saved during the initial read are preserved. Disabling the plugin cancels queued work and prevents pending reads from starting template writes.

Daily-note paths support `YYYY`, `MM` / `M`, `DD` / `D`, and English `ddd` / `dddd` weekday names. Formats can repeat date fields, such as `YYYY/MM/YYYY-MM-DD` for year/month folders. Repeated fields must agree; paths with conflicting fields or invalid dates are ignored.

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
<% dnt.format("YYYY/MM/DD ddd") %>
<% dnt.format("YYYY/MM/DD dddd") %>
```

## Development

```bash
npm install
npm test
npm run lint
npm run build
```
