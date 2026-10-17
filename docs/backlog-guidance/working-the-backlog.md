# Working a backlog kept with open-backlog

This folder, `docs/backlog-guidance/`, holds text for the people and agents who work the backlog:
this guide, and any conventions of the project's own (how it triages, what done means, who owns
which area). Markdown only. Files that belong to items, such as a screenshot a user hands an agent
when asking for a work item, go in `docs/backlog-assets/` instead.

The backlog itself is `docs/backlog/`: one Markdown file per work item. Its `README.md` indexes the
items in tables, `backlog.yml` names the fields and the values they allow, and `_template.md` is
the body for new items. In development the project serves a board over the folder. The files are
the truth: the board shows what they say, follows your edits within seconds, and reports anything
that doesn't add up.

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

Where the project has the CLI (see below), `node bin/open-backlog.mjs new "<title>" docs/backlog
--items first,second,third` writes the file and its index row (steps 1 and 5) after checking every
slug; then fill in its text. Without it, write them by hand. The rest holds either way.

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
   is marked Epic, with a stack of cards and a progress bar (`is:epic` in the search finds it), and
   its sheet lists its items in work order with "Copy epic as prompt".

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

The backlog folder holds `.md` and `.yml` only. Screenshots, exports and other files that belong
to an item go in `docs/backlog-assets/`, linked from the item as
`[the screenshot](../backlog-assets/name.png)`. The board opens such links in the editor, and the
checks leave them alone. This guidance folder stays text.

## What doesn't belong in an item

The backlog is files in the repository, so an item is exactly as visible as the code: everyone who
can read the repository reads it, clones and forks carry it, and the history keeps it. In a public
repository that's everyone.

So an unfixed security finding, a credential, personal or customer data, a legal or HR matter, or
anything under embargo doesn't go into an item's text. Write the item as a pointer instead: it
names the work ("Fix the export authorisation check, see the advisory") and links to where the
details live, such as a GitHub security advisory, a private tracker, or a second backlog the
project keeps outside the repository. The project's backlog README says where; if it doesn't, ask
before writing, and keep the item a pointer meanwhile.

## The CLI

With Node 22 or later and the kit's `bin/open-backlog.mjs` (next to its `web/`; adjust the path to
where the project vendored the kit):

```sh
node bin/open-backlog.mjs check docs/backlog            # problems and suggestions; exit 1 on a problem
node bin/open-backlog.mjs next docs/backlog             # what can start now, in work order
node bin/open-backlog.mjs prompt <slug> docs/backlog    # the brief the board's "Copy as prompt" gives
node bin/open-backlog.mjs index docs/backlog --check    # does the managed index need regenerating?
node bin/open-backlog.mjs new "<title>" docs/backlog --field status=idea --field priority=mid
                                                        # a new item and its index row
```

`new` also takes `--weight <n>`, `--tags a,b`, `--items a,b,c` (the new item is an epic over those,
in work order) and `--epic <slug>` (the new item goes into that epic). It checks everything before
writing and, if anything is wrong, says why on stderr, exits 2 and writes nothing.

## What goes wrong, and what the board says

- A `type` or `kind` the list doesn't allow: "not one of …". Use a listed value or extend the list.
- No index row: "it's missing from README.md's index". A row that disagrees: "index says X, the
  item says Y". Both mean the status or the row was changed in one place only.
- `# Heading` not matching `title:`: "its H1 title disagrees with its front matter title".
- `items`, `depends_on` or `related` naming a title or a path: "names X, which isn't an item".
- An epic listed inside an epic: "epics can't contain epics". Flatten it instead.
- Finding things on the board: words in the search match titles, slugs, text, tags and field
  values. `#tag` keeps items with that tag, `field:value` (`status:ready`, `status:"in review"`)
  those with that value, and `is:epic` the epics. They combine with AND, and quotes keep a phrase,
  or text that looks like a filter, as text. The Epic filter shows one epic and its items.
