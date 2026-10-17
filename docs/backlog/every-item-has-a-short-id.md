---
title: Every item has a short ID
status: idea
priority: mid
type: build
area: core
weight: 10
tags: [search, ids]
created: 2026-10-17
depends_on: [search-matches-tags]
related: [cli-creates-items-and-epics]
---

# Every item has a short ID

## Why
An item's only identifier is its slug, which is long and changes if the title is reworded and the
file renamed. People want a short handle to say, type and write in commits: "W456", the way Azure
DevOps has work item 456, Jira has PROJ-456 and GitHub has #456. Typing it in the board's search
should bring up that item and nothing else, as a tag filter does. The numbers in the index today
are weights, the work order, which changes as plans change, so they can't serve as IDs.

## Acceptance
- An item has `id: <n>` in its front matter, a positive whole number that never changes and is
  never reused. `id` joins the board's own keys (like `items` in v0.2.0), so it's no longer a
  choice field; the update notes say so.
- The board shows the ID as the backlog's prefix and the number, `W-456` by default, on cards, in
  the list (an ID column), in the sheet's title line and in copied prompts. `prefix:` in
  backlog.yml changes the letters (`prefix: OB` shows `OB-456`). The managed index gets an ID
  column.
- Search: `W-456`, `w456` and `W456` (any case, hyphen optional) show only that item, and the
  toolbar shows why, as the search item's structured filters do. A bare `456` stays text search.
- Creating an item (the board's New item, and the CLI's `new` through `planCreate`) gives it the
  highest ID in the folder plus one, done items included.
- `check` reports two items with the same ID as a problem (two branches can each create the next
  number), and an item without one as a suggestion. `node bin/open-backlog.mjs ids docs/backlog
  --write` gives every item without an ID the next free numbers, oldest `created` first, then by
  weight, and changes nothing else.
- The kit's own backlog and `starter/` have IDs; the guide and the skill describe them.
- Node tests cover parsing, the next ID, duplicates, the prefix, and the search forms above.

## Notes
Recommendation, for confirming before this is ready:

- **A number stored, a prefix shown.** Store only the number, so renaming the prefix rewrites no
  files. Azure DevOps works the same way: the ID is a plain integer and its `AB#456` form exists
  only to link it from GitHub.
- **Not `#456`.** In a GitHub repository, `#456` in a commit or a PR links to issue or PR 456, so
  an item ID written that way would link to the wrong thing. A letter prefix avoids it.
- **`W-` by default, uppercase.** W for work item. The hyphen follows Jira and Linear and keeps
  `W-1` readable; search accepts it without the hyphen and in any case. A project with several
  backlogs (see the README on second backlogs) gives each its own prefix.
- **Collisions are found, not prevented.** Without a server handing out numbers, two branches can
  both take the next one. `check` in CI catches it, and renumbering the newer item is one line.

It builds on the query parsing from [Search finds items by tag, field value and kind](search-matches-tags.md),
so it comes after that item. Since `planCreate` assigns the ID, the board and the CLI pick it up
together, whichever of this and the CLI item lands first.
