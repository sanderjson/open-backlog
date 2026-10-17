---
title: List columns sort both ways
status: ready
priority: mid
type: build
area: board
weight: 9
tags: [ui]
created: 2026-10-17
depends_on: []
related: [test-the-board-view-logic]
---

# List columns sort both ways

## Why
The list's headers look sortable, and most are, but a second click on the active column does
nothing: there's no way to reverse a sort. Only Created is shown newest first, and that's fixed.
The arrow appears on the active column alone, so the others don't read as clickable until you try.

## Acceptance
- Clicking the sorted column reverses it. The header's arrow flips, and `aria-sort` says
  ascending or descending.
- Every sortable header shows an arrow, faint on the inactive ones and solid on the active one, so
  it reads as sortable.
- Items without a value (no weight, no status, no date) stay at the end in both directions:
  reversing a sort shouldn't put the unknowns on top.
- The direction is in the address (`?sort=weight&dir=desc`), and the defaults stay as today:
  weight ascending, created newest first.
- `sortItems` in [web/core.js](../../web/core.js), or its caller, takes the direction, and a Node
  test covers reversing with ties and unweighted items.
