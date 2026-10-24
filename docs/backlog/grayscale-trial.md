---
title: Try every project's board in grayscale
id: 42
status: in-progress
priority: high
type: spike
area: board
weight: 16
tags: [ui, a11y]
created: 2026-10-18
depends_on: []
related: [security-reports-have-a-private-route, deliver-five-project-grayscale-trial, the-board-works-in-grayscale, collect-and-answer-feedback-from-the-projects-using-the-kit, audit-what-each-card-mark-tells-a-reader]
horizon: now
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

The maintainer requested an installable experience on 2026-10-21. W-45 provides
**v0.7.0-preview.1**, with grayscale on by default, a colour comparison switch and a notes
recorder. Use [the update prompt](../trials/grayscale-preview.md) in each of the five projects
and record its installation report in [the five-project record](../trials/five-project-notes.md).
Use the pinned prerelease tag or its release package so all five projects run the same build.
In each project, give W-39's feedback prompt before the update prompt, so its answers describe
the version the project had.

Use each board normally for a few days. Click **Trial notes** on the board or in item details
whenever something helps or gets in the way. Saved notes append to that project's
`_trial-notes.md`; downloads include unfinished drafts. The preview records version, theme,
appearance, view and selected item, so observations can be compared later.

The preview uses configured priority words, explicit state labels, one Epic badge and a
completed-only progress bar as provisional choices. Compare with colour using the Grayscale
switch. W-41's final choices still come from the maintainer's notes.

### Original v0.6.0 baseline

For comparison on an installation kept on v0.6.0, the original bookmarklet still toggles
grayscale on the whole page, including its sheet and dialogs:

```text
javascript:(()=>{const id='ob-gray',e=document.getElementById(id);if(e){e.remove();return}const s=document.createElement('style');s.id=id;s.textContent='html,dialog,dialog::backdrop{filter:grayscale(1)}';document.head.append(s)})()
```

Record that baseline version with the observation. On an embedded board the bookmarklet
greys the host page too; the preview's switch affects only the board.

## What to note, per project
- **What you couldn't tell** without colour, and what you did instead: opened the item, switched
  the grouping, turned colour back on.
- **What you didn't miss:** colour that turned out to carry nothing you needed. This feeds W-14.
- **W-41's three questions:** how you'd want priority labelled (P0 to P3, or the word), which
  states need a mark of their own, and which epic cue you actually looked for.
- **Anything about the header or the item details,** for W-36 and W-35. Both are being built
  during the trial, so pass these on as they come rather than at the end.

## Review
Stop on 2026-11-04, or sooner if the notes have stopped saying anything new. Summarise what
there is, answer W-41's questions as well as the notes allow, and close this item. Extend once
at most. Leave any security problem in the kit out of the notes and report it privately
([W-46](security-reports-have-a-private-route.md)).

## Acceptance
- A few days of use in all five projects, with notes recorded below per project (named
  generically, as in W-39, since this backlog is public).
- A summary that answers W-41's three questions, or says what's still unclear, and a list of
  colour nobody missed for W-14.
- Header and details notes passed to W-36 and W-35 while they're built.

## Notes from the trial

[The five-project record](../trials/five-project-notes.md) has one installation and observation
section per project. None of the five external installations has been verified yet; no field
observations have been recorded. Installation smoke checks do not count as days of real use.
