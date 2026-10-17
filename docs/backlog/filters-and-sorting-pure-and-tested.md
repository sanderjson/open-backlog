---
title: Filters and sorting, pure and tested
status: done
priority: mid
type: epic
area: board
weight: 15
tags: [tests, ui]
created: 2026-10-17
items: [test-the-board-view-logic, search-matches-tags, list-sorts-both-ways]
depends_on: []
related: []
---

# Filters and sorting, pure and tested

Make the board's filtering, searching and sorting pure functions with Node tests, then add what
people miss: search that understands tags and field values, and list columns that sort both ways.

## Why
`visible()`, `params()`, `href()`, `columns()` and `sortItems()` are the parts of the board
everyone touches and the parts with no tests. Both feature items here want their tests from the
extraction, so the order is: extract and test, then search, then sort direction. Done together
it's one series of changes to the same few functions.

## Acceptance
- The view logic lives in `web/core.js` with no DOM, with Node tests for every filter, sort and
  address case its item lists, and today's behaviour preserved by the extraction.
- Search takes plain words (now matching field values too) and the qualifiers `#tag`,
  `field:value` and `is:epic`, combined with AND, with quoting for phrases and literal text; list
  columns sort both ways with unknowns last.
- The CLI's `next` and the board's "Can start" agree, and a test says so.

## Notes
`search-matches-tags` is also in [Epics an agent can make and a person can find](epics-agents-make-and-people-find.md).
Whichever epic is worked first does it; the other's progress follows.
