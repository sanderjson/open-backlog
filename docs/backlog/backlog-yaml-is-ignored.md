---
title: backlog.yaml is sent by hosts but ignored by the board
id: 24
status: done
priority: mid
type: build
area: core
weight: 23
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
---

# backlog.yaml is sent by hosts but ignored by the board

## Why
`FILE_NAME` accepts `.yaml`, so hosts send a `backlog.yaml`, but `CONFIG_FILE` is `backlog.yml`
and nothing else is read. A project that names the file `.yaml` gets the guessed fields and no word
about why: checked, no problem is reported.

## Acceptance
- Keep `backlog.yml` as the only configuration filename. Any `backlog.yaml` in the folder adds
  a problem, not a suggestion: "backlog.yaml isn't read; name it backlog.yml". Do not silently
  read, merge, rename or overwrite it.
- With only `.yaml`, report the problem while keeping today's fallback field inference. With
  both names, report the same problem and read `.yml` as usual; explain that the user must
  reconcile their contents before removing the extra file. A `.yml`-only backlog is unchanged.
- README's configuration section and the guide name the canonical spelling and the diagnostic.
  Hosts still send allowed YAML files under the existing file contract; no host changes are
  needed, and the diagnostic is shared by the board and CLI.
- Core tests cover `.yaml` alone, `.yml` alone and both names with distinguishable settings.
  CLI `check` exits 1 for the ignored filename and succeeds again after it is resolved.

## Done
- `parseBacklog` reports a `backlog.yaml` as a problem for the backlog as a whole, so the board's
  panel and `check` share it. Alone, it says the fields are guessed and to rename it; beside a
  `backlog.yml`, to move what's needed into that and delete it. Nothing is read from it.
- README's backlog.yml section and its list of reports, the guide and the changelog name the
  spelling. Tests in [test/core.test.js](../../test/core.test.js) and
  [test/cli.test.js](../../test/cli.test.js) cover `.yaml` alone, `.yml` alone, both with
  different settings, and `check` passing again after a rename.
