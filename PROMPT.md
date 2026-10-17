# Add the open-backlog board to this project

Give this file to a coding agent working in the project, with the version to use (a tag of
https://github.com/sanderjson/open-backlog, e.g. `v0.3.0`).

## Goal

In development only, this project's own web server serves the backlog board at a dev route
(`/dev/backlog/` unless the project has a better place) over the project's backlog folder
(`docs/backlog/`). The board shows the work items, edits them and follows changes to the files.
No second server, no build step, and nothing new in production.

## Context

The board is a kit: static files (`web/` in the repo) that run in the browser. All the logic
(front matter, Markdown, checks, edits, the README index) is in that JavaScript. The host
provides exactly three things, all under one mount path, say `/dev/backlog`:

1. **The page and its files.** `GET /dev/backlog/` serves `web/index.html`, and
   `GET /dev/backlog/<path>` serves `web/<path>` (`board.js`, `core.js`, `board.css`,
   `icon.svg`, `vendor/*.js`). `GET /dev/backlog` (no slash) redirects to `/dev/backlog/`,
   because the page's links are relative. `.js` must be served as `text/javascript` (they're ES
   modules), `.css` as `text/css` and `.svg` as `image/svg+xml`.
2. **`GET /dev/backlog/files`.** It returns JSON: `files` maps each name to its text for every
   regular file directly in the backlog folder matching
   `^[A-Za-z0-9_][A-Za-z0-9._-]*\.(md|ya?ml)$`, with no subfolders. That includes
   `_template.md`, the body for new items. Also `dir` (the folder as the project names it,
   e.g. `"docs/backlog"`), `path` (its absolute path, for "open in editor" links) and
   `writable` (`true`). Optionally, add an `ETag` and answer `If-None-Match` with `304`: the
   page polls every 2 seconds.
3. **`PUT /dev/backlog/files/<name>`.** The body is the file's whole new text. Refuse with 403
   unless the request has the header `X-Open-Backlog: 1`. Refuse with 400 any name that doesn't
   match the pattern above, which also rules out `/`, `..` and hidden files. Cap the body (1 MB
   is plenty) and write atomically: a temporary file in the same folder, then a rename. Answer
   204, or an error status with `{"error": "<why>"}`, which the page shows.

These routes are enough for every board feature, epics included (items whose front matter lists
other items under `items`). Write them in the project's own language and framework, in the
server it already runs: the kit ships no host code to install, and needs none.

Optionally, make saves checked, so the board can never write over an edit made between its read
and its save:
- add `versions` to `GET files`: each file's name mapped to a string that changes whenever the
  file's text does (a SHA-256 hex digest of its bytes is simplest);
- the board then sends `If-Match: "<version>"` with each PUT, or `If-None-Match: *` when it
  creates a file;
- just before writing, compare: if the file's version is different, or the file exists despite
  `If-None-Match: *`, answer 412 and change nothing;
- if the server handles requests concurrently, hold a lock around the compare and the write.

The header check is the protection against cross-site writes (a foreign page can't add a custom
header without a CORS preflight, which this server never allows). So keep the route out of any
CSRF-token middleware and body parsers that would reject or consume a `text/plain` PUT. Leave it
out of authentication too: it exists only in development.

The page needs nothing else: no CDN, no inline script. Under a content security policy it needs
`script-src 'self'`, `style-src 'self'` and `img-src 'self' data:`. To show the board inside the
project's own layout instead of `index.html`, load `board.css` and `board.js` (as
`type="module"`) and add `<div data-open-backlog data-api="/dev/backlog"></div>`. The routes stay
the same.

## Sources

- The kit at the chosen tag: `git clone --depth 1 --branch <tag>
  https://github.com/sanderjson/open-backlog`. Its README describes the routes, the item format,
  `backlog.yml` and the README index. Its `starter/` folder is a backlog to start from,
  `docs/backlog-guidance/working-the-backlog.md` is the guide for people and agents working one,
  and `.claude/skills/open-backlog/` is the skill that gets a coding agent to read it.
