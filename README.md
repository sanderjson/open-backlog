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
| `starter/` | A backlog for a project that has none: `backlog.yml`, a README index, a template, and an epic with two items. |
| `PROMPT.md` | Instructions for an agent adding the board to a project. |
| `test/` | Core, CLI and host regression tests: `npm test` (Node 22 or later). |
| `bin/open-backlog.mjs` | Command-line checks, executable-work suggestions, prompts and managed indexes. |
| `host/files.mjs` | Optional Node reference adapter for checked, recoverable file saves. |
| `browser/` | Headless Chromium regressions over disposable files and the real board. |
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

### Checked batch saves

Existing GET/PUT integrations still work. A host can additionally return
`"capabilities": { "changes": true }` from GET, and accept:

```text
POST <mount>/files
  header X-Open-Backlog: 1
  application/json
  { "changes": [
    { "name": "item.md", "before": "<exact text read>", "after": "<new text>" },
    { "name": "README.md", "before": "<exact text read>", "after": "<new index>" }
  ] }
  204 on success; 409 if a precondition no longer matches
```

`before: null` means the file must not exist, including when creating an item. Validate every
name and precondition before changing anything. Serialize host reads/writes so its readers do
not see a partially applied batch; retain recovery intent before replacing files. A conflict
must never fall back to unconditional PUT or automatically retry stale text.

The board queues edits and reloads after success/failure. On older hosts it checks current text
before each PUT and reports which files saved if a later write fails. Those checks cannot
close a legacy host's read/write race; adopt the batch contract for host-side preconditions.

For Node hosts, mount one `createFilesHandler({ dir: "docs/backlog", mount: "/dev/backlog" })`
instance from `host/files.mjs` for the file routes. It returns false for unrelated routes, so
the project can serve the kit and its own pages normally. Keep the development-only guard in
the host. `maxBody` defaults to 1 MiB for the whole request, including before/after text;
`writable: false` disables writes.

The reference adapter journals ownership and changes in `.open-backlog-transaction/`, then
uses atomic per-file replacements. An interrupted save resumes on the next request. If an
external editor wrote a third value, it preserves that text and the journal, returns readable
files with `writable: false` and `saveError`, and requires manual reconciliation of the saved
before/after texts before removing the journal. Preserve a copy of the journal and current
files first. This is process-interruption recovery, not a power-loss durability guarantee.
External editors do not share the adapter's queue: they can still write in the small interval
between its final comparison and rename. Full exclusion requires all writers to cooperate.
New targets use exclusive creation. The adapter will not recover a journal owned by another
live process; a reused process ID may require manual recovery. Ignore `.open-backlog-*` in
the host project's Git configuration so temporary files/journals stay out of commits.

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

- `title`, `weight`, `created`, `tags`, `branches`, `depends_on`, `related` and `items` are the
  board's own fields. Every other key with a single value (`status`, `priority`, `type`, `area`
  or your own) is a **choice field**: a filter, a board grouping and a select in the item.
- `weight` is the work order, smallest first. Ties go to priority, then title.
- `depends_on` makes an item wait until those items are done. "Can start" shows the open
  items in a startable status that wait on nothing. Missing, self-referencing or malformed
  dependencies exclude an item from this queue as well as producing diagnostics.
