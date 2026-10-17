---
title: The dependency-loop check is quadratic in chain length
id: 27
status: idea
priority: low
type: build
area: core
weight: 26
tags: [review-2026-10, performance]
created: 2026-10-17
depends_on: []
related: []
---

# The dependency-loop check is quadratic in chain length

## Why
`dependencyLoop` in [web/core.js](../../web/core.js) runs a depth-first search from every item and
copies the path at each step. In a long chain each search walks the rest of the chain, so parsing
grows faster than the backlog. Measured with `parseBacklog`, best of three:

| Items | Plain | With an index | With a dependency chain |
|---|---|---|---|
| 500 | 13 ms | 25 ms | 52 ms |
| 1000 | 22 ms | 61 ms | 291 ms |
| 2000 | 42 ms | 197 ms | 2905 ms |

Parsing runs on every change the poll sees and three to four times per edit, so this would be felt
past about a thousand items with long chains. Low priority: real backlogs are smaller.

## Acceptance
- One coloured depth-first search over the whole graph finds every loop, reporting each once from
  its first item in slug order as now; the "go round in a loop" tests pass unchanged.
- 2000 chained items parse in under 100 ms.
- Also worth a look while there: `indexProblems` recomputes `indexRows(s)` for every item.
