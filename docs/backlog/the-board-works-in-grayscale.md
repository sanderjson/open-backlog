---
title: The board works in grayscale
id: 41
status: ready
priority: high
type: build
area: board
weight: 19
tags: [ui, a11y]
created: 2026-10-18
depends_on: [audit-what-each-card-mark-tells-a-reader, grayscale-trial, compact-header-with-version-and-github-links]
related: [colour-palette, visual-legend-for-card-symbols, item-details-open-in-a-native-dialog]
horizon: next
---

# The board works in grayscale

## Why
Maintainer decision, 2026-10-18, after W-40's glance test: **colour never carries important
information on its own.** Design the whole board in grayscale first and make sure everything
can be used that way. Only then reintroduce colour, as W-14's palette, on top of a board that
already works without it.

The glance test showed why. The maintainer read each card's state from its status word only.
The lock and play marks went unnoticed, so "waiting" and "can start" weren't seen. The epic bars
confused: W-9's green, gold, blue, green, green segments said nothing beyond `1/5`, and W-14's
full bar contradicted its `0/4`. Priority wasn't recognised on any card, because the signal bars
don't read as priority. Dark mode read the same as light.

This is the card polish build W-40 calls for, widened from the cards to the whole board.

**When:** after [W-42](grayscale-trial.md), a few days of grayscale use in every project,
run alongside W-39's feedback round. The trial notes settle the questions below. It comes after the header and the details build, changes their marks
through the shared helpers, and ships with them in v0.7.0.

## Scope
Everything the board draws: the header and its counts, filters, cards, column heads, the list,
item and epic details, notices, the problems banner and toasts. W-36's header is built in
grayscale from the start, and W-35's details build follows the same rule.

Under this rule, every meaning has a word, a shape or an icon; colour may repeat it but never
carry it alone. The findings this build owns, from W-40's audit record:

- **State is readable without colour (L9, C8, C2).** "Waits on 1" and "Can start" show as text
  or as a labelled icon, not as a faint mark. Done gets its own mark: the maintainer suggests a
  check icon in place of the status dot. Parked reads differently from done, not only by fading.
- **Epic progress (C1, C2, L3).** The bar fills only for done members, over a neutral track, so
  0/4 looks empty and 2/2 looks full. The count stays. W-14 still decides whether in-progress and
  parked members get their own shading or pattern.
- **Priority is readable (C6, L4).** One form everywhere, with a label. The maintainer
  suggested P0 to P3; the configured word (High, Mid, Low) is the other option.
- **"Epic" is said once per surface (L1).** One clear epic cue on a card and in its details,
  rather than four and three.
- **The title gets room (L2),** and **numbers have labels (L3):** the weight isn't a bare number
  beside the ID.
- **Chips name their field (L5, C5)** where the value alone is ambiguous, so Build and Board
  don't depend on colour to tell type from area.
- **Signals are legible (L6),** and **"can start" on an epic (L7)** is either explained or left
  off.
- **An epic's members (L8):** done and parked members are told apart by more than strikethrough.
- **Status dots (C7)** beside relation links and in column heads have a visible word or shape.

## To agree before building
- **Priority labels:** P0 to P3 (a rank from the configured order, with P0 highest), or the
  configured word. Projects name their own priorities, and some already use `p0`/`p1`.
- **State marks:** which states get an icon besides done's check (waiting, can start, in
  progress, parked), and whether the icon replaces the status dot or sits beside the word.
- **Epic cue:** which single cue stays on a card (badge, frame and stack, or icon).

The maintainer settles these from W-42's trial notes before the build starts.
Everything else follows from the rule.

## Acceptance
- With colour removed from the whole page (for example `filter: grayscale(1)` on `html, dialog, dialog::backdrop`; on the root alone
  it misses open dialogs), every
  state, priority, epic progress figure, relationship and notice can still be read. The browser
  tests include such a grayscale pass.
- A repeat of W-40's glance test, on the same fixture cards in grayscale: the maintainer names
  each card's state (including waiting and can start), each epic's progress and each priority,
  without studying the card. Record the result here.
- Text and meaningful non-text marks meet the contrast targets in grayscale in both themes.
- Before and after screenshots, in light and dark, in `docs/backlog-assets/`.
- No colour is added in this build. Existing colour stays where it repeats a meaning already
  carried another way; W-14's palette build decides the colours that come back.
- Sizes and spacing in `rem`, per W-38's shared requirements; no change to the host contract.

## Trial implementation

W-45's v0.7.0-preview.1 implements provisional labels, a single Epic badge and completed-only
progress so W-42 can run across all five projects. The maintainer requested this test
experience before the field notes exist. Configured priority words and explicit state text
are trial defaults; the choices above, the glance test and final acceptance remain open.
See [the trial procedure](../trials/grayscale-preview.md).

## Notes
W-40's [audit record](audit-what-each-card-mark-tells-a-reader.md#audit-record) has the draft
legend, the findings by letter and the captures. `card()`, `progress()`, `priority()`, `chip()`,
`epicBadge()`, `renderList()`, `renderStats()`, `renderSheet()` and `epicSection()` in
[web/board.js](../../web/board.js). The audit's fixture (one card in every state) was a
throwaway; adding it to `test/` would serve this build's grayscale pass and W-38's combined
verification.
