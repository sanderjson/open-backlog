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
depends_on: [audit-what-each-card-mark-tells-a-reader]
related: [a-refreshed-board-everyone-can-read-and-use, themes, epic-cards-stand-out, compact-header-with-version-and-github-links, visual-legend-for-card-symbols]
---

# Refresh the colour palette

## Why
The board's colours are due a pass: ten tones (gray, blue, teal, green, amber, orange, red, pink,
violet, indigo), each as a dot, a soft fill and an ink, in light and dark, plus the warm neutrals
behind them and the indigo accent. They were chosen once, early, and projects now use them for
statuses, priorities, areas and epics at the same time.

W-38 includes both this decision and the resulting implementation. The choices below remain
open: record the maintainer's answers before changing palette values or card/progress cues.

## Where colour reads as done
Raised by the maintainer on 2026-10-18 from W-38's own card:
[BOARD-BASELINE](../backlog-assets/epic-progress-reads-done.webp). The epic has four items, none
done, and its bar is full and green-looking.

- **Epic progress bars.** `progress()` paints every segment in its member's status tone, so
  four `ready` items give four teal segments. The bar is full whatever the progress, so it
  contradicts the `0/4` beside it, which is the smaller, fainter of the two. Only hue tells a
  0/4 bar from a 4/4 one, and teal and green have almost the same luminance: 1.01:1 against
  each other in dark, 1.03:1 in light.
  Maintainer direction: undone segments are subtle, a neutral close to the card's own surface
  (grey or near black in dark), so the bar fills only as items get done. Still to decide:
  whether active and set-aside (parked) members get a cue of their own between empty and done,
  and what that cue is besides hue.
- **Ready and Done chips and dots.** The same teal/green pair marks Ready and Done on cards,
  list rows, the stats, and the status dots beside Depends on, Unblocks and Related links. Not
  started reads as finished at a glance.
- **Green means two things.** Done is green, and so is "can start": the play mark on cards, the
  "it can start now" notice, an epic's next step (`.bb-step.is-next`), the live indicator and
  success toasts. On the card in the screenshot, the green play mark, the teal chip and the teal
  bar all suggest finished work. Give green one meaning, and give "can start" a cue of its own.

There are likely more cases. The swatch sheet should show each status as it appears together on
one card, in both themes, not only each tone on its own.

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
- **Done and not done:** settle the cases under "Where colour reads as done". Which colour means
  done, whether any not-done status may share its hue family, how epic progress shows undone,
  active and set-aside members, and what marks "can start". W-37's legend describes the result,
  not today's bar.
- **Neutrals and accent:** keep warm paper and indigo, or choose a cooler direction? Record the
  choice for `--bg`, `--surface`, `--sunken`, `--line`, `--ink`, `--muted`, `--faint` and
  `--accent`, with a light/dark swatch proposal for the later build.

## How to pick the tones
Maintainer note, 2026-10-18. If the palette needs a wide spread of hues, don't take evenly spaced
stops along a straight line through the RGB cube. A line between two distant hues (blue to
amber, say) passes near the cube's grey diagonal, so the middle stops come out muddy and dull,
and equal steps in RGB don't look equal in lightness either.

Go around the colour space instead: define the tones in a perceptual polar space and step the
hue angle at a chosen lightness and chroma. OKLCH is the likely choice. Its lightness tracks what
the eye sees better than RGB, and it avoids CIE LCH's drift of blues toward purple. Lab or LCH
are the alternatives to compare. That gives:

- **Even lightness across hues,** so each role (dot, soft fill, ink) can sit at one lightness per
  theme, and its contrast can be predicted before it's measured.
- **Even-looking hue steps,** with the chroma the same across the spread rather than some
  tones shouting and others greyed out.
- **A gamut limit to handle:** at one lightness and chroma some hues fall outside sRGB, and
  yellows and blues reach different maximum chroma. Record how out-of-gamut tones are brought
  back (reduce chroma, keep lightness and hue) and measure contrast on the final sRGB values.

The same applies to derived colours. Where the CSS mixes two colours with
`color-mix(in srgb, …)`, such as the primary button's hover (ink with the accent), the mix can
grey out for the same reason; `in oklab` or `in oklch` keeps it clean. Mixes with `transparent`
only change opacity and aren't affected. If the build derives soft fills from the tones instead
of listing them, it should mix in OKLab too.
Whether the CSS ships `oklch()` values or hex computed from them is for the build to decide.

## Acceptance
- Record a choice and rationale for all five questions, with a swatch proposal, required
  contrast measurements and any remaining uncertainty. This `discuss` item delivers a decision,
  not changes to the shipped board CSS, so screenshots of an implemented palette are not its
  completion criterion.
- Create a separate palette build only after the choices are agreed. Its acceptance covers the
  unchanged ten names, the agreed semantics, text/non-text checks, non-color cues and light/dark
  starter-board screenshots in `docs/backlog-assets/`. It owns any agreed card/progress cue
  changes needed to convey meaning alongside hue, using shared tokens/rendering so W-37 can
  describe the implemented result. Use `rem` for new or changed dimensions.
- Before marking this discussion done, link the agreed build here, make it depend on this
  item, and add it to W-38's `items` before the legend. Also add it to W-37's `depends_on`.
  This discussion can then be done while its build is still pending; W-38 cannot be.
- Clarify W-20's prerequisite: this item's completion permits discussion of themes; any themes
  implementation must also depend on the resulting palette build. W-20 remains outside W-38.
- The build measures actual header, card and existing-dialog surfaces, including configured
  colour overrides. Preserve override precedence and the ten public names; identify the limits
  of arbitrary host/configuration colours rather than claiming unmeasured combinations pass.
  New details and legend surfaces are checked in their builds and W-38's final verification;
  this build must not wait for the legend that depends on it. W-38 owns the combined release.

## Design references
[The header gallery](../header-wireframes.md) (HEADER-*) and
[details gallery](../item-detail-concepts.md) (DETAIL-*) show the proposed surfaces the palette
will need to support. Review text, muted metadata, links, selected rows and dialog backdrops
on those surfaces in both themes. Their grayscale values and sample progress marks are layout
illustrations, not palette candidates or contrast measurements. BOARD-BASELINE is the actual
captured problem; W-40's real-card audit supplies the other semantic conflicts to resolve.

## Decision record
Pending the maintainer's choices. Fill in the mapping, contrast/verification approach,
distinctness/compatibility approach, done and not-done cues, neutral/accent direction, the tone
construction (colour space, lightness and chroma per role, gamut handling) and follow-up build
link before marking this item done.
