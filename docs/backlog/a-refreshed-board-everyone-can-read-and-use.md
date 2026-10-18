---
title: A refreshed board everyone can read and use
id: 38
status: in-progress
priority: mid
type: epic
area: board
weight: 17
tags: [ui, a11y]
created: 2026-10-18
items: [audit-what-each-card-mark-tells-a-reader, compact-header-with-version-and-github-links, colour-palette, item-details-open-in-a-native-dialog, visual-legend-for-card-symbols]
depends_on: []
related: [header-layout, the-board-fits-a-host-page, themes]
---

# A refreshed board everyone can read and use

The board's next visual pass: clearer cards, a compact header, a measured palette, readable item
details and a visual legend that describes the finished cards. Check the whole pass together and ship it
in one release.

## Why
W-29 made the board lay out the same in every project. The header still spends its height on a
large title and boxed counters. Card marks are explained only one tooltip at a time, colours
were picked by eye, and some meanings rely on hue alone. The details view has no agreed reason
for its edge placement. These changes share screens and checks: relative sizing, light and
dark, standalone and embedded use, keyboard operation and screen-reader behaviour. The legend
must describe the palette and card cues that actually ship.

## Scope and decisions
- W-40 is a spike: it audits the card marks before anything is decided. W-36 and W-37 are
  builds. W-14 and W-35 remain discussions: their recommendations are not
  recorded maintainer decisions. Ask about unresolved choices before selecting the palette or
  details interaction. Routine implementation choices within an agreed design need no further
  decision session.
- A completed discussion is not an implemented feature. Before marking either discussion done,
  create and link its separate build, add that build to this epic, and update the legend's
  prerequisites. W-40 adds a card polish build the same way. The current members therefore do
  not represent the full delivery scope.
- Parking required work does not deliver the promised outcome. The epic stays open unless the
  maintainer explicitly changes its scope and acceptance; closing the original members alone
  cannot complete the refresh.
- Keep plain browser JavaScript/CSS and the two-route host contract. Framework changes, Effect,
  new services and W-20's additional themes are outside this epic. W-12 and W-29 stay done as
  records of the earlier work.

## Order
1. **W-40: card audit (spike).** Draft the legend first and run a glance test on real cards.
   Its colour findings go into W-14's questions, so W-14 depends on it. Its layout, label and
   repetition findings become a card polish build. Its screenshots are the baseline. It can run
   alongside the header.
2. **W-36: compact header.** Build against existing colour tokens. Capture the baseline before
   the first UI edit and establish the later Legend button's position.
3. **W-14 and W-35: decisions.** Resolve palette and details questions with the maintainer,
   together if convenient. Each decision gates its own build; the questions can also be
   discussed before the header is finished.
4. **The resulting card polish, palette and details builds.** Add each to `items`, between the
   discussions and W-37, depending on the item that created it. Add their slugs to W-37's
   `depends_on`. The card polish build owns layout, hierarchy, labels and repeated marks; the
   palette build owns agreed colour and non-colour progress cues; the details build owns the
   chosen interaction and its routing/shortcut integration.
5. **W-37: legend.** Finish it after the header and the resulting builds, against the cards,
   palette and dialog behaviour that will ship. W-40's draft legend is its starting text.
6. **Combined verification and release, owned by this epic.** Builds can be reviewed and merged
   separately; the whole pass ships in one release after the checks below.

## Design review references
The wireframes are alternatives for discussion, not acceptance evidence or recorded decisions.
Use the reference labels when giving feedback so the header and details images' A/B/C labels
cannot be confused.

