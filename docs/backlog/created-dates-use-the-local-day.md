---
title: Created dates use the local day
id: 30
status: done
priority: low
type: build
area: core
weight: 27
tags: [review-2026-10]
created: 2026-10-18
depends_on: []
related: []
horizon: unplanned
---

# Created dates use the local day

## Why
A new item's `created` date is the UTC day: `planCreate`'s default is
`new Date().toISOString().slice(0, 10)` in [web/core.js](../../web/core.js). Anywhere ahead of UTC,
an item made after local midnight gets yesterday's date, and behind UTC, one made in the evening
gets tomorrow's. It happened here: [The board fits a host page](the-board-fits-a-host-page.md) says
17 October though it was made on the 18th, and this item and its neighbour came out as the 17th at
00:39 CEST until they were corrected by hand. The board's New item and the CLI's `new` share the
default, so both do it.

## Acceptance
- The default `created` date is the local calendar day, built from the date's local parts
  (`getFullYear`, `getMonth`, `getDate`), for the board's New item and the CLI's `new` alike.
- A Node test pins it: the default for a moment just after local midnight, run with a time zone
  ahead of UTC (`TZ=Europe/Berlin` in a child process, or a Date given to the helper), is that local
  day, not the UTC one.
- The kit's own items made on the 18th that say the 17th are corrected.
