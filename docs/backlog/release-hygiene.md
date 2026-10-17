---
title: A changelog, a version on the board, and a tag for the current head
status: idea
priority: mid
type: chore
area: repo
weight: 18
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
---

# A changelog, a version on the board, and a tag for the current head

## Why
PROMPT.md's model is "pin a tag; update by replacing `web/`". Deciding whether to update needs a
per-tag list of what changed, and README's "Updating a project's copy" paragraph is acting as that
list, with only v0.2.0 and v0.3.0 in it. The head already changes behaviour since v0.3.0: an epic
can start only when one of its items can, four new checks (H1 against front-matter title, stale
index titles, duplicate rows, links to missing files) and `open-backlog:ignore`. PROMPT.md step 7
asks the agent to report the version, but the running board can't say which one it is.

## Acceptance
- A `CHANGELOG.md` with an entry per tag (or GitHub Releases, linked from the README). "Updating a
  project's copy" keeps only the per-major-version compatibility notes and points to it.
- `export const VERSION` in [web/core.js](../../web/core.js), shown in the `?` dialog and in the
  CLI's `--help`, bumped when tagging. A test checks it matches the latest changelog entry.
- The current head is tagged (v0.4.0: the can-start rule is a visible change to "Can start" and
  `next`).
- A short "Releasing" note in the README: bump, changelog, tag.
