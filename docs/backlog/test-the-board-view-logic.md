---
title: Test the board's view logic without a browser
status: idea
priority: mid
type: build
area: board
weight: 16
tags: [review-2026-10, tests]
created: 2026-10-17
depends_on: []
related: [search-matches-tags, list-sorts-both-ways]
---

# Test the board's view logic without a browser

## Why
[web/board.js](../../web/board.js) is about 1,200 lines against seven Playwright scenarios. Filters
(`visible()`), the address (`params()`, `href()`), grouping (`columns()`), the list view, sorting,
search and the `j`, `k`, `b`, `l` and `/` shortcuts have no tests. The README says the suite covers
"keyboard and focus behaviour", but only Tab and Escape are exercised. These functions are nearly
pure functions of a snapshot and the params, so they belong where `node --test` reaches them in
milliseconds. The CLI's `next` reimplements the "Can start" filter that `visible()` already has.

## Acceptance
- `visible`, `params` and `href` (as pure functions of a query string), `columns` and the tone
  choice live in [web/core.js](../../web/core.js) or a `web/view.js` with no DOM, and board.js
  calls them.
- Node tests cover each filter alone and combined, `none` values, the epic filter with the epic
  first, search over title, slug, summary, body and tags, every sort, unknown params dropped, and
  defaults left out of the address.
- The CLI's `next` uses the same filter as "Can start".
- The browser suite gains one scenario each for the list view (a sort click), the search box, a
  field filter and the `j`, `k`, `b`, `l` and `/` keys, so the DOM wiring has coverage too.
