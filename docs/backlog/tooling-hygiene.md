---
title: "Tooling hygiene: engines, exec bit, vendor provenance and versions"
id: 26
status: idea
priority: low
type: chore
area: repo
weight: 25
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
---

# Tooling hygiene: engines, exec bit, vendor provenance and versions

## Why
Small mismatches between what the README says and what the files say.

## Acceptance
- package.json declares `"engines": { "node": ">=22" }`, matching the README.
- [bin/open-backlog.mjs](../../bin/open-backlog.mjs) either has its exec bit set, so
  `./bin/open-backlog.mjs` works as the shebang suggests, or loses the shebang.
- README's vendor row names the files copied, `dist/marked.esm.js` and
  `dist/browser/js-yaml.esm.min.mjs`, and says they're copied as they are, so updating is
  mechanical.
- marked and js-yaml are brought to their current minor versions (18.1.1 and 5.5.0 on 2026-10-17)
  and both suites pass.
