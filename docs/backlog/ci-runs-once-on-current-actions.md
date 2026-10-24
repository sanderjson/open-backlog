---
title: CI runs once per change on current actions
id: 51
status: idea
priority: low
type: chore
area: repo
weight: 31
tags: [ci]
created: 2026-10-24
depends_on: []
related: [tooling-hygiene]
horizon: later
---

# CI runs once per change on current actions

## Why
`on: [push, pull_request]` runs every job twice on a pull-request branch, and
`actions/checkout@v4` and `actions/setup-node@v4` are on an older Node runtime that GitHub is
retiring. Both are one-line fixes. Nothing else in CI needs changing for a tool this size.

## Acceptance
- The trigger is `push` to `main` and `v*` tags, plus `pull_request`.
- Both actions are on their current major versions, and CI passes.
