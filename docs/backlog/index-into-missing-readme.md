---
title: Generating an index into a missing README leaves two blank lines first
status: idea
priority: low
type: build
area: core
weight: 22
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
---

# Generating an index into a missing README leaves two blank lines first

## Why
`planIndex` in [web/core.js](../../web/core.js) appends the region as
`source + (source.endsWith(nl) ? nl : nl + nl) + region + nl`. With no index file, `source` is
empty, so the new README starts with two newlines before the start marker.
`node bin/open-backlog.mjs index <dir> --write` on a folder with no README shows it.

## Acceptance
- An index generated from nothing starts with the start marker, or a `# Backlog` heading if we
  want one, and ends with a single newline.
- A test in [test/reliability.test.js](../../test/reliability.test.js) or
  [test/cli.test.js](../../test/cli.test.js) covers a backlog with no README.
