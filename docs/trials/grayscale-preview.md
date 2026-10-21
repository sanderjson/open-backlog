# Try the grayscale preview in five projects

This is **v0.7.0-preview.1**, a trial prerelease. The latest stable release remains v0.6.0.
Install the same pinned tag in each project, or download the package from its
[GitHub prerelease](https://github.com/sanderjson/open-backlog/releases/tag/v0.7.0-preview.1).

It starts in grayscale, gives state and priority visible words, and fills an epic's progress
bar only for completed members. The trial strip lets you compare colour and record notes.
The final header and item-detail designs are still separate work; this preview keeps their
current layout. Its provisional choices give us something concrete to use and review.

## Pull the pinned version

Clone the tag outside the host project, then follow the update prompt below to replace the
project's vendored kit:

```sh
git clone --depth 1 --branch v0.7.0-preview.1 https://github.com/sanderjson/open-backlog.git
```

For an existing kit checkout, `git fetch origin --tags` and `git switch --detach
v0.7.0-preview.1` select the same version. Keep any local edits safe before switching. A host
project that vendors the kit still needs its copied files replaced; fetching this repository
alone does not change them.

## Build or download the same package everywhere

In the open-backlog checkout:

```sh
npm run pack:preview
```

The command creates `artifacts/open-backlog-v0.7.0-preview.1.tar.gz`, its `.sha256` file and a
ready-to-paste `artifacts/UPDATE-PROMPT.md` with the tag-based update prompt and archive checksum.
The release also includes `UPDATE-FROM-RELEASE.md`, the same prompt without a local machine path.
The archive contains the kit's static files, optional CLI, guides, this procedure, a VERSION
file and a manifest with the SHA-256 of each packaged file. It excludes this repository's
backlog, notes, git data and development dependencies. Regenerate it after changing the preview;
use the same archive checksum in all five installations so the results can be compared.

## Prompt for the agent in each project

Give each project's agent the following prompt:

```text
Update this project's existing open-backlog installation to the grayscale trial prerelease
v0.7.0-preview.1 from https://github.com/sanderjson/open-backlog.
Clone the pinned tag outside this project with:
git clone --depth 1 --branch v0.7.0-preview.1 https://github.com/sanderjson/open-backlog.git
Alternatively, use the release's open-backlog-v0.7.0-preview.1.tar.gz package after verifying
its SHA-256 against the matching .sha256 asset.

Read docs/trials/grayscale-preview.md, README.md's update procedure, and the CHANGELOG in the
tag or extracted package. Inspect this project's current kit, recorded VERSION, dev route and
host integration. Record the previous version, tag commit and archive checksum if using a
package. Keep a local rollback copy of the existing
vendored web files, optional CLI and VERSION before replacing them, preserving any local changes.
Do not publish, commit or change other project work.

Replace the complete vendored web/ folder with the tag's or package's web/, including trial.js. Replace
bin/open-backlog.mjs if this project uses the optional CLI; set the project's VERSION file to
v0.7.0-preview.1. The embedded mounting API is unchanged and grayscale defaults on there too.
Refresh working-the-backlog.md and the open-backlog skill as described by the normal update
procedure. Keep the project's backlog, backlog.yml, own guidance and host routes as they are.
This update does not require a horizon field or migrate the project's work items.

Compare the copied files with the tag, or check package files against MANIFEST.json, and confirm
git includes the copied files.
Where Node 22+ and the CLI are available, run check and index --check for a managed index,
and confirm --help shows the preview version. Restart the project's dev server and hard-reload
its board. Verify the version in the trial strip, grayscale and colour comparison, light and
dark, and existing item edits. Add a short installation-verification note through Trial notes;
confirm it is appended to this project's backlog/_trial-notes.md and not shown as a work item.
Confirm a file edit made outside the browser still appears. Report any check you cannot run.

Report: generic project alias, previous and current versions, tag commit or archive checksum, vendored path,
local dev URL, rollback-copy path, checks passed or unavailable, and notes-file path. Keep project
secrets, private hostnames and plans out of anything copied back to the public open-backlog repo.
```

A project needs no new routes, runtime packages or second server. Copying the static files does
not install Node in a host project. The optional CLI checks require Node 22 or later; browser and
file verification remain possible without it.

## Record observations while working

1. Click **Trial notes** in the trial strip, or the note icon in an item's detail toolbar.
2. Choose Grayscale, Roadmap, Header, Item details or Other. Write what you tried, what was
   unclear or useful, and what you did instead. The current view and item are recorded for you.
3. Click **Save note**. A save confirmation names the file in this project's backlog. Each note
   is appended to `_trial-notes.md` with its time, preview version, appearance and theme. It is
   an ordinary repository file: include it in a commit when you want the observations retained
   in git. Closing the dialog does not save to disk.
4. Unfinished drafts are remembered in this browser for this installation when storage is
   available. Failed saves retain your input. **Download notes** includes the saved log and any
   unfinished draft, and also works when the backlog is read-only. Storage-blocked browsers
   explain that a draft must be saved or downloaded before reloading.
5. Uncheck **Grayscale** briefly when colour would help, then note what it revealed. The setting
   is remembered per installation. Choose light or dark with the existing theme button.

Downloads use the backlog's title and date in their filename. Each installation keeps its own
notes; nothing is sent to a central service. Hand edits to the notes log are preserved by fresh
reads before appending, and hosts with versions refuse a stale save. On a conflict, review and
click Save again; the draft stays available.

## Compare all five

Use [the five-project record](five-project-notes.md) for installation results and a summary of
the observations. Keep the raw notes in each project, or download them and copy only suitable
excerpts into that record. W-42 owns grayscale findings, W-39 owns general feedback, and W-44
owns the roadmap trial in this kit's own backlog. Those experiments stay open until real use
has produced notes and the maintainer reviews them.

## Roll back

Restore the saved vendored `web/`, optional CLI and VERSION together, restart the dev server,
and hard-reload. The notes log remains ordinary Markdown and older boards ignore it because
its filename starts with `_`. Backlog configuration and items need no rollback for this preview.
