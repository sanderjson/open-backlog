# Approved review fixes

Scope approved by the user's “go ahead fix these issues”.

- [x] Add regression tests for empty IDs, multiline titles, handwritten ID cells, Clear wrapping, and narrow toolbar controls; confirm failures on the current code.
- [x] Reuse the front matter editor for existing IDs and multiline titles, retaining ordinary title-first placement.
- [x] Update existing handwritten ID cells in one pass while preserving prose and other columns.
- [x] Reserve Clear's space and let narrow toolbar controls wrap while retaining desktop roles.
- [x] Update the Unreleased notes, run Node/browser suites and backlog checks, and inspect the final diff.

Validation: 66 Node tests and 23 browser tests pass. `check` passes for the project and starter, `index --check` passes for the project, and `git diff --check` is clean. The project's existing unnumbered-item notice remains; its file and README row were left as found.

## Toolbar behavior

People must be able to change grouping, switch views and clear filters without horizontal page scrolling. Clear stays invisible and outside keyboard focus when inactive, with the same box reserved for its active state. Grouping options wrap inside their group when space is tight; native buttons retain their pointer and keyboard behavior. Desktop search, count, grouping and view controls keep their existing roles.

## Five-project grayscale preview — implementation requested 2026-10-21

Authorization: “implement this workitem into a test experience” that can update all five
installations and capture notes while working. Proceed with implementation and verification.

- [x] Add a grayscale default and per-installation comparison switch, with preview identity.
- [x] Give cards explicit priority, weight and state labels and done-only epic progress.
- [x] Add a notes dialog with recoverable drafts, checked file saves, history and downloads.
- [x] Verify file planning, XSS handling, conflicts, read-only use, both themes and embedding.
- [x] Prepare a portable preview archive and project-agent update prompt; record five slots
      for installation verification and trial findings without claiming the projects are updated.
- [x] Update trial backlog records and version/changelog, then run Node/browser suites and
      backlog/index checks. Keep the observation-dependent trial work open.

Interaction: the visible trial strip shows the preview version, Grayscale switch and Trial notes.
Save shows progress, then an explicit disk-save result. Failed saves preserve input and explain
recovery. Escape closes the native notes dialog and restores focus; reopening restores the draft.
The comparison switch changes the board immediately and remembers its setting per installation.

Validation: 75 Node tests and 30 headless browser tests pass; seven affected trial cases pass
after final refinements. Project/starter checks and managed-index/diff checks pass. The archive
was extracted and all 20 file hashes, exclusions, update prompt and CLI identity verified.
