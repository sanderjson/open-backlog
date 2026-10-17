---
title: The board fits a host page
status: ready
priority: mid
type: epic
area: board
weight: 11
tags: [ui, embedding]
created: 2026-10-18
items: [scope-keys-to-the-board, header-layout, board-scrollbar-position]
depends_on: []
related: []
---

# The board fits a host page

The embedding story, end to end: a project shows the board inside its own page, and it looks and
behaves the same there as in every other project.

## Why
PROMPT.md promises that a project can show the board inside its own layout, not only as
`index.html`, and the CSS is scoped under `.bb` for it. In practice each project's board looks a
little different from the next: the toolbar wraps wherever that project's window, text size and
fields happen to break it, the horizontal scrollbar floats mid-screen when columns are short, and
until v0.5.0 the board's keys and title reached outside it. These are the problems every project
that embeds the board sees. The keyboard fix is done, so the bar shows where this started.

## Acceptance
- Mounted in a host page beside another focusable control, under a host header, in a container of
  limited height, the board handles keys and the title as the host's guest (done), lays its header
  and toolbar out the agreed way at 14px and 18px base text, and keeps horizontal scrolling
  reachable at the bottom of its container for short boards and lists.
- The standalone page (`index.html`, with `data-page`) passes the same checks at 1100px and 1600px.
- Both open items are done, and their acceptance holds in the host page as well as the standalone
  page. 
