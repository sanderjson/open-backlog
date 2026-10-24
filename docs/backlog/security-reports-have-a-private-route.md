---
title: Security reports about the kit have a private route
id: 46
status: ready
priority: mid
type: chore
area: repo
weight: 15
tags: [security]
created: 2026-10-24
depends_on: []
related: [collect-and-answer-feedback-from-the-projects-using-the-kit, grayscale-trial]
horizon: now
---

# Security reports about the kit have a private route

## Why
This backlog says a security problem in the kit goes to a private GitHub security advisory
first. Only the maintainer can do that today: private vulnerability reporting is off and there
is no SECURITY.md, so anyone else, including the five projects' agents during W-39, can only
report in public. About fifteen minutes of setup.

## Acceptance
- Private vulnerability reporting is on (Settings > Security, or
  `gh api -X PUT repos/sanderjson/open-backlog/private-vulnerability-reporting`).
- A short SECURITY.md: report with GitHub's "Report a vulnerability", not in issues or feedback;
  fixes go into the latest release; a fix is announced in the CHANGELOG, since projects vendor
  the kit and get no automatic alerts.
