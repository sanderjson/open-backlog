---
title: Epic cards look unmistakably different
id: 9
status: done
priority: mid
type: build
area: board
weight: 8
tags: [ui, epics]
created: 2026-10-17
depends_on: []
related: [colour-palette]
horizon: unplanned
---

# Epic cards look unmistakably different

## Why
An epic's card has a stack of cards drawn behind it and a progress bar, but in a column of ordinary
cards that's easy to miss. A user who had just asked an agent for an epic couldn't see one on the
board. An epic should read as an epic at a glance, without reading the card.

## Acceptance
- An epic card is recognisable among ordinary cards in light and dark without reading it: a
  stronger border (two pixels, in the accent or the epic's status tone), a small "Epic" label with
  the icon in the card's top line, or both. The stack can stay or go.
- The list view marks epics the same way. Its Epic column already shows the bar; the row's title
  gets the label.
- The sheet's title shows that the item is an epic before the Epic section further down.
- Works with today's palette and in both themes, checked with the starter backlog and this one.
  The palette refresh (see the related item) is background, not a prerequisite.

## Notes
`card()`, `progress()` and `renderSheet()` in [web/board.js](../../web/board.js);
`.bb-card.is-epic` in [web/board.css](../../web/board.css).
