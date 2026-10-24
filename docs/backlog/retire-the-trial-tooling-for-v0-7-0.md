---
title: v0.7.0 ships without the trial scaffolding
id: 48
status: idea
priority: high
type: chore
area: board
weight: 19
tags: [release, trial]
created: 2026-10-24
depends_on: [grayscale-trial, the-board-works-in-grayscale]
related: [a-refreshed-board-everyone-can-read-and-use, deliver-five-project-grayscale-trial, publish-a-github-release-for-each-tag]
horizon: next
---

# v0.7.0 ships without the trial scaffolding

## Why
W-45 put the preview's trial tooling on main: the "Trial v…" strip, grayscale on by default,
the Trial notes recorder and `pack:preview`. Nothing yet says which of it stays in v0.7.0, and
the trial procedure explains how to roll back to v0.6.0 but not how to move on from the preview.
README's release-notes command also matches headings by prefix, so `## v0.7.0` would pull in
the whole `## v0.7.0-preview.1` entry.

This is the release checklist for v0.7.0, after W-41.

## Acceptance
- Each trial piece is kept or removed, with one line here saying which and why: the trial strip,
  the Grayscale switch and its default, Trial notes, and `pack:preview`. Nothing that stays is
  labelled "trial".
- README's notes command matches the exact heading and stops at the next one, for example
  `awk -v h="## $v - " 'index($0,h)==1{p=1;next} p&&/^## /{exit} p' CHANGELOG.md`.
- The v0.7.0 CHANGELOG has a short "Updating from the preview" note: save any unsent trial note
  first, replace `web/` and the CLI together, and `_trial-notes.md` can be kept or deleted.
- Before tagging, the maintainer opens the board once in Firefox and Safari as well as Chrome.
- `npm test`, `npm run test:silent` and `check` pass.
