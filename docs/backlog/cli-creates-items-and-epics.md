---
title: The CLI creates items and epics
id: 15
status: done
priority: mid
type: build
area: cli
weight: 14
tags: [agent, epics]
created: 2026-10-17
depends_on: []
related: [agent-guidance]
horizon: unplanned
---

# The CLI creates items and epics

## Why
Asked to "roll these items up into an epic", an agent writes an epic file by hand: a slug, front
matter with allowed values, `items` in work order, a title line that matches, an index row. One
got it half right and no epic card appeared. `planCreate` in [web/core.js](../../web/core.js),
which the board's New item uses, writes a new item's file and index row and can add it to an
existing epic, but it can't create an epic: it takes no `items` list. The CLI is read-only today
except `index --write`. Core support first, then a command, makes the roll-up mechanical and
correct wherever the project has Node. Without Node, agents keep writing the files by hand,
following the guide.

## Acceptance
Core, as its own commit:

- `planCreate` takes an ordered `items` list, which makes the new item an epic. It refuses a slug
  that isn't an item, a slug listed twice, an epic as a member, and `items` together with `epic`
  (an epic inside an epic), with the board's messages. It needs no type called `epic`; the type
  stays whatever the caller sets.
- Node tests cover each refusal, the written file and index row, and a managed index.

Then the command:

- `node bin/open-backlog.mjs new "<title>" [directory]` creates an item through `planCreate`: its
  file from `_template.md`, its index row or a regenerated managed region, and an epic's list. It
  prints the slug and each file written.
- Flags: `--field name=value` for any choice field (repeatable; one per field), `--weight <n>`,
  `--tags a,b`, `--items a,b,c` (ordered; makes an epic) and `--epic <slug>` (adds the new item to
  that epic). The same field given twice with different values, an unknown field or flag, an empty
  `--items`, and `--items` with `--epic` are refused.
- The whole plan is validated before anything is written: a bad value, a missing member or a
  conflict exits 2 with the reason on stderr and writes nothing.
- Writes are checked the way `index --write`'s are: a file that changed since it was read isn't
  written over. Writing several files isn't a transaction, so if a later write fails the command
  names the files already written and says to review them, and exits 1.
- `--help` shows the syntax with examples (an item, an item in an epic, an epic over three items).
- The skill and the guide tell agents to use it when the project has the CLI and to write the
  files by hand otherwise; the README's "Command-line use" lists it. Tests cover the command's
  output, exit codes and that a refused command writes nothing.
