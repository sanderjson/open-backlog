---
title: A header and toolbar that lay out the same in every project
id: 12
status: done
priority: mid
type: build
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

Screenshots: [the first layout](../backlog-assets/header-wrap-1.png) and
[the second, at a larger text size](../backlog-assets/header-wrap-2.png).

## Agreed layout
Agreed on 2026-10-18: two toolbar rows with fixed roles, no Filters menu and no sideways scroll.

- **Row one never wraps.** The search box on the left; the count, Group and the view switch
  pinned right. Search chips sit after the search box and take up the space between the two
  groups first.
- **Row two holds the filters only:** the field selects, Epic, Tag, Can start, Hide closed and
  Clear, always in that order. It wraps within itself, so a second line still reads as filters.
- **Applying a filter moves nothing.** Clear keeps its space when hidden, and the count keeps
  tabular numerals.
- **Epic and Tag stay capped** at their current widths, so long epic titles and many tags don't
  change the layout.
- **Below the existing narrow breakpoint** the title row stacks: the heading with its actions
  beside it, then the stats, then the toolbar, with the search full width.

## Acceptance
- The agreed layout, checked at 14px and 18px base text, with the starter backlog, this one, and a
  six-field backlog with long epic titles, at 1100px and 1600px wide.

## Notes
`skeleton()` and `renderToolbar()` in [web/board.js](../../web/board.js); `.bb-header`,
`.bb-toolbar` and `.bb-filters` in [web/board.css](../../web/board.css).
