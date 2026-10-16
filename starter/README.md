# Backlog

One Markdown file per work item, with front matter for sorting and filtering. In development,
the backlog board shows them as a board or a list (see `backlog.yml` for its settings).

## Front matter

| Field | Values |
|---|---|
| `title` | short name |
| `status` | `idea`, `ready` (discussed, ready to plan), `in-progress`, `parked` (decided, waiting), `done` |
| `priority` | `high`, `mid`, `low` |
| `type` | `build`, `spike` (time-boxed research that ends in a decision), `discuss` (needs a decision first) |
| `area` | free |
| `weight` | positive whole number: the work order, smallest first |
| `tags` | free list |
| `branches` | optional: the git branches whose work the item carries |
| `created` | date |
| `depends_on` | item file names (without `.md`) that should come first |
| `related` | item file names worth reading alongside |

To add an item, use the board's New item, or copy `_template.md` and add a row below.

## Items

| Item | Type | Priority | Status |
|---|---|---|---|
| [Set up the backlog](set-up-the-backlog.md) | build | high | in-progress |
