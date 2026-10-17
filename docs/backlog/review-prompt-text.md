---
title: Review the text around the item in copied prompts
status: ready
priority: mid
type: build
area: core
weight: 13
tags: [prompt, agent]
created: 2026-10-17
depends_on: []
related: [prompt-starts-with-status]
---

# Review the text around the item in copied prompts

## Why
"Copy as prompt" and "Copy epic as prompt" wrap the item's own text in instructions: the opening
line, Fields, Tags and Branches, what it waits on, unblocks and relates to, its epics, the board's
problems, the fenced text, and the closing "keep it current" line. That wrapping grew feature by
feature. It's worth one pass to read both prompts end to end as an agent would, and tighten them.

## Acceptance
- Each line earns its place. What the agent must do (status, order, open questions) comes before
  what it may want to know (relations, problems).
- The item and epic prompts use the same words for the same things: file, status, "waits on",
  "outside the epic".
- The heading-style lines ("Depends on:", "How to work:") are consistent, and no line runs past a
  sentence or two.
- Nothing is pasted that the agent should read from a file instead (the epic prompt's rule), and
  the item prompt says plainly what its links are relative to.
- The tests in [test/core.test.js](../../test/core.test.js) carry the final wording, and the
  README's "Copy as prompt" and "Copy epic as prompt" sections describe what the prompt holds, in
  the new order.