- This project's web server, router and dev-only configuration: how it serves files, how it
  limits routes to development, and where it keeps vendored code.
- A dev menu or dev tools page, if the project has one, to link the board from.
- The project's agent instructions (`CLAUDE.md`, `AGENTS.md` or the like), if it has them, to
  point at the backlog from.

## Expectations

1. **Vendor the kit.** Copy the tag's `web/` into the project unchanged (e.g.
   `vendor/open-backlog/`, or wherever the project keeps vendored code), with the repo's
   `LICENSE` and a `VERSION` file holding the tag beside it. Where the project has Node 22 or
   later, copy `bin/open-backlog.mjs` beside `web/` too: it imports `../web/core.js`, and gives
   agents and CI `check`, `next`, `prompt` and `index`. Don't edit those files: updating means
   replacing the folders. If the kit falls short for this project, say so in your report instead
   of patching the copy. The kit has to stay the same for every host, whatever its language (see
   "Ground rules" in its README). Don't put the files in a folder the server publishes in
   production (a public or static directory). The dev route serves them itself.
2. **Add the route in development only.** It should be absent from production builds, not just
   hidden: a compile-time or startup check on the environment, the way the project already
   limits other dev tools.
3. **Start a backlog if there's none.** If `docs/backlog/` doesn't exist, copy `starter/` there.
   If it exists, add a `backlog.yml` only when the items' values need an order or a strict
   list, which the board can't guess (e.g. a status no item uses yet). Either way, if the project
   has no `docs/backlog-guidance/`, create it with the kit's `working-the-backlog.md`: it's
   Markdown only, and the project's own conventions go beside it. Attachments that belong to items
   go in `docs/backlog-assets/`, created when first needed. The backlog is as visible as the
   repository, so fill in the starter README's line on what stays out of it (unfixed security
   findings, credentials, personal data) with where this project keeps such things, and ask if it
   isn't obvious.
4. **Point agents at it.** Copy the kit's `.claude/skills/open-backlog/` into the project's
   `.claude/skills/` (or wherever the project's agent tooling keeps skills). Add a few lines to
   the project's agent instructions (`CLAUDE.md`, `AGENTS.md` or the like): where the backlog
   folder is, to read `docs/backlog-guidance/` before changing it, that an epic is an item with an
   `items` list, and that a status change goes in the item's front matter and its index row.
5. **Test the routes** with the project's own test tools:
   - `GET files` returns the folder's `.md`/`.yml` files, `_template.md` included, and nothing
     else (no hidden files, no other kinds), and `writable` is true;
   - `PUT` writes the file;
   - `PUT` refuses a missing header (403), `..%2Fx.md`, `x.sh` and `.x.md` (400), and nothing
     is written outside the folder;
   - `GET /dev/backlog/` serves the page and `board.js` is served as JavaScript;
   - in a production build or configuration, the route doesn't exist;
   - if the host gives versions: a PUT with the current version writes, a PUT with a stale
     `If-Match` gets 412 and changes nothing, and `If-None-Match: *` on an existing file gets 412.
6. **Check it in a headless browser.** Open the board, change an item's status in its sheet, and
   confirm the file's front matter (and its README row, if the index shows status) changed. Then
   edit a file by hand and see the board follow within a few seconds. If the host gives
   versions, also edit a file by hand while its sheet is open, then change a field in the sheet:
   the board reports the conflict and your hand edit stays. Keep browser windows hidden unless
   explicitly requested.
7. **Link it** from the project's dev menu, if there is one, and mention the board in the
   project's docs where dev tools are listed.
8. **Report** where the kit lives and at which version, the route and how it's limited to
   development, what you added to the backlog and to the agent instructions, and anything from
   step 5 or 6 that didn't hold.
