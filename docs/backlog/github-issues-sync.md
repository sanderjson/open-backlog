---
title: Sync with GitHub Issues, or not
id: 21
status: ready
priority: low
type: discuss
area: cli
weight: 20
tags: [agent, integrations]
created: 2026-10-17
depends_on: []
related: [cli-creates-items-and-epics]
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
files as the truth. Markdown links in an item's body already work, so they are the baseline
for linking out; a new `links:` key or other reserved metadata is a separate choice, not a
prerequisite for import. Decide here; build items follow from the recorded decision.

## Acceptance
- Record the maintainer's choice, reasons and explicit deferrals here: no integration, body
  links only, optional one-way import, and whether any structured link metadata has a concrete
  use case that existing body links cannot meet. A recommendation alone is not a completed
  decision, and this sprint does not build an importer or live synchronization.
- If import is selected, bound its future build: invocation/input through optional `gh`, which
  issues are included, title/body/source-URL and label/status mapping into the project's strict
  fields, and the behavior on a repeated import. Specify source identity and duplicate handling
  so re-running an import cannot silently overwrite hand-edited items or create duplicates.
- Retain file ownership of work state, optional Node/gh tooling and the two-route host contract.
  No board credentials or background service are introduced. Separate import and any new link
  field representation into build items only after those choices are made.
- Update README's guidance to match the recorded decision and link the later build items here,
  with bounded acceptance and prerequisites. Do not implement those builds just to finish this
  discussion. It can run alongside the sprint's delivery work and does not gate v0.6.0.

## Decision record
Pending the maintainer's choice. Capture the chosen option, source/re-import policy if relevant,
rejected alternatives and links to follow-up items before marking this discussion done.
