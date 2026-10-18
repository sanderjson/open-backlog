---
title: Predictable configuration, index generation and tooling
id: 22
status: done
priority: low
type: epic
area: repo
weight: 21
tags: [review-2026-10]
created: 2026-10-17
items: [index-into-missing-readme, backlog-yaml-is-ignored, regex-literals, tooling-hygiene, created-dates-use-the-local-day]
depends_on: []
related: [loop-check-speed, update-the-vendored-parsers-with-recorded-versions]
---

# Predictable configuration, index generation and tooling

## Why
Projects should get an intentional result from an empty index, a clear explanation for a
misspelled config filename, and tooling whose files match its documented requirements. These
are bounded fixes with their own regression checks; their size is not a promise of one session.

W-30 (local created dates) is already done and stays in the epic as delivery history. The four
open members are W-23, W-24, W-25 and W-26. Parser upgrades are tracked separately in W-32;
W-27's graph optimization is independent stretch work. Neither blocks this epic's completion.

## Acceptance
- Every listed member is done or explicitly closed, and its acceptance holds. Generating a new
  index has no leading blank lines; `backlog.yaml` produces a useful diagnostic; invisible
  regex characters have visible escapes; Node requirements, executable CLI and vendor provenance
  agree with the documentation.
- `npm test`, `npm run test:silent`, checks for this backlog and the starter, and this backlog's
  `index --check` pass. The board keeps working with only the two required HTTP routes.
- W-26 records tooling and vendor provenance; W-31 owns the project update instructions. Reuse
  that wording without expanding W-26 into a second update-guide rewrite.

## Done
- W-23, W-24, W-25 and W-26 are done this sprint, and W-30 was already. `npm test`,
  `npm run test:silent`, `check` on this backlog and the starter, and `index --check` pass.
