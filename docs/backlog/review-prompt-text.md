---
title: Review the text around the item in copied prompts
id: 17
status: ready
priority: mid
type: build
area: core
weight: 15
tags: [prompt, agent]
created: 2026-10-17
depends_on: [answer-the-questions-a-project-update-raised]
related: [prompt-starts-with-status, every-item-has-a-short-id]
---

# Review the text around the item in copied prompts

## Why
"Copy as prompt" and "Copy epic as prompt" wrap the item's own text in instructions: the opening
line, Fields, Tags and Branches, what it waits on, unblocks and relates to, its epics, the board's
problems, the fenced text, and the closing "keep it current" line. That wrapping grew feature by
feature. It's worth one pass to read both prompts end to end as an agent would, and tighten them.

## Acceptance
- Keep the first line's existing contract: the item or epic's short ID (when present) and title
  follow "Work on this item from the backlog:" or "Work through this epic from the backlog:".
  Preserve ID search, numbering and the underlying status/dependency behavior.
- An unfinished prerequisite warning stays before any instruction to change status or begin
  work. It requires the user's go-ahead before proceeding. Use the backlog's configured active
  and done statuses; never invent them when absent, and do not tell an already active item to
  start again. Avoid repeating the same status instruction at both ends of the prompt.
- Keep the current content contract explicit: include the selected item or epic's own body;
  an epic refers to its members by file instead of pasting each member's body. Tell the agent
  to read the current files before work, since a clipboard copy can become stale. File paths
  are project-relative; links inside the pasted body are relative to the backlog folder.
- Put instructions to act, the work order and unresolved questions before optional context.
  Keep file, status, "waits on" and "outside the epic" consistent across prompts and the guide
  clarified by W-31. Distinguish problems from suggestions, and preserve missing-item and
  blocked-work diagnostics while tightening their wording.
- Test representative item and epic prompts in [test/core.test.js](../../test/core.test.js):
  IDs present/absent, custom/missing statuses, already active and blocked work, outside-epic
  dependencies, an item with no index row, and a body containing Markdown fences. Assert that
  the warning comes first and the selected body is present while epic member bodies are absent.
- README's "Copy as prompt" and "Copy epic as prompt" sections describe this content and order.
  This is an editorial pass over the existing contract; a different content model needs its
  own decision instead of being introduced as wording cleanup.

## Order
Finish W-31 first so filenames, short IDs, project conventions and update guidance have one
meaning before aligning the prompts with them. This prerequisite is about the shared wording;
it does not reopen the delivered status-opening or ID features. W-34's `--slug` option isn't a
prerequisite: the prompts name files by path whatever their names. `npm test` and the browser
clipboard tests pass after the edits.
