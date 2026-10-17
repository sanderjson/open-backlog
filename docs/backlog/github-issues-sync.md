---
title: Sync with GitHub Issues, or not
status: ready
priority: low
type: discuss
area: cli
weight: 20
tags: [agent, integrations]
created: 2026-10-17
depends_on: []
related: []
---

# Sync with GitHub Issues, or not

## Why
Many projects already track work in GitHub Issues, and a backlog that ignores them splits the
truth: agents get asked to "file an issue", and people look for work in two places. The question
deserves an explicit answer, and the answer may be a narrow one.

## The options
1. **Live two-way sync.** Items and issues mirror each other: status to open or closed and labels,
   slug to issue number, text to body. It fights the kit's premise three ways. The files stop being
   the single truth. It needs credentials and network calls that nothing in the kit has today: the
   board runs in the browser against two routes, and the CLI reads a folder. And it's
   GitHub-specific in a kit that promises any host; GitLab, Linear and Jira users would want the
   same.
2. **One-way import through the CLI.** `node bin/open-backlog.mjs import-issues`, reading
   `gh issue list --json` so no token touches the kit, writes an item per open issue through
   `planCreate`, with the issue's URL in the item, once or on demand. That's the starter's "Move
   the project's ideas into the backlog" made mechanical: optional, Node-only, no server.
3. **Links out, nothing more.** An item links to its issue. Today every extra front-matter key
   becomes a choice field, so an `issue: https://…` key would turn into a one-value filter. A small
   notion of link fields (`links:` as a list, or URL-valued keys shown as links in the sheet and
   never as filters) fixes that cheaply and serves any tracker.

## Recommendation
Options 2 and 3 and no live sync: import once with the CLI, link out from items, and keep the
files as the truth. Decide here; the build items follow from the decision.

## Acceptance
- A decision recorded in this item and reflected in the README's agent guidance, with build items
  created for whatever was chosen.
