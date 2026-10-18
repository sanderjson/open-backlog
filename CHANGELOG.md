# Changelog

What changed at each tag, newest first. A project pins a tag and updates by replacing its copy of
`web/` (and `bin/open-backlog.mjs`, if it has one), so each entry opens with what the update asks
of the project, when it asks anything. The README's
[Updating a project's copy](README.md#updating-a-projects-copy) has the short form, and
[Releasing](README.md#releasing) says how an entry gets here.

## Unreleased

This will be v0.6.0. Updating asks two things of a project, and offers one:

- **`id` is now the board's own key.** A choice field called `id` stops being one.
- **A board in a host's own page is as tall as its content** unless its element has a height; it
  no longer takes at least the window's height. Give the element a height for the board to fill
  it, with a short board's sideways scrollbar at the bottom of that space.
- **Number the items** with `node bin/open-backlog.mjs ids docs/backlog --write` (or add `id: n` by
  hand). Until a backlog has IDs nothing changes; once it has, new items are numbered and an item
  without one gets a suggestion.

Added:

- Every item can have a short ID, shown with the backlog's prefix (`W-12`; `prefix:` in
  backlog.yml changes the letters). It leads cards, the list (sortable), the sheet's title, the
  managed index and a copied prompt's first line, and the search finds an item by it. New items
  get the highest ID plus one; `check` reports a shared or malformed ID.
- `ids [directory] --check|--write` in the CLI numbers the items without an ID, oldest first.
  It handles empty ID fields and multiline titles, and fills existing ID cells in handwritten
  indexes as well as regenerating managed ones.

Changed:

- The toolbar has two rows with fixed roles in every project: search, its chips, then the count,
  Group and the view switch on the first; the filters, always in the same order, on the second,
  which wraps within itself. Clear keeps its place while hidden, so applying a filter moves
  nothing. The header keeps one order, and on narrow screens stacks as heading, stats, toolbar.
  Grouping options wrap when space is tight, keeping the count and view switch inside the board.
- With more columns than fit and only a few cards, the board's sideways scrollbar sits at the
  bottom of the window (or of the height a host gives the board), not under the cards; a list
  wider than the window does the same.

Fixed:

- A new item's `created` date is the local day where the board or the CLI runs. It was the UTC
  day, so an item made after local midnight ahead of UTC got yesterday's date.

## v0.5.0 - 2026-10-18

Updating from v0.4.0 asks two things of a project:

- **Refuse requests for another `Host`.** Both routes must answer 403 to a request whose `Host`
  header isn't a development host: localhost, 127.0.0.1, [::1] or the project's own dev host, with
  any port. The `X-Open-Backlog` header stops ordinary cross-site requests but not a page that
  rebinds its own DNS name to 127.0.0.1 after loading; such a page could read the backlog and
  overwrite its files while the dev server runs. The check is one comparison in the project's own
  server code, so copying `web/` doesn't add it. README's "The two routes" and PROMPT.md describe
  it, PROMPT.md's route tests cover it, and `test/server.mjs` shows it.
- **Add `data-page` to the mount element if the board is the whole page**, as `web/index.html` now
  does. Without it the board takes the page for a host's own: it leaves the page title alone and
  handles its keyboard shortcuts only while focus is inside the board, which is the new behaviour
  for a board mounted in a project's own layout.

Changed:

- Search: every word has to match, where before the whole query matched as one piece of text.
  Words also match choice-field values. Qualifiers filter, in the style of GitHub's issue search:
  `#tag`, `field:value` (`status:ready`, `status:"in review"`, `area:none`) and `is:epic`; quotes
  keep a phrase together or make a filter-looking word plain text. Each filter in force shows as a
  chip by the search box.
- Copied prompts open with the status change, and a blocked item asks for the go-ahead first.

Added:

- List columns sort both ways: a second click turns the sort around, and the direction is in the
  address.
- Epics are marked as epics on cards, in list rows and in the sheet's title.
- `new "<title>"` in the CLI creates an item, an epic over existing items (`--items a,b,c`) or an
  item inside an epic (`--epic <slug>`), with `--field name=value`, `--weight` and `--tags`. It
  validates the whole plan first and writes the file and the index row together, or nothing.
  `planCreate` in `core.js` does the same for the board and any other caller.
- A switch in the shortcuts dialog turns single-key shortcuts off, remembered per browser.
- The board shows its version in the shortcuts dialog and the CLI in `--help`; `VERSION` in
  `web/core.js` is the source. This changelog.
- The kit's own backlog in `docs/backlog/`, served by `npm run dev`; guidance for people and
  agents in `docs/backlog-guidance/working-the-backlog.md` and a skill in
  `.claude/skills/open-backlog/`, both of which PROMPT.md installs in a project.

Fixed:

- A malformed link in an item's text, or an error while rendering a sheet, no longer breaks the
  sheet or reports the host as down, and the sheet still closes.
- The board's view logic (filters, search, sorting, columns and the address) lives in `core.js`
  and has Node tests; apart from the search changes above, it behaves as before.

## v0.4.0 - 2026-10-16

Updating from v0.3.0 asks nothing of a project.

- An epic can start only when one of its open items can, whatever its own `depends_on` says, so
  "Can start" and `next` leave out an epic whose items are all under way, waiting or not in a
  startable status. An epic with no open item left can start: its own acceptance remains.
- A new problem: a link in an item's text to a `.md` or `.yml` file in the folder that isn't there.
  New suggestions: an unfinished prerequisite that comes after its dependent in work order,
  `related` repeating `depends_on`, and `type: epic` on an item that lists no items.
- `<!-- open-backlog:ignore -->` above a table keeps it out of the index, so an overview that links
  items is neither checked nor rewritten.

## v0.3.0 - 2026-10-16

Updating from v0.2.0 asks nothing of a project; file versions are optional.

- Checked saves over the same two routes: a host may add `versions` to `GET files`, the board then
  sends each PUT with `If-Match` (or `If-None-Match: *` for a new file), and the host answers 412
  when the file changed underneath. Without versions the board reads each file again before
  writing it. Either way it queues edits, refreshes after every save and conflict, and says which
  files were saved when a save across several files stops partway.
- The CLI, `bin/open-backlog.mjs`: `check`, `next`, `prompt <slug>` and `index --check|--write`,
  on the same `core.js` the board uses.
- Managed index regions between `<!-- open-backlog:index start -->` and `end`, regenerated by the
  board and the CLI while the prose around them stays.
- New diagnostics: missing and self-referencing prerequisites, an item's `# Title` against its
  front matter and its index row, duplicate index rows, and explicit area groups.
- The board keeps focus and a half-typed value when the backlog changes underneath it.
- README's ground rules, and CI on Node 22 and 24 with headless Chromium.

## v0.2.0 - 2026-10-16

Updating from v0.1.1: `items` is now a key the board owns, so a choice field called `items`
stops being one. Hosts need nothing new.

- Epics: an item whose front matter lists other items under `items` is one. The board shows
  progress, work order and the next item that can start, and checks membership: a member that's
  no item, an epic listing itself or another epic, a member listed twice, a done epic with open
  members.
- Copy as prompt: a button in the sheet, and `c`, copy the item for a coding agent's session in
  the project, with its file, fields, relations, problems and text. On an epic, the button copies
  the whole epic in work order.
- Hosts may send `_template.md`, and the board uses it for new items.

## v0.1.1 - 2026-10-16

- MIT licence, and PROMPT.md vendors it with the kit.

## v0.1.0 - 2026-10-16

- First release: the board in `web/`, over two routes a project's own dev server serves;
  `starter/` for a project with no backlog yet; PROMPT.md for the agent that adds it to a project.
