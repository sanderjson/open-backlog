---
title: Search finds items by tag, field value and kind
status: ready
priority: high
type: build
area: board
weight: 7
tags: [ui]
created: 2026-10-17
depends_on: []
related: [test-the-board-view-logic]
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
- Typing a tag name, with or without a leading `#`, filters to the items tagged with it, and the
  toolbar shows that a tag is the filter (the Tag select set, or a chip in the search), so it's
  clear why an item that mentions the word isn't there.
- Typing a field's value (`ops`, `high`, `in-progress`) does the same with that field's filter,
  and typing `epic` shows the epics, whatever their type.
- Plain text search still works for anything that isn't a tag or a value. A query that's both is
  the filter first, and one keystroke away from text: a decision for whoever picks this up, kept
  simple.
- The address keeps the choice (`?tag=chore`, `?kind=ops`, as the selects do today), so it can be
  bookmarked.
- A Node test over `visible()` (see the related item) or a browser test covers a tag query, a
  `#tag` query, a field value, `epic`, an untagged item mentioning the word, and a query that's
  none of these.

## Notes
`visible()` in [web/board.js](../../web/board.js) does the matching; `tagCounts` and the fields in
[web/core.js](../../web/core.js) know every tag and value.
