---
title: The board's horizontal scrollbar floats mid-screen when columns are short
id: 13
status: done
priority: mid
type: build
area: board
weight: 13
tags: [ui]
created: 2026-10-17
depends_on: [header-layout]
related: []
---

# The board's horizontal scrollbar floats mid-screen when columns are short

## Why
`.bb-board` scrolls sideways when a grouping has more columns than fit the window. The scroll
container is only as tall as its tallest column (`align-items: start`), so with many columns and a
few cards the scrollbar is drawn right under the cards, in the middle of the screen, with empty
page below it. It reads as a stray line, and on a system that always shows scrollbars it's
permanent. The list view has the same shape: `.bb-table-wrap` scrolls sideways and is only as tall
as its rows.

## Acceptance
- With more columns than fit and only a few cards, the horizontal scrollbar sits at the bottom of
  the viewport, not under the cards. The same for a short list wider than the window.
- Columns still start at the top and keep their own height; nothing stretches into the empty space
  unless it looks intentional.
- When the board is taller than the window, sideways scrolling is still reachable (trackpads and
  Shift+wheel already work; where the bar sits then is secondary).
- Checked at a few sizes with the starter backlog grouped by a field with six or more values.
- Inside a host's page, the board uses whatever height its mount element is given: the bar sits
  at the bottom of that height, and nothing assumes the viewport. A host that gives the element no
  height keeps today's behaviour, which is fine there because the host's page scrolls.
- PROMPT.md says that a host that wants the bar at the bottom of its container gives the mount
  element a height.

## Notes
It comes after [the header layout](header-layout.md), which settles the rows above the board.
The simplest route is probably to make `.bb-app` a flex column of at least the viewport's height
when the board owns the page (`data-page`), or of the height a host gives the mount element, and let `.bb-main` and `.bb-board` take the
remaining height, so the scroller's bottom edge is the container's. A sticky scrollbar proxy is
the heavier alternative. Styles in [web/board.css](../../web/board.css): `.bb-app`, `.bb-main`,
`.bb-board`, `.bb-table-wrap`.
