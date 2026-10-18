---
title: new takes a custom file name with --slug
id: 34
status: done
priority: mid
type: build
area: cli
weight: 16
tags: ["cli", "agent"]
created: 2026-10-18
depends_on: []
related: [answer-the-questions-a-project-update-raised, cli-creates-items-and-epics]
---

# new takes a custom file name with --slug

## Why
A project that names its items its own way, such as `<area>-<nn>-<slug>.md`, has to rename every
item `new` makes, and fix the index row with it. Split from W-31, which says in words that such
names are allowed; this item makes `new` produce them. W-17 doesn't wait on it.

## Acceptance
- `new "<title>" [directory] --slug <stem>` passes the stem to shared `planCreate`, which writes
  `<stem>.md`. The title and ID mean what they do now. Without `--slug`, the title-derived name
  and the `-2` suffix on a collision are unchanged. No board form field or host route is needed.
- The stem is used exactly as given and checked against the host's safe file name rules and the
  parser's item-file rules. A path, a hidden or `_`-prefixed name, a trailing `.md`, `README`,
  the configured index name or an existing file is refused. A requested name is never suffixed
  or overwritten. A missing value or a repeated `--slug` is an argument error: stderr, exit 2,
  nothing written.
- The index row and an epic's `items` (with `--epic`) use the stem. Templates, managed and
  ordinary indexes and automatic IDs keep working. Partial-write reporting stays as it is; no
  rename command.
- Core and CLI tests cover `api-07-export`, default naming, collisions, reserved and unsafe
  names, malformed arguments and no writes on invalid input.
- `--help`, README, the guide and the skill document the option, and Unreleased in the
  CHANGELOG says what it does.

## Done
- `planCreate` takes `slug`, checked by `checkSlug` in [web/core.js](../../web/core.js); the CLI
  passes `--slug` through unchanged. Tests in [test/core.test.js](../../test/core.test.js) and
  [test/cli.test.js](../../test/cli.test.js) cover the cases above, an epic's list and a managed
  index; refused commands leave the folder byte for byte as it was.
