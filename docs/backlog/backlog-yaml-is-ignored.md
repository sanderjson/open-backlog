---
title: backlog.yaml is sent by hosts but ignored by the board
id: 24
status: ready
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
