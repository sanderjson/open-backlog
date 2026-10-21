---
title: Item details open in a native dialog
id: 35
status: ready
priority: mid
type: discuss
area: board
weight: 18
tags: [ui, a11y]
created: 2026-10-18
depends_on: []
related: [a-refreshed-board-everyone-can-read-and-use, compact-header-with-version-and-github-links, visual-legend-for-card-symbols, the-board-fits-a-host-page, scope-keys-to-the-board]
horizon: next
---

# Item details open in a native dialog

## Why
Opening an item or an epic slides a fixed-width sheet in from the right. The rest of the window
is a blurred scrim and the board under it is inert. The board provides context, but the current
layout has no agreed reason to put the details at the edge instead of giving the text a centred
reading layout or making a usable inspector beside the board.

The sheet is also built by hand, while the New item and Help dialogs are native `<dialog>`
elements. `renderSheet()` writes an `<aside role="dialog" aria-modal="true">` into the page, then
does by hand what `showModal()` does natively: it sets `inert` on the header, toolbar and main,
keeps Tab inside the panel, closes on Escape and on a scrim click, and puts focus back on the
card. Each of those is code that can drift from what browsers and assistive technology expect,
and none of it puts the sheet in the top layer. On a host page, an ancestor's `overflow` or
stacking context can still clip or cover it. W-38 includes this discussion and its resulting
build; the recommendations below remain proposals until the maintainer records a choice.

**When:** decided now, in one session with the header, without waiting for W-42's grayscale
trial: none of the questions below depend on it. The build follows the header and ships in
v0.7.0. The details draw status, priority and progress with the shared card helpers, so W-41
changes those marks later in one place; this build keeps using the helpers rather than drawing
its own.

## Current behaviour to keep
- `?item=<slug>` in the address is what opens an item. Back closes it, and a shared link opens
  it.
- j and k step through items, c copies the prompt, e opens the file, all with details open,
  character shortcuts enabled and focus outside editable controls. Help can open above details.
- Live updates redraw the sheet in place, keeping scroll, the focused control and any
  uncommitted value.
- Closing returns focus to the item's card or list row, even when the board redrew it meanwhile.
- Links between items (Depends on, Unblocks, Related, an epic's items) switch items without
  closing.
- From an epic's sheet, the New item dialog opens over it. Closing that dialog or Help returns
  focus inside details; only closing details returns focus to the selected card/list row.

## What today's sheet shows
Every part needs a place in the chosen layout, or a recorded decision to drop it. The wireframes
leave most of these out: DETAIL-D, E, F and both phone sheets show fields as one line of text
and none of the rest, and DETAIL-A draws Why and Acceptance in boxes that look like editors.

- **Editable fields** on a writable board: Weight and a select for each choice field. On a
  read-only board, chips instead.
- **The file path**, which opens the item in the editor (e), and **Copy as prompt**, or
  **Copy epic as prompt** on an epic.
- **Problems and suggestions** that `check` reports for this item.
- **Tags** (each filters the board), **branches** and the **created** date.
- **Epic membership:** the epics it's in with their progress, a way out of each, and "Add to
  epic…" on a writable board.
- **The start notice:** "waits on n open items" or "it can start now".
- **On an epic:** its progress, next up, its items in work order with what each waits on, what
  holds it up from outside, and a new item in it.
- **Depends on, Unblocks and Related,** each with its status dot.
- **The body,** rendered Markdown with links that open other items or files.

## To agree before building
- **Modal or not.** Either the details take over until they're closed (a modal dialog, as
  today), or the board stays usable beside them, so clicking another card switches the item (a
  non-modal side panel, like a split view). Non-modal supports comparing and selecting items
  while details stay open. It requires two coordinated views, the board reflowing narrower,
  shortcuts scoped to the focused view and an explicit narrow-screen layout.
- **Embedding scope.** A native modal blocks interaction with the rest of its document,
  including the host page's own header and controls, whereas today's manual `inert` loop covers
  the board's regions. Record whether that document-wide scope is acceptable. A non-modal
  desktop inspector is an alternative if the host must remain usable; it needs an explicit
  narrow-screen policy. Do not assume that `showModal()` is scoped to the board's container.
