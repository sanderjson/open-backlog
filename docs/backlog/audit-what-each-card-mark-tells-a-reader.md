---
title: Audit what each card mark tells a reader
id: 40
status: in-progress
priority: mid
type: spike
area: board
weight: 17
tags: [ui, a11y]
created: 2026-10-18
depends_on: []
related: [colour-palette, visual-legend-for-card-symbols, epic-cards-stand-out]
---

# Audit what each card mark tells a reader

## Why
The cards need polish and visual clarity, not only new colours. W-38's own card shows it
([BOARD-BASELINE](../backlog-assets/epic-progress-reads-done.webp)): the bar is full at 0/4, and
"Ready", the play mark and the bar all suggest finished work. W-14 records the colour side of
that. The rest isn't colour:

- **Epic is shown four times:** the EPIC badge, the stacked card edge, the layers icon on the
  progress row, and the pink "Epic" chip for the `type` field.
- **The title gets the narrowest space.** The ID, the badge and the priority bars share its row,
  so a short title wraps to three lines.
- **Some marks have no label:** the weight (`17` in a box reads like a count), the priority
  bars, the play mark, and the faint `0/4`.

W-37's legend has to explain every mark in a sentence, so its design would expose these
problems one by one, after the palette is already chosen. Doing that exercise first, as a
spike, gives W-14 the full list of conflicts to decide on, and gives the cards their own fix.

## The exercise
Write the legend as a draft, before anything is built. For each mark on a card, a list row and
an item's details, record:

- what it means, in one plain sentence;
- how it looks in light and dark (shape, colour, label);
- where else the same look appears, and with what meaning;
- what it competes with on the same card.

A mark is a finding if it takes more than one sentence to explain, means two things, repeats
another mark, or only tells its meaning through colour or a tooltip. Then do a glance test: the
maintainer reads a set of real cards (ordinary, epic, blocked, can start, in progress, parked,
done) in both themes and says what state each one is in. Where the answer is wrong or slow, the
card is unclear. Timebox: half a day. Mockups are allowed; no changes to `web/`.

## Acceptance
- An inventory of every mark in this item (the draft legend), with each finding marked. Annotated
  screenshots of the cards used, in light and dark, go in `docs/backlog-assets/`. They double as
  W-38's "before" pictures.
- Each finding goes to one place:
  - **Colour and meaning:** W-14's questions, especially "Done and not done", before it's decided.
  - **Layout, hierarchy, labels and repeats:** a new card polish build, added to W-38's `items`
    before W-37 and to W-37's `depends_on`.
  - **Explanation only:** W-37's content. The draft legend becomes its starting text.
- The glance test's results are recorded here, with the cards that read wrong.

## Design references
BOARD-BASELINE is an actual pre-refresh screenshot, captured when the epic had four members;
it is a snapshot, not today's membership count. Use it to discuss the conflicting progress,
state and startability cues.

The [header gallery](../header-wireframes.md) and [details gallery](../item-detail-concepts.md)
are layout studies. Compare DETAIL-B/E for whether card framing aids recognition, and
DETAIL-A/D for whether relationship labels remain clear as plain links. These can inform the
audit's recommendations, but its inventory and glance test still use real cards in both themes.
Do not treat generated symbols or fictional status examples as definitions of existing behaviour.

## Notes
`card()`, `progress()`, `priority()`, `epicBadge()`, `chip()` and `renderList()` in
[web/board.js](../../web/board.js); `.bb-card`, `.bb-progress`, `.bb-priority`, `.bb-weight`
and `.bb-signals` in [web/board.css](../../web/board.css).
