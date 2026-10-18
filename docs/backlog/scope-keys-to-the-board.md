---
title: Keyboard shortcuts stay inside the board
id: 18
status: done
priority: mid
type: build
area: board
weight: 17
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
---

# Keyboard shortcuts stay inside the board

## Why
PROMPT.md supports mounting the board inside the project's own layout, and the CSS is scoped under
`.bb` for that. The key handler isn't: `document.addEventListener("keydown", …)` in
[web/board.js](../../web/board.js) handles `n`, `b`, `l`, `j`, `k`, `e`, `c`, `/` and `?` wherever
focus is. With focus on an element outside the board, pressing `n` opened the New item dialog
(reproduced headlessly). A host page with its own `/` search fights the board. The board also sets
`document.title`, which overwrites an embedding page's title.

## Acceptance
- Shortcuts fire only when focus is inside the board, or on the page body when the board is the
  page. The standalone `index.html` works exactly as now. Typing in an input, a select, a text
  area or an editable element never triggers one, as today.
- `document.title` changes only when the board owns the page, or the host opts in.
- Character shortcuts can be turned off: a switch in the Keyboard shortcuts dialog (the toolbar's
  keys button opens it too), remembered per browser in `localStorage` and on by default. If storage
  is blocked the switch still works for the visit. With it off, no single-character key does
  anything; Escape, Tab and buttons activated with Enter or Space keep working. This follows
  WCAG 2.2's character key shortcuts criterion.
- A browser test mounts the board beside a focusable element, presses `n` with focus there and sees
  no dialog, then presses `n` with focus on the board and sees one; with shortcuts off, `n` opens
  nothing and Escape still closes the sheet.
