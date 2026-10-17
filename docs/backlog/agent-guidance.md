---
title: Guidance agents find on their own
status: done
priority: high
type: build
area: repo
weight: 2
tags: [agent, epics]
created: 2026-10-17
depends_on: []
related: [cli-creates-items-and-epics]
---

# Guidance agents find on their own

## Why
Asked to roll work items up into an epic, an agent working in a project didn't create the epic
card. It didn't know that an `items` list is what makes an epic, that `type: epic` needs the value
in the project's own list, or that the board's search doesn't cover fields like `kind`. The
conventions were in the kit's README, which an agent in a host project never sees. Guidance has to
be where agents look: a skill that triggers on backlog work, and the backlog's own README.

## What was done
- A skill, [.claude/skills/open-backlog/SKILL.md](../../.claude/skills/open-backlog/SKILL.md): the
  file format, creating an item, rolling items up into an epic step by step, statuses in both
  places, the index (managed or not), attachments, the CLI, and the usual mistakes with what the
  board says about each. Plain Markdown, so any agent can read it as a guide. Active in this repo.
- [PROMPT.md](../../PROMPT.md) installs it in a project, asks for a pointer in the project's agent
  instructions (CLAUDE.md, AGENTS.md), and vendors the CLI beside `web/` where the project has Node.
- [starter/README.md](../../starter/README.md) has a "Working the backlog" section with the short
  version, so every new backlog carries it even without the skill.
- The kit's README documents attachments beside the folder (`docs/backlog-guidance/`).

## Acceptance
- An agent in a project with the skill installed, asked to roll items into an epic, creates the
  epic file with `items` in work order, an allowed type, a matching title line and an index row,
  and says where it is.
- A project without the skill finds the recipe in its backlog's README.
