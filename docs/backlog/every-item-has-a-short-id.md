---
title: Every item has a short ID
id: 11
status: done
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
- An item has `id: <n>` in its front matter, a positive whole number that never changes. `id`
  joins the board's own keys (like `items` in v0.2.0), so it's no longer a choice field. That makes
  this v0.6.0, with a CHANGELOG note that a project's own `id` field becomes the board's.
- The ID comes first wherever it's shown: as the backlog's prefix and the number, `W-456` by
  default, it's the first column of the list and of the managed index, leads the card's top line
  and the sheet's title line, and opens a copied prompt's first line (`Work on this item from the
  backlog: W-456 Title`), since that line is what ends up in commit messages. `prefix:` in
  backlog.yml changes the letters (`prefix: OB` shows `OB-456`).
- Search: `W-456`, `w456` and `W456` (any case, hyphen optional) show only that item, and the
  toolbar shows it as a chip, like the other qualifiers. A bare `456` stays text search.
- Creating an item (the board's New item, and the CLI's `new` through `planCreate`) gives it the
  highest ID in the folder plus one, done and parked items included, in a backlog that numbers its
  items or has none yet. One that doesn't number yet starts with `ids --write`, not with whichever
  item happens to be made next. Nothing else keeps a counter: there's none in backlog.yml.
- `check` reports two items with the same ID, or one that isn't a positive whole number, as a
  problem, and, once the backlog has IDs, an item without one as a suggestion (a backlog that
  doesn't number its items isn't told about each of them). `node bin/open-backlog.mjs ids docs/backlog --write` gives every item without an ID
  the next free numbers, oldest `created` first, then by weight, and changes nothing else.
- The guide says what "never reused" rests on: the kit reads the folder, not git history, so
  deleting the highest-numbered item frees its number for the next one. Keeping done and parked
  items, as the guide already asks, keeps every number taken.
- The kit's own backlog and `starter/` are numbered before the v0.6.0 tag; the guide, the skill
  and the README describe IDs.
- Node tests cover parsing, the next ID (with a done item holding the highest), duplicates, the
  prefix, the search forms above and the ID's place in the prompt and the index.

## Notes
Agreed on 2026-10-18:

- **A number stored, a prefix shown.** Only the number is stored, so renaming the prefix rewrites
  no files. Azure DevOps works the same way: the ID is a plain integer and its `AB#456` form exists
  only to link it from GitHub.
- **Not `#456`.** In a GitHub repository, `#456` in a commit or a PR links to issue or PR 456, so
  an item ID written that way would link to the wrong thing. A letter prefix avoids it.
- **`W-` by default, uppercase.** W for work item. The hyphen follows Jira and Linear and keeps
  `W-1` readable; search accepts it without the hyphen and in any case. A project with several
  backlogs (see the README on second backlogs) gives each its own prefix.
- **Collisions are found, not prevented, and there's no counter.** Without a server handing out
  numbers, two branches can both take the next one. They already collide in git on the README's
  index rows, so concurrent creation surfaces at merge time, and `check` in CI is the backstop;
  renumbering the newer item is one line.
- **"Never reused" holds while items are kept.** The kit knows nothing about git, so it can't
  remember a deleted item's number. That limit is written down rather than engineered around.

It builds on the query parsing from [Search finds items by tag, field value and kind](search-matches-tags.md).
Since `planCreate` assigns the ID, the board and the CLI pick it up together.
