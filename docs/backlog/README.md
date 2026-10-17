# Backlog

The kit's own work, one Markdown file per item, shown by `npm run dev` at
http://127.0.0.1:3737/dev/backlog/. `backlog.yml` names the fields, `_template.md` is the body for
new items, and the tables below are a managed index: the board keeps them current, and
`node bin/open-backlog.mjs index docs/backlog --write` regenerates them.

Areas: `board` is the page (web/board.js, web/board.css), `core` the logic (web/core.js), `host`
the contract hosts implement (README's routes, PROMPT.md, test/server.mjs), `cli` the command
line, and `repo` everything around them (releases, CI, docs, dependencies).

How to work it, for people and agents: [../backlog-guidance/working-the-backlog.md](../backlog-guidance/working-the-backlog.md),
which is also what projects install with the board. In short: one file per item, an epic is an item
with an `items` list, a status change goes in the front matter and the index row, and
`node bin/open-backlog.mjs check docs/backlog` says what doesn't add up. Screenshots and other
attachments live in [../backlog-assets/](../backlog-assets/).

This repository is public, so this backlog is too. Nothing here should be more sensitive than the
code beside it: a security finding against the kit that could hurt the projects using it goes to a
GitHub security advisory first, and gets an item here once a fix is ready.

<!-- open-backlog:index start -->

### Board

<!-- open-backlog:group area=board -->

| Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- |
| [A bad link in an item can't break the sheet or report the host down](bad-link-breaks-the-sheet.md) | 5 | done | high | build |
| [Epics an agent can make and a person can find](epics-agents-make-and-people-find.md) | 6 | done | high | epic |
| [Test the board's view logic without a browser](test-the-board-view-logic.md) | 6 | done | mid | build |
| [Search finds items by tag, field value and kind](search-matches-tags.md) | 7 | done | high | build |
| [Epic cards look unmistakably different](epic-cards-stand-out.md) | 8 | done | mid | build |
| [List columns sort both ways](list-sorts-both-ways.md) | 9 | done | mid | build |
| [A header and toolbar that lay out the same in every project](header-layout.md) | 10 | ready | mid | discuss |
| [The board's horizontal scrollbar floats mid-screen when columns are short](board-scrollbar-position.md) | 11 | ready | mid | build |
| [Refresh the colour palette](colour-palette.md) | 12 | ready | mid | discuss |
| [Filters and sorting, pure and tested](filters-and-sorting-pure-and-tested.md) | 15 | done | mid | epic |
| [Keyboard shortcuts stay inside the board](scope-keys-to-the-board.md) | 17 | done | mid | build |
| [Themes beyond light and dark](themes.md) | 19 | idea | low | discuss |

### Core

<!-- open-backlog:group area=core -->

| Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- |
| [Prompts open with the status change](prompt-starts-with-status.md) | 3 | done | high | build |
| [Every item has a short ID](every-item-has-a-short-id.md) | 10 | idea | mid | build |
| [Review the text around the item in copied prompts](review-prompt-text.md) | 13 | ready | mid | build |
| [Generating an index into a missing README leaves two blank lines first](index-into-missing-readme.md) | 22 | idea | low | build |
| [backlog.yaml is sent by hosts but ignored by the board](backlog-yaml-is-ignored.md) | 23 | idea | low | build |
| [Spell invisible characters in regexes as escapes](regex-literals.md) | 24 | idea | low | chore |
| [The dependency-loop check is quadratic in chain length](loop-check-speed.md) | 26 | idea | low | build |

### Host

<!-- open-backlog:group area=host -->

| Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- |
| [Hosts refuse requests for another Host](host-header-check.md) | 4 | done | high | build |

### Cli

<!-- open-backlog:group area=cli -->

| Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- |
| [The CLI creates items and epics](cli-creates-items-and-epics.md) | 14 | done | mid | build |
| [Sync with GitHub Issues, or not](github-issues-sync.md) | 20 | ready | low | discuss |

### Repo

<!-- open-backlog:group area=repo -->

| Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- |
| [Dogfood the kit](dogfood-the-kit.md) | 1 | done | high | build |
| [Guidance agents find on their own](agent-guidance.md) | 2 | done | high | build |
| [A changelog, a version on the board, and a tag for the current head](release-hygiene.md) | 18 | idea | mid | chore |
| [Small fixes from the October 2026 review](small-fixes-from-the-review.md) | 21 | idea | low | epic |
| [Tooling hygiene: engines, exec bit, vendor provenance and versions](tooling-hygiene.md) | 25 | idea | low | chore |

<!-- open-backlog:index end -->
