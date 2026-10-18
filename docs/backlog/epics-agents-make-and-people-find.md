---
title: Epics an agent can make and a person can find
id: 6
status: done
priority: high
type: epic
area: board
weight: 6
tags: [epics, agent, ui]
created: 2026-10-17
items: [agent-guidance, cli-creates-items-and-epics, epic-cards-stand-out, search-matches-tags]
depends_on: []
related: []
---

# Epics an agent can make and a person can find

The story from this week, end to end: you ask an agent to roll items up into an epic, it makes a
correct one, you find it on the board, and you see at a glance that it's an epic.

## Why
An agent asked to roll work items into an epic didn't create one, and once it had, the person
couldn't find it: search doesn't look at fields, and the epic look is easy to miss among ordinary
cards. Each piece is its own item. Together they close the loop, and the guidance item is done
already, so the bar shows where this started.

## Acceptance
- Asked to "roll these items up into an epic", an agent ends with a correct epic either way the
  project allows: by writing the files the guide describes, which every project can do, or with
  `node bin/open-backlog.mjs new … --items` where the project has the CLI. Either way the epic's
  `items` are in work order, its type is allowed, its title line matches and its index row exists.
- Typing `is:epic` in the board's search shows the epics, whatever their type; `#tag` and
  `field:value` filter by a tag or a field, and a plain word also matches field values.
- An epic card is recognisable in a column of ordinary cards, in light and dark, without reading
  it, and the list and the sheet mark epics the same way.

## Notes
`search-matches-tags` is also in [Filters and sorting, pure and tested](filters-and-sorting-pure-and-tested.md).
Whichever epic is worked first does it; the other's progress follows.
