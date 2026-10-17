# Backlog alignment review

Reviewed 2026-10-17 against commit `50852ef`. These are proposed changes for review; the work items and their index have not been edited.

The backlog has useful, concrete problem statements and follows the kit's architecture: browser logic, optional Node tooling, plain HTTP, and no additional host service. The main improvement is to make its execution contract as precise as its file format: distinguish decisions from builds, encode the prerequisites the epics promise, and remove inaccurate implementation assumptions.

## What is already sound

- All 26 items pass `check`; the managed index passes `index --check`.
- There are 24 open items: 13 `ready` and 11 `idea`; two items are done. Three of the open items are epics.
- Links and epic membership are structurally valid. An item appearing in two epics is supported and useful here; keep one shared search item rather than duplicating its implementation.
- Keep the two completed items as delivery history. No current item needs deletion merely to tidy the board.
- Preserve the [ground rules](../README.md#ground-rules), especially optional tooling and support for hosts with only the two required routes.

## Recommended changes, in priority order

### 1. Give readiness a useful meaning

[backlog.yml](backlog/backlog.yml) currently has `startable: [idea, ready]`. Consequently `next` offers 23 of the 24 open items, including the CLI and view-extraction ideas. Only `themes`, which has an unfinished prerequisite, is excluded. This is valid configuration, but the queue does little triage.

Change this project's configuration to `startable: [ready]`. Add a short project convention in `docs/backlog-guidance/project-conventions.md`:

- A ready build has agreed behavior, a bounded scope, and observable acceptance criteria.
- A ready discussion is executable decision work: its deliverable is a recorded decision and updated or newly created build items.
- An idea remains available for triage without appearing in the execution queue. A prerequisite is promoted to ready deliberately.
- `depends_on` records a required predecessor; `related` supplies context. Epic membership and weights do not substitute for prerequisites.

Apply this locally; changing the shipped starter's workflow is a separate product decision. Keep weight as the order and priority as importance, since the implementation sorts by weight before priority.

### 2. Resolve search behavior before calling its build ready

[Search finds items by tag, field value and kind](backlog/search-matches-tags.md) is high priority and ready, but its acceptance leaves the central interaction to whoever implements it. A word can be a tag, a value in several fields, and ordinary text. Automatic conversion can also leave a field filter active after the person edits or clears the search.

Add a small, high-priority `discuss` item, proposed slug `search-query-behavior`. Its completion should record the query rules and rewrite the existing build's acceptance criteria. Keep the existing build as one item, move it to `idea` during that decision, and make it depend on the decision.

My recommendation is to preserve bare-word text search, include choice-field values in its searchable text, and support explicit `#tag`, `field:value`, and `is:epic` queries. Show structured filters visibly. This makes intent predictable without silently choosing between identically named tags and field values. If automatic bare-word conversion is preferred, decide its precedence and text-search escape explicitly.

The decision must cover:

- Duplicate values across fields, a value shared with a tag, case matching, multiword values, and mixed text/filter queries.
- Interaction with existing selects, Clear, editing/backspacing a query, and URL round trips.
- Finding every structural epic, including one with no `type: epic`. The existing `?epic=<slug>` selects the members of one particular epic; it cannot also mean all epic cards.
- Updating the generic guide and installed skill, which currently describe search as excluding fields. Keep those statements accurate until the feature ships.

Add the decision item to both existing epics that contain the search build. Do not create a second search implementation.

### 3. Correct the CLI item's premise and expose its core work

[The CLI creates items and epics](backlog/cli-creates-items-and-epics.md) says `planCreate` already creates epics. [Its current signature](../web/core.js) accepts an `epic` target for adding a new item to an existing epic, but accepts no `items` list for creating a new epic. An in-memory probe passing `items: ['child']` produced an ordinary item with an empty member list, even with `type: epic`.

Split out a focused core build, proposed slug `create-epics-through-core`, and make the existing CLI item depend on it. The core item should cover planning an ordered member list, valid structural epic detection, missing/duplicate/self members, and refusing nested epics. Preserve support for arbitrary configured type values: structural epics do not require a choice value named `epic`.

Then tighten the CLI item's acceptance:

- Specify list argument syntax, empty lists, repeated flags, conflicting `--items`/`--epic`, and documented exit codes.
- Use an unambiguous way to set arbitrary choice fields, such as repeatable `--field name=value`. A project can legitimately have a choice field named `epic`, which conflicts with the proposed `--epic` membership option.
- Validate the entire plan before writing. Invalid input writes nothing.
- Cover both managed and ordinary index tables, title collisions, and templates.
- For a later filesystem failure or conflict, report the files already written and how to recover. Multi-file writes are not a transaction; do not imply rollback or stronger concurrency protection than the existing checked writer provides.

Add the core item to the existing agent/epics epic, before the CLI item. The CLI can remain `idea` until these details are settled.

### 4. Make the two main epics agree about work order

[Filters and sorting, pure and tested](backlog/filters-and-sorting-pure-and-tested.md) explicitly promises extraction before search and sorting. However, search and sorting have no prerequisites, are ready, and have earlier global weights. [The other epic](backlog/epics-agents-make-and-people-find.md) schedules CLI creation first and permits the shared search work to happen before the extraction.

Keep both epics and their shared search item. For the sequence the filtering epic currently promises:

- Promote `test-the-board-view-logic` to ready after tightening its scope, and put its weight before search and sorting.
- Set the search build's `depends_on` to `[search-query-behavior, test-the-board-view-logic]`.
- Set `list-sorts-both-ways.depends_on` to `[test-the-board-view-logic]`.
- Preserve independent work, such as epic appearance, without inventing dependencies merely because files overlap.

This explicitly commits to extraction first. If that is not the intended product tradeoff, remove the prerequisite language from the filtering epic and retain browser tests as an independent route; do not leave both interpretations in the backlog.

Also correct [the extraction item](backlog/test-the-board-view-logic.md): the CLI and board already use the same `item.startable` value computed in `core.link`. Its claim that the CLI reimplements readiness is inaccurate. Replace that proposed rewrite with a parity check. Define extraction as preserving existing behavior; the search and sort items own their subsequent behavior changes. `sortItems` already lives in core, so describe its missing coverage separately from functions that need moving.

### 5. Align the agent/epics outcome with optional Node

The [agent/epics epic](backlog/epics-agents-make-and-people-find.md) currently requires the agent to create its epic through the future CLI command. The kit supports projects without Node, and the completed guidance item already supports writing the files directly.

Rewrite the end-to-end acceptance as two supported paths: an agent with the installed guidance creates a valid epic and index entry directly; where the optional CLI is installed, it can create the same result mechanically. Keep CLI support in the epic, but make the universal user outcome independent of its availability.

Keep [epic appearance](backlog/epic-cards-stand-out.md) independently ready. Add explicit text/icon cues in cards, list rows, and sheet titles, and verify both themes. Palette refresh is related context, not a prerequisite; the card improvement should work with today's palette.

### 6. Group embedding work around a user outcome

One additional epic would earn its place: **The board works within a project's dev page**, proposed slug `board-fits-host-page`, `area: board`, `priority: mid`, initially `status: idea`.

Proposed members, in order: `[scope-keys-to-the-board, header-layout, board-scrollbar-position]`.

Its end-to-end acceptance should mount the board beside another focusable host control, under a host header, in a constrained container: shortcuts and title handling respect that host; filters and view controls remain usable at both text sizes; short boards and lists have reachable horizontal scrolling within their available space. Exercise the standalone page too.

This improves alignment with the kit's embedding promise. In particular, [the scrollbar item](backlog/board-scrollbar-position.md) currently requires the viewport bottom and suggests viewport height; that acceptance needs a container-aware variant when the board sits inside another page. Raise the keyboard-scoping fix in work order because it restores promised host behavior.

Do not make `header-layout` depend on a palette decision. Its current `discuss` item mixes selecting a layout and delivering it: make its acceptance a concrete layout decision, then create or promote the build with the agreed behavior.

### 7. Keep maintenance bounded and releases usable

[Small fixes from the review](backlog/small-fixes-from-the-review.md) describes five small, few-line fixes for one session. Dependency-graph optimization and parser-library upgrades have a different risk and verification profile.

- Remove `loop-check-speed` from that epic and keep it as an independent low-priority performance item. Record benchmark environment, workload, and comparison to baseline; a universal 100 ms threshold is not a portable acceptance criterion. Treat index-scan optimization as separately measured scope rather than an extra suggestion hidden in the same acceptance list.
- Keep the mechanical parts of `tooling-hygiene` together. Move vendor upgrades into a separate low-priority chore, proposed slug `update-vendored-parsers`, with the selected versions and behavioral validation recorded when implemented. Its current claim about current minor versions will age; this review did not verify upstream releases.
- Rename the remaining epic around its result, for example **Predictable configuration, index generation and tooling**, and remove the unsupported few-line estimate.
- Raise `backlog-yaml-is-ignored` to mid priority: silently losing configuration affects workflow. Prefer a clear diagnostic directing people to canonical `backlog.yml`, consistent with current documentation; test `.yaml` alone and both names. This is a narrower change than adding another configuration-selection rule.
- In `release-hygiene`, separate preparing the changelog/version display from the actual release checklist. Replace the moving target of tagging current head with a named release scope and a version chosen at release time. Keep any Unreleased changelog entry separate from the version consistency check.

Give the existing public security item priority in the correctness work, and handle its disclosure through the advisory process specified by the [backlog README](backlog/README.md). Its current detailed body conflicts with that newly recorded convention; the public item should be a pointer until the fix is ready. This review adds no reproduction details.

## Item-by-item disposition

| Current item | Recommended action |
| --- | --- |
| [dogfood-the-kit](backlog/dogfood-the-kit.md) | Keep done; the dev host and CI checks exist. |
| [agent-guidance](backlog/agent-guidance.md) | Keep done; update the actual guide/skill alongside later search and CLI changes, rather than reopening this delivered work. |
| [prompt-starts-with-status](backlog/prompt-starts-with-status.md) | Keep high/ready. Preserve the blocked-item warning before any unconditional instruction to begin; test custom statuses, missing status, and blocked work. |
| [host-header-check](backlog/host-header-check.md) | Prioritize remediation and align the public item's content with the advisory convention. Correct its stale PROMPT step references: routes are in Context; route tests are in Expectations 5. |
| [bad-link-breaks-the-sheet](backlog/bad-link-breaks-the-sheet.md) | Keep high/ready. Retain both malformed-link handling and render-error recovery; add an independent render-failure case, since preventing the bad link alone does not verify the error boundary. |
| [epics-agents-make-and-people-find](backlog/epics-agents-make-and-people-find.md) | Keep epic; add the search decision and core creation item, encode shared prerequisites, and cover the direct-file path as well as optional CLI. |
| [search-matches-tags](backlog/search-matches-tags.md) | Add the query-behavior decision; revise acceptance and dependencies, then restore ready. |
| [epic-cards-stand-out](backlog/epic-cards-stand-out.md) | Keep independently ready; require a consistent text/icon cue across card, list and sheet. |
| [list-sorts-both-ways](backlog/list-sorts-both-ways.md) | Keep scope; encode the chosen extraction prerequisite. Specify initial direction on a newly selected column, tie behavior, and invalid/missing `dir` handling. |
| [header-layout](backlog/header-layout.md) | Separate the layout decision from its implementation; add container-width and small-screen acceptance. Include in the embedding epic. |
| [board-scrollbar-position](backlog/board-scrollbar-position.md) | Amend viewport-specific acceptance for embedded containers. Include in the embedding epic. |
| [colour-palette](backlog/colour-palette.md) | Make this a decision deliverable before a palette build. Define contrast checks and non-colour cues; reconcile dropping/merging tones with preserving all ten public tone names. |
| [review-prompt-text](backlog/review-prompt-text.md) | Keep as a later, bounded editorial pass. Resolve the conflict between the item prompt pasting its body and the rule to paste nothing an agent can read from a file; choose and document each prompt's contract. Avoid redoing the status-opening fix. |
| [cli-creates-items-and-epics](backlog/cli-creates-items-and-epics.md) | Correct the premise; depend on focused core planning work; specify CLI grammar, validation and partial-write behavior. |
| [filters-and-sorting-pure-and-tested](backlog/filters-and-sorting-pure-and-tested.md) | Keep epic; align dependencies and weights, add the search decision, replace the redundant readiness rewrite with parity validation. |
| [test-the-board-view-logic](backlog/test-the-board-view-logic.md) | Correct the duplication claim, bound extraction to current behavior, and promote before dependent features. If extracting to `web/view.js`, include its distribution in documentation and a vendored-layout smoke check. |
| [scope-keys-to-the-board](backlog/scope-keys-to-the-board.md) | Promote the bounded host-behavior fix to ready and move earlier. Preserve editable-control exclusions and standalone shortcuts. Include in the embedding epic. |
| [release-hygiene](backlog/release-hygiene.md) | Bring release preparation ahead of shipping the next batch; separate the eventual tag operation, choose release scope explicitly, and handle Unreleased entries. |
| [themes](backlog/themes.md) | Keep idea/low with the palette dependency; require a recorded use case and customization mechanism before expanding scope. |
| [github-issues-sync](backlog/github-issues-sync.md) | Keep low-priority discussion. Body links already work, so treat them as the baseline; choose import or structured link metadata only for a demonstrated gap. If import is chosen, create builds then and link to CLI creation as appropriate. |
| [small-fixes-from-the-review](backlog/small-fixes-from-the-review.md) | Narrow and rename around its outcome; move performance work out and separate parser upgrades from mechanical hygiene. |
| [index-into-missing-readme](backlog/index-into-missing-readme.md) | Keep small/low; choose start marker directly as the expected output, rather than leaving an optional heading decision in acceptance. |
| [backlog-yaml-is-ignored](backlog/backlog-yaml-is-ignored.md) | Raise to mid, choose the canonical-name diagnostic, and make ready once its exact behavior is written. |
| [regex-literals](backlog/regex-literals.md) | Repair the acceptance bullet itself: spell `\uFEFF` and `[\u0300-\u036F]` visibly. It currently repeats the invisible literals the item proposes removing. |
| [tooling-hygiene](backlog/tooling-hygiene.md) | Keep the mechanical chore; split vendor upgrades, and retain explicit provenance. |
| [loop-check-speed](backlog/loop-check-speed.md) | Keep low and independent, with reproducible comparative benchmarks and scope limited to the demonstrated bottleneck. |

## Proposed execution order

1. Align the existing security item with its disclosure convention and prioritize its fix; repair malformed-link/render recovery; ship the bounded prompt-opening improvement.
2. Decide search semantics. Perform the bounded view extraction, then implement search and bidirectional sorting against the agreed tests.
3. Deliver epic recognition and core/CLI creation. The direct-file workflow remains part of acceptance.
4. Fix embedding behavior: keyboard/title scope, agreed header layout, and container-aware scrolling.
5. Prepare the next release with changelog and inspectable version. Pick the release contents explicitly; independent polish need not delay already valuable fixes.
6. Work through narrowed maintenance. Keep themes, tracker integration and graph optimization in later triage until their value warrants the work.

After any accepted backlog edits, regenerate the managed index and rerun `check`, `next`, and `index --check`. Review each epic's resulting next item, not just the absence of diagnostics.

## Validation and limits

Ran `node bin/open-backlog.mjs check docs/backlog --json` (26 items, no problems), `node bin/open-backlog.mjs index docs/backlog --check` (no drift), and `next --json` (23 startable entries). Read every work item, project guidance, relevant implementation, and existing test coverage. Used an in-memory creation probe to verify the CLI item's incorrect core-API premise; it wrote no files.

This is a backlog alignment review, not a fresh browser, performance, or security audit. Product behavior remains a recommendation, and upstream library versions were not checked. No implementation changes or release operations were performed.
