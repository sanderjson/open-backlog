---
title: Update the vendored parsers with recorded versions
id: 32
status: idea
priority: low
type: chore
area: repo
weight: 28
tags: ["review-2026-10", "vendor"]
created: 2026-10-18
depends_on: [tooling-hygiene]
related: [small-fixes-from-the-review]
horizon: later
---

# Update the vendored parsers with recorded versions

## Why
Parser updates change how every project's front matter and Markdown are read. They deserve
their own version selection and behavior review, rather than being hidden in W-26's Node,
executable-bit and provenance cleanup. The vendored headers currently say marked 18.0.13 and
js-yaml 5.4.2; past notes claiming particular "current minor versions" are not update targets.

## Acceptance
- At implementation time, verify candidate versions and migration notes from the parsers'
  official release sources. Record the selected versions, date, upstream release links and why
  each update is needed; avoid an unbounded "latest" requirement or an assumed minor upgrade.
- Use the provenance/copy procedure recorded by W-26. Preserve licenses, record exact artifact
  names and source checksums, and keep static vendored modules usable without runtime npm
  dependencies, a bundler or a host-specific feature. The SHA-256 baseline for the current
  vendored files is already recorded under "Independent vendor check" in
  `docs/project-updates-verification.md`, so an update compares against it.
- Verify the APIs used by `web/core.js` before replacing files. Exercise YAML schema and
  malformed/duplicate-key handling, Markdown fences and links, escaped raw HTML and unsafe-URL
  handling, and template/front-matter/index round trips. Run the full Node and browser suites;
  document intentional behavior changes and their host impact in the changelog.
- Keep each parser's replacement independently reviewable and record which versions actually
  shipped in README. This low-priority idea stays outside planned work unless a later scope
  decision brings it into a horizon. A security advisory for either parser is the exception.
  Dependabot reads only manifests like `package.json`, so it can't see the copies in
  `web/vendor`, and an advisory is only noticed by watching the marked and js-yaml
  repositories' security advisories. A fix for one ships as its own small update, using the
  copy procedure and checks above, without waiting for this item.
