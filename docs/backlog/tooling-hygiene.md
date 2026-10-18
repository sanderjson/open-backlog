---
title: "Tooling hygiene: Node requirement, executable CLI and vendor provenance"
id: 26
status: ready
priority: low
type: chore
area: repo
weight: 25
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: [answer-the-questions-a-project-update-raised, update-the-vendored-parsers-with-recorded-versions]
---

# Tooling hygiene: Node requirement, executable CLI and vendor provenance

## Why
Small mismatches between what the README says and what the files say.

This item covers mechanical tooling and provenance only. W-31 owns the update procedure and
optional-Node explanation; W-32 owns parser upgrades and their behavior review.

## Acceptance
- package.json declares `"engines": { "node": ">=22" }`, matching the README and CI; the root
  package-lock metadata agrees. This describes development and optional CLI requirements, not
  a new Node requirement for a host serving the board.
- Keep the shebang and set the tracked executable bit on
  [bin/open-backlog.mjs](../../bin/open-backlog.mjs). From a checkout,
  `./bin/open-backlog.mjs --help` and `node bin/open-backlog.mjs --help` report the same version.
- Verify the exact upstream source artifacts for the currently installed marked and js-yaml
  files. Record package version, source artifact, local destination and license beside the
  README vendor row; verify the claimed unmodified copy against the published artifact before
  describing the copy procedure as mechanical. Do not guess the filenames or bump versions here.
- No runtime npm dependency, build step or host-specific code is added. Run `npm ci` and the
  existing Node/browser suites on the documented Node versions; record executable-bit and
  provenance verification with the change.
