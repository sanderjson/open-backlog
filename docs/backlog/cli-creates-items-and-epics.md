---
title: The CLI creates items and epics
status: idea
priority: mid
type: build
area: cli
weight: 14
tags: [agent, epics]
created: 2026-10-17
depends_on: []
related: [agent-guidance]
---

# The CLI creates items and epics

## Why
Asked to "roll these items up into an epic", an agent writes an epic file by hand: a slug, front
matter with allowed values, `items` in work order, a title line that matches, an index row. One
got it half right and no epic card appeared. `planCreate` in [web/core.js](../../web/core.js)
already knows how to do all of it, epics included, since the board's New item uses it, and the CLI
is read-only today except `index --write`. A command makes the roll-up mechanical and correct
wherever the project has Node.

## Acceptance
- `node bin/open-backlog.mjs new "<title>" [docs/backlog]` with `--<field> <value>` for each choice
  field, `--weight`, `--tags`, `--items` (which makes the new item an epic) and `--epic` (which adds
  it to an existing one) writes the item through `planCreate`: its file from `_template.md`, its
  index row or a regenerated managed region, and the epic's list. It prints the slug and the files
  written.
- `--items` refuses an epic inside an epic and slugs that aren't items, with the board's messages.
- Values are validated against backlog.yml as the board validates them; a bad one exits 2 without
  writing anything.
- Writes are checked the way `index --write` is: a file that changed since it was read isn't
  written over.
- The skill tells agents to use it when the project has it, and the README's "Command-line use"
  lists it.
