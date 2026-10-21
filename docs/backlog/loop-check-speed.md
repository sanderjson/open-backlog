---
title: The dependency-loop check repeats work along long chains
id: 27
status: idea
priority: low
type: build
area: core
weight: 26
tags: [review-2026-10, performance]
created: 2026-10-17
depends_on: []
related: [small-fixes-from-the-review]
horizon: unplanned
---

# The dependency-loop check repeats work along long chains

## Why
`dependencyLoop` in [web/core.js](../../web/core.js) runs a depth-first search from every item and
copies the path at each step. Repeating the walks along a chain already costs quadratic edge
visits; copying the growing path adds further work. Original review measurements with
`parseBacklog`, best of three (environment not recorded, so these are context, not a portable
acceptance target):

| Items | Plain | With an index | With a dependency chain |
|---|---|---|---|
| 500 | 13 ms | 25 ms | 52 ms |
| 1000 | 22 ms | 61 ms | 291 ms |
| 2000 | 42 ms | 197 ms | 2905 ms |

Parsing runs on every change the poll sees and three to four times per edit, so this would be felt
past about a thousand items with long chains. Low priority: real backlogs are smaller.

## Acceptance
- Analyze the dependency graph once in O(items + dependency edges), without restarting a walk
  from each root or copying the complete path at each step. Keep checks for missing and
  self-referencing dependencies, and preserve the existing simple-cycle test outputs.
- Define the overlapping-cycle diagnostic contract before implementation. The recommended
  bounded result is one deterministic valid cycle witness per cyclic component, beginning at
  that witness's smallest slug; do not promise to enumerate every elementary cycle, whose count
  can grow exponentially. Cover disconnected cycles, shared-cycle nodes, long acyclic chains,
  a diamond-shaped DAG, missing targets and self references.
- Compare the same baseline and candidate on 500, 1000 and 2000 items, including long chains and
  a no-dependency control, with and without an index. Record commit IDs, Node version, hardware,
  warm-up and repeated timing summaries. Show the graph-work improvement separately from other
  parsing costs; do not enforce an environment-independent 100 ms wall-clock assertion in CI.
- Keep `indexProblems`/index scanning and other parsing optimizations out of this change. If
  measurements identify another bottleneck, create a separate item with its own evidence.

## Sprint boundary
Independent stretch work, outside W-22 and the v0.6.0 release gate. Keep it an idea until the
cycle-reporting contract and benchmark procedure are settled; it is not a few-line cleanup.
