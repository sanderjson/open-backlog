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

| ID | Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- | --- |
| W-5 | [A bad link in an item can't break the sheet or report the host down](bad-link-breaks-the-sheet.md) | 5 | done | high | build |
| W-6 | [Epics an agent can make and a person can find](epics-agents-make-and-people-find.md) | 6 | done | high | epic |
| W-7 | [Test the board's view logic without a browser](test-the-board-view-logic.md) | 6 | done | mid | build |
| W-8 | [Search finds items by tag, field value and kind](search-matches-tags.md) | 7 | done | high | build |
| W-9 | [Epic cards look unmistakably different](epic-cards-stand-out.md) | 8 | done | mid | build |
| W-10 | [List columns sort both ways](list-sorts-both-ways.md) | 9 | done | mid | build |
| W-29 | [The board fits a host page](the-board-fits-a-host-page.md) | 11 | done | mid | epic |
| W-12 | [A header and toolbar that lay out the same in every project](header-layout.md) | 12 | done | mid | build |
| W-13 | [The board's horizontal scrollbar floats mid-screen when columns are short](board-scrollbar-position.md) | 13 | done | mid | build |
| W-16 | [Filters and sorting, pure and tested](filters-and-sorting-pure-and-tested.md) | 15 | done | mid | epic |
| W-18 | [Keyboard shortcuts stay inside the board](scope-keys-to-the-board.md) | 17 | done | mid | build |
| W-14 | [Refresh the colour palette](colour-palette.md) | 18 | ready | mid | discuss |
| W-20 | [Themes beyond light and dark](themes.md) | 19 | idea | low | discuss |

### Core

<!-- open-backlog:group area=core -->

| ID | Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- | --- |
| W-3 | [Prompts open with the status change](prompt-starts-with-status.md) | 3 | done | high | build |
| W-11 | [Every item has a short ID](every-item-has-a-short-id.md) | 10 | done | mid | build |
| W-17 | [Review the text around the item in copied prompts](review-prompt-text.md) | 15 | done | mid | build |
| W-23 | [Generating an index into a missing README leaves two blank lines first](index-into-missing-readme.md) | 22 | done | low | build |
| W-24 | [backlog.yaml is sent by hosts but ignored by the board](backlog-yaml-is-ignored.md) | 23 | done | mid | build |
| W-25 | [Spell invisible characters in regexes as escapes](regex-literals.md) | 24 | done | low | chore |
| W-27 | [The dependency-loop check repeats work along long chains](loop-check-speed.md) | 26 | idea | low | build |
| W-30 | [Created dates use the local day](created-dates-use-the-local-day.md) | 27 | done | low | build |

### Host

<!-- open-backlog:group area=host -->

| ID | Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- | --- |
| W-4 | [Hosts refuse requests for another Host](host-header-check.md) | 4 | done | high | build |

### Cli

<!-- open-backlog:group area=cli -->

| ID | Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- | --- |
| W-15 | [The CLI creates items and epics](cli-creates-items-and-epics.md) | 14 | done | mid | build |
| W-34 | [new takes a custom file name with --slug](new-takes-a-custom-file-name-with-slug.md) | 16 | done | mid | build |
| W-21 | [Sync with GitHub Issues, or not](github-issues-sync.md) | 20 | ready | low | discuss |

### Repo

<!-- open-backlog:group area=repo -->

| ID | Item | Weight | Status | Priority | Type |
| --- | --- | --- | --- | --- | --- |
| W-1 | [Dogfood the kit](dogfood-the-kit.md) | 1 | done | high | build |
| W-2 | [Guidance agents find on their own](agent-guidance.md) | 2 | done | high | build |
| W-28 | [Publish a GitHub release for each tag](publish-a-github-release-for-each-tag.md) | 9 | done | high | chore |
| W-31 | [Answer the questions a project update raised](answer-the-questions-a-project-update-raised.md) | 14 | done | mid | build |
| W-19 | [A changelog, a version on the board, and a tag for the current head](release-hygiene.md) | 18 | done | mid | chore |
| W-22 | [Predictable configuration, index generation and tooling](small-fixes-from-the-review.md) | 21 | done | low | epic |
| W-26 | [Tooling hygiene: Node requirement, executable CLI and vendor provenance](tooling-hygiene.md) | 25 | done | low | chore |
| W-32 | [Update the vendored parsers with recorded versions](update-the-vendored-parsers-with-recorded-versions.md) | 28 | idea | low | chore |
| W-33 | [Release v0.6.0 after the project-update fixes](release-v0-6-0-after-the-project-update-fixes.md) | 29 | in-progress | mid | chore |

<!-- open-backlog:index end -->
