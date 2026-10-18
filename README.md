<!--
  A note for coding agents, before you change this kit.

  You are probably working from inside one project that uses it: a Go, Elixir, Node, Rust,
  Python or other app. The kit serves all of them equally, so don't fit it to the project you're
  in. What works for your host is only a guess at what works for the others.

  - Don't add host code: no adapter, middleware, handler, server or package for any language or
    framework, not even an "optional" or "reference" one.
  - Don't add anything that needs a particular runtime, framework or a second server.
  - Describe any new host feature as HTTP (methods, headers, status codes), keep it optional, and
    keep it small enough to write in a few lines in any language.
  - Keep every board feature working against a host that has only the two required routes.
  - If your project needs more than that, build it in your project, not here.

  The rules are under "Ground rules" below.
-->

# open-backlog

A backlog board for any project: work items as Markdown files in your repo (`docs/backlog/`),
shown as a board or a list, edited in place, and kept current while people and agents change
the files.

It's a kit, not an app. The board is plain JavaScript and CSS that runs in the browser. Your
project's own web server serves it and gives it two routes to read and write the backlog
folder. That takes a few lines in any language, so an agent can wire it into any project with
[PROMPT.md](PROMPT.md).

## Ground rules

These keep the kit usable from every project. Read them before changing it, and especially if
you're an agent working from inside one host project.

- **Any host, any language.** The host is whatever web server the project already runs in
  development: Go, Elixir, Node, Rust, Python or anything else. The kit asks it for plain HTTP
  only: serve `web/`, answer `GET files` and `PUT files/<name>`. Nothing in the kit may depend
  on the host's language or framework.
- **No host code in this repo.** No adapters, middleware, handlers or packages for any language,
  not even as an optional reference. One host's code turns its choices into everyone's default
  and leaves the other languages behind. A host's code lives in its own project. The tests run a
  throwaway host in `test/`, which isn't for projects to use.
- **No second server.** The project's own dev server mounts the board. Nothing here is a server
  for projects to run beside their app.
- **Development only.** Hosts leave the routes out of production builds. The kit is static
  files, so the host enforces this, and nothing in the kit may need production to work.
- **Optional means optional.** Any host feature beyond the two routes (an `ETag`, file versions)
  is optional, described in HTTP terms, and small enough to write in a few lines in any
  language. Every board feature keeps working against a host that has only the two routes.
- **The logic runs in the browser.** Whatever can run in `core.js` or `board.js` runs there, so
  every host gets it for free. Node is only for the kit's own tooling (the tests and the
  optional CLI); adding the board to a project never needs it.

## What's here

