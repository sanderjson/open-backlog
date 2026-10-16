# Add the open-backlog board to this project

Give this file to a coding agent working in the project, with the version to use (a tag of
https://github.com/sanderjson/open-backlog, e.g. `v0.2.0`).

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

That's the whole contract. Everything else the board does, epics included (items whose front
matter lists other items under `items`), is plain files read and written through these routes,
so it needs nothing more from the host.

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
  `backlog.yml` and the README index. Its `starter/` folder is a backlog to start from.
- This project's web server, router and dev-only configuration: how it serves files, how it
  limits routes to development, and where it keeps vendored code.
- A dev menu or dev tools page, if the project has one, to link the board from.

## Expectations

1. **Vendor the kit.** Copy the tag's `web/` into the project unchanged (e.g.
   `vendor/open-backlog/`, or wherever the project keeps vendored code), with the repo's
   `LICENSE` and a `VERSION` file holding the tag beside it. Don't edit those files: updating means replacing the folder. Don't put
   them in a folder the server publishes in production (a public or static directory). The dev
   route serves them itself.
2. **Add the route in development only.** It should be absent from production builds, not just
   hidden: a compile-time or startup check on the environment, the way the project already
   limits other dev tools.
3. **Start a backlog if there's none.** If `docs/backlog/` doesn't exist, copy `starter/` there.
   If it exists, add a `backlog.yml` only when the items' values need an order or a strict
   list, which the board can't guess (e.g. a status no item uses yet).
4. **Test the routes** with the project's own test tools:
   - `GET files` returns the folder's `.md`/`.yml` files, `_template.md` included, and nothing
     else (no hidden files, no other kinds), and `writable` is true;
   - `PUT` writes the file;
   - `PUT` refuses a missing header (403), `..%2Fx.md`, `x.sh` and `.x.md` (400), and nothing
     is written outside the folder;
   - `GET /dev/backlog/` serves the page and `board.js` is served as JavaScript;
   - in a production build or configuration, the route doesn't exist.
5. **Check it in a browser.** Open the board, change an item's status in its sheet, and confirm
   the file's front matter (and its README row, if the index shows status) changed. Then edit
   a file by hand and see the board follow within a few seconds.
6. **Link it** from the project's dev menu, if there is one, and mention the board in the
   project's docs where dev tools are listed.
7. **Report** where the kit lives and at which version, the route and how it's limited to
   development, what you added to the backlog, and anything from step 4 or 5 that didn't hold.
