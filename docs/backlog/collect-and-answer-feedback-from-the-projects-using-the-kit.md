---
title: Collect and answer feedback from the projects using the kit
id: 39
status: ready
priority: high
type: build
area: repo
weight: 16
tags: [guidance, agent]
created: 2026-10-18
depends_on: []
related: [answer-the-questions-a-project-update-raised, agent-guidance, github-issues-sync, grayscale-trial, security-reports-have-a-private-route]
horizon: now
---

# Collect and answer feedback from the projects using the kit

## Why
Five projects use open-backlog now, and each has questions or comments about fitting it into
its own setup. PROMPT.md already asks the integrating agent to report where the kit falls short,
but that report goes only to the person running that project's session. Nothing collects the
reports in one place, so the same question can be answered five times, or not at all, and the
kit's README, PROMPT.md and guide never learn from it.

The most useful work so far came from real use: one project's update raised the questions W-31
answered. Five projects are five times that input, and they're available now.

## To agree before collecting
How feedback reaches this repository, now and next time:

- **Paste it here.** All five projects run on the same computer, each in its own CLI session.
  Each project's agent answers the same prompt (below), and the answers are pasted into a
  session in this repo. No setup, so it works today. It only works for one person on one
  machine, though, and leaves no record outside this item.
- **A GitHub issue per project.** An issue form in this repo (`.github/ISSUE_TEMPLATE/`), filed
  by each project's agent with `gh issue create` from the same account. Answers come back as
  comments, which that project's agent can read with `gh issue view`. The record lasts, and it
  works for adopters who aren't on this machine. The repository is public, so the form has to
  say what stays out, and filing is outward-facing: the agent drafts the issue and asks before
  it files.
- **Questions in the install itself.** PROMPT.md's Report step (Expectations step 8, and step 6
  of Updating) gains a fixed "Questions for the kit" part, so every install and update ends
  with the same shape of feedback, whichever channel carries it. Answered questions go into a
  known-questions section in PROMPT.md, so the next integrating agent can answer them on the
  spot without asking anyone.

Recommendation: paste here for this round, add the Report part to PROMPT.md as part of the
answers, and use the issue form as the channel for later rounds. Decide the issue form after
this round, once the feedback shows whether it's needed.

## The prompt for each project
Run this in each project's own session as it stands, without updating the kit first: whatever
v0.6.0 already fixes gets "update" as its answer, which also shows whether the update steps are
easy to find. Paste the reply here, with the maintainer's own comments on that project below it.

The prompt asks for facts first, so the replies can be compared by version and stack. It asks
for a quote and a workaround behind each complaint, so each point leads to a specific fix, and
for a top three, so the replies don't turn into wish lists. Some answers feed open items too:
other trackers bear on W-21, backlog size on W-27, and day-to-day use on the board refresh
(W-38).

> We use open-backlog in this project, and its maintainer is collecting feedback from every
> project that uses it. Answer from what you can see here. This is read-only: don't change files,
> file issues or post anywhere. If you didn't install or update the kit yourself, say so and work
> from the files and the git history. Leave out anything private to this project (customer data,
> credentials, internal hostnames, unreleased plans) and describe the setup in general terms.
> If you find a security problem in the kit itself, leave it out of this reply and tell the
> maintainer directly.
>
> **1. The setup (facts only)**
> - The kit's version (the project's `VERSION` file) and where the kit is vendored.
> - The stack: language, framework, dev server, and how the board's route is wired in.
> - The Node version, and whether the CLI is installed. If it is, a summary of `check` and `next`.
> - The backlog's size (items and epics), and any fields or statuses beyond the starter's.
> - Whether the agent instructions (CLAUDE.md, AGENTS.md) point at the backlog.
> - Whether the vendored files differ from the release, or the host works around them.
> - Whether work is also tracked elsewhere (GitHub Issues, another tool), and how the two relate.
>
> **2. What didn't fit.** Any install or update step that didn't hold, and anything you had to
> work around: what you were doing, what README, PROMPT.md or the guide said (quote it, with the
> file and section), and what you did instead.
>
> **3. Open questions.** What you'd still ask the kit's maintainer, and what you assumed meanwhile.
>
> **4. Day-to-day use.** How people and agents here actually use the backlog: the board, the CLI,
> editing files by hand. What gets used, what doesn't, and what you keep doing by hand that the
> kit could do.
>
> **5. Top three.** The changes you'd most want in the kit, most important first, and why.
>
> Reply in that order, and mark each point in 2 to 5 as a bug, a doc gap, a question or a
> request.

## Trial experience

W-45 packages v0.7.0-preview.1 for updating all five projects and recording notes from inside
the board. Use [the project-agent update prompt](../trials/grayscale-preview.md) and
[the shared five-project record](../trials/five-project-notes.md). The notes recorder's topics
include Header and Item details, so the maintainer can capture those observations alongside
the agent feedback requested above. Keep each project's raw `_trial-notes.md` there; copy only
suitable excerpts into this public record.

## Alongside: the grayscale trial
[W-42](grayscale-trial.md) runs in the same projects on the same days: the maintainer uses each
board in grayscale and notes what's missed. Those notes go in
[the five-project record](../trials/five-project-notes.md); W-42 owns them. Give this prompt
before W-42's update prompt, so the reply describes the version the project had.

## Acceptance
- Feedback from all five projects is recorded below under "Feedback received", one section per
  project. Name projects generically ("a Rails app on v0.5.0") unless their maintainer agrees to
  the name, since this backlog is public.
- Each point is grouped by theme and duplicates are merged, then given one outcome:
  - already answered, so the docs need to be easier to find;
  - a gap in README, PROMPT.md, the guide or the skill, fixed here;
  - a kit change, which becomes its own item, linked from here;
  - specific to that project, answered without changing the kit.
- The doc fixes land in README, PROMPT.md, `docs/backlog-guidance/working-the-backlog.md`,
  `.claude/skills/open-backlog/SKILL.md` and the starter where it applies. The CHANGELOG has an
  entry saying what an updating project should reread.
- Each project gets its answers back: either pasted back into its session or as a comment on its
  issue, depending on the channel used.
- The channel decision is recorded here. If it's the issue form: the form exists, asks for the
  same things as the prompt above, says what stays out, and PROMPT.md points at it with "draft,
  then ask before filing".
- `npm test`, `check` and `index --check` pass for this backlog and the starter.

## Feedback received
None yet.
