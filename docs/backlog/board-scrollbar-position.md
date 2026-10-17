---
title: The board's horizontal scrollbar floats mid-screen when columns are short
status: ready
priority: mid
type: build
area: board
weight: 13
tags: [ui]
created: 2026-10-17
depends_on: []
related: [header-layout]
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
- Inside a host's page, where the board gets a container rather than the window, the same holds
  for that container: the bar sits at the bottom of the height the host gives the board, and
  nothing assumes the viewport.

## Notes
The simplest route is probably to make `.bb-app` a flex column of at least the viewport's height,
or of the height a host's container gives it, and let `.bb-main` and `.bb-board` take the
remaining height, so the scroller's bottom edge is the container's. A sticky scrollbar proxy is
the heavier alternative. Styles in [web/board.css](../../web/board.css): `.bb-app`, `.bb-main`,
`.bb-board`, `.bb-table-wrap`.