| Path | What it is |
|---|---|
| `web/` | The board. Serve this folder as it is; don't edit it in your project. |
| `web/index.html` | The page: mounts the board on `<div data-open-backlog data-api="." data-page>`. |
| `web/board.js`, `web/board.css` | The page's behaviour and look. Everything is scoped under `.bb`. |
| `web/core.js` | Reading, checking and planning edits to the backlog, and what the board shows for an address, with no page. |
| `web/vendor/` | [marked](https://github.com/markedjs/marked) 18.0.13 and [js-yaml](https://github.com/nodeca/js-yaml) 5.4.2, with their MIT licences. |
| `starter/` | A backlog for a project that has none: `backlog.yml`, a README index, a template, and an epic with two items. |
| `docs/backlog/` | The kit's own backlog, kept with the board it's built with: `npm run dev` serves it (see [Development checks](#development-checks)). |
| `docs/backlog-guidance/` | Text for people and agents working a backlog: `working-the-backlog.md`, which PROMPT.md installs in projects, and a project's own conventions. Markdown only. |
| `docs/backlog-assets/` | What isn't text: screenshots and other files that belong to items, linked from them. |
| `PROMPT.md` | Instructions for an agent adding the board to a project. |
| `CHANGELOG.md` | What changed at each tag, newest first, opening with what the update asks of a project. |
| `.claude/skills/open-backlog/` | A skill that gets a coding agent to read `docs/backlog-guidance/` when backlog work comes up, and holds the essentials. PROMPT.md installs it. |
| `test/` | Core, CLI and contract tests, with the throwaway host they run against: `npm test` (Node 22 or later). |
| `bin/open-backlog.mjs` | An optional command line for agents and CI (Node 22 or later): checks, work that can start, prompts and managed indexes. |
| `browser/` | Headless Chromium tests of the real board over throwaway backlogs. |
| `LICENSE` | MIT: use it, change it, ship it. |

## The two routes

The page fetches relative to `data-api`, which is `.` (the page's own folder) by default. So
when the page is served at `/dev/backlog/`, the routes are `/dev/backlog/files` and
`/dev/backlog/files/<name>`.

```
GET <mount>/files
  200 application/json
  { "files": { "<name>.md": "<text>", "backlog.yml": "<text>", … },
    "versions": { "<name>.md": "<version>", … }, // optional: see "Checked saves" below
    "dir": "docs/backlog",              // how the project names the folder (shown on the page)
    "path": "/abs/path/docs/backlog",   // optional: absolute, for "open in editor" links
    "writable": true }                  // false: the board shows the backlog but can't change it

PUT <mount>/files/<name>
  header  X-Open-Backlog: 1
  header  If-Match: "<version>"  or  If-None-Match: *   // only when GET gives versions
  body    the file's whole new text (UTF-8)
  204 on success; 412 when the If-Match or If-None-Match check fails;
  4xx/5xx with { "error": "…" } otherwise
```

- `files` holds every regular file directly in the folder whose name matches
  `^[A-Za-z0-9_][A-Za-z0-9._-]*\.(md|ya?ml)$` (`FILE_NAME` in `core.js`): the items,
  `backlog.yml`, the README and `_template.md`, with no hidden files and no subfolders.
- `PUT` writes only names matching that pattern, only in that folder, and only with the
  header. A page on another site can't send that header without the browser asking your
  server first, and your server never says yes. That's the board's protection against
  cross-site writes, so the route needs no CSRF token.
- Both routes answer `403` to a request whose `Host` header isn't a development host:
  `localhost`, `127.0.0.1`, `[::1]` or the dev host the project configures, with any port. The
  header alone doesn't cover DNS rebinding, where a page on another site points its own name at
  your machine: the browser then treats your server as that page's origin and sends the header
  without asking. The request still carries the page's name in `Host`, so one comparison refuses
  it. Vite, webpack-dev-server, Django and Rails check `Host` for the same reason. Neither check
  is authentication: a program running on the machine can still call the routes, as it can
  already read the files.
- An `ETag` on `GET` (answering `If-None-Match` with `304`) is optional. It makes the page's
  polling cost next to nothing.

The board polls `GET` every 2 seconds while its tab is visible, so edits made in an editor, by
an agent or by git show up by themselves. A host with its own way of knowing can dispatch
`window.dispatchEvent(new Event("open-backlog:refresh"))` to make it look sooner.

Only run it in development. It reads and writes files in the repo, which a server in
production must not do.

### Checked saves (optional)

The board plans each edit on the files it has just read. It queues edits, so a quick second
edit builds on the first, reads the files again after every save, and says which files were
saved if a save across several files stops partway.

Between that read and its PUT, an agent or an editor could change the same file. To keep the
board from writing over such a change, a host can give each file a version:

- `GET files` adds `"versions": { "<name>": "<version>" }`. A version is any string that
  changes whenever the file's text does. A hash of the file's bytes, such as SHA-256 in hex, is
  the simple choice.
- The board then sends `If-Match: "<version>"` with each PUT (quoted, the way HTTP writes
  entity tags), or `If-None-Match: *` for a file it's creating.
- Just before writing, the host compares. If the file's current version isn't the one sent, or
  the file exists despite `If-None-Match: *`, it answers `412` and changes nothing. The board
  then shows the conflict and the current files, and never retries on its own.
- If the host can serve two requests at once, a lock around the compare and the write stops two
  saves from passing the same check.

That's a few lines in any language. Without versions, the board reads the file again just
before each PUT and stops if it changed. That catches most edits made in between, but only the
host can catch all of them. Either way, a save that touches several files (an item and its
index row) isn't all-or-nothing. If a later write fails, the board names the files already
saved, and the stale index row shows up as a problem to fix.

## The backlog's files

Each item is `<slug>.md`: front matter, then Markdown. The slug, the file name without `.md`, is
how links, `depends_on`, `related`, `items` and the index name the item; its `id` is the short
handle people say and type (W-12). The board and `new` make the slug from the title ("Brand
palette" is `brand-palette`), but any name the folder accepts will do, so a project can name items
its own way (`api-07-export.md`, which `new --slug api-07-export` makes).

```markdown
---
title: Brand palette
id: 12
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

- `title`, `id`, `weight`, `created`, `tags`, `branches`, `depends_on`, `related` and `items`
  are the board's own fields. Every other key with a single value (`status`, `priority`, `type`, `area`
  or your own) is a **choice field**: a filter, a board grouping and a select in the item.
- `id` is a positive whole number that never changes, shown with the backlog's prefix: `W-12`,
  or `OB-12` with `prefix: OB` in backlog.yml. It leads the card, the list, the sheet's title, the
  index and a copied prompt's first line, and typing it in the search (`W-12`, `w12`) finds the
  item. A new item gets the highest ID in the folder plus one, done items included; there's no
  counter, so two branches can take the same number, which `check` reports. The kit reads the
  folder, not git, so deleting the highest-numbered item lets its number come back: keep done
  items. `node bin/open-backlog.mjs ids docs/backlog --write` numbers a backlog that has none.
- `weight` is the work order, smallest first. Ties go to priority, then title.
- `depends_on` makes an item wait until those items are done. "Can start" shows the open
  items in a startable status that wait on nothing. Missing, self-referencing or malformed
  dependencies exclude an item from this queue as well as producing diagnostics.
- `items` makes the item an epic: see [Epics](#epics).
- Files starting with `_` or `.` aren't items. `_template.md` is the body for new items, with
  `{{title}}` replaced.
- A new title doesn't need a new file name. To rename the file anyway, keep its `id`, `git mv` it,
  and change the old slug wherever it's used: other items' `depends_on`, `related` and `items`,
  Markdown links to it (`](old-slug.md)`) and its index row (or `index --write`). `check` then
  reports anything still naming the old slug.
- The folder holds only `.md` and `.yml`. Screenshots and other files an item needs go beside it,
  in `docs/backlog-assets/`, linked from the item as `[the screenshot](../backlog-assets/name.png)`:
  the board opens such links in your editor, and the checks leave them alone. Text about how the
  backlog is worked goes in `docs/backlog-guidance/` (see [Guidance for agents](#guidance-for-agents)).

### As visible as the repository

The backlog is files in the repository, so it's exactly as visible as the code: everyone who can
read the repository can read it, every clone and fork carries it, and once committed it stays in
the history. In a public repository that's the world. A private repository isn't private enough
for everything either: contractors, integrations and former collaborators read it, and it can be
made public later.

So don't write into an item what shouldn't travel with the code. Unfixed security findings are the
clearest case: an item that says where the hole is tells everyone before the fix lands. Credentials,
customer names, personal data, legal and HR matters, and anything under embargo are the others.
Three ways to keep them out, none of which changes the kit:

- **Point, don't describe.** The item names the work ("Fix the export authorisation check, see the
  advisory") and links to where the details live: a GitHub security advisory, a private tracker, a
  document only the right people can open. GitHub's draft security advisories exist for exactly
  this.
- **A second backlog outside the repository.** A folder `.gitignore` lists, or a private repository
  checked out inside the project (a submodule, or a sibling clone the host is pointed at), served by
  the same host at a second mount. The board takes any folder behind the two routes, so one project
  can run `/dev/backlog/` for everyday work and `/dev/backlog-private/` for the rest.
- **Encrypt the folder in the repository.** A tool such as git-crypt stores the files encrypted and
  decrypts them in the working tree, which is what the host reads, so the board works unchanged while
  the repository holds ciphertext. Every reader needs the key, CI included.

Write the project's own rule into its backlog README (the starter has a line to fill in) so people
and agents writing items know where such things go. The guide and the skill tell agents to check
it before writing anything of the kind. For the common cases, a good default:

- **Unfixed security findings**: a draft security advisory on the code host (GitHub's, or GitLab's
  confidential issues). The item points at it and gets the details once the fix ships.
- **Credentials**: the password or secrets manager the project already uses. No backlog holds a
  secret's value; an item may name which secret, never what it is.
- **Customer and personal data, legal, HR and embargoed matters**: wherever the people involved
  already keep them, such as a private tracker or a shared drive only they can open. A second
  backlog outside the repository suits a team that wants a board for them too.

An agent that finds no rule can propose these and ask; it doesn't decide for the project, and it
doesn't copy anything sensitive into an item while it waits.

### backlog.yml

Optional, and spelled `backlog.yml`: a `backlog.yaml` isn't read, and the board reports it as a
problem until it's renamed (or, beside a `backlog.yml`, merged into it and deleted). It names the
choice fields and their values in order, which statuses count as done,
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
Unannotated headings remain free prose; their meaning is not guessed. A table the board should
leave alone, such as an overview whose rows link items, goes under
`<!-- open-backlog:ignore -->`: it's neither checked nor rewritten, and its rows aren't index rows.

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

Optional, for agents and CI on machines that have Node 22 or later. The board doesn't need it,
and no dependencies need installing. A project vendors `bin/open-backlog.mjs` beside `web/` to
have it (see PROMPT.md):

```sh
node bin/open-backlog.mjs check docs/backlog --json
node bin/open-backlog.mjs next docs/backlog --json
node bin/open-backlog.mjs prompt item-slug docs/backlog
node bin/open-backlog.mjs index docs/backlog --check
node bin/open-backlog.mjs ids docs/backlog --write
node bin/open-backlog.mjs new "Export to CSV" docs/backlog --field status=idea --tags export
node bin/open-backlog.mjs new "Checkout v2" docs/backlog --items cart-rules,payment-retry
node bin/open-backlog.mjs new "Export to CSV" docs/backlog --slug api-07-export
```

The directory defaults to `docs/backlog`. `check` uses the same parser as the board and exits 1
for errors; informational notices do not fail it. `next` lists only startable work in work
order, and `prompt` prints the board's agent brief. Usage/filesystem failures exit 2. These
commands are read-only except an explicit `index --write` and `new`, which write a file only if it
hasn't changed since the command read it.

`new "<title>"` creates an item the way the board's New item does, through `planCreate`: its file
from `_template.md`, its index row or the regenerated managed region, and an epic's list. It takes
`--field name=value` for any choice field (once per field), `--weight <n>`, `--tags a,b`,
`--items a,b,c`, which makes the new item an epic over those items in work order, and
`--epic <slug>`, which adds it to an existing epic, and `--slug <name>`, which names the file
`<name>.md` instead of after the title, for a project with its own naming pattern. A requested name
is used exactly as given: one that's taken (in any case), ends in `.md`, isn't a name the folder
accepts, starts with `_` or is the README or index is refused, never suffixed. It validates the
whole command first: a bad value, a missing or nested member, a refused name, or `--items` with
`--epic` exits 2 with the reason on stderr and writes nothing. It prints the slug and each file written. Writing several files isn't a
transaction, so if a later write fails it names the files already written and exits 1.

### Guidance for agents

Agents in a project meet the backlog as files, not as the board, so the conventions have to be where
they look. Three places, each with one job:

- `docs/backlog-guidance/` holds the text: `working-the-backlog.md`, the guide to items, epics,
  statuses, the index, attachments and the checks, plus whatever conventions the project adds.
  Markdown only. PROMPT.md installs the guide with the board.
- `.claude/skills/open-backlog/SKILL.md` is a skill (the Agent Skills format: Markdown with a name
  and a description) that gets a coding agent to read that folder when backlog work comes up, and
  holds the essentials in case it can't.
- `docs/backlog-assets/` holds what isn't text: screenshots and other files a user hands an agent
  when asking for a work item, linked from the item.

A new backlog's own README (from `starter/`) carries the short version, for agents with none of it.

### What the board reports

A value `backlog.yml` doesn't allow, a strict field left empty, a weight that isn't a positive
whole number, a link to no item (in `depends_on`, `related` or the index) or to a file in the
folder that isn't there (in an item's text), a dependency loop, a file without front matter or a
title, a `backlog.yaml` (which isn't read), an index that disagrees with the items, and an epic
whose list or status doesn't add up (see [Epics](#epics)). These appear in a panel at the top and on each item, with suggestions
(things worth a look, not mistakes) after the problems: an unfinished prerequisite that comes
after its dependent in work order, `related` repeating `depends_on`, `type: epic` on an item
that lists no items, and an epic whose items are all done.

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
- An epic can start when one of its open items can. **Can start** and `next` leave out an epic
  whose open items are all under way, waiting on unfinished work or not in a startable status,
  whatever its own `depends_on` says. One with no open item left can start: its own acceptance
  remains.
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

- An epic's card sits in its status column like any item, marked **Epic** with a violet border
  and a stack of cards behind it, and a bar with a segment for each item, coloured by its status,
  then how many are done. Its list row and its sheet's title carry the same Epic mark.
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
coding agent working in the project. What to do comes first:

- if the epic itself waits on unfinished work, which work, and to ask before starting;
- setting the epic in progress now (or that it's in progress already), using the backlog's own
  statuses, and nothing about status when it names none;
- how to work: read the epic's file now and each item's file before starting it, since the files
  are current and the copy may not be; follow the work order unless an item says otherwise; keep
  each item's status current in its front matter and its index row; mark the epic done only when
  every item is done and its own acceptance holds; and stop to ask about any open question an
  item lists;
- its items in work order, each with its file, status, priority, weight, what it waits on
  (marking what's outside the epic), and the board's problems and suggestions; then what can
  start next, and what holds the epic up from outside.

Then what the agent may want to know: the epic's file, fields and progress, what it depends on,
unblocks and relates to, the board's problems and suggestions for it, and last its whole text,
which is where its goal and end-to-end acceptance live. It points to the items' files rather than
pasting them, so the brief stays short and the agent reads each file when it gets there. `epicPrompt` in `core.js` builds it, and `epicOrder`,
`epicProgress`, `epicsOf`, `planAddToEpic` and `planRemoveFromEpic` are there too.

Epics are ordinary item files, so they need nothing from the host.

## Using the board

- **Board or list**: group the board by any choice field; sort the list by any column, and click
  it again to turn it around. Items without a value stay last either way.
- **Filters**: search, each field, an epic, a tag, "Can start" and "Hide closed". The stats at
  the top are filters too. Everything you pick is in the address, so a view can be bookmarked.
- **Search**: an ID (`W-12`, `w12`) finds that item. Words match titles, slugs, text, tags and
  field values; every word has to match.
  Qualifiers filter, in the style of GitHub's issue search: `#tag`, `field:value` for any choice
  field (`status:ready`, `status:"in review"`, `area:none`) and `is:epic` for every epic,
  whatever its type. Quotes keep a phrase together, and make text that looks like a filter
  (`"#chore"`) plain text. Each filter in force shows as a chip by the search box, and its ×
  takes it out. `parseQuery` and `matchesQuery` in `core.js` do the work.
- **Edit**: change an item's weight and fields in its sheet, drag a card to another column, or
  add a **New item**. Each edit rewrites that line of front matter and the item's index row,
  nothing else.
- **Links**: links to other items open them on the board, links to other files open in your
  editor, and links to the web open in a new tab.
- **Copy as prompt**: the button in an item's sheet copies the item for a coding agent's
  session in the project. What to do comes first: a blocked item names what it waits on and asks
  for the go-ahead; then the status change (in progress now, done when finished, in the
  backlog's own statuses), and to read the item's file, which is current where the copy may not
  be, and ask about any open question it lists. Then its file, fields, what it depends on,
  unblocks and relates to, its epics, the board's problems and suggestions, and last its text,
  whose links are relative to the backlog folder. Paste it into the agent and add your own
  instructions. `itemPrompt` in `core.js` builds it. On an epic, the button
  copies the whole epic instead (see [Epics](#epics)).
- **Keys**: `/` search, `n` new item, `b` board, `l` list, `Shift E` epic filter, `j`/`k` next
  and previous item, `e` open in editor, `c` copy as prompt, `Esc` close, `?` all of them. The
  shortcuts dialog can turn the single-key ones off, per browser, for screen reader and speech
  input users; Esc, Tab and the buttons keep working. It also says which version the board is.
  In a host's own page (no `data-page` on the mount), the keys work only while focus is inside
  the board, and the board leaves the page's title alone.
- Light and dark follow the system. The theme button overrides it, per browser.

## Updating a project's copy

Projects keep a copy of the kit at a tagged version (see PROMPT.md). An update moves the whole copy
to one newer tag: no files from two tags, and no edits to them. [CHANGELOG.md](CHANGELOG.md) says
what changed at each tag, opening with what the update asks of the project, if anything. Read every
entry after the project's recorded version, up to the new tag, and do what each asks. The two
routes don't change within a major version.

With the new tag cloned somewhere outside the project
(`git clone --depth 1 --branch <tag> https://github.com/sanderjson/open-backlog`):

1. **Replace the kit's files.** Replace the project's copy of `web/` with the tag's, and
   `bin/open-backlog.mjs` if the project has the CLI. Set the project's `VERSION` file, its record
   of the tag it copied, to the new tag. `VERSION` in `web/core.js` is the kit's own: it arrives
   with the copy and is never edited by hand.
2. **Install or refresh the guidance and the skill.** Copy the tag's
   `docs/backlog-guidance/working-the-backlog.md` and `.claude/skills/open-backlog/SKILL.md` over
   the project's, creating them if the project's copy predates v0.5.0. Those two files are the
   kit's. Everything else stays as it is: the project's own conventions beside the guide, its other
   skills, the backlog, `backlog.yml`, `_template.md` and `docs/backlog-assets/`.
3. **Make sure git keeps the copied files.** A broad ignore rule such as `bin/` also matches
   `vendor/open-backlog/bin/`, and the CLI then works on this machine and is missing from every
   clone. `git check-ignore -v --no-index <path>…` over the copied files names any rule that
   matches them (`--no-index` checks files already tracked too). Anchor the rule to what it meant
   (`/bin/` for the project's own `bin/`) or add a narrow exception (`!vendor/open-backlog/bin/`).
   Then `git status` lists every copied file that changed. A file that works locally isn't
   evidence that it's in git: after committing, run the CLI's `--help` and `check` from a fresh
   clone or a `git worktree add`.
4. **Say where details that stay out go.** A backlog started before v0.5.0 has no line in its
   README saying where unfixed security findings, credentials and personal data go (see
   [As visible as the repository](#as-visible-as-the-repository)). Add one, beside the README's
   other notes on working the backlog, like the starter's "What stays out" line. Propose the
   project's answer and ask its owners to confirm; until they do, items stay pointers.
5. **Point agents at the backlog.** If the project's agent instructions (`CLAUDE.md`, `AGENTS.md`
   or the like) don't point at the backlog yet, add the lines PROMPT.md's step 4 describes. If the
   project has no such file, say so and offer the lines for a new `AGENTS.md`; don't create one
   unasked, and don't count its absence as a failed update.
6. **See it working.** Run `check`, and `index --check` if the README has a managed index.
   Restart the project's dev server if it was running before the copy or caches files, reload the
   board without the cache, and confirm that `?` shows the new version, as the CLI's `--help` does.
   Then repeat PROMPT.md's step 6: change a status in a sheet and see the file change, edit a file
   by hand and see the board follow. If the server can't be run, say so instead of reporting the
   update as checked.

What an update has asked so far:

- v0.2.0 made `items` the board's own key, so a choice field called `items` stops being one.
- v0.5.0 asks hosts to refuse requests whose `Host` isn't a development host (see
  [The two routes](#the-two-routes)). The board doesn't depend on it, so a host without the check
  keeps working, but add it: it closes the DNS-rebinding gap the header leaves. v0.5.0 also needs
  `data-page` on the mount element when the board is the whole page, as `web/index.html` has;
  without it the board behaves as it does inside a host's own page.

The board says which version it is in its shortcuts dialog (`?`), and the CLI in `--help`.

## Development checks

```sh
npm ci
npm test
npx playwright install chromium
npm run test:silent
```

The browser suite is headless and runs the board against throwaway backlogs and the test host,
both with file versions and with only the two routes. It covers:

- edits, dragging, creation and clipboard prompts;
- rapid changes and external edits;
- conflicts and partial saves;
- malformed links and render failures, which never show as the host being down;
- epic membership and creation;
- search, field filters and list sorting;
- keyboard navigation and focus behaviour.

The Node suite covers the view itself (filters, search, sorting, columns and the address) without
a browser.

`npm run dev` serves the kit's own backlog, `docs/backlog/`, on the test host at
http://127.0.0.1:3737/dev/backlog/ (`PORT=4000 npm run dev` for another port). It's for working on
the kit: projects mount the board in their own dev server (see [PROMPT.md](PROMPT.md)), and the
test host stays a throwaway. The backlog's index is a managed region, so
`node bin/open-backlog.mjs index docs/backlog --check` reports drift.

CI runs the Node suites on Node 22 and 24, and Chromium headlessly, and checks `starter/` and
`docs/backlog/` with the CLI. The kit still has no build step and no runtime npm dependency.

## Releasing

A release is a tag: projects pin it and copy `web/`. To cut one:

1. Set `VERSION` in `web/core.js` and the example tag in `PROMPT.md` to the new version, and add
   its entry at the top of [CHANGELOG.md](CHANGELOG.md), opening with what the update asks of a
   project when it asks anything. `test/version.test.js` fails until the three agree and `--help`
   prints it.
2. Run the checks above, merge to `main`, and tag the merge with an annotated tag whose message
   starts with the version (`git tag -a v0.5.0 -m "v0.5.0: …"`), then push the tag.
3. Publish a GitHub release for the tag, with its changelog entry as the notes. The changelog is
   the record, but only a release notifies the repository's watchers, which matters most when an
   update asks something of hosts:

   ```sh
   v=v0.5.0 prev=v0.4.0
   awk "/^## $v/{p=1;next} /^## $prev/{p=0} p" CHANGELOG.md | gh release create "$v" --title "$v" --notes-file -
   ```

   Releases start at v0.5.0. The tags before it have changelog entries but no releases, and get
   none: publishing them now would only send watchers old news.

Within a major version the two routes don't change. A minor version may add to what the kit asks
of a project (a key the board owns, a check hosts should add) and says so at the top of its
changelog entry; a patch version asks nothing.

## Licence

MIT, see [LICENSE](LICENSE). Contributions welcome.
