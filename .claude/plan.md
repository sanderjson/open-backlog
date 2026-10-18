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
