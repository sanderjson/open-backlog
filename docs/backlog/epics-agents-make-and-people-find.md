---
title: Epics an agent can make and a person can find
status: ready
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
- In a project with the skill and the CLI, "roll these items up into an epic" ends with an epic
  file whose `items` are in work order, with an allowed type, a matching title line and an index
  row, written by `node bin/open-backlog.mjs new … --items`.
- Typing `epic` in the board's search shows the epics, whatever their type; typing a tag or a
  field value filters by it.
- An epic card is recognisable in a column of ordinary cards, in light and dark, without reading
  it.

## Notes
`search-matches-tags` is also in [Filters and sorting, pure and tested](filters-and-sorting-pure-and-tested.md).
Whichever epic is worked first does it; the other's progress follows.
