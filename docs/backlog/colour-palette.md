---
title: Refresh the colour palette
id: 14
status: ready
priority: mid
type: discuss
area: board
weight: 18
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
- **Semantic mapping:** keep today's well-known status tones and priority ordering, or choose a
  different explicit mapping? Record how other configured fields cycle through tones, and how
  explicit `colors:` overrides take precedence. Include `ready` and review statuses in examples
  instead of assuming every not-started value uses gray.
- **Contrast targets:** measure text on its actual background in both themes: normal text at
  least 4.5:1 and large text at least 3:1 under
  [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
  Meaningful non-text cues need 3:1 against adjacent colors where required by
  [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
  Do not apply one threshold to every dot, fill, border and text role indiscriminately.
- **Distinctness and compatibility:** keep all ten public tone names so existing `colors:`
  configuration continues to parse. Hues may be adjusted or their automatic use reduced;
  removing names needs a separate migration decision. Define labels, icons or other cues where
  meaning would otherwise rely on hue alone, including epic progress bars; do not promise ten
  colors every person can distinguish. See
  [use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
- **Neutrals and accent:** keep warm paper and indigo, or choose a cooler direction? Record the
  choice for `--bg`, `--surface`, `--sunken`, `--line`, `--ink`, `--muted`, `--faint` and
  `--accent`, with a light/dark swatch proposal for the later build.

## Acceptance
- Record a choice and rationale for all four questions, with a swatch proposal, required
  contrast measurements and any remaining uncertainty. This `discuss` item delivers a decision,
  not changes to the shipped board CSS, so screenshots of an implemented palette are not its
  completion criterion.
- Create a separate palette build only after the choices are agreed. Its acceptance covers the
  unchanged ten names, the agreed semantics, text/non-text checks, non-color cues and light/dark
  starter-board screenshots in `docs/backlog-assets/`. That build belongs to a later sprint.
- Clarify W-20's prerequisite: this item's completion permits discussion of themes; any themes
  implementation must also depend on the resulting palette build. Neither build gates v0.6.0.

## Decision record
Pending the maintainer's choices. Fill in the mapping, contrast/verification approach,
distinctness/compatibility approach, neutral/accent direction and follow-up build link before
marking this item done.