- `items` makes the item an epic: see [Epics](#epics).
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

H1/front-matter title differences, stale index titles and duplicate rows are reported too.
To validate a hand-maintained table's area, place
`<!-- open-backlog:group area=authoring -->` above it (URL-encode a value containing spaces).
Unannotated headings remain free prose; their meaning is not guessed.

For a generated index, wrap just the existing item tables in these comments:

```markdown
<!-- open-backlog:index start -->
...the item tables...
<!-- open-backlog:index end -->
```

`node bin/open-backlog.mjs index docs/backlog --write` replaces only that region, groups by area,
orders by weight and includes the configured fields. Text outside it is preserved. `--check`
reports drift without writing. Board edits also regenerate a marked region, so area changes,
new items and weight changes keep its grouping/order current. Existing unmarked tables retain
their previous in-place behavior; generation refuses to overwrite them without adoption.

### Command-line use

Node 22 or later; no dependency installation is needed for these commands:

```sh
node bin/open-backlog.mjs check docs/backlog --json
node bin/open-backlog.mjs next docs/backlog --json
node bin/open-backlog.mjs prompt item-slug docs/backlog
node bin/open-backlog.mjs index docs/backlog --check
```

The directory defaults to `docs/backlog`. `check` uses the same parser as the board and exits 1
for errors; informational notices do not fail it. `next` lists only startable work in work
order, and `prompt` prints the board's agent brief. Usage/filesystem failures exit 2. These
commands are read-only except an explicit `index --write`, which uses checked saves.

### What the board reports

A value `backlog.yml` doesn't allow, a strict field left empty, a weight that isn't a positive
whole number, a link to no item, a dependency loop, a file without front matter or a title, an
index that disagrees with the items, and an epic whose list or status doesn't add up (see
[Epics](#epics)). These appear in a panel at the top and on each item, with suggestions (things
worth a look, not mistakes) after the problems.

## Epics

An epic is an item that lists other items: work that belongs together and is worked through as
one, often in one session with a coding agent. It needs no new kind of file:

```markdown
---
title: Checkout v2
status: in-progress
type: epic            # optional: a value you add to your own type list
weight: 1
items: [cart-rules, payment-retry, receipt-email, checkout-copy]
depends_on: []
---

# Checkout v2

## Why
One checkout for web and app.

## Acceptance
- A customer pays on the phone, a failed card retries, and the receipt arrives.
```

- **Any item with an `items` list is an epic.** Nothing in `backlog.yml` turns epics on, and
  `type` stays yours.
- `items` is ordered. Where dependencies don't decide the order, the list does.
- An item may be in more than one epic. An epic can't contain an epic: the board reports that
  as a problem rather than nesting them.
- Items keep their own `depends_on`. The epic groups them; it doesn't replace dependencies.
- People set an epic's status, and the board never changes it. It only points out a mismatch:
  an epic marked done while items in it are open is a problem, and every item done while the
  epic isn't gets a suggestion.
- The board also reports a slug in `items` that's no item, an epic listing itself, and an item
  listed twice.

**Work order.** An epic's items come in work order: each after the items it depends on in the
epic, and otherwise as early as its place in `items` allows. The first item and what it needs
come first, then the second, and so on. A dependency loop is reported as usual and doesn't stop
the order.

**On the board**

- An epic's card sits in its status column like any item, with a stack of cards behind it and a
  bar with a segment for each item, coloured by its status, then how many are done.
- An epic's sheet shows its progress, **Next up** (the first item that can start now), its items
  in work order with their status and what each waits on, and the unfinished items outside the
  epic that hold it up. It has **New item in this epic** and **Show on the board**.
- An item's sheet has an **Epics** row: each epic it's in opens the epic, its × takes the item
  out, and **Add to epic** adds it to the end of another epic's list. These rewrite only the
  epic's `items`, keeping the list's style (`[a, b]` or a `- a` line per item).
- The **Epic** filter (`Shift E`) shows only an epic's items, with the epic itself first. It's
  in the address as `?epic=<slug>`. The list view has an Epic column.
- Sorting and the index's tables treat an epic as an ordinary item: it's a row like any other.

**Copy epic as prompt.** On an epic, **Copy epic as prompt** (or `c`) copies one brief for a
coding agent working in the project. It holds:

- the epic's file and its whole text, which is where its goal and end-to-end acceptance live;
- its items in work order, each with its file, status, priority, weight, what it waits on
  (marking what's outside the epic) and any problems;
- what holds the epic up from outside;
- how to work: read each item's file before starting it, follow the work order unless an item
  says otherwise, keep each item's status current in its front matter and its index row, set
  the epic in progress when starting, mark it done only when every item is done and its own
  acceptance holds, and stop to ask about any open question an item lists.

It points to the items' files rather than pasting them, so the brief stays short and the agent
reads each file when it gets there. `epicPrompt` in `core.js` builds it, and `epicOrder`,
`epicProgress`, `epicsOf`, `planAddToEpic` and `planRemoveFromEpic` are there too.

Epics are ordinary item files, so they need nothing from the host.

## Using the board

- **Board or list**: group the board by any choice field; sort the list by any column.
- **Filters**: search (titles, text, tags), each field, an epic, a tag, "Can start" and "Hide
  closed". The stats at the top are filters too. Everything you pick is in the address, so a
  view can be bookmarked.
- **Edit**: change an item's weight and fields in its sheet, drag a card to another column, or
  add a **New item**. Each edit rewrites that line of front matter and the item's index row,
  nothing else.
- **Links**: links to other items open them on the board, links to other files open in your
  editor, and links to the web open in a new tab.
- **Copy as prompt**: the button in an item's sheet copies the item for a coding agent's
  session in the project: its file, fields, what it waits on, unblocks and relates to, its
  epics, any problems, its text, and how to keep its status current. Paste it into the agent
  and add your own instructions. `itemPrompt` in `core.js` builds it. On an epic, the button
  copies the whole epic instead (see [Epics](#epics)).
- **Keys**: `/` search, `n` new item, `b` board, `l` list, `Shift E` epic filter, `j`/`k` next
  and previous item, `e` open in editor, `c` copy as prompt, `Esc` close, `?` all of them.
- Light and dark follow the system. The theme button overrides it, per browser.

## Updating a project's copy

Projects keep a copy of `web/` at a tagged version (see PROMPT.md). To update, replace the
folder with the newer tag's `web/` and change the recorded version. The two routes don't change
within a major version. v0.2.0 (epics) needs nothing new from hosts. The only thing it can break
is a choice field called `items`, which is now the board's own.

## Development checks

```sh
npm ci
npm test
npx playwright install chromium
bun run test:silent
```

The browser suite is headless by default and uses temporary backlogs and localhost servers.
It covers edits, dragging, creation, clipboard prompts, rapid changes, external edits,
conflicts, partial legacy saves, epic membership/creation and keyboard/focus behavior. CI runs the Node suites on Node
22 and 24 and runs Chromium headlessly. The kit still has no build step or runtime npm dependency.

## Licence

MIT, see [LICENSE](LICENSE). Contributions welcome.
