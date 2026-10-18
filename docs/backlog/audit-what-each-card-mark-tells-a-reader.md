---
title: Audit what each card mark tells a reader
id: 40
status: done
priority: mid
type: spike
area: board
weight: 17
tags: [ui, a11y]
created: 2026-10-18
depends_on: []
related: [the-board-works-in-grayscale, colour-palette, visual-legend-for-card-symbols, epic-cards-stand-out]
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

## Audit record
Captured on 2026-10-18 from v0.6.0's board on a read-only host, at a 1600px wide window. The
backlog was a throwaway fixture with one card in every state:
- six statuses (idea, ready, in progress, review, parked, done);
- three priorities and none, four types and three areas;
- an item that waits, a branch and a long title;
- three epics: at 1/5 with members in mixed states, at 0/4 with every member ready, and at
  2/2 with all done.

The IDs below (W-1 to W-17) are the fixture's cards, not this backlog's items. The images
aren't drawn on; the tables name each card by its ID instead. Read-only means the details show
chips where a writable board has selects.

| Capture | Light | Dark |
| --- | --- | --- |
| Board grouped by status | [AUDIT-BOARD-LIGHT](../backlog-assets/card-audit-board-by-status-light.webp) | [AUDIT-BOARD-DARK](../backlog-assets/card-audit-board-by-status-dark.webp) |
| Board grouped by area (glance test) | [AUDIT-GLANCE-LIGHT](../backlog-assets/card-audit-glance-light.webp) | [AUDIT-GLANCE-DARK](../backlog-assets/card-audit-glance-dark.webp) |
| List | [AUDIT-LIST-LIGHT](../backlog-assets/card-audit-list-light.webp) | [AUDIT-LIST-DARK](../backlog-assets/card-audit-list-dark.webp) |
| Item details (W-4, waiting) | [AUDIT-ITEM-LIGHT](../backlog-assets/card-audit-item-details-light.webp) | [AUDIT-ITEM-DARK](../backlog-assets/card-audit-item-details-dark.webp) |
| Epic details (W-9, 1/5) | [AUDIT-EPIC-LIGHT](../backlog-assets/card-audit-epic-details-light.webp) | [AUDIT-EPIC-DARK](../backlog-assets/card-audit-epic-details-dark.webp) |

### Draft legend
Every mark on a card, a list row and an item's details, as v0.6.0 draws it. The last column
names the findings below.

| Mark | Where | What it means | Findings |
| --- | --- | --- | --- |
| `W-4`, small and muted | Card top left, list ID column, before the details title | The item's short ID, a handle that never changes. | L3, E1 |
| EPIC badge, violet, with a layers icon | Card, list title, above the details title | The item is an epic: it lists other items. | L1 |
| Violet frame with a card stacked behind | Epic cards | The same: an epic. | L1 |
| Priority bars, top right: red 3, amber 2, grey 1, none 0 | Cards; the list adds the word | The item's priority. The card has no label, only a tooltip. | C6, L4 |
| Summary, muted, up to two lines | Card, list | The first paragraph of the item. | |
| Segmented bar, `done/total` and a layers icon | Epic cards, the list's Epic column, epic details (large) | Progress of the epic's members: a segment per member in its status colour, done first. | C1, C2, L1, L3 |
| A number in a grey box | Card bottom left, list Weight column, "Weight n" in details | Work order: lower comes first. Labelled only in details. | L3, E1 |
| Chip: a dot and a value | Card, list, details | One field's value: status (unless the board is grouped by it), type, area and so on. The field's name isn't shown. | C3, C5, L5 |
| Branch icon | Card signals | Branches are recorded for the item. The names are only in the tooltip. | L6, E2 |
| Lock and a count | Card signals, list "Waits on" column, details notice, epic steps | It waits on that many unfinished items. | L6, L9 |
| Hooked arrow and a count | Card signals | That many items list this one in `depends_on`, finished ones included. | L6, E2 |
| Green play triangle | Card signals (only when the backlog has an active status), details notice, epic "Next up" | It can start now: open, in a startable status, nothing unfinished before it. | C4, L7, E3 |
| Faded card | Done and parked cards; in the list, only the title cell fades | Closed: done or set aside. | C8 |
| Strikethrough | Epic steps in details | Done, and also parked. | L8 |
| Numbered circle in the status colour, filled when done | Epic steps | Its place in work order, and its status. | C2 |
| Green-tinted row and "Next up" panel | Epic details | The first member that can start. | C4 |
| Status dot | Column heads, Depends on, Unblocks and Related links, an epic's outside blockers | That item's status, by colour alone (the name is in a tooltip). | C7 |
| Violet epic pill, with `1/5` in details | List Epic column, details "Epics" row | The epics the item is in, and their progress. | L3, C5 |
| "1 of 5 items done · 1 in progress · 1 can start · 1 waiting · 1 set aside" | Epic details | Progress, in words. | None: the clearest progress statement on the board. |
| Live dot, green | Header, before the path | The board is following the files. | C4 |
| Boxed counters | Header | Counts that also filter. | W-36 owns these. |

### Findings
**Colour and meaning, for W-14:**
- **C1. The epic bar is always full.** Already under "Where colour reads as done".
- **C2. The bar can't show "waiting".** A member that waits keeps its status colour. So W-4
  (ready, waiting on W-2) is a teal segment exactly like W-1, which can start. The sentence in
  the epic's details tells them apart; the bar doesn't.
