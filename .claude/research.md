# Review follow-up: IDs and toolbar

The user approved fixing the four findings from the branch review.

- `withId` inserts a new key after the first title line, duplicating empty ID keys and splitting multiline YAML values.
- `planIds` regenerates managed indexes but leaves existing ID cells in handwritten indexes stale.
- Clear's display rule loses to the global `[hidden]` rule, so showing Clear can add a toolbar row.
- The toolbar's non-shrinking end group overflows small screens and constrained mounts.

Keep ID placement under ordinary single-line titles, preserve other front matter and handwritten index columns, and keep desktop toolbar roles. At narrow widths, controls must wrap within the toolbar and remain reachable by keyboard and pointer.

The existing 64 Node tests and 21 browser tests pass. Additional review probes reproduced all four failures. The existing uncommitted backlog item and its README row belong to other work.

## Five-project trial experience — 2026-10-21

The maintainer clarified that the requested outcome is an installable test experience across
five existing projects, with grayscale and notes during normal work. The previous horizon
configuration alone does not deliver that. Latest released kit: v0.6.0; W-42 currently uses a
bookmarklet, and W-41's final visual choices await trial evidence.

`Board.mutate` serialises writes, reads fresh files, checks writability, and delegates conditional
PUTs and conflicts to `write`. Trial notes can use a fixed `_trial-notes.md` file over those same
routes: underscore files are already excluded from items and indexes. Persisted draft notes and
the grayscale preference must be scoped by the resolved API URL, not shared across mounts.
The notes dialog must retain input across polling, closing, failed saves and reloads. On success
it clears the draft; read-only boards can download notes without writing. Use textContent for
the saved log and escaped HTML for all UI context.

A grayscale token override keeps fixed sheets and top-layer dialogs working, without filtering
the mount (which would change containing blocks). Use configured priority words, labelled
waiting/startability/weight, and a done-only neutral progress fill as provisional trial choices.
W-41 remains open for maintainer findings; W-35's layout discussion and W-36's header redesign
are separate work. Ship a locally generated preview archive with version, sources and update
instructions, rather than documenting an unpublished tag as available.
