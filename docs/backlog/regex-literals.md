---
title: Spell invisible characters in regexes as escapes
id: 25
status: done
priority: low
type: chore
area: core
weight: 24
tags: [review-2026-10]
created: 2026-10-17
depends_on: []
related: []
horizon: unplanned
---

# Spell invisible characters in regexes as escapes

## Why
`FRONT_RE` in [web/core.js](../../web/core.js) starts with a literal U+FEFF byte-order mark, and
`slugify` strips a literal range of combining marks, U+0300 to U+036F. Both are invisible in most
editors. A formatter, an editor that strips BOMs, or a trojan-source lint rule can change or reject
them without anyone seeing a diff.

## Acceptance
- Replace the literal BOM in `FRONT_RE` with the visible source escape `\uFEFF`, and the literal
  combining-mark range in `slugify` with `[\u0300-\u036F]`. Keep the optional BOM, range endpoints
  and other regex behavior unchanged; the acceptance text itself must contain visible escapes.
- Tests for front matter behind a BOM and for a slug from an accented title, added if they don't
  exist, cover LF and CRLF front matter and composed/decomposed accented input. Do not broaden
  transliteration or filename rules as part of this mechanical change.

## Done
- `FRONT_RE` spells its optional BOM `﻿`, and `slugify` strips `[̀-ͯ]`. A scan of
  `web/`, `bin/` and `test/` finds no other invisible format, combining or space characters.
- A test in [test/core.test.js](../../test/core.test.js) reads front matter behind a BOM with LF
  and CRLF endings, and slugs composed and decomposed accents the same; it pins that letters
  without a decomposition (Æ, ß) are still dropped.
