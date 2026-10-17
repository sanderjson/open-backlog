---
title: A header and toolbar that lay out the same in every project
status: ready
priority: mid
type: discuss
area: board
weight: 12
tags: [ui]
created: 2026-10-17
depends_on: []
related: []
---

# A header and toolbar that lay out the same in every project

## Why
The header and the toolbar flex-wrap, so where things land depends on the window, the font size,
how many choice fields a backlog has and how long its epic titles are. In one project the filter
row holds everything up to Can start, and Hide closed, Clear, the count, Group and the view switch
drop to a second line. At a larger text size the same row breaks after Epic, so Tag, Can start,
Hide closed and Clear start the second line instead. Every project's board looks different, and the
eye has to hunt for the view switch and the count.

Screenshots: [the first layout](../backlog-assets/header-wrap-1.webp) and
[the second, at a larger text size](../backlog-assets/header-wrap-2.webp).

## To agree before building
- The toolbar has the same structure for any backlog: the filters (search, fields, epic, tag, the
  two toggles, Clear) in one group, and the count, Group and view switch in another that never
  changes rows.
- Filters that don't fit don't reflow the other group: they wrap inside their own group, scroll,
  or fold into a "Filters" menu. Prefer the simplest thing that's predictable.
- Applying a filter (Clear appearing, the count changing) doesn't shift the controls around it.
- Six fields and long epic titles don't change the layout; the Epic select stays capped (it's
  already `max-width: 15rem`).
- The title row (eyebrow, title, stats, actions) holds together down to about 1100px; below that
  it stacks in one fixed order.

## Acceptance
- The agreed layout, checked at 14px and 18px base text, with the starter backlog, this one, and a
  six-field backlog with long epic titles, at 1100px and 1600px wide.

## Notes
`skeleton()` and `renderToolbar()` in [web/board.js](../../web/board.js); `.bb-header`,
`.bb-toolbar` and `.bb-filters` in [web/board.css](../../web/board.css).
