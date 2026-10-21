---
title: Deliver a grayscale trial build for five projects
id: 45
status: done
priority: high
type: build
area: board
horizon: now
tags: [ui, a11y, trial]
created: 2026-10-21
depends_on: []
related: [grayscale-trial, collect-and-answer-feedback-from-the-projects-using-the-kit, the-board-works-in-grayscale]
---

# Deliver a grayscale trial build for five projects

## Why
The maintainer needs an installable test experience for all five existing projects and a way to
record observations while working. Backlog plans and a grayscale bookmarklet alone leave the
kit on v0.6.0 and make the trial hard to run consistently.

## Acceptance

- A portable v0.7.0-preview.1 package can replace an existing project's static kit and optional
  CLI, with version/checksum identity, per-file verification and rollback instructions.
- Grayscale starts enabled in standalone and embedded boards, covers light and dark plus
  dialogs, and can be compared with colour using a per-installation preference.
- Priority, status, waiting, startability and weight are readable as words. An epic has one
  badge on its card and a neutral progress track filled only by completed members.
- Trial notes can be recorded from the board or item details, with version, appearance, theme,
  view and item context. They append to a non-item Markdown file using the existing checked
  file routes. Draft recovery, conflicts, read-only use and downloads are verified.
- An update prompt and five-project record let each project's agent install and verify the
  same package; trial findings can be documented during normal work.
- Node/browser suites, project/starter backlog checks and the managed-index check pass.

## Delivery

[Update instructions and project-agent prompt](../trials/grayscale-preview.md).
[Five-project installation and observation record](../trials/five-project-notes.md).
Install the pinned prerelease tag or its package; the release includes an agent update prompt.
Generate the package with `npm run pack:preview`; it contains no project backlog or notes.

This delivers the trial tooling. W-42 owns field observations and W-41 owns the final visual
choices; W-35 and W-36 still own the details and header designs. No external installation is
claimed to be updated until its agent's verification is recorded.

## Verification

- All 75 Node tests pass; all 30 headless Chromium tests pass. After the final draft-context
  and read-only feedback refinements, all seven trial browser cases pass again.
- Project and starter backlog checks, the managed-index check and `git diff --check` pass.
- Verified all 20 extracted package files against MANIFEST.json, the archive checksum, package
  exclusions, the generated update prompt and the extracted CLI's preview version.
- Package SHA-256: `d7330dcd4549389ec07d9466225d8dcd035183f6a05e2ad9672d9ce2b048bfaa`.
- UI review copies: [light](../backlog-assets/grayscale-preview-light.webp),
  [dark](../backlog-assets/grayscale-preview-dark.webp), and
  [notes dialog](../backlog-assets/grayscale-preview-notes.webp). The typed example in the
  capture was not saved as a trial observation.

The five external installation reports and real-use findings remain pending in W-42/W-39.
