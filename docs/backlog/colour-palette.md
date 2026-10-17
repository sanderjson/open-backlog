---
title: Refresh the colour palette
status: ready
priority: mid
type: discuss
area: board
weight: 14
tags: [ui]
created: 2026-10-17
depends_on: []
related: [themes, epic-cards-stand-out]
---

# Refresh the colour palette

## Why
The board's colours are due a pass: ten tones (gray, blue, teal, green, amber, orange, red, pink,
violet, indigo), each as a dot, a soft fill and an ink, in light and dark, plus the warm neutrals
behind them and the indigo accent. They were chosen once, early, and projects now use them for
statuses, priorities, areas and epics at the same time.

## To agree before building
- What the palette is for: statuses get well-known tones (gray not started, blue under way, green
  done, amber parked, red blocked) and other fields cycle through the rest. Keep that, or let the
  first field's values drive the hues?
- Contrast: every chip's ink on its soft fill, and every dot on the surface, meets WCAG AA in both
  themes, checked with a contrast tool rather than by eye.
- Distinctness: ten tones a colour-blind user can tell apart in a progress bar. Drop or merge the
  ones they can't (indigo against violet and blue; amber against orange).
- Neutrals and accent: keep the warm paper and the indigo, or go cooler? One decision, applied to
  `--bg`, `--surface`, `--sunken`, `--line`, `--ink`, `--muted`, `--faint` and `--accent`.

## Acceptance
- The agreed palette in [web/board.css](../../web/board.css), with the ten tone names unchanged so
  `colors:` in every backlog.yml keeps working, and the README's colour list still true.
- A light and a dark screenshot of the starter backlog in `docs/backlog-assets/`, for the record.