- **C3. Ready (teal) and Done (green) look alike.** Already recorded.
- **C4. Green means five things:** done, can start, next up, live and success. Already recorded.
- **C5. Different fields share colours.** Each field cycles through the tones from the start, so
  on one card Build (type) and Board (area) are both violet, and Chore and Core are both orange.
  Status colours turn up in other fields too: Discuss and Cli are teal like Ready, Review is
  violet like Build, and the Epic type is blue like In progress. The chip never names its field,
  so colour is the only clue to which field it belongs to, and that clue points the wrong way.
- **C6. Low and no priority look the same.** One grey bar against three empty ones (W-3 against
  W-7). The low tone is close to the empty bars' colour.
- **C7. Status dots carry status by colour alone,** beside relation links and in column heads.
- **C8. Done and parked fade the same way.** Outside the Status grouping, only the chip tells
  W-5 (parked) from W-6 (done). The list fades only the title cell, not the row.

**Layout, labels and repeats, for the card polish build:**
- **L1. "Epic" is said four times on a card:** the badge, the frame and stack, the layers icon
  and the Epic type chip. In its details it's said three times: the badge, the chip and the
  section heading.
- **L2. The title shares its row** with the ID, the badge and the priority bars. W-8's title
  takes two lines at 1600px; BOARD-BASELINE shows three in a narrow column.
- **L3. Bare numbers:** the weight box right beside `W-n`, `0/4`, the `1/5` on the details
  Epics chip, and the list's Waits on count. Only the details label the weight.
- **L4. Priority has three forms:** bars on the card, bars with the word in the list, and a
  coloured chip in the details.
- **L5. Chips never name their field.** Build or Board, Chore or Core: the reader has to know
  the backlog's values.
- **L6. The signals are small and faint.** Lock-1 and arrow-1 look alike, and the branch icon
  has no count.
- **L7. An epic can show the play mark** (W-14), though nobody works on an epic itself. Either
  say what "can start" means for an epic or leave the mark off.
- **L8. Strikethrough marks done and parked members alike** in an epic's details.
- **L9. A waiting item still says Ready** (W-4: Ready and a lock). The status is what the file
  says; the lock is what the board works out. The card shouldn't let the word win.

**Explanation only, for W-37:**
- **E1.** The ID never changes. The weight is work order and can change.
- **E2.** The arrow's count includes finished items. The branch mark isn't checked against Git.
- **E3.** The play mark appears only when the backlog has an active status. A parked dependency
  still counts as unfinished.

**What works and should stay:** the sentence in an epic's details, the priority word in the
list, "Weight n" in the details, and the "Waits on" notice in the details.

### Glance test
Done by the maintainer on 2026-10-18 with AUDIT-GLANCE-LIGHT, then AUDIT-GLANCE-DARK. The board
was grouped by area, so a card's column didn't give away its state. For each card: its state,
each epic's progress, and its priority.

**What the maintainer read:**
- **State came from the status word alone:** ready, in progress, parked, or none (unless idea
  counts as a state). Nobody picked up "waiting" from the lock (W-4, W-7) or "can start" from the
  play mark (W-1, W-10 to W-14).
- **W-9:** read as 1/5, so 20% done, but the green, gold, blue, green, green segments confused.
- **W-14:** "says 0/4 but all green": the bar and the count disagree.
- **W-17:** read as 2/2 and done. The maintainer suggested a small check icon for done in place
  of the dot.
- **Priority wasn't recognised on any card.** Maybe the signal bars, the maintainer guessed, and
  suggested P0 to P3 instead.
- **Dark mode read the same as light.**

**Answer key:**

| Card | State | Priority |
| --- | --- | --- |
| W-1 | Ready, can start (and W-7 waits on it) | High |
| W-2 | In progress, with a branch | Mid |
| W-3 | In review (under way) | Low |
| W-4 | Ready, but waiting on W-2 | Mid |
| W-5 | Parked | Low |
| W-6 | Done | Mid |
| W-7 | Idea, waiting on W-1 | None |
| W-8 | In progress | High |
| W-9 | Epic, in progress, 1 of 5 done: one done, one in progress, one can start, one waiting, one parked | High |
| W-10 to W-13 | Ready, can start | Mid |
| W-14 | Epic, ready, 0 of 4 done | Mid |
| W-15, W-16 | Done | Mid, Low |
| W-17 | Epic, done, 2 of 2 | Mid |

**Read wrong or missed:** "waiting" (W-4, W-7), "can start" (every card with the play mark), the
epics' progress from their bars (W-9, W-14), and every priority. The glance test confirms C1, C2,
C6, L3, L4, L6 and L9.

**Decision that followed:** colour never carries important information on its own. The whole
board is designed in grayscale first, and colour is reintroduced afterwards
([W-41](the-board-works-in-grayscale.md), then W-14's palette).

### Where the findings went
- **C1 to C8:** W-14's questions. C2, C6, C7 and C8 have a non-colour side, which W-41 fixes
  first.
- **L1 to L9:** [W-41, The board works in grayscale](the-board-works-in-grayscale.md), the card
  polish build, widened to the whole board.
- **E1 to E3 and the draft legend:** W-37's starting text.

`card()`, `progress()`, `priority()`, `epicBadge()`, `chip()` and `renderList()` in
[web/board.js](../../web/board.js); `.bb-card`, `.bb-progress`, `.bb-priority`, `.bb-weight`
and `.bb-signals` in [web/board.css](../../web/board.css).
