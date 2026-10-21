---
title: Generating an index into a missing README leaves two blank lines first
id: 23
status: done
priority: low
type: build
area: core
weight: 22
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
horizon: unplanned
---

# Generating an index into a missing README leaves two blank lines first

## Why
`planIndex` in [web/core.js](../../web/core.js) appends the region as
`source + (source.endsWith(nl) ? nl : nl + nl) + region + nl`. With no index file, `source` is
empty, so the new README starts with two newlines before the start marker.
`node bin/open-backlog.mjs index <dir> --write` on a folder with no README shows it.

## Acceptance
- With a missing or empty index file, generation starts directly with
  `<!-- open-backlog:index start -->`, without a heading or leading blank lines, and ends with
  exactly one newline. Repeating generation produces no write.
- Preserve existing text outside a managed region, the existing line-ending style, and the
  refusal to replace an unmarked handwritten index. This fix changes only empty-source spacing.
- Tests cover missing and empty files through `planIndex`, plus CLI `index --write` followed by
  a passing `index --check`; existing preservation tests in
  [test/reliability.test.js](../../test/reliability.test.js) still pass.

## Done
- `planIndex` adds no separator before the region when the index file is missing or empty. Text
  before a new region keeps its blank line, and a marked region is replaced as before.
- Tests in [test/reliability.test.js](../../test/reliability.test.js) and
  [test/cli.test.js](../../test/cli.test.js) fail without the fix and pass with it.
