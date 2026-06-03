# Daily Note Template

Daily Note Template expands DNT expressions in Obsidian daily notes.

It uses Obsidian's Daily notes settings to identify daily-note paths. Obsidian's Daily notes and Templates plugins remain responsible for creating notes and applying the normal note template.

- It expands `<% dnt... %>` expressions in existing daily notes.
- It does not create missing daily notes.
- It does not apply the full Daily notes template to empty notes.
- It never waits on Obsidian Sync before expanding visible DNT expressions.

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
