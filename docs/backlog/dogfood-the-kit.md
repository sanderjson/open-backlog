---
title: Dogfood the kit
id: 1
status: done
priority: high
type: build
area: repo
weight: 1
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
horizon: unplanned
---

# Dogfood the kit

## Why
A kit for keeping work items next to the code had none of its own: there was no `docs/backlog/`,
and `npm run check` failed with ENOENT. The kit's own work now lives here, and the CLI checks it in
CI, so the kit has to pass its own checks before it can ship.

## What was done
- `docs/backlog/` with `backlog.yml`, `_template.md`, a README whose index is a managed region
  (which the starter doesn't show) and the items from the October 2026 review.
- `npm run dev` ([test/dev.mjs](../../test/dev.mjs)) runs the throwaway test host over this folder.
  [test/server.mjs](../../test/server.mjs) takes a `dir` and a `port` for it, and leaves a real
  folder alone when it closes. The host is still not for projects: their own dev server mounts the
  board (PROMPT.md).
- CI runs `npm run check` and `index docs/backlog --check` on this backlog.

## Acceptance
- `npm run dev` opens the board on this backlog, and an edit there rewrites the item's front matter
  and its index row.
- `npm run check` and `node bin/open-backlog.mjs index docs/backlog --check` pass in CI.
