# Project-update sprint verification

Reviewed `feat/project-updates` at `d3e7b05`. Sprint range: `b96eef0..d3e7b05`.
The branch includes `feat/ids-layout-release`, including the earlier fixes at `135508b`.

## Summary

One finding: 0 critical, 0 high, 1 medium, 0 low, now resolved. The CLI, prompt and parser changes
passed the existing suites and additional probes; no runtime regression was found. The update
steps now keep CLI verification conditional. W-33 remains in progress while release operations
and final CI are pending.

## Scope

| Subsystem | Files | Side effects checked |
| --- | --- | --- |
| Item creation | `web/core.js`, `bin/open-backlog.mjs`, core/CLI tests | Requested filenames, collision refusal, planned writes, index and epic references |
| Agent prompts | `web/core.js`, prompt tests and README | Status/warning order, configured statuses, body content, problems versus suggestions |
| Configuration and index | `web/core.js`, core/reliability/CLI tests | Ignored config diagnostic, empty index generation, BOM and accent handling |
| Updates and release | README, PROMPT, guide, skill, starter, package metadata and backlog items | Optional-tool contract, executable mode, vendor provenance, version and release state |

## Finding 1: Update verification requires the optional CLI

**Severity:** Medium (P2)

**Type:** Documentation/contract mismatch

**Location:** `README.md:490`, `README.md:501`, `PROMPT.md:159`

**Problem:** The new update procedure instructs every project to run CLI commands, although the
kit supports hosts without Node or the CLI. Step 1 explicitly replaces the CLI only when the
project has it; step 6 then unconditionally says to run `check` and compare the CLI's `--help`.
The fresh-checkout verification in step 3 has the same missing condition. PROMPT's Updating
step 6 repeats it. An otherwise valid browser-only installation cannot complete these steps as
written, conflicting with W-31's requirement to keep Node optional.

**Evidence:** README step 6 begins "Run `check`, and `index --check` if the README has a managed
index." PROMPT step 6 begins "Run `check`, restart the dev server". Neither limits the commands
to projects where Node 22+ and the CLI are installed. The existing Node-optional statement in
the ground rules and the conditional copy step remain in force.

**Recommendation:** Qualify CLI verification in both procedures, including the fresh-checkout
step: run `--help`, `check` and applicable `index --check` where Node 22+ and the CLI are
installed. For other hosts, verify the recorded tag, the board's version dialog and the browser/
file edit flow. Do not require installing Node to update a working board.

**Resolution:** README and PROMPT now limit CLI checks to installations with Node 22+ and the
CLI. Fresh-checkout inspection applies to all hosts, and browser verification compares the
board's version with the project's recorded tag before exercising the file edit flow.

## Verification results

| Check | Result |
| --- | --- |
| Node 26.11.1: complete Node suite | 73 passed |
| Node 22.23.3: complete Node suite | 73 passed |
| Node 24.22.0: complete Node suite | 73 passed |
| Chromium suite under Node 26.11.1 | 23 passed |
| Chromium suite under Node 24.22.0 | 23 passed |
| `check docs/backlog --json` | 34 items, no problems or suggestions |
| `check starter --json` | 3 items, no problems or suggestions |
| `ids docs/backlog --check` | Passed |
| `index docs/backlog --check` | Passed |
| `git diff --check main...HEAD` | Passed |
| Executable CLI | Tracked as 100755; direct `--help` reports v0.6.0 |
| Version consistency | Core constant, PROMPT example, changelog and CLI agree |

Node 22 and 24 were isolated official binaries in `/private/tmp`, downloaded from nodejs.org
and checked against their published SHA-256 manifests. The installed Node version was unchanged.
These are local macOS runs; they do not replace the Linux CI jobs on the reviewed release commit.

Additional in-memory probes combined an exact mixed-case/dotted custom slug with automatic IDs,
templates, ordinary and managed indexes, and epic membership. Both resulting backlogs checked
cleanly. Invalid paths, reserved names, case-insensitive collisions and whitespace names were
refused. Item and epic prompts respected empty configured active/done status lists.

## Independent vendor check

Fetched the exact package tarballs from npm and compared parser and license bytes. All four
matched, confirming that marked comes from `lib/marked.esm.js`, not `dist/`.

| Local file | Source | SHA-256 |
| --- | --- | --- |
| `web/vendor/marked.js` | [marked 18.0.13](https://registry.npmjs.org/marked/-/marked-18.0.13.tgz), `package/lib/marked.esm.js` | `2e70fea3ee49f98ab67ee395e5af51cc6bee4fafed15910da9ccb7f650df8014` |
| `web/vendor/marked.LICENSE` | Same archive, `package/LICENSE` | `8e3a3f82f59a60958f56ca08f445647c32a4733dc7ca6c2c46f6eb898471ab9c` |
| `web/vendor/js-yaml.js` | [js-yaml 5.4.2](https://registry.npmjs.org/js-yaml/-/js-yaml-5.4.2.tgz), `package/dist/browser/js-yaml.esm.min.mjs` | `154ea2da9e53404fb206f19cb9ce6c3a9880295fa34b96e40855be7cbc02f082` |
| `web/vendor/js-yaml.LICENSE` | Same archive, `package/LICENSE` | `a07bc24468b9654ce76a547d47a2db282d07733b715db4c73a98bd63961f9550` |

## Remaining release checks and limits

1. Run CI on the final reviewed merge/release commit as W-33 requires. The two reported upgrade
   walkthroughs lacked a project dev server; the passing browser suites exercise the test host,
   not those projects' own dev servers.
2. Follow the two-branch merge order and complete the annotated tag and published release before
   closing W-33. No local v0.6.0 tag exists at review time. This review performs no push, merge,
   tag or publication; the subsequent wording fix and release operations are separate work.

The pre-existing untracked `docs/next-sprint-review.md` was excluded from the committed-sprint
assessment; its known stale status is housekeeping, not a new finding.