| Work item | Images and review focus |
| --- | --- |
| [W-36 — Header](compact-header-with-version-and-github-links.md#design-references) | HEADER-A/B/C, HEADER-COMPARE and HEADER-PHONE: compare hierarchy, search access, board space and wrapping. [Header gallery](../header-wireframes.md). |
| [W-35 — Details](item-details-open-in-a-native-dialog.md#design-references) | DETAIL-A–F and the two DETAIL-PHONE sheets: compare reading, relation discovery and moving through an epic. [Details gallery](../item-detail-concepts.md). |
| [W-40 — Card audit](audit-what-each-card-mark-tells-a-reader.md) | [BOARD-BASELINE](../backlog-assets/epic-progress-reads-done.webp) is an actual pre-refresh screenshot showing the misleading 0/4 bar. Use real cards for the audit; the wireframes are layout studies. |

For useful review feedback, name the reference, the task being attempted and what helps or
gets in the way; include a case such as a long title, many members or a narrow host. Record the
chosen references and refinements in W-36 and W-35 before their implementation. The current
recommendations (HEADER-B, DETAIL-D and DETAIL-E) remain proposals.

W-14 owns palette decisions, W-40 owns the meaning audit, and W-37 explains the final rendered
cues. Drawn symbols, progress bars and the Legend button do not settle those items. Production
keeps the shared `rem`, theme, embedding and accessibility requirements below; generated
wireframes do not demonstrate that those checks pass.

## Shared interaction and sizing requirements
- Modal UI uses native `<dialog>`, an accessible name, suitable initial focus, a visible
  dismissal control (Close or Cancel), and Escape affecting only the topmost dialog. A heading
  may use `tabindex="-1"`; do not put `tabindex` on `<dialog>` itself.
- New item, keyboard help and Legend suppress board character shortcuts. Details retain j/k,
  c and e when character shortcuts are enabled and focus is outside editable controls. Another
  modal above details suspends those shortcuts. Preserve the existing disable-shortcuts setting.
- Closing details returns focus to the selected item's current card/list row, including after
  j/k or a live redraw. Closing a nested dialog returns focus inside details. If a target no
  longer exists, use a logical fallback within the board. Details dismissal keeps the address
  and history in sync. Backdrop dismissal is a per-dialog policy, not automatic with
  `showModal()`.
- W-35 settles modality and embedding scope. A native modal makes the rest of its document
  inert, including host controls. If a non-modal desktop inspector is chosen, record that
  exception and its narrow-screen behaviour before building.
- Use `rem` for new or changed typography, spacing, fixed dimensions, radii and responsive
  thresholds. Flexible layout units and a prose measure in `ch` remain appropriate. Scope
  styles under `.bb`; do not force the host's root font size or add an unrelated whole-file
  conversion. W-37 also covers shared New item and keyboard-help dialog sizing.
- Reuse the agreed colour tokens and card cues across the header, details and legend. Carry
  meaning alongside colour. Preserve reduced-motion support, visible focus and usable targets.

## Combined verification
- Use the starter backlog, this backlog and a six-field backlog with long titles and epic/tag
  values. Include ordinary items, epics, unfinished dependencies, closed/parked items, custom
  priorities and colour overrides, plus writable and read-only states.
- At a root reference size of 16 CSS pixels, test widths corresponding to `68.75rem`, `100rem`,
  `20rem` and `24.375rem`. Keep each viewport's CSS-pixel width fixed while changing root text
  size to 14, 16 and 18 CSS pixels; resizing both together would hide text-scaling problems.
  These measurements do not prescribe fixed pixel sizing in shipped CSS. Also check a narrow
  mount inside a wider host page.
- Check standalone and embedded layouts in light and dark for clipped controls, header
  overflow, lost content and unreachable scrolling. Include a host container with limited
  height and `overflow: hidden`, plus a focusable host control. Verify the chosen modal/host
  interaction and that host controls recover when the last modal closes.
- Exercise keyboard-only and VoiceOver on macOS: open/close, Tab/Shift-Tab, nested dialogs,
  shortcuts, title announcements on item switches and valid focus return. Live updates must
  preserve scroll, focused controls and uncommitted values.
- Check contrast on actual surfaces against W-14's targets and verify the agreed non-colour
  cues directly. Legend samples match final rendering and configuration; a legend does not
  replace accessible names and explanations on the cards themselves.
- Run the full Node/browser suites, backlog checks and managed-index checks on the combined
  result. Use relevant checks during individual builds and repeat broader checks when changes
  affect their results. Record actual commands/results, manual observations and screenshot
  links here; do not report unperformed VoiceOver checks as passed.

## Acceptance
- All required members are done, including the builds added after W-40 and the decisions, and the
  combined checks have evidence. Any approved scope changes are recorded explicitly.
- Comparable before/after screenshots show the board, an item's details and an epic's details;
  final screenshots also show the legend. Save them in `docs/backlog-assets/`, with matching
  data, filters, viewport and root text size for each comparison.
- One release carries the pass, following README's releasing procedure: consistent
  `core.VERSION`, PROMPT example and CHANGELOG, a tag and published GitHub release. Update user
  documentation for the header, legend and changed interactions. The header's version and
  release link identify the version actually shipped.
- Target no additional host routes, runtime, configuration migration or integration steps.
  Verify that against the final diff and record the actual update impact in the CHANGELOG;
  do not promise unchanged instructions before that review. Projects still follow the normal
  tagged-copy update procedure.

## Verification record
Pending implementation. Add commands/results, manual observations and evidence links as the
work is verified; keep the front matter and index current separately.
