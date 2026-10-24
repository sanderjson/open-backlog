---
title: One bad backlog.yml setting doesn't discard the others
id: 50
status: idea
priority: low
type: build
area: core
weight: 30
tags: [config]
created: 2026-10-24
depends_on: []
related: [themes]
horizon: later
---

# One bad backlog.yml setting doesn't discard the others

## Why
`parseConfig` stops at the first unknown or bad key in `backlog.yml`, so every setting after it
is ignored. If `fields` comes later, the board quietly falls back to guessed fields. `check`
does report the bad key, so this only hurts until someone reads the error. Low priority.

## Acceptance
- A bad key is reported and skipped; the settings before and after it still apply.
- A core test covers a bad key placed before `fields:`.
