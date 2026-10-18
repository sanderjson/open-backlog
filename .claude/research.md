# Review follow-up: IDs and toolbar

The user approved fixing the four findings from the branch review.

- `withId` inserts a new key after the first title line, duplicating empty ID keys and splitting multiline YAML values.
- `planIds` regenerates managed indexes but leaves existing ID cells in handwritten indexes stale.
- Clear's display rule loses to the global `[hidden]` rule, so showing Clear can add a toolbar row.
- The toolbar's non-shrinking end group overflows small screens and constrained mounts.

Keep ID placement under ordinary single-line titles, preserve other front matter and handwritten index columns, and keep desktop toolbar roles. At narrow widths, controls must wrap within the toolbar and remain reachable by keyboard and pointer.

The existing 64 Node tests and 21 browser tests pass. Additional review probes reproduced all four failures. The existing uncommitted backlog item and its README row belong to other work.
