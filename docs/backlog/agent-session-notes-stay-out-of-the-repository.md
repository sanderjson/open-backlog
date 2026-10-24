---
title: Agent session notes stay out of the repository
id: 47
status: ready
priority: low
type: chore
area: repo
weight: 16
tags: [hygiene]
created: 2026-10-24
depends_on: []
related: [deliver-five-project-grayscale-trial]
horizon: now
---

# Agent session notes stay out of the repository

## Why
Two agent scratch files were committed next to the shipped skill: `.claude/plan.md` and
`.claude/research.md`. Nothing uses them, and they quote old approvals an agent could misread.
They were never packaged, so removing them changes nothing for projects. Five minutes.

## Acceptance
- Both files are removed. Anything in them still worth keeping moves to W-45's text first.
- `.gitignore` ignores `.claude/*` except `!.claude/skills/`, so the next ones stay local.
