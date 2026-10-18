---
title: Try every project's board in grayscale
id: 42
status: ready
priority: high
type: spike
area: board
weight: 16
tags: [ui, a11y]
created: 2026-10-18
depends_on: []
related: [the-board-works-in-grayscale, collect-and-answer-feedback-from-the-projects-using-the-kit, audit-what-each-card-mark-tells-a-reader]
---

# Try every project's board in grayscale

## Why
W-40's glance test showed the board relies on colour, and the maintainer decided it must work
without colour first (W-41). One glance test at fictional cards is thin evidence for W-41's
three questions, though. A few days of real use in every project shows what's actually missed
without colour, what isn't, and what people look for.

Run it together with W-39's feedback round: same projects, same days. The agents answer W-39's
prompt; these notes are the maintainer's own, since an agent doesn't look at the board.

## How
This is an experiment, not a release. Projects stay on v0.6.0 and nothing in them changes. A
bookmarklet turns grayscale on and off on the current page, including the item sheet and
dialogs (checked on v0.6.0):

```text
javascript:(()=>{const id='ob-gray',e=document.getElementById(id);if(e){e.remove();return}const s=document.createElement('style');s.id=id;s.textContent='html,dialog,dialog::backdrop{filter:grayscale(1)}';document.head.append(s)})()
```

Save it as a bookmark and click it once after opening or reloading a board. On an embedded board
it greys the host page too. macOS's Grayscale colour filter (System Settings, Accessibility,
Display) is the alternative, for the whole screen.

## What to note, per project
- **What you couldn't tell** without colour, and what you did instead: opened the item, switched
  the grouping, turned colour back on.
- **What you didn't miss:** colour that turned out to carry nothing you needed. This feeds W-14.
- **W-41's three questions:** how you'd want priority labelled (P0 to P3, or the word), which
  states need a mark of their own, and which epic cue you actually looked for.
- **Anything about the header or the item details,** for W-36 and W-35. Both are being built
  during the trial, so pass these on as they come rather than at the end.

## Acceptance
- A few days of use in all five projects, with notes recorded below per project (named
  generically, as in W-39, since this backlog is public).
- A summary that answers W-41's three questions, or says what's still unclear, and a list of
  colour nobody missed for W-14.
- Header and details notes passed to W-36 and W-35 while they're built.

## Notes from the trial
None yet.
