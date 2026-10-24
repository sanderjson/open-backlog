---
name: open-backlog
description: Work a project's Markdown backlog kept with open-backlog (one item per file in docs/backlog, a README index, a board in development). Use when asked to add, change or find work items, roll items up into an epic, mark work started or done, say what to work on next, or when finishing work that a backlog item tracks. Points at the project's backlog guidance and holds the essentials: the file format, epics, statuses, the index row, attachments and the CLI checks.
---

# Working a backlog kept with open-backlog

The backlog is a folder, usually `docs/backlog/`: one Markdown file per work item, a `README.md`
that indexes them, `backlog.yml` with the fields and the values they allow, and `_template.md` for
new items. The guidance for working it is text in `docs/backlog-guidance/`: the kit's
`working-the-backlog.md` and the project's own conventions. Read that folder before changing the
backlog. If the project has no such folder, the kit's copy is `docs/backlog-guidance/` in the
open-backlog repo.

## The essentials

- Read `backlog.yml` first. A strict field allows only the values it lists.
- An item is `<slug>.md`: front matter, a `# Title` line matching `title:`, then the body from
  `_template.md`. `id:` is its short number (shown as W-12): the highest in the folder plus one
  for a new item, never changed or reused, and the handle to use in commit messages. The slug
  (the file name) is how other items and the index name it: by default the title in lower case
  joined with `-`, or the project's own pattern if its items follow one. Renaming a file means
  changing the slug everywhere it's used, then `check`. Every item has a row in the README's
  index.
- An epic is an item with `items: [slugs]` in work order. Nothing else makes one. `type: epic`
  only if the list allows it. Epics can't contain epics, and the member items' files stay as they
  are. Asked to roll items up into an epic, make the epic file and its index row, and say where it
  is: with the CLI, `new "<title>" docs/backlog --items a,b,c` plus its fields; without it, by
  hand.
- A status change goes in the front matter **and** the index row: the active status when you
  start, the done status when you finish. An epic is done only when every item in it is and its
  own acceptance holds.
- A README with `<!-- open-backlog:index start -->` and `end` markers has a generated index:
  `node bin/open-backlog.mjs index docs/backlog --write` regenerates it. Otherwise edit the row.
- Attachments, such as a screenshot the user hands you with a request, go in
  `docs/backlog-assets/`, linked as `../backlog-assets/name.png`. The backlog folder holds `.md`
  and `.yml` only, and the guidance folder holds text only.
- Keep linked review copies small and committed: optimise images and check text readability.
  Prefer WebP for large raster previews, retaining useful SVG sources or optimised PNG when
  exact pixels matter. Bulky originals can live in an ignored local folder such as
  `docs/backlog-assets-local/` or external storage; item links point to shared review copies.
- The backlog is as visible as the repository. Unfixed security findings, credentials, personal or
  customer data and legal matters don't go in an item's text. Write the item as a pointer to where
  the project keeps such details (its backlog README says where). If it doesn't say, propose a
  place (a draft security advisory, the project's secrets manager) and ask.
- A preview's `_trial-notes.md` is an observations log, not a work item. Preserve it and its
  hand edits. The board's Trial notes button appends versioned observations; when asked to
  record notes by hand, append Markdown without giving the log an ID or index row.
- With Node 22 or later and the kit's CLI: `check`, `next`, `prompt <slug>` and `index --check`,
  each taking the folder as an argument, and `new "<title>"` with `--field name=value`, `--weight`,
  `--tags`, `--items` (an epic), `--epic` (into one) or `--slug` (the project's own file name).
  Prefer `new` to writing a new item by hand: it validates everything first and writes the file
  and the index row together. Give a `--field` for every field `backlog.yml` lists values for
  (`--field status=idea --field priority=mid --field type=build` in the starter); `new` refuses
  without them and fills none in.
- The board's search matches words in titles, slugs, text, tags and field values, and takes
  filters: `#tag`, `field:value` (`status:ready`), `is:epic`. Quotes keep a phrase or literal text.
  Tell the user to type `is:epic` to find an epic you made.
