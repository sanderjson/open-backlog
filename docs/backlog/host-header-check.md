---
title: Hosts refuse requests for another Host
status: done
priority: high
type: build
area: host
weight: 4
tags: [security, review-2026-10]
created: 2026-10-17
depends_on: []
related: []
---

# Hosts refuse requests for another Host

## Why
The defence against cross-site writes is the `X-Open-Backlog` header: a page on another site can't
add it without a CORS preflight, which the host never allows. That holds for ordinary cross-origin
requests but not under DNS rebinding. A page at `http://attacker.example:PORT` can point that name
at 127.0.0.1 after it has loaded; the browser then treats the dev server as the page's own origin
and sends custom headers without a preflight. The test host answers 204 to a PUT with
`Host: evil.example`, and nothing in PROMPT.md asks hosts to refuse one.

The exposure is bounded but real: such a page could read the whole backlog and overwrite its files
while the dev server runs, and the vandalism gets committed with the next change. Vite,
webpack-dev-server, Django and Rails all check the Host header for this reason.

## Acceptance
- README's "The two routes" and PROMPT.md's Context say: answer 403 to a request on either route whose
  `Host` header isn't the development host (localhost, 127.0.0.1, [::1] or the project's configured
  dev host, with any port). That's one comparison in any language, so it fits the ground rules.
- PROMPT.md's route tests (Expectations 5) get: a GET and a PUT with `Host: evil.example` are refused and
  nothing is written.
- [test/server.mjs](../../test/server.mjs), the first host to update, does the check, and
  [test/host.test.js](../../test/host.test.js) covers it.
- README's sentence about the header says what it does and doesn't cover.
