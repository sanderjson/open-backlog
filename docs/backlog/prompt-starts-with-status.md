---
title: Prompts open with the status change
status: ready
priority: high
type: build
area: core
weight: 3
tags: [prompt, agent]
created: 2026-10-17
depends_on: []
related: [review-prompt-text]
---

# Prompts open with the status change

## Why
"Copy as prompt" puts the status instruction last: "Keep it current as you work: set status to
in-progress when you start and to done when it's finished" comes after the item's whole text.
Agents often skip it, and we end up telling them by hand to move the item to in-progress. The epic
prompt does the same: "Set the epic's status to in-progress when you start" sits under "How to
work" at the very end.

## Acceptance
- The item prompt's first instruction after the title line tells the agent to set the item to the
  active status now, in its front matter and its index row where it has one, and to set it to the
  done status when it's finished. The closing reminder can stay, shorter.
- The epic prompt opens the same way for the epic itself, and says to move each item to the active
  status as it's started.
- The wording still comes from the backlog's own statuses (`active` and `done` in backlog.yml),
  and the line is left out for a backlog with no status field, as today.
- The `itemPrompt` and `epicPrompt` tests in [test/core.test.js](../../test/core.test.js) cover the
  opening lines.

## Notes
`itemPrompt` and `epicPrompt` in [web/core.js](../../web/core.js) build the prompts; `statusPlaces`
already words "in its front matter and its row in docs/backlog/README.md".
