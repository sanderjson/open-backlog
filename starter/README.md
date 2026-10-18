# Backlog

One Markdown file per work item, with front matter for sorting and filtering. In development,
the backlog board shows them as a board or a list (see `backlog.yml` for its settings).

## Front matter

| Field | Values |
|---|---|
| `title` | short name |
| `id` | the item's short number, shown as W-1: the highest in the folder plus one, never changed or reused |
| `status` | `idea`, `ready` (discussed, ready to plan), `in-progress`, `parked` (decided, waiting), `done` |
| `priority` | `high`, `mid`, `low` |
| `type` | `build`, `spike` (time-boxed research that ends in a decision), `discuss` (needs a decision first), `epic` (an item that lists others) |
| `area` | free |
| `weight` | positive whole number: the work order, smallest first |
| `tags` | free list |
| `branches` | optional: the git branches whose work the item carries |
| `created` | date |
| `depends_on` | item file names (without `.md`) that should come first |
| `related` | item file names worth reading alongside |
| `items` | epics only: the item file names it groups, in the order to work through them |

## Working the backlog

For people and agents alike. `../backlog-guidance/working-the-backlog.md`, installed with the
board, says the same at more length; the project's own conventions go in that folder too.

- **New item**: copy `_template.md` to `<slug>.md` (the slug comes from the title: "Brand
  palette" is `brand-palette`), fill the front matter with values from the table above, and add a
  row to the table below. Or use the board's New item, which does all of that.
- **Roll items up into an epic**: create one more item whose front matter has
  `items: [first-slug, second-slug]` in the order to work them. That list alone makes it an epic;
  `type: epic` only labels it. Its text says what the whole is for and how to tell it's finished.
  The items it lists stay as they are, and an epic can't list another epic.
- **Status**: set it in the item's front matter *and* in its row below when you start
  (`in-progress`) and when you finish (`done`). An epic's status is set by hand: `done` only when
  every item in it is done and its own acceptance holds.
- **Order**: `weight` is the work order, smallest first. `depends_on` names what must be finished
  first; `related` is for reading alongside.
- **Attachments**: this folder holds only `.md` and `.yml`. Screenshots and other files go in
  `../backlog-assets/`, linked from the item as `[name](../backlog-assets/name.png)`.
- **What stays out**: this folder is as visible as the repository, history included. Unfixed
  security findings, credentials, personal or customer data and legal matters don't go in an item.
  The item names the work and points to where the details live. *This project keeps them in:*
  *(fill in: a security advisory, a private tracker, a second backlog outside the repository).*
- **Check**: where the project has Node 22 or later and the kit's CLI,
  `node bin/open-backlog.mjs check docs/backlog` reports what doesn't add up. The board shows the
  same at the top.

## Items

| ID | Item | Type | Priority | Status |
|---|---|---|---|---|
| W-1 | [Adopt the backlog](adopt-the-backlog.md) | epic | high | in-progress |
| W-2 | [Set up the backlog](set-up-the-backlog.md) | build | high | in-progress |
| W-3 | [Move the project's ideas into the backlog](move-ideas-in.md) | build | mid | idea |
