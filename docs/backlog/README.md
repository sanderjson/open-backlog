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

## Where this is going

Draft, 2026-10-24, for the maintainer to confirm. open-backlog is a simple tool, and it's
finished when a project can drop in the board, the CLI and the guide and then mostly forget
them: the board reads clearly with or without colour, agents add and change items without
breaking `check`, and updates are rare and boring.

1. **Finish the grayscale trial** (W-42, W-39), by 2026-11-04.
2. **Ship v0.7.0** (W-38): the header, item details and grayscale work, without the trial
   scaffolding (W-48).
3. **v1.0:** the backlog format and the two-route host contract stop changing without a major
   version.

Everything else waits in `later` until a project asks for it. A new item should say which step
it serves, or why it's worth doing anyway. Keep each one small enough to finish in one sitting.

## Roadmap experiment

[W-44](try-roadmap-horizons-in-our-backlog.md) trials a `horizon` field on our own backlog.
Run `npm run dev`, then open
http://127.0.0.1:3737/dev/backlog/?group=horizon&open=1 to see the open work grouped by horizon.
The initial assignments are drafts for the maintainer to adjust at the first planning session.
They express intent without dates; status, priority, weight and dependencies keep their own meanings.

| Horizon | Meaning |
| --- | --- |
| `now` | Short term: the current planning cycle, including experiments gathering evidence. |
| `next` | Near term: the following work to consider, after current work or its dependencies. |
| `later` | Mid or long term: a direction worth keeping, without a scheduled cycle. |
| `unplanned` | Kept in the backlog, with no horizon chosen. |

People and agents should set `horizon: unplanned` on new items unless a planning decision says
otherwise. The configured field is required, so `check` catches missing horizons. Previously
completed items use `unplanned` because no horizon was recorded; newly completed items retain
their horizon. Both are hidden by the trial link's Open filter. Epics and their
members each have their own horizon; it is not inherited. Record useful examples and problems
in W-44 over three planning sessions, then use them to answer W-43's repository questions.

<!-- open-backlog:index start -->

### Board

<!-- open-backlog:group area=board -->

