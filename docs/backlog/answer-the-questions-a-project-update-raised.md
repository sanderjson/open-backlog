---
title: Answer the questions a project update raised
id: 31
status: done
priority: mid
type: build
area: repo
weight: 14
tags: [guidance, agent]
created: 2026-10-18
depends_on: []
related: [agent-guidance, cli-creates-items-and-epics, release-hygiene, new-takes-a-custom-file-name-with-slug]
---

# Answer the questions a project update raised

## Why
An agent updated a project from v0.4.0 to v0.5.0 and finished with questions and workarounds
that the kit's README, PROMPT.md and guide should have settled. Each one will come up again in
every project that updates:

- **Where details that stay out of the repo go.** The guide says to ask when the backlog README
  doesn't say, and the agent did. But a project updating from v0.4.0 never got the starter
  README's fill-in line, and nothing in "Updating a project's copy" or the CHANGELOG tells it to
  add one. The options are listed, but nothing helps a project choose (for example, a GitHub
  draft advisory for security findings, a password manager for credentials).
- **File names that aren't the title's slug.** The project names items `<area>-<nn>-<slug>.md`.
  The guide says the slug *is* the title in lower case, which reads as a rule, so the agent
  couldn't tell whether other names are allowed. `new` names the file after the title, so every
  item it makes needs renaming, and the index row with it. The agent suggested a `--slug` option.
- **No `CLAUDE.md` or `AGENTS.md`.** PROMPT.md asks for a pointer in the project's agent
  instructions "if it has them", so the agent skipped that step. It didn't know whether to create
  one.
- **The vendored CLI was git-ignored.** The project's `.gitignore` rule `bin/` also matched the
  vendored `bin/open-backlog.mjs`, so the file was never committed and `check` failed in a fresh
  clone. Nothing in the install or update steps says to make sure the copied files are tracked.
- **Updating didn't install the guidance.** The guide and skill were new since the project's last
  update. The agent found them, but the update steps only mention `web/` and `bin/`.
- **Confirming the update on the board.** The agent couldn't check the board live because an old
  dev server was still running. The update steps don't say how to confirm the new version is
  served (restart, then `?` shows the version).

## Acceptance
- README's "Updating a project's copy" and PROMPT.md cover upgrading an existing backlog as
  well as a fresh install. Use one chosen tag for the whole kit: replace `web/` and, where the
  optional CLI is installed, `bin/open-backlog.mjs`; refresh the kit's guide and installed skill.
  Preserve the project's backlog, configuration, attachments and its own convention files.
- Distinguish the host's recorded `VERSION` file from `VERSION` in the kit's `web/core.js`.
  Update the host's marker to the chosen tag; copy the kit unchanged. Hosts do not edit core.js
  or bump the kit's version themselves. Apply every relevant intervening CHANGELOG update note.
- Check the copied files' paths for ignore rules (`git check-ignore -v`, including `--no-index`
  when checking already tracked paths), inspect which files will be committed, and verify the
  optional CLI's `--help` and `check` from a fresh checkout. Explain fixing a broad `bin/` rule
  with a narrow exception; copying a file locally is not evidence it is in git.
- Install or refresh only the kit-owned guidance and skill files, preserving project additions.
  If no agent instructions file exists, report that and propose the pointer text for `AGENTS.md`;
  do not silently create a new instructions file or treat its absence as an install failure.
- An existing backlog README without a "what stays out" convention gets an explicit migration
  step. Describe suitable private locations for the common cases and respect the project's
  access rules; if its choice is unclear, leave a public item as a pointer and ask where details
  belong. No sensitive example content is copied into the public backlog.
- Restart the project's own dev server when needed, reload without stale assets, compare `?`
  and, where installed, CLI `--help` with the chosen tag, and run the existing read/edit smoke
  check. If the server cannot be exercised, report that limit instead of claiming verification.
- README, the guide and the installed skill distinguish `id: n` (the stable short handle) from
  the filename stem (the slug used by links and membership). Projects may use their own safe
  filename pattern. A manual rename keeps the ID and updates the index, `depends_on`, `related`,
  `items` and Markdown links in other items, followed by `check`; renaming the title alone does
  not require renaming the file. W-34 adds `new --slug`; this item documents the naming rule and
  the manual rename, and doesn't wait for it.

## Validation
- Walk through both a v0.4.0 project missing guidance and a v0.5.0 project with local conventions;
  record which update steps apply and confirm that project-owned files survive.
- `npm test`, `check` for this backlog and the starter, and this backlog's `index --check` pass.
  Keep Node and the CLI optional for hosts without them.

## Done
- README's "Updating a project's copy" has six steps; PROMPT.md has an Updating section that
  follows them, notes the project's `VERSION` against core.js's, checks ignore rules on a fresh
  install, and offers `AGENTS.md` lines when there's no instructions file. "As visible as the
  repository" gives defaults to propose; the guide and the skill say to propose one and ask.
- README, the guide, the skill and the starter say the slug is the file name, a project's own
  pattern is fine, and how to rename an item's file. `new --slug` is W-34.
- Walked through with two throwaway projects, each with `bin/` in `.gitignore`, updated to this
  branch's files. A v0.4.0 copy needed every step: the CLI was ignored (`check-ignore` named the
  rule; `/bin/` fixed it), and the guide, the skill and the "What stays out" line were missing. A
  v0.5.0 copy with its own `triage.md` and a second skill needed steps 1 to 3 only; its own
  files survived. From a fresh `git worktree`, `--help` and `check` ran in both. Neither had a
  dev server, so step 6's board check wasn't exercised there.
