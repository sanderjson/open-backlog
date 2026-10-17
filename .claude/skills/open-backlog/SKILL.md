---
name: open-backlog
description: Work a project's Markdown backlog kept with open-backlog (one item per file in docs/backlog, a README index, a board in development). Use when asked to add, change or find work items, roll items up into an epic, mark work started or done, say what to work on next, or when finishing work that a backlog item tracks. Covers the file format, epics, statuses, the index row, attachments and the CLI checks.
---

# Working a backlog kept with open-backlog

The backlog is a folder, usually `docs/backlog/`, with one Markdown file per work item. Its
`README.md` indexes the items in tables, `backlog.yml` names the fields and the values they allow,
and `_template.md` is the body for new items. In development the project serves a board over the
folder. The files are the truth: the board shows what they say and follows your edits within
seconds, and it reports anything that doesn't add up.

## Before changing anything

1. Read `backlog.yml`. It lists the choice fields (`status`, `priority`, `type`, `area`, or the
   project's own names such as `kind`) and, for a strict field, the only values allowed. It also
   says which statuses mean done, closed, not started and under way.
2. Read the README's front matter table and one existing item, and match their style.
3. If the project has Node 22 or later and the kit's CLI (`bin/open-backlog.mjs` next to the
   kit's `web/`, often under `vendor/open-backlog/`), run `check` before and after: it reports the
   same problems the board does.

## An item

`<slug>.md`. The slug is the file name and the item's id: the title in lower case with words
joined by `-`, so "Brand palette" is `brand-palette.md`. Front matter, a `# Title` line that
matches `title:`, then the body from `_template.md`, usually `## Why` and `## Acceptance`:

```markdown
---
title: Brand palette
status: idea
priority: high
type: build
area: design
weight: 12
tags: [brand]
created: 2026-10-17
depends_on: [logo-audit]
related: []
---

# Brand palette

## Why
One palette drives every screen.

## Acceptance
- Every status, priority and area has a tone in light and dark.
```

- `title`, `weight`, `created`, `tags`, `branches`, `depends_on`, `related` and `items` belong to
  the board. Every other key with a single value is a choice field.
- `weight` is the work order, smallest first. `depends_on` names items that must be finished
  first; `related` is for reading alongside. Both hold slugs, never titles or paths.
- A new item needs a row in the index too (see "The index").

## Rolling items up into an epic

When asked to group items into an epic, make the epic. An epic is an item whose front matter has
an `items` list. Nothing else makes one, and nothing in `backlog.yml` turns epics on.

1. Create `<epic-slug>.md` like any item, with `items: [first, second, third]` in the order the
   work should go, dependencies permitting. Its text says what the whole is for (`## Why`) and how
   to tell it's finished (`## Acceptance`), end to end. The items keep their own.
2. Set `type: epic` (or `kind: epic`) only if the project's list allows the value. If it doesn't
   and the project wants epics labelled, add `epic` to that list in `backlog.yml` and say so. The
   board shows the epic look either way: the `items` list is what counts.
3. Status: the project's not-started status, or its active one if an item in it is already under
   way. People set an epic's status; the board only points out a mismatch.
4. Leave the member items' files alone. Membership lives in the epic's list only. Don't list an
   epic in another epic, the epic itself, or a slug that isn't an item.
5. Add the epic's index row, run `check`, and tell the user the file name. On the board the epic
   shows a stack of cards and a progress bar, and its sheet lists its items in work order with
   "Copy epic as prompt".

To add an item to an epic later, append its slug to the epic's `items`. To take it out, remove it.

## Statuses

- Starting work: set the project's active status (`in-progress` in most backlogs) in the front
  matter **and** in the item's index row. Finishing: the done status, both places.
- Never set an epic to done while an item in it is open. Mark it done when every item is done or
  closed and the epic's own acceptance holds.
- Use the project's own values. A value a strict list doesn't have is reported as a problem.

## The index

The README's tables whose rows start with a link to an item are the index. A column headed by a
field name (Status, Priority, Weight) has to match the item.

- If the README has `<!-- open-backlog:index start -->` and `<!-- open-backlog:index end -->`
  markers, the tables between them are generated. After changing items run
  `node bin/open-backlog.mjs index docs/backlog --write`, which rewrites only that region, or edit
  the row by hand when Node isn't available.
- Otherwise edit the row in place, and add a new item's row to the table it belongs to (with one
  table per area, under its area): `| [Title](slug.md) | high | idea |`.

## Attachments

The folder holds `.md` and `.yml` only. Screenshots and other files go beside it, in
`docs/backlog-guidance/` unless the project uses another name, linked from the item as
`[the screenshot](../backlog-guidance/name.png)`. The board opens such links in the editor.

## The CLI

With Node 22 or later and the kit's `bin/open-backlog.mjs` (next to its `web/`; adjust the path to
where the project vendored the kit):

```sh
node bin/open-backlog.mjs check docs/backlog            # problems and suggestions; exit 1 on a problem
node bin/open-backlog.mjs next docs/backlog             # what can start now, in work order
node bin/open-backlog.mjs prompt <slug> docs/backlog    # the brief the board's "Copy as prompt" gives
node bin/open-backlog.mjs index docs/backlog --check    # does the managed index need regenerating?
```

## What goes wrong, and what the board says

- A `type` or `kind` the list doesn't allow: "not one of …". Use a listed value or extend the list.
- No index row: "it's missing from README.md's index". A row that disagrees: "index says X, the
  item says Y". Both mean the status or the row was changed in one place only.
- `# Heading` not matching `title:`: "its H1 title disagrees with its front matter title".
- `items`, `depends_on` or `related` naming a title or a path: "names X, which isn't an item".
- An epic listed inside an epic: "epics can't contain epics". Flatten it instead.
- The board's search covers titles, slugs, text and tags, not field values. To find an epic, use
  the Epic filter; to find items by a field, use that field's select.