- **Where it sits.** If modal: centred, with a reading width for the prose (about 70ch) and the
  fields beside or above it on wide screens, or kept at the edge with the board dimmed out. If
  non-modal: the panel's width, and whether the board shrinks or the panel overlaps it. Full
  screen below the narrow breakpoint is the recommendation; record the chosen narrow layout
  and whether it becomes modal as part of the decision.
- **Reading and epic navigation.** Choose among the design references below, or record which
  parts to combine. Decide whether ordinary items and epic browsing need different layouts,
  whether the active epic context belongs in the address, and how member selection or outline
  disclosure affects Back. Items may belong to more than one epic. The drawings' Previous/Next
  controls follow epic order; existing j/k follows board order. Keep that shortcut contract
  unless a change is explicitly agreed.
- **Where today's content goes.** For the chosen references, place each part listed under
  "What today's sheet shows", above all the editable fields and the epic section, or record
  that it's dropped and why. Editing the Markdown body in the board is out of scope.
- **One dialog or one per item.** Recommended: **one** `<dialog>` that stays in the page and is
  filled with the current item. Eagerly rendering a dialog for every item adds unused content
  and requires unique IDs for each copy. Because the address picks one item, one persistent
  dialog avoids that work without affecting the visible behaviour.
- **Focus on open and on switching.** Recommended: focus the heading (`tabindex="-1"`) on open,
  so the content starts at its title. Do not add `tabindex` to the native `<dialog>` itself.
  When j, k or a link intentionally switches items, move focus to the new heading so a screen
  reader announces the change. A live refresh of the same item must preserve focus, reading
  position and uncommitted field values instead.

Recommendation: one modal `<dialog>` opened with `showModal()`, centred on wide screens with a
reading width for the prose, and full screen on narrow ones. That gives the left side a reason
(the details are the focus, and the board behind is plainly set aside), uses native top-layer,
inert and Escape behaviour, and follows the other dialogs' shared conventions. Backdrop
dismissal needs explicit configuration or a handler. The non-modal split view remains an option
for the maintainer to settle, not an alternative already rejected by this recommendation.

## Building it (after the decision)
The following describes the recommended modal implementation. Adapt it to the recorded choice
if a different interaction is selected, and carry W-38's relevant shared requirements into the
separate build.

- The `<dialog>` element is created once in `skeleton()` beside the other two. `renderSheet()`
  fills its contents and never replaces the element. A replaced or re-shown dialog loses focus
  and the open state.
- `aria-labelledby` points at the title (with the Epic badge for an epic). The `aside` and its
  `role` go, along with the manual Tab trap, the `inert` loop and the scrim element. The
  backdrop is `::backdrop`, and a click on it closes. Use `closedby="any"` where browsers support
  it, with a click handler as the fallback.
- Handle the dialog's `cancel` and `close` paths so native dismissal and address-driven
  rendering cannot leave an open dialog with no item, or a closed dialog with `?item` still
  set. Back, Escape, the close button and backdrop dismissal must converge on the same route
  state. A nested dialog handles its own Escape without clearing the underlying item's address.
- `key()` currently skips the character shortcuts whenever `dialog[open]` matches. With the item
  sheet as a dialog, j, k, c and e would stop working, so that check must exclude the item dialog
  and keep blocking them in New item, Help and the Legend (W-37). Base this on the active
  topmost dialog and preserve the typing guard and character-shortcut preference. Do not send
  focus to inert board controls from a shortcut while the modal is open.
- Keep the manual focus return to the card (by slug, as now). The browser's own focus
  restoration aims at the element that had focus before, which a live redraw may have replaced.
- Keep and verify explicit background scroll locking (`bb-locked`); do not assume native
  modality alone provides the required scrolling behaviour. Closing a nested dialog must not
  release a lock still needed by details.
- Open and close animations stay under `prefers-reduced-motion: reduce`, like the current slide
  and fade.
- New sizes and spacing in `rem`, as in W-36 and W-37.

## Acceptance
- A decision recorded here on modality, placement and one-or-many, with a sketch or screenshot of
  the agreed layout in `docs/backlog-assets/`, and explicit answers for embedding scope and
  focus on opening/switching. Resolve these questions with the maintainer before migration.
