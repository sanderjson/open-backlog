---
title: A bad link in an item can't break the sheet or report the host down
id: 5
status: done
priority: high
type: build
area: board
weight: 5
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
horizon: unplanned
---

# A bad link in an item can't break the sheet or report the host down

## Why
An item whose text has a badly percent-encoded link, `[bad](foo%E0%A4%A.md)`, makes `decodeURI`
throw in `linkBody` ([web/board.js](../../web/board.js)). Two things then go wrong:

- The sheet half-renders: its links aren't rewired and focus isn't placed, and `sheetKey` is
  already set, so it won't try again.
- The render runs inside `poll()`'s try block. Its catch calls `setLive(false)`, so the live dot
  turns amber with "Can't reach the host: retrying" while the host is fine, and the board stops
  redrawing until the sheet closes.

Reproduced headlessly: a page error "URI malformed", then `.bb-live.is-down` after an
`open-backlog:refresh` event.

## Acceptance
- A malformed link renders as a plain link to its raw href, or without one as links to unknown
  files do, and the rest of the sheet works.
- A render error never shows as a host problem. `poll()` tells fetch failures from render failures;
  a render failure is reported where the user sees it (a toast or the error panel) and the next
  change renders again.
- A browser test opens an item with such a link and asserts no page error, a rendered panel, and a
  live dot still green after a refresh.
