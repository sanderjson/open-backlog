---
title: List columns sort both ways
id: 10
status: done
priority: mid
type: build
area: board
weight: 9
tags: [ui]
created: 2026-10-17
depends_on: [test-the-board-view-logic]
related: []
---

# List columns sort both ways

## Why
The list's headers look sortable, and most are, but a second click on the active column does
nothing: there's no way to reverse a sort. Only Created is shown newest first, and that's fixed.
The arrow appears on the active column alone, so the others don't read as clickable until you try.

## Acceptance
- Clicking the sorted column reverses it. Clicking another column sorts by it in its default
  direction: newest first for created, ascending for the rest.
- The active header has `aria-sort` (`ascending` or `descending`) and an arrow pointing that way.
  Every other sortable header shows a neutral indicator, visibly different from either arrow, so
  it reads as sortable. The icons are decorative and hidden from assistive technology
  (`aria-hidden`); the header's button names the column.
- Items without a value (no weight, no status, no date) stay at the end in both directions, and
  ties break the same way in both directions (the existing tie-breakers, then the slug), so
  reversing never shuffles equal items.
- The direction is in the address (`?sort=weight&dir=desc`), only when it isn't the column's
  default; an unknown `dir` is dropped. The defaults stay as today: weight ascending, created
  newest first.
- `sortItems` in [web/core.js](../../web/core.js) takes the direction, and Node tests cover
  reversing with ties and unweighted items, and the address round trip.
