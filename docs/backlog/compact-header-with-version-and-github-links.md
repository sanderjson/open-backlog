---
title: A compact header with version and GitHub links
id: 36
status: ready
priority: mid
type: build
area: board
weight: 17
tags: ["ui", "layout"]
created: 2026-10-18
depends_on: []
related: [a-refreshed-board-everyone-can-read-and-use, header-layout, visual-legend-for-card-symbols, item-details-open-in-a-native-dialog, colour-palette]
---

# A compact header with version and GitHub links

## Why
The maintainer still finds the header visually poor after W-12's wrapping fix. The title is too
large, the boxed statistics take up too much room, and the search field stays narrow while a
large gap separates it from the controls on the right. The requested redesign has a smaller
logo, a GitHub link, a visible version and better use of the available space.

W-12 remains a completed layout fix. This new design work belongs to W-38, with a compact
identity and useful controls taking priority over decoration. It's W-38's first build and ships
in v0.7.0 with the details build and W-41. Before it starts, the maintainer picks a header
reference and the Group control (see "Design references"). Notes from W-42's grayscale trial may
adjust it before the release.

## Proposed direction
- **Compact identity:** use the existing mark at approximately `1.25rem`, a restrained project
  title around `1.125rem`, and a secondary directory/connection label. The configured backlog
  title stays the primary identity when the board is embedded in another project.
- **GitHub and version:** link to `https://github.com/sanderjson/open-backlog` and show the
  installed kit version from `core.VERSION`, with a link to that version's release notes.
  Make clear that these identify open-backlog, rather than the host project's repository or
  release. Do not fetch GitHub or imply that the installed version is the latest release.
- **Compact statistics:** replace the large boxed counters with inline, labelled counts. Keep
  their existing filter actions, selected states and configured status/priority labels.
- **Use the available width:** let search expand into unused space. Keep the visible item count,
  Group and Board/List controls together and easy to find. Keep filters in their own row, in
  the order established by W-12; applying a filter must not shift the controls.
- **Utilities:** keep New item prominent, with theme and keyboard help secondary. Provide a
  labelled Legend entry beside keyboard help when W-37 lands. W-37 owns the button and dialog;
  establish their place here without adding a non-working trigger. The Legend arrives in
  v0.8.0; this header ships in v0.7.0 without it.
- **Responsive layout:** let statistics move to their own compact row when space requires it.
  On phones, give search a full row and let controls wrap in deliberate groups. Respond to the
  board container's width when embedded, rather than assuming it fills the viewport.
- **Units:** use `rem` for typography, spacing, padding, control dimensions, radii and responsive
  thresholds. Do not introduce fixed `px` sizing for the redesigned header. Use flexible layout
  units where appropriate and check that changing the root text size scales the result.

Wide-screen layout to explore during the build:

```text
[small mark + project title / directory] [inline counts] [version GitHub Legend keys theme New]
[Search expands into available space..................] [count Group ...] [Board/List]
[field filters ...] [Epic] [Tag] [Can start] [Hide closed] [Clear]
```

This is a layout direction, not an approved pixel-perfect design. The visual result is part of
the later build's review.

## Acceptance
- The shipped header follows the compact direction above: smaller identity, discoverable GitHub
  and installed-version links, inline statistics and an expanding search field. Record before
  and after screenshots and the space recovered above the board in `docs/backlog-assets/`.
- Use `rem` for the redesigned header's sizes and spacing. Follow W-38's root-size checks at
  fixed viewport widths, without overriding the host's root text size or shrinking text to
  save space. Keep styles scoped under `.bb` and interaction targets usable.
- Check the starter backlog, this backlog and a six-field backlog with long titles, epic names,
  tags and field values. Check approximately `68.75rem` and `100rem` wide, phone widths around
  `20rem` and `24.375rem` at W-38's reference root size, and a narrow mount inside a wider host
  page. Keep those viewport widths fixed while varying the root size. Controls remain visible,
  usable and within their container, without header scrolling or overlap.
- Preserve search, query chips, all filters, statistics-as-filters, Group, Board/List, Clear's
  reserved space, connection feedback, New item, keyboard help, theme controls and the
  read-only state. Preserve keyboard order, accessible labels and visible focus indicators;
  smaller icons must retain comfortable interaction targets.
- Grayscale first (W-38): nothing in the header means something by colour alone, for example the
  connection state and selected counts. Check the header with colour removed.
- Check light and dark themes and both standalone and embedded use. Use existing semantic
  colour tokens rather than adding local colour values. This build can start before W-14;
  W-38's combined verification checks the header again with the implemented palette.
- Version text comes from `core.VERSION`; release and repository links identify the kit
  explicitly. No new host route, framework, package or network lookup is needed.
- Run the backlog check and the relevant existing Node/browser checks when implementing.
  Update header layout assertions for the new design while retaining their checks for stable
  controls and narrow containers.

## Design references
[The header gallery](../header-wireframes.md) contains the full-size images and editable SVGs.
Use these reference labels in review comments; the letters drawn inside the images belong to
this header set, not the separate details set. All options remain proposals.

| Reference and image | What it explores | Perspective for review |
| --- | --- | --- |
| [HEADER-A — Balanced rows](../backlog-assets/header-wireframe-a-balanced-rows.webp) | Smaller identity, inline counts and expanding search, with distinct row roles. | Closest to the current toolbar contract; compare the height saved before changing control placement. |
| [HEADER-B — Search first](../backlog-assets/header-wireframe-b-search-first.webp) | Search moves into the identity bar; counts and view settings form the next row. | Strong candidate when finding items is the main task; explicitly agree the changed search/count grouping. |
| [HEADER-C — Compact workbench](../backlog-assets/header-wireframe-c-compact-workbench.webp) | Two wide-screen rows and a Group dropdown. | Prioritises board space; test long titles, extra fields and larger root text before accepting the density. |
| [HEADER-PHONE — Phone comparison](../backlog-assets/header-wireframes-mobile.webp) | A phone treatment for each desktop option. | Compare control order, visible filters and reachable targets, rather than shrinking the desktop header. |
| [HEADER-COMPARE — Desktop comparison](../backlog-assets/header-wireframes-comparison.webp) | All three headers with the same board data. | Use for a fair comparison of hierarchy and recovered board space. |

The recommendation to explore HEADER-B is a review starting point, not a recorded choice.
Record the selected reference or combination and any changed row roles or grouping behaviour
here before implementing it. The grayscale palette, snapshot counts and version text are
illustrative; production uses semantic tokens, live data, `core.VERSION` and `rem` sizing.

## Notes

`skeleton()`, `renderStats()` and `renderToolbar()` in [web/board.js](../../web/board.js),
header/toolbar styles in [web/board.css](../../web/board.css), the existing mark in
[web/icon.svg](../../web/icon.svg), and `VERSION` in [web/core.js](../../web/core.js).
W-38 owns the combined verification and the v0.7.0 release.
