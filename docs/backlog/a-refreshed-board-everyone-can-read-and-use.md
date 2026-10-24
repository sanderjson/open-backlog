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
items: [audit-what-each-card-mark-tells-a-reader, deliver-five-project-grayscale-trial, grayscale-trial, compact-header-with-version-and-github-links, item-details-open-in-a-native-dialog, the-board-works-in-grayscale, retire-the-trial-tooling-for-v0-7-0, colour-palette, visual-legend-for-card-symbols]
depends_on: []
related: [collect-and-answer-feedback-from-the-projects-using-the-kit, header-layout, the-board-fits-a-host-page, themes]
horizon: now
---

# A refreshed board everyone can read and use

The board's next visual pass: a compact header, readable item details, a board that works in
grayscale, then a measured palette and a legend that describes the finished cards. It ships in
two releases: v0.7.0 makes the board usable without colour, v0.8.0 brings colour back.

## Why
W-29 made the board lay out the same in every project. The header still spends its height on a
large title and boxed counters. Card marks are explained only one tooltip at a time, colours
were picked by eye, and some meanings rely on hue alone. The details view has no agreed reason
for its edge placement. These changes share screens and checks: relative sizing, light and
dark, standalone and embedded use, keyboard operation and screen-reader behaviour. The legend
must describe the palette and card cues that actually ship.

## Scope and decisions
- **Grayscale first (maintainer decision, 2026-10-18, after W-40's glance test):** colour never
  carries important information on its own. The board is designed and checked in grayscale first
  (W-41), and colour comes back afterwards through W-14's palette build, repeating meanings the
  board already shows in words, shapes or icons.
- W-40 is a spike: it audits the card marks before anything is decided. W-36, W-41 and W-37 are
  builds. W-14 and W-35 remain discussions: their recommendations are not
  recorded maintainer decisions. Ask about unresolved choices before selecting the palette or
  details interaction. Routine implementation choices within an agreed design need no further
  decision session.
- A completed discussion is not an implemented feature. Before marking either discussion done,
  create and link its separate build, add that build to this epic, and update the legend's
  prerequisites. The current members therefore do not represent the full delivery scope.
- Parking required work does not deliver the promised outcome. The epic stays open unless the
  maintainer explicitly changes its scope and acceptance; closing the original members alone
  cannot complete the refresh.
- **Plan, agreed 2026-10-18:** learn and build at the same time. The maintainer tries every
  project's board in grayscale for a few days (W-42), alongside W-39's feedback round, and those
  notes decide W-41's questions. Meanwhile the header and the item details can be built, since
  neither depends on what the trial will teach; if they haven't started when the trial ends,
  they simply follow it. W-41, the palette and the legend follow the trial.
- **Scope change, 2026-10-21:** the trial became an installable prerelease, v0.7.0-preview.1
  (W-45), with provisional W-41 cues and trial tooling. v0.7.0 starts from the preview.
- **Two releases:** v0.7.0 carries W-36, the details build and W-41; v0.8.0 carries the palette
  build and W-37. Projects get the new header and details sooner, and their next feedback covers
  them. Each release runs the combined verification for what it carries.
- Keep plain browser JavaScript/CSS and the two-route host contract. Framework changes, Effect,
  new services and W-20's additional themes are outside this epic. W-12 and W-29 stay done as
  records of the earlier work.

## Order
Alongside all of it: **W-42, the grayscale trial,** a few days in every project, run with
W-39's feedback round (W-39 isn't part of this epic). The five projects run v0.7.0-preview.1 (W-45);
W-42 records each install. Its notes decide W-41's questions, which depends on it, and may adjust the header and
details before v0.7.0.

**Done**
1. **W-40: card audit (spike).** A draft legend, findings C1 to C8, L1 to L9 and E1 to E3, and a
   glance test. Its captures are the baseline.

**v0.7.0: the board works without colour**
2. **W-36: compact header.** The first build. The maintainer picks a header reference
   (HEADER-A, B or C, or a combination) and the Group control (buttons or a dropdown). Built in
   grayscale from the start. Capture the baseline before the first UI edit and establish the
   later Legend button's position.
3. **W-35: item details, decided now.** One decision session settles modality, host scope,
   layout references, where today's content goes, j/k order and the address. None of these wait
   on the trial. Its build is then added to `items` here, before W-41, and to W-37's
   `depends_on`. The details draw their marks with the shared card helpers, so W-41 changes them
   there later without rework.
4. **W-41: the board works in grayscale.** After the trial: its three questions (priority labels,
   state marks, the one epic cue) are settled from the trial notes, then built across the whole
   board, details included. It owns layout, hierarchy, labels, repeated marks and every
   non-colour cue, including epic progress.
5. **v0.7.0 release:** combined verification for the header, details and W-41, in grayscale and
   in today's colours. [W-48](retire-the-trial-tooling-for-v0-7-0.md) is the release checklist:
   what happens to the trial tooling, the release-notes fix and the update note for preview
   installs.

**v0.8.0: colour comes back**
6. **W-14: palette decision, then its build.** Decides which colours return and where, on top of
   W-41's cues and the trial's "what colour you didn't miss" notes. The build is added to
   `items` before W-37 and to W-37's `depends_on`.
7. **W-37: legend.** Last, against the cards, palette and dialogs that ship. W-40's draft legend
   is its starting text.
8. **v0.8.0 release:** the full combined verification below.

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
- Reuse the agreed colour tokens and card cues across the header, details and legend. Colour
  only repeats a meaning already carried by a word, shape or icon; every surface is checked with
  colour removed. Preserve reduced-motion support, visible focus and usable targets.

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
- Repeat W-40's glance test on the finished board, once in grayscale and once in colour: state,
  epic progress and priority must be readable both ways.
- Check contrast on actual surfaces against W-14's targets and verify the agreed non-colour
  cues directly. Legend samples match final rendering and configuration; a legend does not
  replace accessible names and explanations on the cards themselves.
- Before v0.7.0, run every check above that applies to the header, details and W-41, with
  today's colours; before v0.8.0, run them all again with the new palette and the legend.
- Run the full Node/browser suites, backlog checks and managed-index checks on the combined
  result. Use relevant checks during individual builds and repeat broader checks when changes
  affect their results. Record actual commands/results, manual observations and screenshot
  links here; do not report unperformed VoiceOver checks as passed.

## Acceptance
- All required members are done, including the details and palette builds added after their
  decisions, and both releases' checks have evidence. Any approved scope changes are recorded
  explicitly.
- Comparable before/after screenshots show the board, an item's details and an epic's details;
  final screenshots also show the legend. Save them in `docs/backlog-assets/`, with matching
  data, filters, viewport and root text size for each comparison.
- Two releases carry the pass, v0.7.0 (header, details, grayscale) and v0.8.0 (palette,
  legend), each following README's releasing procedure: consistent `core.VERSION`, PROMPT
  example and CHANGELOG, a tag and a published GitHub release. Each updates the user
  documentation for what it changes. The header's version and release link identify the version
  actually shipped.
- Target no additional host routes, runtime, configuration migration or integration steps.
  Verify that against the final diff and record the actual update impact in the CHANGELOG;
  do not promise unchanged instructions before that review. Projects still follow the normal
  tagged-copy update procedure.

## Verification record
Pending implementation. Add commands/results, manual observations and evidence links as the
work is verified; keep the front matter and index current separately.
