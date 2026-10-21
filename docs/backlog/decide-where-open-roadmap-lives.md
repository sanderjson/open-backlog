---
title: Decide where open-roadmap lives
id: 43
status: ready
priority: mid
type: spike
area: repo
tags: [roadmap]
created: 2026-10-20
depends_on: [try-roadmap-horizons-in-our-backlog]
related: []
horizon: next
---

# Decide where open-roadmap lives

## Why
open-roadmap is a visualiser for plans across work horizons: short, near, and mid or long term.
The board shows what's in the backlog now, but not how the work spreads over time. Before
building anything, decide whether open-roadmap is its own repository or an extension of
open-backlog, since the answer sets how it's versioned, vendored and installed.

## First experiment
[W-44: Try roadmap horizons in our backlog](try-roadmap-horizons-in-our-backlog.md) uses the
existing board and item files to test the smallest option. Review its findings before making
the repository decision. The trial is configured here; it has no usage findings yet.

## Starting evidence
The kit already treats configured scalar fields as editable choices, filters and board
groupings (`web/core.js`, `web/board.js`). A `horizon` field can therefore use the existing
files, two host routes, parser, checks and index generator. This first experiment changes
only this repository's backlog and its local guidance; projects installing the kit receive
their own configuration from `starter/`.

That makes extending open-backlog the simplest option to test first. It does not yet answer
whether people need plans outside work items, a separate layout or audience, or independent
releases. The recommendation below remains open until the trial and maintainer review.

## Questions
- **Data:** does a roadmap read the same item files, with a horizon field (or tag) in
  `backlog.yml`, or does it need its own source, such as plans that aren't items yet?
- **Fit:** is it another view of the board (a grouping or a tab), or a page with its own layout
  and audience, such as people outside the team?
- **Install:** what would a project vendor for each option, and what does that cost a project
  that wants the backlog without the roadmap?
- **Release:** shared versioning and CHANGELOG, or separate releases that have to track
  open-backlog's file format?
- **Dependencies:** what open-roadmap would reuse from the core and the board (the parser,
  `check`, themes), and whether that's cleaner as a shared module or as the same package.

## Acceptance
- Each question above has an answer recorded here, with the option it favours.
- A recommendation (own repo, or part of open-backlog) and its reasons, agreed with the
  maintainer.
- Follow-up items for the chosen option, linked from here.

## Decision record
Pending W-44's findings. Answer each question above, state which option it favours, and record
the maintainer's agreement before closing this spike. W-44 is the experiment leading to the
decision; implementation follow-ups for the chosen option still need to be created.
