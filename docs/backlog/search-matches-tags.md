---
title: Search finds items by tag, field value and kind
status: ready
priority: high
type: build
area: board
weight: 7
tags: [ui]
created: 2026-10-17
depends_on: [test-the-board-view-logic]
related: []
---

# Search finds items by tag, field value and kind

## Why
One project tags its upkeep items `chore`. Typing `chore` in the search is expected to narrow the
board to those items, and it doesn't feel like it does. Checked headlessly: the search does match
tags, but it's a plain text search over title, slug, summary, body and tags, so an untagged item
that merely mentions the word shows up too, the Tag filter stays empty, and typing `#chore`, the
way the chips in the sheet show a tag, matches nothing.

Fields are worse: the search doesn't look at choice fields at all, so `ops` doesn't find items
with `kind: ops`, and `epic` finds nothing unless the word is in the text, though an item with an
`items` list is an epic whatever its type says. An agent put it this way after a user couldn't
find the epic it had made: "the board searches titles, IDs, summaries, item text and tags, but not
fields like kind".

## Acceptance
The search box takes a query in the qualifier style GitHub uses for issues: plain words search
text, and qualifiers filter.

- **Plain words** match, case-insensitively, the title, slug, summary, body, tags and the item's
  choice-field values, so `ops` finds an item with `kind: ops`. Every word has to match somewhere
  (AND). `"two words"` in quotes matches that phrase.
- **`#tag`** keeps only the items tagged with it; an untagged item that merely mentions the word
  isn't shown.
- **`field:value`** keeps the items whose choice field has that value, for any field in the
  backlog (`status:ready`, `kind:ops`, `priority:high`). `field:none` keeps those without one, as
  the selects' None does. Field names and values match case-insensitively; a value with spaces is
  quoted (`status:"in review"`).
- **`is:epic`** keeps the epics: every item with an `items` list, whatever its type. It's not
  `?epic=<slug>`, the Epic filter, which keeps one epic and its items.
- Filters and words combine with AND, with each other and with the toolbar's selects.
- **Literal text:** a quoted term is always text, so `"#chore"` or `"status:ready"` finds those
  characters. A qualifier that isn't one (`http:`, `is:` with anything but `epic`, a name that
  isn't a field) is text too. `#` always means a tag, and `is:` is reserved even if a field is
  called `is`.
- The toolbar shows each qualifier in force as a chip by the search box; its × removes that term
  from the query. The query, chips, selects, Clear (which empties the query and the selects) and
  the address (`?q=…`, as today) always agree: reloading or bookmarking a URL gives the same
  board.
- The guide, the skill and the README say what search covers and show the syntax; they no longer
  say that search skips field values.
- Node tests cover the parser and `visible()`: `#tag`, `field:value` with case and quotes,
  `field:none`, `is:epic` (including an epic without `type: epic`), AND across terms, a phrase, a
  quoted literal, an unknown qualifier as text, a field value found by plain text, and an untagged
  item mentioning a tag. A browser test types a query and removes a chip.

## Notes
`visible()` in [web/board.js](../../web/board.js) does the matching; `tagCounts` and the fields in
[web/core.js](../../web/core.js) know every tag and value.
