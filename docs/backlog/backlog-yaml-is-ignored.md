---
title: backlog.yaml is sent by hosts but ignored by the board
status: idea
priority: low
type: build
area: core
weight: 23
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
---

# backlog.yaml is sent by hosts but ignored by the board

## Why
`FILE_NAME` accepts `.yaml`, so hosts send a `backlog.yaml`, but `CONFIG_FILE` is `backlog.yml`
and nothing else is read. A project that names the file `.yaml` gets the guessed fields and no word
about why: checked, no problem is reported.

## Acceptance
- Either both names are read (`.yml` first, with a problem when both exist), or a `backlog.yaml`
  in the folder produces a problem: "backlog.yaml isn't read; name it backlog.yml". Pick one and
  say so in the README.
- A test in [test/core.test.js](../../test/core.test.js) covers it.