| ID | Item | Weight | Status | Priority | Type | Horizon |
| --- | --- | --- | --- | --- | --- | --- |
| W-5 | [A bad link in an item can't break the sheet or report the host down](bad-link-breaks-the-sheet.md) | 5 | done | high | build | unplanned |
| W-6 | [Epics an agent can make and a person can find](epics-agents-make-and-people-find.md) | 6 | done | high | epic | unplanned |
| W-7 | [Test the board's view logic without a browser](test-the-board-view-logic.md) | 6 | done | mid | build | unplanned |
| W-8 | [Search finds items by tag, field value and kind](search-matches-tags.md) | 7 | done | high | build | unplanned |
| W-9 | [Epic cards look unmistakably different](epic-cards-stand-out.md) | 8 | done | mid | build | unplanned |
| W-10 | [List columns sort both ways](list-sorts-both-ways.md) | 9 | done | mid | build | unplanned |
| W-29 | [The board fits a host page](the-board-fits-a-host-page.md) | 11 | done | mid | epic | unplanned |
| W-12 | [A header and toolbar that lay out the same in every project](header-layout.md) | 12 | done | mid | build | unplanned |
| W-13 | [The board's horizontal scrollbar floats mid-screen when columns are short](board-scrollbar-position.md) | 13 | done | mid | build | unplanned |
| W-16 | [Filters and sorting, pure and tested](filters-and-sorting-pure-and-tested.md) | 15 | done | mid | epic | unplanned |
| W-42 | [Try every project's board in grayscale](grayscale-trial.md) | 16 | in-progress | high | spike | now |
| W-36 | [A compact header with version and GitHub links](compact-header-with-version-and-github-links.md) | 17 | ready | mid | build | next |
| W-38 | [A refreshed board everyone can read and use](a-refreshed-board-everyone-can-read-and-use.md) | 17 | in-progress | mid | epic | now |
| W-40 | [Audit what each card mark tells a reader](audit-what-each-card-mark-tells-a-reader.md) | 17 | done | mid | spike | unplanned |
| W-18 | [Keyboard shortcuts stay inside the board](scope-keys-to-the-board.md) | 17 | done | mid | build | unplanned |
| W-35 | [Item details open in a native dialog](item-details-open-in-a-native-dialog.md) | 18 | ready | mid | discuss | next |
| W-41 | [The board works in grayscale](the-board-works-in-grayscale.md) | 19 | ready | high | build | next |
| W-48 | [v0.7.0 ships without the trial scaffolding](retire-the-trial-tooling-for-v0-7-0.md) | 19 | idea | high | chore | next |
| W-14 | [Refresh the colour palette](colour-palette.md) | 20 | ready | mid | discuss | next |
| W-37 | [A visual legend for card symbols](visual-legend-for-card-symbols.md) | 22 | ready | mid | build | next |
| W-20 | [Themes beyond light and dark](themes.md) | 23 | idea | low | discuss | later |
| W-45 | [Deliver a grayscale trial build for five projects](deliver-five-project-grayscale-trial.md) |  | done | high | build | now |

### Core

<!-- open-backlog:group area=core -->

| ID | Item | Weight | Status | Priority | Type | Horizon |
| --- | --- | --- | --- | --- | --- | --- |
| W-3 | [Prompts open with the status change](prompt-starts-with-status.md) | 3 | done | high | build | unplanned |
| W-11 | [Every item has a short ID](every-item-has-a-short-id.md) | 10 | done | mid | build | unplanned |
| W-17 | [Review the text around the item in copied prompts](review-prompt-text.md) | 15 | done | mid | build | unplanned |
| W-23 | [Generating an index into a missing README leaves two blank lines first](index-into-missing-readme.md) | 22 | done | low | build | unplanned |
| W-24 | [backlog.yaml is sent by hosts but ignored by the board](backlog-yaml-is-ignored.md) | 23 | done | mid | build | unplanned |
| W-25 | [Spell invisible characters in regexes as escapes](regex-literals.md) | 24 | done | low | chore | unplanned |
| W-27 | [The dependency-loop check repeats work along long chains](loop-check-speed.md) | 26 | idea | low | build | later |
| W-30 | [Created dates use the local day](created-dates-use-the-local-day.md) | 27 | done | low | build | unplanned |
| W-50 | [One bad backlog.yml setting doesn't discard the others](backlog-yml-problems-keep-the-other-settings.md) | 30 | idea | low | build | later |

### Host

<!-- open-backlog:group area=host -->

| ID | Item | Weight | Status | Priority | Type | Horizon |
| --- | --- | --- | --- | --- | --- | --- |
| W-4 | [Hosts refuse requests for another Host](host-header-check.md) | 4 | done | high | build | unplanned |

### Cli

<!-- open-backlog:group area=cli -->

| ID | Item | Weight | Status | Priority | Type | Horizon |
| --- | --- | --- | --- | --- | --- | --- |
| W-15 | [The CLI creates items and epics](cli-creates-items-and-epics.md) | 14 | done | mid | build | unplanned |
| W-34 | [new takes a custom file name with --slug](new-takes-a-custom-file-name-with-slug.md) | 16 | done | mid | build | unplanned |
| W-21 | [Sync with GitHub Issues, or not](github-issues-sync.md) | 20 | ready | low | discuss | unplanned |
| W-49 | [`new` refuses an item that `check` would reject](new-refuses-an-item-missing-a-required-field.md) | 21 | ready | mid | build | next |

### Repo

<!-- open-backlog:group area=repo -->

| ID | Item | Weight | Status | Priority | Type | Horizon |
| --- | --- | --- | --- | --- | --- | --- |
| W-1 | [Dogfood the kit](dogfood-the-kit.md) | 1 | done | high | build | unplanned |
| W-2 | [Guidance agents find on their own](agent-guidance.md) | 2 | done | high | build | unplanned |
| W-28 | [Publish a GitHub release for each tag](publish-a-github-release-for-each-tag.md) | 9 | done | high | chore | unplanned |
| W-31 | [Answer the questions a project update raised](answer-the-questions-a-project-update-raised.md) | 14 | done | mid | build | unplanned |
| W-46 | [Security reports about the kit have a private route](security-reports-have-a-private-route.md) | 15 | ready | mid | chore | now |
| W-39 | [Collect and answer feedback from the projects using the kit](collect-and-answer-feedback-from-the-projects-using-the-kit.md) | 16 | ready | high | build | now |
| W-44 | [Try roadmap horizons in our backlog](try-roadmap-horizons-in-our-backlog.md) | 16 | in-progress | mid | spike | now |
| W-47 | [Agent session notes stay out of the repository](agent-session-notes-stay-out-of-the-repository.md) | 16 | ready | low | chore | now |
| W-19 | [A changelog, a version on the board, and a tag for the current head](release-hygiene.md) | 18 | done | mid | chore | unplanned |
| W-43 | [Decide where open-roadmap lives](decide-where-open-roadmap-lives.md) | 19 | ready | mid | spike | next |
| W-22 | [Predictable configuration, index generation and tooling](small-fixes-from-the-review.md) | 21 | done | low | epic | unplanned |
| W-26 | [Tooling hygiene: Node requirement, executable CLI and vendor provenance](tooling-hygiene.md) | 25 | done | low | chore | unplanned |
| W-32 | [Update the vendored parsers with recorded versions](update-the-vendored-parsers-with-recorded-versions.md) | 28 | idea | low | chore | later |
| W-33 | [Release v0.6.0 after the project-update fixes](release-v0-6-0-after-the-project-update-fixes.md) | 29 | done | mid | chore | unplanned |
| W-51 | [CI runs once per change on current actions](ci-runs-once-on-current-actions.md) | 31 | idea | low | chore | later |

<!-- open-backlog:index end -->