- A separate build item for the decision, whose acceptance covers: everything under "Current
  behaviour to keep" and "What today's sheet shows", in the places the decision gives them; keyboard-only use (open, Tab cycles inside, Escape closes, focus returns to
  the card); VoiceOver on macOS reading the dialog's name on open and the new title after j or k;
  the board mounted in a host page inside a container with `overflow: hidden`; root text sizes
  equivalent to 14, 16 and 18 CSS pixels with W-38's fixed viewport widths and narrow-host
  checks; nested New item and Help behaviour; read-only use; the grayscale rule from W-38 and
  W-41 (status, progress and relations readable with colour removed); and light and dark
  screenshots of an item and an epic. Test host controls against the agreed modality and reduced-motion use.
- Before marking the discussion done, link that build here, make it depend on this item, add
  it to W-38's `items` before W-41, and add it to W-37's `depends_on`. W-38 owns the combined
  verification and the v0.7.0 release; this discussion alone does not deliver the new details
  UI.

## Decision record
Pending the maintainer's choices. Record modality, host interaction, placement, one-or-many,
focus policy, the selected design references and refinements, where today's content goes, epic
context and navigation/history policy, and the follow-up build link before marking this item
done.

## Design references
[The details gallery](../item-detail-concepts.md) compares the same fictional six-member epic
with two members done. Use the labels below to identify images in feedback. These generated
wireframes explore reading and navigation; their sample symbols and grayscale surfaces do not
define the palette, card semantics, measured dimensions or modal/host policy.

| Reference and image | What it explores | Perspective for review |
| --- | --- | --- |
| [DETAIL-A — Related cards](../backlog-assets/item-detail-concept-a-related-cards.webp) | Article with grouped relation microcards and an epic member strip. | Makes connections easy to recognise; check whether the extra framing competes with the prose. |
| [DETAIL-B — Epic navigator](../backlog-assets/item-detail-concept-b-epic-navigator.webp) | Persistent member microcards beside the selected article. | Supports direct movement through an epic; compare its density and title space with DETAIL-E. |
| [DETAIL-C — Epic overview](../backlog-assets/item-detail-concept-c-epic-overview.webp) | Member grid with a neighbouring article. | Gives the epic more presence; assess reading width and scanning with many members. |
| [DETAIL-D — Reading first](../backlog-assets/item-detail-concept-d-reading-first.webp) | One reading column with ordinary relationship links. | Strong starting point for ordinary items; the full member list requires returning to the epic. |
| [DETAIL-E — Plain epic list](../backlog-assets/item-detail-concept-e-epic-list.webp) | Flat member rows beside the article, without microcards. | Keeps direct navigation with less framing; check long lists, selection visibility and narrow containers. |
| [DETAIL-F — Epic outline](../backlog-assets/item-detail-concept-f-epic-outline.webp) | One epic document with the selected member expanded inline. | Suits reviewing work in order; long articles move later headings, and disclosure needs an explicit URL/focus policy. |
| [DETAIL-PHONE-CARDS — Microcard phone views](../backlog-assets/item-detail-concept-mobile.webp) | Member grid followed by a separate reading view. | Compare title recognition, touch spacing and the return path to all members. |
| [DETAIL-PHONE-LIST — Plain phone views](../backlog-assets/item-detail-concept-plain-mobile.webp) | Full-width member rows, then reading with text navigation. | Compare scanning and readable titles against the grid; preserve comfortable targets without boxes. |

Current recommendation for discussion: DETAIL-D for ordinary items and DETAIL-E for epic
browsing. Compare A/D for relationships, B/E for persistent navigation, and C/F for the epic
overview. The two phone sheets show successive views, not stacked dialogs. No layout is
approved; bring the chosen references and outstanding interaction decisions into the build.

## Notes

`renderSheet()`, `skeleton()`, `key()` and `close()` in [web/board.js](../../web/board.js);
`.bb-sheet`, `.bb-scrim`, `.bb-panel` and `.bb-dialog` in [web/board.css](../../web/board.css).
References: [the dialog element](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)
and the [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
including its advice on where initial focus goes in content-heavy dialogs.
