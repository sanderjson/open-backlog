# open-backlog

A backlog board for any project: work items as Markdown files in your repo (`docs/backlog/`),
shown as a board or a list, edited in place, and kept current while people and agents change
the files.

It's a kit, not an app. The board is plain JavaScript and CSS that runs in the browser. Your
project's own web server serves it and gives it two routes to read and write the backlog
folder. That takes a few lines in any language, so an agent can wire it into any project with
[PROMPT.md](PROMPT.md).

## What's here

| Path | What it is |
|---|---|
| `web/` | The board. Serve this folder as it is; don't edit it in your project. |
| `web/index.html` | The page: mounts the board on `<div data-open-backlog data-api=".">`. |
| `web/board.js`, `web/board.css` | The page's behaviour and look. Everything is scoped under `.bb`. |
| `web/core.js` | Reading, checking and planning edits to the backlog, with no page. |
| `web/vendor/` | [marked](https://github.com/markedjs/marked) 18.0.13 and [js-yaml](https://github.com/nodeca/js-yaml) 5.4.2, with their MIT licences. |
| `starter/` | A backlog for a project that has none: `backlog.yml`, a README index, a template and one item. |
| `PROMPT.md` | Instructions for an agent adding the board to a project. |
| `test/` | Tests for `core.js`: `node --test test/` (Node 22 or later). |
| `LICENSE` | MIT: use it, change it, ship it. |

## The two routes

The page fetches relative to `data-api`, which is `.` (the page's own folder) by default. So
when the page is served at `/dev/backlog/`, the routes are `/dev/backlog/files` and
`/dev/backlog/files/<name>`.

```
GET <mount>/files
  200 application/json
  { "files": { "<name>.md": "<text>", "backlog.yml": "<text>", … },
    "dir": "docs/backlog",              // how the project names the folder (shown on the page)
    "path": "/abs/path/docs/backlog",   // optional: absolute, for "open in editor" links
    "writable": true }                  // false: the board shows the backlog but can't change it

PUT <mount>/files/<name>
  header  X-Open-Backlog: 1
  body    the file's whole new text (UTF-8)
  204 on success; 4xx/5xx with { "error": "…" } otherwise
```

- `files` holds every regular file directly in the folder whose name matches
  `^[A-Za-z0-9_][A-Za-z0-9._-]*\.(md|ya?ml)$` (`FILE_NAME` in `core.js`): the items,
  `backlog.yml`, the README and `_template.md`, with no hidden files and no subfolders.
- `PUT` writes only names matching that pattern, only in that folder, and only with the
  header. A page on another site can't send that header without the browser asking your
  server first, and your server never says yes. That's the board's protection against
  cross-site writes, so the route needs no CSRF token.
- An `ETag` on `GET` (answering `If-None-Match` with `304`) is optional. It makes the page's
  polling cost next to nothing.

The board polls `GET` every 2 seconds while its tab is visible, so edits made in an editor, by
an agent or by git show up by themselves. A host with its own way of knowing can dispatch
`window.dispatchEvent(new Event("open-backlog:refresh"))` to make it look sooner.

Only run it in development. It reads and writes files in the repo, which a server in
production must not do.

## The backlog's files

Each item is `<slug>.md`: front matter, then Markdown. The file name is the item's id.

```markdown
---
title: Brand palette
status: idea
priority: high
type: build
area: design
weight: 2
tags: [brand]
branches: []
created: 2026-10-15
depends_on: [logo-audit]
related: []
---

# Brand palette

## Why
One palette drives every screen.
```

- `title`, `weight`, `created`, `tags`, `branches`, `depends_on` and `related` are the board's
  own fields. Every other key with a single value (`status`, `priority`, `type`, `area` or
  your own) is a **choice field**: a filter, a board grouping and a select in the item.
- `weight` is the work order, smallest first. Ties go to priority, then title.
- `depends_on` makes an item wait until those items are done. "Can start" shows the open
  items that wait on nothing.
- Files starting with `_` or `.` aren't items. `_template.md` is the body for new items, with
  `{{title}}` replaced.

### backlog.yml

Optional. It names the choice fields and their values in order, which statuses count as done,
closed, not started and under way, colours, the editor for file links, and the index file. See
[starter/backlog.yml](starter/backlog.yml) for every setting. Without it, the board takes the
usual fields (status, priority, type, area) and the values the items use, with well-known
statuses and priorities in their usual order.

### The README index

Any Markdown table in `README.md` (or `index:` in backlog.yml) whose rows start with a link to
an item, like `| [Brand palette](brand-palette.md) | build | high | idea |`. A column whose
header names a field (Status, Priority, Weight…) is checked against each item and rewritten
when the board changes that field. New items get a row in the table they fit best: with one
table per area, under their area.

### What the board reports

A value `backlog.yml` doesn't allow, a strict field left empty, a weight that isn't a positive
whole number, a link to no item, a dependency loop, a file without front matter or a title, and
an index that disagrees with the items. These appear in a panel at the top and on each item.

## Using the board

- **Board or list**: group the board by any choice field; sort the list by any column.
- **Filters**: search (titles, text, tags), each field, a tag, "Can start" and "Hide closed".
  The stats at the top are filters too. Everything you pick is in the address, so a view can
  be bookmarked.
- **Edit**: change an item's weight and fields in its sheet, drag a card to another column, or
  add a **New item**. Each edit rewrites that line of front matter and the item's index row,
  nothing else.
- **Links**: links to other items open them on the board, links to other files open in your
  editor, and links to the web open in a new tab.
- **Keys**: `/` search, `n` new item, `b` board, `l` list, `j`/`k` next and previous item, `e`
  open in editor, `Esc` close, `?` all of them.
- Light and dark follow the system. The theme button overrides it, per browser.

## Updating a project's copy

Projects keep a copy of `web/` at a tagged version (see PROMPT.md). To update, replace the
folder with the newer tag's `web/` and change the recorded version. The two routes don't change
within a major version.

## Licence

MIT, see [LICENSE](LICENSE). Contributions welcome.
