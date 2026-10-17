---
title: Publish a GitHub release for each tag
status: done
priority: high
type: chore
area: repo
weight: 9
tags: [release]
created: 2026-10-18
depends_on: []
related: [release-hygiene]
---

# Publish a GitHub release for each tag

## Why
The CHANGELOG is the record of what each tag changed, but nobody is told when a tag appears: only
a GitHub release notifies the repository's watchers. v0.5.0 asks every project to change its own
server code (the `Host` check), so a project that never looks at the changelog would miss it.
README's "Releasing" already says a release is the announcement; none has been published yet.

## Acceptance
- v0.5.0 has a GitHub release titled `v0.5.0`, whose notes are its CHANGELOG entry, published by
  the maintainer:

  ```sh
  awk '/^## v0.5.0/{p=1;next} /^## v0.4.0/{p=0} p' CHANGELOG.md | gh release create v0.5.0 --title v0.5.0 --notes-file -
  ```

- README's "Releasing" makes the GitHub release a step of every release, with that command in its
  general form, not only of releases that ask something of hosts.
- Whether to publish releases for the tags before v0.5.0 is decided and written down (their
  changelog entries exist, so it's one command each).
