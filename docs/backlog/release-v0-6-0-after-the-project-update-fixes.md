---
title: Release v0.6.0 after the project-update fixes
id: 33
status: in-progress
priority: mid
type: chore
area: repo
weight: 29
tags: ["release", "guidance"]
created: 2026-10-18
depends_on: [answer-the-questions-a-project-update-raised, new-takes-a-custom-file-name-with-slug, review-prompt-text]
related: [small-fixes-from-the-review, release-hygiene, publish-a-github-release-for-each-tag, every-item-has-a-short-id, the-board-fits-a-host-page]
---

# Release v0.6.0 after the project-update fixes

## Why
Projects need a tagged, published update containing the ID and embedding work from
`feat/ids-layout-release`, its review fixes in `135508b`, and the project-update/agent workflow work planned next.
v0.6.0 is already warranted by the newly reserved `id` key and changed embedded-height default;
it is not waiting for a palette, themes, importer or parser upgrade.

## Acceptance
- W-31, W-34 and W-17 satisfy their acceptance. Any new correctness issue found while
  delivering them is fixed or explicitly resolved before release. W-22's members ship if they
  are done by then; the epic doesn't hold the release. W-14/W-21's decision timing, W-20, W-27
  and W-32 are not release prerequisites either.
- Review Unreleased against the final diff. Include the already delivered IDs/layout/date work,
  its review fixes, `new --slug`, update guidance and whichever maintenance changes shipped.
  Put host actions first, including the reserved `id`, opt-in numbering and mount-height notes;
  do not claim deferred builds or parser versions that were not delivered.
- During release preparation, align `VERSION` in `web/core.js`, PROMPT.md's example tag and the
  dated `v0.6.0` changelog heading as README's releasing procedure requires. Before that step,
  keep development work under Unreleased rather than pretending v0.6.0 is already published.
- On the final release commit, pass the Node 22/24 CI jobs, full browser suite, starter/project
  checks and `index --check`. Exercise the documented update from an older project copy,
  confirming tracked files, preserved local conventions, version display and the optional CLI.
- The ID, layout, date and scrollbar work on `feat/ids-layout-release` is merged to `main` before
  the sprint, untagged; sprint work lands on `main` through its own branches.
- Release from `main`: create an annotated `v0.6.0` tag on the release commit, push it,
  and publish a GitHub release for that exact tag with its changelog entry as the notes. A tag
  alone does not complete this item. Record the release URL and checked commit/version here.

## Progress
- Prepared on `feat/project-updates`: `VERSION` 0.6.0 in `web/core.js`, PROMPT.md's example
  `v0.6.0`, the changelog's dated `v0.6.0` heading (reviewed against the final diff: W-31, W-34,
  W-17 and all four W-22 fixes shipped, nothing deferred is claimed), and README's list of what
  updates ask. `npm test` (73) and `npm run test:silent` (23) pass; the browser suite checks `?`
  shows the version.
- The update was repeated on a throwaway v0.4.0 project at these files: the copied CLI is tracked
  after anchoring its `bin/` ignore rule, `--help` says v0.6.0 from a fresh worktree, `check`
  passes, and the project's own files are untouched.
- Left: a review of the branch, then merge `feat/ids-layout-release` and this branch to `main`,
  CI on the merge, the annotated tag, and the published release.
