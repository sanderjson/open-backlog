---
title: "`new` refuses an item that `check` would reject"
id: 49
status: ready
priority: mid
type: build
area: cli
weight: 21
tags: [cli]
created: 2026-10-24
depends_on: []
related: [cli-creates-items-and-epics]
horizon: next
---

# `new` refuses an item that `check` would reject

## Why
`check` requires every field that has a list of values, but `new` only checks the fields it's
given, then exits 0 after writing an item `check` rejects. README's own `new` examples pass only
`status`, so following them in a starter backlog makes a broken item. Agents are told to prefer
`new`, so they hit this first.

## Acceptance
- `new` refuses, with one message naming each missing field and its allowed values, and writes
  nothing. No defaults are filled in: a default priority is a choice nobody made.
- The board's New item form shows the same message.
- The `new` examples in README, the guide and the skill give every required field.
- A test: `new` with only a title fails on a copy of `starter/`; with every field it passes and
  `check` passes.
