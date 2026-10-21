---
title: Try roadmap horizons in our backlog
id: 44
status: in-progress
priority: mid
type: spike
area: repo
horizon: now
tags: ["roadmap"]
created: 2026-10-21
depends_on: []
related: [decide-where-open-roadmap-lives]
---

# Try roadmap horizons in our backlog

## Why
Before deciding where open-roadmap lives (W-43), use our own backlog to learn whether the
existing item files and board can show short, near, and mid or long term plans clearly.
A configured choice field is enough to try this without building a new page or release.

## Acceptance

- Three planning sessions are recorded below, starting with the maintainer reviewing the draft
  assignments. Each session includes a useful example, a limitation (or explicitly none), and
  any horizon moves with their reasons.
- The findings say whether the horizons make planned work easier to understand, whether epics
  and tasks work together, and whether any intended plan cannot be expressed as an item or epic.
- W-43 receives evidence for its Data and Fit questions and notes about Install, Release and
  Dependencies. Assumptions are distinguished from observed behaviour.
- The maintainer chooses to keep, revise or remove the trial field, with that choice recorded
  here. Any implementation follow-ups are linked from W-43; this trial does not settle where
  open-roadmap lives.

## Setup

- [x] Configure `horizon: [now, next, later, unplanned]` in this repo's `backlog.yml`.
- [x] Give every currently open item a draft horizon and regenerate the README index.
- [x] Set previously completed items to `unplanned`; the configured field is required even on
  closed work, and no historical horizon was recorded.
- [x] Put the horizon meanings and the trial link in the backlog README.
- [ ] Review the draft assignments with the maintainer in the first planning session.

The draft puts W-38's active refresh, W-39's feedback round, W-42's grayscale trial and this
experiment in `now`; the ready refresh work and W-43's decision in `next`; W-20's themes in
`later`; and the remaining ideas or discussions in `unplanned`. This is a starting proposal,
not an agreed schedule. Horizon does not change status or make blocked work startable.

## Run the trial

1. Run `npm run dev` and open
   http://127.0.0.1:3737/dev/backlog/?group=horizon&open=1. Keep Open on and Can start off:
   the roadmap needs to include planned work that still has dependencies.
2. At the first planning session, adjust the draft horizons to match the maintainer's intent.
   Drag a card between horizon columns or change Horizon in its details. Check that its file
   and README row follow. The columns run Now, Next, Later, Unplanned in that order.
3. Use the view for three planning sessions, during normal backlog work. Try both the full
   view and `is:epic` in search. Note whether hiding tasks clarifies the plan or hides work
   that matters; epic members do not inherit horizons from their epic.
4. Move at least one item between horizons as plans change. Note the reason and whether the
   horizon still makes sense alongside its status, priority, weight and dependencies.
5. Record a plan that does not fit the existing items, if one comes up: what it needs to say,
   who needs to read it, and what the current view makes awkward. Record none if none arises.
6. Summarise the evidence for W-43, including whether an internal planning board is enough or
   a separate page or audience is needed. Then choose to keep, revise or remove the field.

## What this can establish
The setup tests the existing data model and grouping with no application code changes. It
reuses the current parser, checks, board and host routes, and adds nothing to a backlog-only
project's install because `starter/` is unchanged. A published roadmap's audience, layout,
installation and release boundaries still need W-43's assessment if the trial points there.

## Notes from the trial
Setup is complete. No planning sessions have been observed yet.

Setup verification: all 73 Node tests, backlog `check` and `index --check` pass. An in-memory
check of the real backlog confirms the four columns, 14 open items, and a horizon edit updating
the item and index without changing startability. Browser save behaviour remains to be checked
in the first session.

Copy this for each session:

```markdown
### Session <1, 2 or 3> — <date>
- Useful example:
- Limitation, or none:
- Horizon moves and reasons:
- Epics and tasks:
- Plans that do not fit, intended audience, or none:
```

## Outcome
Pending the three sessions and maintainer review. Record keep, revise or remove, the reasons,
and the evidence passed to W-43 here before marking this item done.
