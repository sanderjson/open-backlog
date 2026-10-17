---
title: Themes beyond light and dark
id: 20
status: idea
priority: low
type: discuss
area: board
weight: 19
tags: [ui]
created: 2026-10-17
depends_on: [colour-palette]
related: []
---

# Themes beyond light and dark

## Why
The board follows the system's light or dark, with a button to override. Projects have their own
colours, and a board used all day deserves a look its users like: a cooler neutral, a different
accent, or a named theme that matches the project's other dev tools. Today that means editing
`web/board.css`, which projects must not do, since the copy is replaced on update.

## To agree before building
- Where a theme is chosen: `theme:` in backlog.yml (the backlog's own look), CSS custom properties
  the host page sets around `.bb` (the host's look), or both, with the host winning.
- What a theme is: the neutrals and the accent only, with the ten tones fixed, or the tones too?
- How many ship: two or three named themes, each in light and dark, built on the refreshed palette.
- The theme button stays light, dark and auto; the theme itself isn't a per-user toggle.

## Acceptance
- The agreed mechanism, documented in the README's backlog.yml section and in PROMPT.md's notes for
  hosts, with the shipped themes shown in `docs/backlog-assets/`.
- Nothing in it needs a host feature beyond serving static files.
