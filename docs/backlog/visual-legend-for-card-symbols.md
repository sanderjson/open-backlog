---
title: A visual legend for card symbols
id: 37
status: ready
priority: mid
type: build
area: board
weight: 22
tags: ["ui", "a11y"]
created: 2026-10-18
depends_on: [compact-header-with-version-and-github-links, colour-palette, item-details-open-in-a-native-dialog]
related: [a-refreshed-board-everyone-can-read-and-use, audit-what-each-card-mark-tells-a-reader, epic-cards-stand-out]
---

# A visual legend for card symbols

## Why
Cards communicate through small marks: priority bars, numbered dependency icons, branch marks,
weight badges, coloured chips and epic progress. Tooltips explain individual marks, but there
is no visual reference a person can open to understand them together. The maintainer requested
a legend modal like the existing keyboard shortcuts modal.

This is W-38's final feature build so the reference describes the visuals and interactions that
will ship, including the agreed non-colour cues.

## Order
The header and both discussions are prerequisites now. Before W-14 and W-35 are marked done,
their resulting palette and details builds must also be added to this item's `depends_on`.
Begin this build after both resulting implementations are done, as ordered by W-38. The
discussions alone are insufficient prerequisites. W-38 owns combined verification and release.

## Proposed interaction
- Add a visible **Legend** button beside keyboard help, available in both Board and List views.
  Keep its text label so finding the reference does not require understanding another icon.
- Open one native `<dialog>` with the accessible name **Card legend**, using W-38's shared
  conventions. Focus a heading or suitable content element on open, provide a visible Close
  button, handle Escape only for the topmost dialog and restore focus to the current trigger
  on close, with a logical fallback if a redraw removed it. Do not add a character shortcut.
- Show real visual examples beside brief explanations. Group the reference into item identity
  and work order, priority and coloured fields, dependency/branch signals, and epics/progress.
  Include an example ordinary card and an epic card. Do not put contradictory states such as
  "can start" and unfinished blockers on the same example card.
- Keep the layout readable on phones with a single column and internal scrolling when needed.
  Use `rem` for typography, spacing, modal width, control sizes, radii and responsive thresholds.

## Symbols and meanings to cover

| Visual example | Explanation |
| --- | --- |
| Short ID, such as `W-42` | A stable item handle; use this backlog's configured prefix. |
| Weight badge, such as `12` | Work order: lower numbers come first. |
| Filled priority bars | Show each configured priority label using the same renderer and ordering as cards, plus the no-priority state. Do not assume every backlog has high/mid/low or that every label has a distinct bar pattern. |
| Coloured dot and labelled chip | A value of a named field. Use this backlog's actual labels and resolved colours, including explicit overrides; the same colour can mean different things in different fields. |
| Lock with a count | The number of dependencies not marked done. A parked dependency is still unfinished. |
| Unblocks arrow with a count | The number of items that list this item as a dependency. The current count includes finished items, so do not label it as a count of open blockers or promise they all become startable. |
| Play triangle | The item can start: it is open, in a startable status and has no unfinished or invalid dependencies. Cards show this mark when the backlog has an active status configured. |
| Branch mark | One or more branch names are recorded in the item; the board does not check whether those branches exist in Git. |
| Epic badge and stacked card | An item groups other items through its `items` list. |
| Segmented epic bar and `done/total` | Each segment represents an existing direct member and uses that member's status colour. The count is done members out of existing direct members; missing references are reported as problems, and parked members do not count as done. Segments are grouped by stage, rather than following work order. |
| Muted closed card | The item has a configured closed status. Closed includes done and may include statuses such as parked. |

The table describes today's meanings. Use the shared renderers for the final samples, including
any non-colour cues agreed by W-14 and implemented in its build. Changing what a signal means
is outside this item; if the palette decision changes its presentation, explain that final
presentation rather than preserving an obsolete example.

## Acceptance
- A labelled Legend trigger opens the native modal from Board and List, in standalone and
  embedded use, including read-only boards. It uses the position established by W-36, and this
  item owns the working trigger as well as its dialog.
- Every visual listed above has a faithful rendered sample and a plain explanation. Reuse the
  card icon/badge/priority/progress rendering and tone resolution where practical so the
  reference cannot quietly drift from the cards. Do not use emoji substitutes or a separate
  hard-coded palette. Check the legend's actual text and non-text surfaces against W-14's
  agreed contrast targets, including light/dark themes and configured override examples.
- Samples reflect the loaded backlog's prefix, configured fields, priority ordering, statuses
  and colour overrides. Explain absent/unconfigured features without implying they are enabled.
  Inspect examples with custom priority labels, no priority field, no active status, and
  different statuses sharing one colour. Text labels carry meaning alongside colour.
- The legend reflects configuration changes while open without stealing focus or resetting the
  person's reading position. Example content remains read-only and never creates or edits
  backlog items.
- Keyboard-only use covers opening, focus inside the modal, Tab/Shift-Tab, Escape and focus
  return. Board character shortcuts remain suppressed while the legend is open. Give the
  dialog a clear accessible name and preserve logical reading order for screen readers. This
  reference supplements accessible card names and explanations; it does not replace them.
- Use `rem` for new layout dimensions and verify scaling at different root text sizes. Check
  light and dark themes, phone-sized containers, readable scrolling and comfortable Close
  targets. Save screenshots of the ordinary-card and epic examples in `docs/backlog-assets/`
  during the build. Apply W-38's fixed-viewport text-scaling checks. Convert shared New item,
  keyboard-help and Legend dialog sizing to the same `rem`-based conventions where they share
  styles, preserving form behaviour and host style scoping.
- No new host route, package or external service is required. Run the backlog check and relevant
  existing Node/browser checks when implementing, including a focused check that the displayed
  legend follows custom configuration and its dialog preserves keyboard behaviour.

## Design references
[The header gallery](../header-wireframes.md) (HEADER-A/B/C and HEADER-PHONE) shows possible
positions for the labelled Legend trigger beside keyboard help. These are placement studies;
there is no legend-dialog wireframe yet. Use the chosen header's position when this build starts.

[The details gallery](../item-detail-concepts.md) compares microcards with plain links and rows.
DETAIL-D/E are useful references for restrained text hierarchy and named relationship groups,
but their generated icons and progress marks are not legend samples. W-40's audit and the final
shared renderers supply the meanings and examples this dialog must explain.

## Notes
`ICONS`, `epicBadge()`, `priority()`, `card()`, `progress()`, `key()` and the Help dialog in
[web/board.js](../../web/board.js); `tone()`, `stage()` and dependency derivation in
[web/core.js](../../web/core.js). Read W-14's decision and resulting build before choosing the
final examples; the original table is a reference, not a second definition of card rendering.
