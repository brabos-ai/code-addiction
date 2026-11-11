# Plan: Product Close-Out Parity — the product layer gets the four close-out repairs the internal layer already shipped, plus single ownership of the changelog and the review discipline

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-11

---

## Context

The internal layer was closed out repeatedly between 2026-09-09 and 2026-09-11. Most of those runs
repaired something reading had not surfaced. `final-report-shape` is the only one of them that reached
the product layer; `review-no-loops`, `durable-delivery-history`, `prompt-quality-ruler`,
`close-out-hardening` and `fast-local-bats` are all recorded in `docs/delivered.jsonl` as `internal`.

Four of those repairs are about facts that hold in any repository: a close-out that re-runs must not
write its record twice, a merge gate must ask whether the build finished before it asks whether the
delivery was graded, a deletion must prove the thing it is deleting exists somewhere else first, and a
merge must go through the forge when the forge has rules. The product layer ships to users' projects
and closes out real branches without any of the four.

The `review-no-loops` changelog records the product layer being left out on purpose: *"The product
layer keeps its own review flow. `/add.review`, `add-plan-review`, `plan-reviewer-agent` and
`readback-agent` are untouched beyond one line. That is the roadmap's declared scope for this item."*
Scope, not architecture. This plan closes that gap and three ownership defects found while refining it.

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-11T010158-product-close-out-parity-000-umbrella.md` | The ten shared decisions, the three candidate shapes and why B and C were rejected, the decomposition map, the non-goal on `/add.review` |
| `docs/brainstorming/2026-09-11T010158-product-close-out-parity-001-close-out.md` | Decisions 1 to 11: the `feature-pr.sh` deletion, `gh pr merge` ownership, the three `done.sh` modes, the nine probe fields, the four states, the publish table, the PR route, the dry-run, the two post-merge checks, `GATE_LEDGER`, the model pin |
| `docs/brainstorming/2026-09-11T010158-product-close-out-parity-002-docs-and-discipline.md` | Decisions 1 to 4: the changelog owner and the per-part complement table, the `add-review-discipline` sibling with its counts and divergence-by-site table and disk boundary, the build-entry readback |

Umbrella decision 3 is **superseded** by close-out decision 2, and umbrella decision 5 is **refined**
by docs-and-discipline decision 3. Both supersessions are recorded in the umbrella itself. This plan
implements the superseding versions.

## Global Constraints

- `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 and emits no warning absent from the baseline measured before F1 (`CLAUDE.md`, Pipeline; `/add-framework--build` STEP 6)
- `cd cli && npx vitest run --no-file-parallelism` — serial or nothing (`add-framework-product-layer`, the cli suite)
- "**If stdout carries `Debugger listening on ws://…`**, an editor injected `NODE_OPTIONS`. Clear it (`unset NODE_OPTIONS VSCODE_INSPECTOR_OPTIONS`) before trusting any assertion on stdout or stderr." (`add-framework-product-layer`)
- `npm run test:scripts` routes into a Linux container on Windows; **exit 2 is a refusal to run, never a red suite** (`2026-09-10T230600-PLAN--fast-local-bats`)
- Never write a raw `.codeadd/` path in a product artefact — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the exception and are always `.codeadd/scripts/` (`CLAUDE.md`, Pipeline)
- HTML comments are stripped at build; injection markers and `<!-- uses: -->` blocks rely on it (`CLAUDE.md`, Pipeline)
- `converge-gates.sh` always exits 0 — "this is a diagnosis, never a gate. Exit 2 only on CLI misuse." (its own header)
- `delivered.sh` and `build-ledger.sh` exit 1 only when the filesystem refuses a write, because "a write that silently fails to land is worse than a loud failure" (their own headers)
- `done.sh --merge` remains the sole owner of every **local git** write; `gh pr merge` is not a local git write (close-out decision 2)
- **The cli suite is red on a clean tree today:** two `history` tests in `cli/tests/graph-query.test.js` time out at 5000ms on the development machine (`2026-09-11T005514-PLAN--vitest-fixture-scope`, Problem 4). Every F-block grades against **no new failure** relative to a baseline captured before F1, never against zero
- **`2026-09-11T005514-PLAN--vitest-fixture-scope` is in flight and asserts an exact test-name set and a count of 1002.** Land it first, or re-capture its L2.1 baseline after this delivery. See Risks

## Problem

1. **`/add.done` writes its record without checking whether it already did** — its only idempotency
   guard, at 6.3, covers the changelog file. 6.8 leaves the `delivered.jsonl` entry in the working tree
   and `done.sh --merge` commits it, so a run that writes the entry and then fails leaves the branch
   holding a complete and correct entry. A second run falls through to 6.8 and writes a **second line
   for one delivery**. Internal's gate 2.1 crosses the same two facts over four combinations; its
   fourth row was added after a three-row table produced exactly this duplicate on PR #49.

2. **No gate asks whether the build finished** — `converge-gates.sh` computes four gates.
   `GATE_REVIEW` asks whether the delivery was graded, `GATE_QA_BASELINE` whether its evidence still
   matches, `GATE_COVERAGE` reads a table written at plan time, and `GATE_EPIC` returns `ok`
   unconditionally when there is no `epic.md`. On a simple feature nothing asks whether `/add.build`
   reached its last task. Unwritten code breaks no test.

3. **`/add.done` merges locally and pushes `main` directly** — `done.sh --merge` squash-merges into
   local `main` and pushes it. No PR, no review, no CI read. Under branch protection the push is
   refused after the local merge commit already exists, so `set -euo pipefail` aborts with local `main`
   ahead of `origin` and the operator holding a state nothing in the pipeline describes.

4. **The branch is deleted without proving the merge landed** — `done.sh` deletes the checkpoint tags,
   the worktree and the branch local and remote. It never fetches, so nothing in the script has looked
   at `origin/main` since the branch point.

5. **The changelog path is declared three times and the owner's value is wrong** — the `changelog`
   schema in `add-doc-schemas/references/history.md` says `docs/changelog/CHG[NNNN].md`, which is the
   internal layer's directory and does not exist in a user's project. `/add.pull-request` 3.3 and
   `/add.done` 6.3 both use the feature directory and both carry a skip-on-exists guard, so a feature
   whose PR was opened mid-build merges with a changelog describing the work that existed when the PR
   was opened.

6. **The review discipline is restated in four commands and owned by none** — `add.new` STEP 8,
   `add.brainstorm` STEP 5, `add.plan` STEP 13 and `add.plan-to-ready` STEP 3 each write out the
   verdict handling, the one re-dispatch and the readback comparison in their own words.
   `add-plan-review` is the rubric and correctly carries none of it. The drift is already visible:
   `add.plan-to-ready`'s readback leg does not stop and does not present while the other three do, and
   nothing states that difference as a rule.

7. **`/add.build` never reads the plan cold** — the product readback runs inside `/add.plan` STEP 13
   and `/add.plan-to-ready` STEP 3, in the session that assembled the plan. A build invoked later, or
   resumed after a compaction, gets no cold reading of the document it is about to execute.

8. **`feature-pr.sh` is a third PR flow that the command declaring it says does not exist** — the
   script exists at 432 lines with its own bats suite; `/add.pull-request` declares
   `- script: feature-pr.sh` in its `uses:` block, which is the only reason
   `node scripts/graph.js orphans` does not list it; and the same command's `ALWAYS:` block reads
   `⛔ DO NOT USE: Bash for any non-existent script (no feature-pr.sh, no done.sh)`. The script also
   disagrees with the command on duplicates, aborting where the command appends, and its
   `--confirm-merge` mode is a second implementation of work `done.sh` owns.

## Proposal

Clear the ground, then build the gate, then the plumbing, then the routing, then the ownership fixes.

The order is forced by two things. **The deletion goes first** because adding a PR merge route on top
of a contradicted PR flow would make four PR paths in one layer. **The routing goes last of the
close-out work** because it consumes the probe fields, the three `done.sh` modes and the ledger line
that the blocks before it produce.

The documents-and-discipline half is independent of the close-out half in behaviour and overlaps it in
exactly two files: both edit `add.build.md` and both add a row to
`add-subagent-driven-development`'s canonical format. Different regions and different rows, and the
close-out half goes first so the second half lands on text that has stopped moving.

## Current State

| Artefact | Today | `impact --depth 1` | Risk |
|---|---|---|---|
| `framwork/.codeadd/commands/add.build.md` | 17 steps; no publish step; 10.0 names two pre-dispatch blocks; no readback | 15 | HIGH |
| `framwork/.codeadd/commands/add.done.md` | `> **MODEL:** Use haiku model`; STEP 4 reads four gates and states "The script computes FOUR gates"; 6.3 skips on exists; 6.8 writes the entry unconditionally; STEP 8 calls `done.sh --merge` | 10 | HIGH |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | STEP 6 requires "all four gates ok"; its checkpoint commit copies five gate lines verbatim; `GATES_OK=N/4` read as the pass summary | 8 | HIGH |
| `framwork/.codeadd/commands/add.pull-request.md` | `uses:` declares `feature-pr.sh`; its `ALWAYS:` block and `NEVER` list both assert that script does not exist; 3.1 skips on exists; 3.3 declares the path | 0 | LOW |
| `framwork/.codeadd/commands/add.plan.md` | STEP 13 restates the verdict handling and the readback comparison | 19 | HIGH |
| `framwork/.codeadd/commands/add.new.md` | STEP 8 restates the same | 12 | HIGH |
| `framwork/.codeadd/commands/add.brainstorm.md` | STEP 5 restates the same | 3 | HIGH |
| `framwork/.codeadd/scripts/done.sh` | 437 lines, `set -euo pipefail`, two modes; context mode emits the branch facts and `CHANGED_FILES`; merge mode commits, pushes, squash-merges locally, pushes `main`, then deletes tags, worktree and branch | 4 | HIGH |
| `framwork/.codeadd/scripts/converge-gates.sh` | 376 lines, `set -u`, always exits 0; four gate blocks; header says "four /add.done convergence gates"; `GATES_OK=$GATES_OK/4` at line 374 | 4 | HIGH |
| `framwork/.codeadd/scripts/feature-pr.sh` | 432 lines; the only product script calling `gh`; creates the PR then exits `STATUS=AWAITING_MERGE`; `--confirm-merge` checks out main, pulls, deletes the local branch | 1 | MEDIUM |
| `framwork/.codeadd/skills/add-commit/SKILL.md` | Checkpoint Receipt names "**the five gate lines**" and lists four `GATE_*` plus `GATES_OK` | 5 | HIGH |
| `framwork/.codeadd/skills/add-doc-schemas/references/history.md` | The `changelog` schema; its location line names `docs/changelog/CHG[NNNN].md` | 1 | MEDIUM |
| `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` | The canonical ledger format; no `Publish:` and no `Readback:` row | 3 | HIGH |
| `.claude/skills/add-review-discipline/SKILL.md` | Exists; names no product counterpart, because none existed | 4 | HIGH |
| `.claude/commands/add-framework--brainstorm.md` | Nine sites and eleven lines name a brainstorm filename; the SET form carries no ordinal, contradicting `add-plan-authoring` line 79 and the files on disk | 0 | LOW |
| `.claude/skills/add-plan-authoring/SKILL.md` | Carries the plan set's `-000-umbrella` ordinal; says nothing about the brainstorm set | 3 | HIGH |

**Deliberately untouched, listed so the build does not sweep them:**

| Artefact | Why it is safe |
|---|---|
| `add-id-convention` | Names `done.sh` only for `[NNNN][L]` branch parsing, which no F-block changes |
| `add-wiki-maintenance` | Reads `CHANGED_FILES` from `done.sh` context mode. F5 **adds** fields and removes none |
| `add.build`'s `- script: converge-gates.sh` declaration | The command's own line 1005 says it never runs that script. The declaration is inaccurate today and fixing it is not this plan's scope |
| `add-plan-review` | The rubric. Its dimensions, severity, verdict definition, caps and output shape are out of scope by design |
| `@readback-agent`, `add-feature-readback` | F14 uses the existing agent and its existing three scopes. Neither definition changes |
| `/add.review`, `qa-evidence.sh`, `qa-preflight.sh` | The non-goal recorded in the umbrella's Proposed Solution, option C |

**The delivery index has no entry for any product artefact this plan touches.** Three product entries
exist in total (`plain-language-rule` twice, `final-report-shape` once), so the index is young rather
than silent. `node scripts/graph.js history` was run for `add.done`, `add.build`, `done.sh`,
`converge-gates.sh` and `feature-pr.sh` on `--layer product` and returned no delivery for any of them.
No prior attempt at a PR-based merge, a build-ledger gate, or single ownership of the product changelog
path exists to supersede.

## Scope

### Includes

#### T1 — Close-out (ref: `...-001-close-out.md`)

- **F1** [product] — `framwork/.codeadd/scripts/feature-pr.sh`: **delete**, together with
  `framwork/.codeadd/scripts/tests/feature-pr.bats`, the `- script: feature-pr.sh` line in
  `framwork/.codeadd/commands/add.pull-request.md`'s `uses:` block, and the two prohibitions naming it
  in that command's `ALWAYS:` block and `NEVER` list. The sweep is complete in this one block: nothing
  else in the tree references the script — verified against
  `framwork/.codeadd/skills/add-ecosystem/SKILL.md`, whose script table has no row for it. It must NOT
  remove the `no done.sh` half of that prohibition — `/add.pull-request` genuinely must not call
  `done.sh`, and only the `feature-pr.sh` clause is false. Ref: close-out Decision 1.

- **F2** [product] — `framwork/.codeadd/scripts/converge-gates.sh`: add `GATE_LEDGER` as a fifth gate
  emitting `GATE_LEDGER` and `GATE_LEDGER_DETAIL` on the four statuses its siblings use, and move the
  summary to `GATES_OK=N/5`. In the **same block**, update every place that states the gate count or
  enumerates the list, because a document contradicting the script is a drift `build.js` cannot see.
  **The complete set, measured in the planning session of 2026-09-11 — six artefacts, seventeen lines:**

  | Artefact | Lines | What states it |
  |---|---|---|
  | `framwork/.codeadd/scripts/converge-gates.sh` | 4, 15, 371, 374 | The header's "four /add.done convergence gates", the WHY block's "the same four gates as prose", the summary comment's "short of 4/4", and `GATES_OK=$GATES_OK/4` |
  | `framwork/.codeadd/scripts/tests/converge-gates.bats` | 744, 766, 774 | A comment, the L1 test name "passes all four gates, GATES_OK=4/4", and its assertion |
  | `framwork/.codeadd/commands/add.done.md` | 135 | "The script computes FOUR gates", and the parse list, which must gain `GATE_LEDGER` and `GATE_LEDGER_DETAIL` |
  | `framwork/.codeadd/commands/add.plan-to-ready.md` | 62, 442, 768, 771, 886 | STEP 6's "all four gates ok", the checkpoint commit's "**the five gate lines**" and its key list, "CONVERGED requires all four gates", "anything short of `4/4`", and the CONVERGED row's `GATES_OK=4/4` |
  | `framwork/.codeadd/skills/add-commit/SKILL.md` | 89, 111, 120 | The Checkpoint Receipt's "**the five gate lines**" and its key list, the worked example's `GATES_OK=4/4`, and "gated on all four gates reading `ok`" |
  | `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | 254 | The `converge-gates.sh` row's "read-only probe for the four gates (review, QA baseline, epic, coverage)" |

  ⛔ **Two matches on the same strings are NOT this sweep's, and a grep-and-replace across the tree
  breaks both.** `framwork/.codeadd/commands/add.build.md` line 770 — "Run the four gates below" — is
  STEP 11.3's four commit gates and has nothing to do with `converge-gates.sh`.
  `framwork/.codeadd/scripts/tests/converge-gates.bats` lines 52 and 54 — "4/4 items compliant" and
  "RF: 4/4" — are fixture text inside a fabricated review document. Both must stay byte-unchanged.

  It must NOT change the two `git log --grep=GATES_OK` passages, which name the key rather than the
  count, and must NOT make the script exit non-zero on a failing gate. Ref: close-out Decision 10.
  - **Produces:** `converge-gates.sh` emits `GATE_LEDGER=ok|missing|broken|not-probed` and `GATES_OK=N/5`

- **F3** [product] — `framwork/.codeadd/commands/add.done.md`: a new STEP 4.3 that reads `GATE_LEDGER`
  and blocks on anything but `ok`, parsing it from the preflight output the step already captures. It
  must NOT re-derive the verdict by reading `build-ledger.md` or `tasks.md` itself — that restates the
  gate the script owns. Ref: close-out Decision 10.
  - **Consumes:** `converge-gates.sh` emits `GATE_LEDGER=ok|missing|broken|not-probed` and `GATES_OK=N/5` (F2)

- **F4** [product] — `framwork/.codeadd/scripts/done.sh`: split the merge sequence into
  `--commit-push` and `--cleanup`, **extracted from `--merge`'s own body**, and make `--merge` compose
  them in order around the local checkout-and-squash. It must NOT change `--merge`'s observable
  behaviour, its emitted keys, or its refusal to run on `main` or inside a linked worktree — every
  existing `done.bats` case must stay green untouched. Ref: close-out Decision 2.
  - **Produces:** `done.sh` accepts `--commit-push` and `--cleanup` as independent modes

- **F5** [product] — `framwork/.codeadd/scripts/done.sh`: nine probe fields in **context mode** —
  `PR_STATE`, `PR_URL`, `PR_HEAD_SHA`, `PR_MERGE_COMMIT`, `INDEX_ENTRY`, `MERGED_ON_MAIN`,
  `LEDGER_PATH`, `PUBLISH_RECORD`, `PUBLISH_RECORD_URL`, with the values the design's table defines.
  `gh` absent or unauthenticated is `PR_STATE=no-gh`, never an error. `INDEX_ENTRY` reads the
  **file content** of `docs/delivered.jsonl`, committed or not, matching `"id":"<FEATURE_NUMBER>"`. It
  must NOT remove or reorder any field context mode emits today — `add-wiki-maintenance` reads
  `CHANGED_FILES` from it. Ref: close-out Decision 3.
  - **Produces:** `done.sh` context mode emits `PR_STATE`, `INDEX_ENTRY`, `MERGED_ON_MAIN` and `PUBLISH_RECORD`

- **F6** [product] — `framwork/.codeadd/scripts/done.sh`: `git push --dry-run origin "$MAIN_BRANCH"`
  before `git checkout "$MAIN_BRANCH"` on the local route, so a refused push is reported before any
  local write; and inside `--cleanup`, the two numbered post-merge checks — `git fetch origin <main>`
  as check 1, then `git merge-base --is-ancestor <MERGE_SHA> origin/<main>` as check 2 — refusing
  every deletion when either fails, naming the failing check, and still exiting 0. It must NOT roll
  back a completed merge, and must NOT make a refused deletion a non-zero exit: by `--cleanup` the
  merge has landed and nothing left behind is a failed delivery. Ref: close-out Decisions 8 and 9.
  - **Consumes:** `done.sh` accepts `--commit-push` and `--cleanup` as independent modes (F4)

- **F7** [product] — `framwork/.codeadd/commands/add.build.md`: a new **STEP 17: Publish [STOP]** with
  the design's five-row behaviour table, Completion renumbered to **STEP 18**, and one `Publish:` line
  appended through `build-ledger.sh` on every path including the paths where nothing was pushed. In the
  same block, add the `Publish:` row to
  `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md`'s canonical format. It must NOT
  merge, must NOT offer the question on `main` or `master`, and must NOT mention a PR when `gh` is
  absent. Measured before planning: no artefact outside `add.build.md` cites STEP 17, and the feature
  fragments cite STEP 15 and STEP 11.3 only. Ref: close-out Decision 5.
  - **Produces:** the build ledger carries one `Publish: pr-opened <url> | pr-updated <url> | declined — local merge | on-main — nothing offered | no-gh — pushed | no-gh — local` line

- **F8** [product] — `framwork/.codeadd/commands/add.done.md`: STEP 2 gains the four-state cross and
  the route table — `Normal`, `Resume`, `Closed out`, `Recovery` — crossing merge state against
  `INDEX_ENTRY`, plus the seven-row `PR_STATE` × `PUBLISH_RECORD` route table, and the `> **MODEL:**
  Use haiku model` line is removed. It must NOT compute either fact itself; both come from F5's probe.
  It must NOT route to the PR route when `PR_STATE=no-gh`. Ref: close-out Decisions 4, 6 and 11.
  - **Consumes:** `done.sh` context mode emits `PR_STATE`, `INDEX_ENTRY`, `MERGED_ON_MAIN` and `PUBLISH_RECORD` (F5)
  - **Consumes:** the build ledger carries one `Publish: pr-opened <url> | pr-updated <url> | declined — local merge | on-main — nothing offered | no-gh — pushed | no-gh — local` line (F7)
  - **Produces:** `/add.done` STEP 2 carries the four-state route table naming `Normal`, `Resume`, `Closed out` and `Recovery`

- **F9** [product] — `framwork/.codeadd/commands/add.done.md`: the PR route, in the design's seven
  ordered steps — `done.sh --commit-push`, `gh pr checks --watch --fail-fast`, the `headRefOid` against
  `git rev-parse HEAD` comparison that **refuses a verdict from any other SHA**, the rule that only
  `success` is a pass, the rule that no required check configured merges and is reported,
  `gh pr merge --squash`, then `done.sh --cleanup` — and the report line naming which evidence the gate
  accepted, CI or local, and why. It must NOT treat a skipped, queued, neutral or cancelled required
  check as a pass, and must NOT proceed to cleanup when the merge is refused: the entry and changelog
  stay on the branch and the next run routes to `Resume`. Ref: close-out Decision 7.
  - **Consumes:** `done.sh` accepts `--commit-push` and `--cleanup` as independent modes (F4)

- **F10** [product] — `framwork/.codeadd/commands/add.done.md`: the `Resume` route, which runs every
  gate and skips STEP 5's promotion, 6.3, 6.7 and 6.8; the `Recovery` route, which resolves the feature
  id from the merge commit's own diff matching `docs/features/[NNNN][L]-*/`, takes the delivery facts
  from `git show --name-status <merge-commit>`, writes the entry and the changelog on `main`, and never
  calls `done.sh --merge` or `gh pr merge`; and STEP 8 delegating its deletions to `done.sh --cleanup`.
  It must NOT reconstruct the recovery diff from `plan.md` — an entry derived from a plan records
  intent, not delivery — and must NOT re-run STEP 5's promotion on the resume route, because a reported
  skip is evidence and a silent safe re-run is not. Ref: close-out Decision 4.
  - **Consumes:** `/add.done` STEP 2 carries the four-state route table naming `Normal`, `Resume`, `Closed out` and `Recovery` (F8)

#### T2 — Documents and discipline (ref: `...-002-docs-and-discipline.md`)

- **F11** [product] — `framwork/.codeadd/skills/add-doc-schemas/references/history.md`: the `changelog`
  schema takes ownership of its path, corrected to `<feature-dir>/changelog.md`, and gains the
  one-per-delivery prohibition block plus the six-row per-part complement table. It must NOT change the
  frontmatter fields, the four section names, the depth floors or the hard bans, and must NOT be moved
  into `add-doc-schemas/SKILL.md`, whose Schema Index already resolves `changelog` here. Ref:
  docs-and-discipline Decisions 1 and 2.
  - **Produces:** the `changelog` schema declares `<feature-dir>/changelog.md` and the complement-in-place rule

- **F12** [product] — `framwork/.codeadd/commands/add.done.md`: 6.3 complements the existing changelog
  in place instead of skipping generation, and cites the schema rather than declaring the path. It must
  NOT allocate a second `CHG[NNNN]`, must NOT rewrite `id:`, `created:`, `type:` or `related:`, and
  must NOT change the `## QA Evidence` upsert, which already replaces rather than appends. Ref:
  docs-and-discipline Decision 2.
  - **Consumes:** the `changelog` schema declares `<feature-dir>/changelog.md` and the complement-in-place rule (F11)

- **F13** [product] — `framwork/.codeadd/commands/add.pull-request.md`: 3.1 complements instead of
  skipping and 3.3 cites the schema rather than declaring the path. It must NOT lose the secrets gate,
  the append-only PR body update, or the `add-commit` message generation. Ref: docs-and-discipline
  Decision 2.
  - **Consumes:** the `changelog` schema declares `<feature-dir>/changelog.md` and the complement-in-place rule (F11)

- **F14** [product] — `framwork/.codeadd/commands/add.build.md`: a new sub-step **10.0.4** dispatching
  `@readback-agent` with `target` = `docs/features/${FEATURE_ID}` and `scope` = `subfeature` naming
  `${EPIC_CURRENT_SF}` on an epic or `feature` otherwise, 10.0's intro changed from "Both blocks below"
  to name three, the four ledger lines Decision 4 defines verbatim — **three prefixed `Readback:` and
  one prefixed `Ruling:` for the divergence case, not four `Readback:` lines** — the resume rule that a `Readback:` line already
  present means it ran, and Completion reporting the outcome. In the same block, add the `Readback:`
  row to `add-subagent-driven-development`'s canonical format. It must NOT be a gate, must NOT stop the
  build, must NOT be re-dispatched, and must NOT have an inline fallback: a provider with no subagent
  dispatch gets the skipped line. Ref: docs-and-discipline Decision 4.
  - **Produces:** the build ledger carries one of `Readback: matches …`, `Readback: diverges …` or `Readback: skipped — no subagent dispatch on this provider`, and on divergence additionally one `Ruling: built the plan's reading of <X> — <why> — <what it costs if wrong>` line
  - **Produces:** `/add.build` carries a readback site at 10.0.4 that is not a gate and rules on divergence

- **F15** [product] — `framwork/.codeadd/skills/add-review-discipline/SKILL.md` (new), registered as
  `"add-review-discipline": {}` in `framwork/provider-map.json`. It owns the three readers and the
  question each answers, the count rule `one dispatch plus at most one re-dispatch, legal only after
  apply → re-gate`, the readback-divergence-by-site table with its three rows, what the caller owes a
  report, acting on the verdict, and the disk boundary with its inverted prohibition. It carries the
  HTML-comment sibling note. It must NOT restate `add-plan-review`'s rubric, the fix loop's
  `MAX_ATTEMPTS` or the readback report format, and its `uses:` block must NOT name the internal
  sibling — a cross-layer target resolves inside its own layer and dangles. Also add its row to
  `framwork/.codeadd/skills/add-ecosystem/SKILL.md`'s skill inventory. Ref: docs-and-discipline
  Decision 3.
  - **Consumes:** `/add.build` carries a readback site at 10.0.4 that is not a gate and rules on divergence (F14)
  - **Produces:** `add-review-discipline` exists in the product layer with the count rule and the divergence-by-site table

- **F16** [internal] — `.claude/skills/add-review-discipline/SKILL.md`: add the sibling note naming the
  product counterpart, matching the arrangement both `add-final-report` files already carry. It must
  NOT change the internal counts, the no-file rule or anything else in the file, and its `uses:` block
  must NOT name the product sibling. Ref: docs-and-discipline Decision 3.
  - **Consumes:** `add-review-discipline` exists in the product layer with the count rule and the divergence-by-site table (F15)

- **F17** [product] — `framwork/.codeadd/commands/add.new.md` STEP 8,
  `framwork/.codeadd/commands/add.brainstorm.md` STEP 5,
  `framwork/.codeadd/commands/add.plan.md` STEP 13 and
  `framwork/.codeadd/commands/add.plan-to-ready.md` STEP 3: each cites
  `{{skill:add-review-discipline/SKILL.md}}` instead of restating the counts, the verdict table and the
  divergence behaviour. Each keeps its own dispatch inputs — `path`, `kind`, `target`, `scope` — because
  those are per-site facts, and `add.plan-to-ready` keeps its Decision Log comparator, which is specific
  to an autonomous loop. It must NOT change any dispatch's inputs and must NOT remove
  `add.plan-to-ready`'s "does NOT stop and does NOT present" rule. Ref: docs-and-discipline Decision 3.
  - **Consumes:** `add-review-discipline` exists in the product layer with the count rule and the divergence-by-site table (F15)

#### T3 — The brainstorm set's ordinal (no design doc; the decision is carried inline here)

- **F18** [internal] — `.claude/commands/add-framework--brainstorm.md` and
  `.claude/skills/add-plan-authoring/SKILL.md`: a brainstorm **SET** gains the `NNN` ordinal the plan
  set already has, `-000-umbrella` and `-001-<subtopic>` onward, and the naming is stated **once**
  instead of nine times. STEP 5.1 becomes the single declaration; the other eight sites cite it rather
  than restating the pattern. `add-plan-authoring`'s File Naming gains one line saying the brainstorm
  set uses the same allocate-once timestamp and the same ordinal, with the brainstorm command owning
  its directory and slug, plus `- mention: /add-framework--brainstorm` in its `uses:` block.

  **The nine sites, measured in the planning session of 2026-09-11 — eleven lines:**

  | Lines | Site |
  |---|---|
  | 72, 86 | The resolve prohibition's `-> ref:` example, and STEP 1.0's missing-path stop |
  | 321 | STEP 5.1's umbrella output path |
  | 331, 332 | STEP 5.1's SET example block |
  | 417, 418 | STEP 5.2's Decomposition Map template rows |
  | 511 | STEP 7.4's refine suggestion |
  | 537 | STEP 8.4's subtopic output path |

  ⛔ **Lines 320 and 491 must stay byte-unchanged, and a blind replace breaks them.** Both name a
  **standalone** brainstorm, `YYYY-MM-DDTHHMMSS-[topic].md`, which correctly carries no ordinal
  because there is no set to order. Only a set member takes one. This is the same shape as F2's
  false-positive trap: the string matches and the meaning does not.

  It must NOT move the naming into `add-plan-authoring` as its owner. The brainstorm command is the
  only writer of that filename, so the defect is repetition inside one file rather than split
  ownership, and the fix is one declaration. `add-plan-authoring` gets a cross-reference so a reader
  comparing the two set conventions cannot find the rule for one and not the other.

### Does NOT Include (important!)

- **Collapsing `/add.review` into `/add.build`**, as `review-no-loops` did internally. The umbrella's
  option C records the reason: the product review captures QA evidence, allocates the run numbers
  `qa-evidence.sh promote` makes immutable, and emits the `## Fix Routing` contract `/add.build` STEP 12
  consumes. Removing it would take `GATE_REVIEW`, `GATE_QA_BASELINE` and the correction contract too.
- **Deleting or relocating `review-NNN.md` or `qa-validation-NNN.md`.** F15 states the opposite
  invariant with its boundary, precisely so a future reader does not import the internal no-file rule.
- **Any change to `add-plan-review`'s rubric** — dimensions, severity, verdict definition, caps, output
  shape, inline fallback.
- **Any change to `@readback-agent` or `add-feature-readback`.** F14 uses the agent's existing three
  scopes unchanged.
- **A delivery archive under `docs/deliveries/` for the product layer.** Product's plan, tasks, ledger
  and changelog live under `docs/features/`, which is tracked and rides the merge. Internal's
  post-merge checks 3, 4 and 5 answer a question product does not have, which is why F6 has two checks
  and not five.
- **Merging the two `add-review-discipline` files, or any check that keeps them byte-identical.**
  Divergence is the intended outcome, as it is for `add-final-report`.
- **Fixing `add.build`'s inaccurate `- script: converge-gates.sh` declaration.** Its own line 1005 says
  it never runs that script. Real, pre-existing, and not this request's scope.
- **Any ordinal for the PRODUCT brainstorm.** Measured: `framwork/.codeadd/commands/add.brainstorm.md`
  has no umbrella, no set, no subtopic and no decomposition — it writes one file per session. There is
  no set to order, so an ordinal there would be a feature this request never asked for. Where the
  product does have sets, the epic's subfeatures, the ordinal already exists as `SF01`, `SF02`.
- **Giving the PRODUCT brainstorm path a single owner.** Two artefacts declare it and they currently
  **agree**: `add.brainstorm.md` STEP 3 and `add-doc-schemas/references/new-feature.md` line 182, both
  `docs/brainstorm/YYYY-MM-DDTHHMMSS-<slug>.md`. That is the condition the changelog was in before it
  diverged, not a live defect. Recorded here so it is not lost; it earns its own plan when it drifts or
  when someone touches either declaration.
- **Turning `fileParallelism` on, or any other change inside `cli/vitest.config.js`.** That is
  `2026-09-11T005514-PLAN--vitest-fixture-scope`'s scope.
- **Auto-merge configuration, PR labels, or PR templates.**

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| How does `/add.done` merge? | PR when one exists, local when it does not | STEP 4, 2026-09-11. A user's project may have no `gh` and no CI; refusing without them breaks every project that closes out today |
| Who calls `gh pr merge`? | `/add.done`, not `done.sh` | Close-out Decision 2. Every product `gh` call is already made from a command, and `gh pr merge` performs no local git operation. **Supersedes umbrella decision 3** |
| Where is the publish answer recorded? | One `Publish:` line in the build ledger | STEP 4, 2026-09-11. `build-ledger.sh` already accepts an arbitrary single line, so no script and no schema changes, and `/add.done` will already be reading that file for `GATE_LEDGER` |
| Why record it at all, when `gh pr view` answers? | To tell *declined* from *never asked* | Close-out Decision 6. Those two states need different behaviour; a missing line makes the close-out ask |
| Which wins, the record or the forge? | The forge. A PR that exists takes the PR route whatever the ledger says | Close-out Decision 6 |
| Where does the ledger gate live? | `converge-gates.sh`, as a fifth gate | Close-out Decision 10. Its header states it exists because `/add.done` and `/add.plan-to-ready` evaluated the same gates as prose and disagreed |
| What does `GATE_LEDGER` return with no `tasks.md`? | `ok`, with a stated reason | Close-out Decision 10. Those ledger lines are keyed by area, not task id. `GATE_COVERAGE`'s own precedent for an absent table |
| Does the gate read the ledger or the ticks? | The ledger | `add.build`'s own invariant: the ledger outranks the tick |
| How many post-merge checks? | Two | Close-out Decision 9. Product's documents are tracked and ride the merge, so there is no separate archive to resolve and `cmp` |
| Is the fetch inside the gate? | Yes, as numbered check 1 | Close-out Decision 9. Outside it, its failure lets check 2 pass against a `main` that never saw the merge |
| What happens to `feature-pr.sh`? | Deleted, with its suite and both stale references | Close-out Decision 1. The only command declaring it forbids running it; `/add.pull-request` does more; `--confirm-merge` is a second git owner |
| Does `/add.done` keep its `haiku` pin? | No | Close-out Decision 11. It now routes four states and refuses a verdict from the wrong SHA |
| Where does the changelog path live? | The `changelog` schema, corrected to `<feature-dir>/changelog.md` | Docs-and-discipline Decision 1. `docs/changelog/` is the internal layer's directory and does not exist in a user's project |
| Skip or complement an existing changelog? | Complement, per the six-row table | Docs-and-discipline Decision 2. A skip is not idempotency: it leaves the state the first run produced, correct only when nothing changed since |
| Is `TL;DR` appended to or rewritten? | Rewritten | Docs-and-discipline Decision 2. A bullet is a fact and stays true; a summary is a claim about the whole delivery |
| How many times may a reader be dispatched? | One, plus at most one re-dispatch, legal only after `apply → re-gate` | Docs-and-discipline Decision 3. Already the product's idiom, used four times. **Refines umbrella decision 5** |
| Why does the product differ from internal here? | The re-gate | Docs-and-discipline Decision 3. A deterministic schema gate re-approves the changed document between the two reads, and the internal layer has no such gate |
| May a verdict reach disk? | Only where a deterministic script consumes it | Docs-and-discipline Decision 3. `qa-evidence.sh` and `converge-gates.sh` read the two the product stores |
| Is the build readback a gate? | No. Its divergence is a ruling | Docs-and-discipline Decision 4. The approval already happened when the user chose to run the build after reading the plan's report |
| Is the build readback re-dispatchable? | No | Docs-and-discipline Decision 4. Its divergence becomes a ruling, so no document changes and there is nothing to re-gate |
| One plan or two? | One | STEP 4, 2026-09-11, and this command's own rule: layer tags carry the split, never two plans |
| Does the brainstorm set get the plan set's ordinal? | Yes, in the internal layer | User request, 2026-09-11. `add-plan-authoring` line 79 already carries `-000-umbrella` for a plan set, the files on disk under `docs/brainstorming/` already use it, and the command's template does not — so the command contradicts both |
| Does the product brainstorm get one too? | No. There is nothing to order | Measured 2026-09-11: `add.brainstorm.md` has no umbrella, set, subtopic or decomposition. An ordinal with no set is an invented feature |
| Who owns the brainstorm filename? | The brainstorm command, stated once | The command is its only writer, so the defect is nine restatements inside one file, not split ownership. `add-plan-authoring` gets a cross-reference, not the ownership |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A close-out that cannot write its record twice | A longer STEP 2 in `/add.done`, with four routes instead of one path |
| A merge that goes through review and CI when the project has them | `/add.done` gains a `gh` dependency, on one route only |
| One PR flow instead of three | A 432-line script and its bats suite |
| A gate that asks whether the build happened, not only whether it was graded | `GATES_OK` changes denominator, so a checkpoint commit's gate lines read differently before and after |
| A refused push reported before anything local is written | One extra network round-trip on the local route |
| Deletions that cannot run against an unfetched ref | One extra fetch per close-out |
| A changelog on `main` describing everything that merged | One more write at close-out where there used to be a skip |
| One owner for the review discipline, cited by four commands | A second file to keep in step with its internal sibling by hand |
| A build that reads its plan cold before the first dispatch | One more subagent dispatch per build, and a divergence that reaches a human only at Completion |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| **`vitest-fixture-scope` asserts an exact test-name set and a count of 1002; this plan adds a suite** | High | Land `2026-09-11T005514-PLAN--vitest-fixture-scope` first. It is drafted and reviewed, and it also takes the cli suite from 208s to under 120s, which this plan's 17 F-blocks need. If it has not landed, F1's first act is to re-capture that plan's L2.1 baseline and record the new count as a ruling |
| **Internal's gate 2.1 fourth row and its resume path have never executed**, so F8 and F10 inherit an unproven shape | High | L5 asserts each of the four states independently against a fabricated tree state, rather than waiting for a live close-out to find the gap. The `close-out-hardening` changelog names this untested branch explicitly |
| Splitting `--merge` into three modes regresses the local route | Medium | F4 extracts the two modes from `--merge`'s own body rather than re-implementing them, and keeps `--merge`'s entry point so every existing `done.bats` case still exercises the whole sequence. L3.1 asserts the existing cases pass unmodified |
| A project with no `gh` stops being able to close out | Low | `PR_STATE=no-gh` routes to the local route and F9's report names it. F5 makes `gh` absence a probe value, never an error. L3.4 covers the probe and L5.3 covers the route |
| Deleting `feature-pr.sh` breaks an installed project | Low | Nothing in the shipped set can reach it: the only command declaring it forbids running it, and the graph shows exactly one dependant. L1.3 asserts the orphan list does not grow |
| The `GATES_OK` denominator change breaks checkpoint-commit archaeology | Low | `git log --grep=GATES_OK` matches the key, not the count. F2 leaves both grep passages untouched and L2.6 asserts they are unchanged |
| `GATE_LEDGER` blocks a legitimate DEVELOPMENT-mode close-out | Medium | F2 returns `ok` with a stated reason when no `tasks.md` is in scope. L2.2 asserts it |
| The PR route holds the session open on `--watch` | Medium | F9 documents `--squash --auto` as preferable where auto-merge is enabled. Not a blocker: the wait is what makes the SHA comparison meaningful |
| Someone imports the internal no-file rule and deletes `review-NNN.md` | Medium | F15 states the opposite invariant with its reason and its boundary, in its own prohibition block. L8.4 asserts the prohibition is present |
| Complementing a changelog produces duplicate bullets | Medium | F11's complement table fixes the match rule at the `type(scope): summary` prefix. L6.3 asserts a bullet already present is not re-added |
| A caller citing the skill loses a site-specific rule in the rewrite | Medium | F17 names what must survive per site. L8.5 asserts `add.plan-to-ready` still carries its Decision Log comparator and its no-stop rule |
| Two F-blocks edit `add.build.md` and two edit `add-subagent-driven-development` | Medium | F7 and F14 touch different regions and different rows, and F7 lands first. The Execution Order states it |
| A blind replace adds the ordinal to the two standalone brainstorm paths that must not have one | Medium | F18 names lines 320 and 491 as must-not-change, L11.3 asserts them byte-unchanged, and L10.7 mutates one to prove the level bites |
| The cli suite is red on a clean tree, so a build cannot tell its own breakage from the existing failure | High | A Global Constraint: grade every F-block against no NEW failure relative to a baseline captured before F1, the same discipline the graph warnings already use |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `framwork/.codeadd/scripts/feature-pr.sh` | product | **remove** | F1 — a third PR flow the declaring command forbids |
| `framwork/.codeadd/scripts/tests/feature-pr.bats` | product | **remove** | F1 — the deleted script's suite |
| `framwork/.codeadd/scripts/converge-gates.sh` | product | modify | F2 — `GATE_LEDGER`, the header, `GATES_OK=N/5` |
| `framwork/.codeadd/scripts/tests/converge-gates.bats` | product | modify | F2 — the new gate's cases and the stale `N/4` assertions |
| `framwork/.codeadd/skills/add-commit/SKILL.md` | product | modify | F2 — the Checkpoint Receipt's gate-line list goes from five to six |
| `framwork/.codeadd/scripts/done.sh` | product | modify | F4, F5, F6 — three modes, nine probe fields, the dry-run and the two checks |
| `framwork/.codeadd/scripts/tests/done.bats` | product | modify | F4, F5, F6 — the modes, the probes and the refused cleanup |
| `framwork/.codeadd/commands/add.done.md` | product | modify | F2, F3, F8, F9, F10, F12 — the gate count, 4.3, STEP 2's routing, the PR route, resume and recovery, 6.3's complement |
| `framwork/.codeadd/commands/add.build.md` | product | modify | F7, F14 — STEP 17 Publish with Completion renumbered, and 10.0.4's readback |
| `framwork/.codeadd/commands/add.pull-request.md` | product | modify | F1, F13 — the `uses:` line and the two stale prohibitions, then 3.1 and 3.3 |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | product | modify | F2, F17 — the gate denominator and its checkpoint gate lines, then citing the skill |
| `framwork/.codeadd/commands/add.plan.md` | product | modify | F17 — STEP 13 cites the skill |
| `framwork/.codeadd/commands/add.new.md` | product | modify | F17 — STEP 8 cites the skill |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | modify | F17 — STEP 5 cites the skill |
| `framwork/.codeadd/skills/add-doc-schemas/references/history.md` | product | modify | F11 — the `changelog` schema's path, ownership and complement table |
| `framwork/.codeadd/skills/add-review-discipline/SKILL.md` | product | **create** | F15 — the product sibling |
| `framwork/provider-map.json` | product | modify | F15 — register the new skill for five providers |
| `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` | product | modify | F7, F14 — the `Publish:` and `Readback:` rows in the canonical format |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | product | modify | F2, F15 — the `converge-gates.sh` row's "four gates" (line 254), and the skill table gains the new skill's row. **Not F1**: it has no row for `feature-pr.sh` |
| `.claude/skills/add-review-discipline/SKILL.md` | **internal** | modify | F16 — the sibling note |
| `.claude/commands/add-framework--brainstorm.md` | **internal** | modify | F18 — the set ordinal, stated once across nine sites, with lines 320 and 491 untouched |
| `.claude/skills/add-plan-authoring/SKILL.md` | **internal** | modify | F18 — the cross-reference to the brainstorm set's convention, and one `uses:` mention |
| `cli/tests/product-close-out-parity.test.js` | product | **create**, incrementally | Owned by no single F-block. Each level is written and observed RED immediately before the F-block it covers, per the RED-first discipline below. The file is created by F1's levels and grows with every block |
| `CLAUDE.md` | internal | **generated** | Its inventory block loses `feature-pr.sh` and gains `add-review-discipline`. Written by `node scripts/inventory.js`, never by hand, and staged as that path alone |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE its F-block lands and verify each fails against the
current tree — that is the proof the tests bite. Then drive them GREEN.

**Baseline captured before F1, and every level graded against it:**

```bash
unset NODE_OPTIONS VSCODE_INSPECTOR_OPTIONS
ADD_GRAPH_WARNINGS=1 node scripts/build.js            # the warning list
cd cli && npx vitest run --no-file-parallelism --reporter=json > baseline.json
npm run test:scripts                                   # the bats baseline; exit 2 is a refusal, not red
node scripts/graph.js orphans | head -1                # the orphan count
```

### L1 — The deletion (F1)

1. `framwork/.codeadd/scripts/feature-pr.sh` and
   `framwork/.codeadd/scripts/tests/feature-pr.bats` are absent. *RED today: both exist.*
2. No file in the repository contains the string `feature-pr.sh`. *RED today: `add.pull-request.md`
   contains it three times, at lines 9, 83 and 360.*
3. `node scripts/graph.js orphans` returns the same count as the baseline. *RED today: not measured
   after a deletion.*
4. `add.pull-request.md`'s prohibition still forbids calling `done.sh`. *This is the half that must
   survive — a test that only asserts the removal would pass on a prohibition deleted whole.*

### L2 — `GATE_LEDGER` (F2, F3)

1. With a `tasks.md` holding `T01` and `T02` and a ledger holding a `complete` line for both,
   `converge-gates.sh` emits `GATE_LEDGER=ok`. *RED today: the key does not exist.*
2. With no `tasks.md` in scope, it emits `GATE_LEDGER=ok` and a `GATE_LEDGER_DETAIL` naming the
   reason. *RED today: the key does not exist.*
3. With a `tasks.md` and no ledger, it emits `GATE_LEDGER=missing` naming the path it looked for.
4. With `T02` lacking a `complete` line, it emits `GATE_LEDGER=broken` and the detail names `T02`.
   **Assert the id appears, not merely that the status is `broken`** — a detail that names no id
   sends the operator to read the ledger by hand.
5. It emits `GATES_OK=N/5`, and the script still exits 0 on a failing gate.
6. **The sweep is complete across all six artefacts F2 names.** `converge-gates.sh`,
   `converge-gates.bats`, `add.done.md`, `add.plan-to-ready.md`, `add-commit/SKILL.md` and
   `add-ecosystem/SKILL.md` together contain no `GATES_OK=4/4`, no "four gates", no "FOUR gates" and
   no "five gate lines". `add-commit`'s and `add.plan-to-ready`'s key lists each name six keys
   including `GATE_LEDGER`, and `add.done.md`'s parse list names `GATE_LEDGER` and
   `GATE_LEDGER_DETAIL`.
7. **The two false-positive matches are byte-unchanged.** `add.build.md` line 770's "Run the four
   gates below" and `converge-gates.bats` lines 52 and 54's fixture text still read exactly as they do
   today. *A grep-and-replace across the tree breaks both, and nothing else in this matrix would
   notice.*
8. Both `git log --grep=GATES_OK` passages are byte-unchanged.
9. `add.done.md` STEP 4 blocks on `GATE_LEDGER` being anything but `ok`, and contains no instruction
   to read `build-ledger.md` or `tasks.md` directly.
10. On the `SFxx` form, the gate resolves the SF-level ledger rather than the feature-level one.

### L3 — `done.sh` (F4, F5, F6)

1. Every `done.bats` case that exists today passes **unmodified** after F4. *This is the proof the
   split changed no behaviour; a rewritten case proves nothing.*
2. `--commit-push` and `--cleanup` each run standalone, and `--merge` still performs the whole local
   sequence and emits the same keys it emits today.
3. Context mode emits all nine probe fields.
4. With `gh` absent from `PATH`, `PR_STATE=no-gh` and the script still exits 0. *RED today: the field
   does not exist.*
5. `INDEX_ENTRY=present` for an entry sitting **uncommitted** in `docs/delivered.jsonl`. *This is the
   case the duplicate is born in; a check reading only commits cannot see it.*
6. `PUBLISH_RECORD` reads the **last** `Publish:` line when the ledger holds more than one — the
   ledger is a log, not a set, so a re-run appends a second.
7. On the local route, a push that `--dry-run` refuses stops the script **before** any local merge
   commit exists. *Assert the commit is absent, not merely that the exit code is non-zero.*
8. `--cleanup` with a failing fetch deletes nothing, names check 1, and exits 0.
9. `--cleanup` whose merge SHA is not an ancestor of `origin/<main>` deletes nothing, names check 2,
   and exits 0.
10. `--cleanup` passing both checks deletes the tags, the worktree and the branch.

### L4 — The publish question (F7)

1. `add.build.md` carries a `STEP 17` whose heading names Publish and a `STEP 18` whose heading names
   Completion, and no duplicate step number. *RED today: STEP 17 is Completion.*
2. Its behaviour table carries all five rows, and each names the exact `Publish:` string it writes.
3. The step's prohibitions forbid offering the question on `main` or `master`, forbid pushing before
   an answer, and forbid merging.
4. `add-subagent-driven-development`'s canonical format carries a `Publish:` row.
5. No feature fragment and no other artefact cites `add.build` STEP 17 or STEP 18. *Measured before
   planning; re-assert after the renumber.*

### L5 — The close-out routing (F8, F9, F10)

1. `add.done.md` STEP 2 carries a four-row table crossing merge state against entry presence, and
   each row names its route.
2. It carries the seven-row `PR_STATE` × `PUBLISH_RECORD` table, and the `none` × `none` row routes
   to ASK.
3. `PR_STATE=no-gh` routes to the local route in every combination.
4. The `Resume` route names STEP 5's promotion, 6.3, 6.7 and 6.8 as skipped. **Assert all four are
   named** — internal's resume path skips three and the fourth is product-specific.
5. The `Recovery` route resolves the feature from the merge commit's diff, takes its facts from
   `git show --name-status`, and contains a prohibition against reconstructing the diff from `plan.md`.
6. The PR route's seven steps appear in order, and the SHA comparison sits **before** the verdict is
   read.
7. The check-status rule names `skipped`, `queued`, `neutral` and `cancelled` as not a pass, and the
   no-required-check case merges and is reported.
8. `add.done.md` contains no `> **MODEL:**` line.
9. STEP 8 delegates its deletions to `done.sh --cleanup` and performs none itself.
10. The report names which evidence the gate accepted, CI or local, and why.

### L6 — The changelog owner (F11, F12, F13)

1. `references/history.md` names `<feature-dir>/changelog.md` and contains no
   `docs/changelog/CHG[NNNN].md`. *RED today: it contains the latter.*
2. It carries the one-per-delivery prohibition block and the six-row complement table.
3. Complementing a changelog that already holds a `feat(api): add endpoint` bullet does not add a
   second copy of it, and does add a bullet the file lacks.
4. Complementing rewrites `## TL;DR` and preserves every existing `## Changes` bullet byte-for-byte.
5. Complementing preserves `id:`, `created:`, `type:` and `related:`, bumps `updated:`, and allocates
   no second `CHG[NNNN]`.
6. Neither `add.done.md` 6.3 nor `add.pull-request.md` 3.1 contains a skip instruction, and neither
   declares the path literally.
7. `add.pull-request.md` still carries its secrets gate and its append-only PR body update.

### L7 — The build readback (F14)

1. `add.build.md` carries a `10.0.4` dispatching `@readback-agent`, and 10.0's intro names three
   blocks. *RED today: it names two.*
2. The dispatch specifies `scope: subfeature` on an epic and `scope: feature` otherwise.
3. Three `Readback:` lines (matches, diverges, skipped) and one `Ruling:` line for the divergence
   case are each specified verbatim. **Assert the `Ruling:` prefix on the fourth** — a builder reading
   "four `Readback:` lines" lands the divergence outcome without the ruling the design requires.
4. The resume rule states that a `Readback:` line already present means it ran.
5. Its prohibitions forbid stopping the build, forbid re-dispatching, and forbid an inline fallback.
6. `add-subagent-driven-development`'s canonical format carries a `Readback:` row.
7. Completion reports the outcome.

### L8 — The discipline skill and its callers (F15, F16, F17)

1. `framwork/.codeadd/skills/add-review-discipline/SKILL.md` exists and
   `framwork/provider-map.json` carries `"add-review-discipline": {}`. *RED today: neither exists.*
2. `node scripts/build.js` emits the skill into all five provider directories.
3. Both siblings carry the note, and **neither `uses:` block names the other**. *A cross-layer target
   dangles and fails the build; assert the absence, not only the note's presence.*
4. The product skill states the count rule, the three-row divergence table and the disk boundary, each
   exactly once, and its disk prohibition permits `review-NNN.md` and `qa-validation-NNN.md` by name.
5. All four callers cite `{{skill:add-review-discipline/SKILL.md}}`; none restates the verdict table;
   and `add.plan-to-ready` still carries its Decision Log comparator and its "does NOT stop and does
   NOT present" rule.
6. Every caller's dispatch inputs are byte-unchanged.

### L9 — Behavioural acceptance

1. A close-out on a branch with an open PR reaches `gh pr merge --squash` only after a check run whose
   `headRefOid` equals `HEAD`.
2. A second close-out run on a branch whose entry is already written writes **no second line** to
   `docs/delivered.jsonl`. *This is the defect the plan exists to fix; assert the line count.*
3. A close-out whose `--cleanup` checks fail leaves the branch and reports it, and the merge stays
   landed.
4. `ADD_GRAPH_WARNINGS=1 node scripts/build.js` exits 0 with no warning absent from the baseline.

### L10 — The tests still bite (mutation, after F17)

Run each mutation against the post-change tree, confirm the named level goes red, then restore.

1. Change `GATES_OK=N/5` back to `N/4` in `converge-gates.sh`. L2.5 goes red.
2. Remove the `git fetch` from `--cleanup`. L3.8 goes red. *This is the check whose failure is
   invisible — it deletes successfully against a stale ref.*
3. Delete the `none` × `none` ASK row from `add.done.md`'s route table. L5.2 goes red.
4. Restore the skip instruction in `add.done.md` 6.3. L6.6 goes red.
5. Add `- skill: add-review-discipline` to the internal sibling's `uses:` block. L8.3 goes red **and**
   `node scripts/build.js` fails on the dangling target.
6. Change `add.build.md` line 770's "Run the four gates below" to "five". L2.7 goes red. *This is the
   false positive a tree-wide replace would have taken silently.*
7. Add `-000-` to the standalone brainstorm path at `add-framework--brainstorm.md` line 320. L11.3
   goes red. *The second false positive, and the one that produced the wrong filenames this plan's
   design set was written under.*

### L11 — The brainstorm set's ordinal (F18)

1. `add-framework--brainstorm.md` states the set naming **once**. Every other site cites that one
   declaration instead of repeating `YYYY-MM-DDTHHMMSS-[topic]-umbrella.md`. *RED today: nine sites
   restate it.*
2. The single declaration carries `-000-umbrella` and `-001-<subtopic>`, matching
   `add-plan-authoring`'s plan-set example character for character in its ordinal form.
3. **Lines 320 and 491 are byte-unchanged**, and the standalone form they name still carries no
   ordinal. *A replace that adds `-000-` to a standalone brainstorm is the failure this level exists
   to catch, and nothing else in this matrix would notice.*
4. `add-plan-authoring`'s File Naming names the brainstorm set's convention and its owner, and its
   `uses:` block carries `- mention: /add-framework--brainstorm`.
5. The naming rule for a brainstorm set appears in exactly two files, and `add-plan-authoring`'s
   mention points at the command rather than restating the pattern.

**RED expectations against the current tree:** L1 fails because the script exists. L2 fails entirely
because `GATE_LEDGER` does not exist. L3.3 through L3.10 fail because the modes and fields do not
exist; L3.1 and L3.2 pass today and are the regression net. L4.1 fails because STEP 17 is Completion.
L5 fails entirely. L6.1 fails because the stale path is present. L7.1 fails because 10.0 names two
blocks. L8.1 fails because neither file exists. L9.2 and L9.3 fail because neither behaviour exists.
L10 is written before F17 lands and run after, because a mutation proves a test bites only against the
tree that test now runs on.

**GREEN = all levels pass after F1–F17.**

---

## Execution Order

1. **F1** [product] — delete `feature-pr.sh`, its suite and both stale references.
2. **F2** [product] — `GATE_LEDGER`, `GATES_OK=N/5`, and the gate-list sweep across three documents.
3. **F3** [product] — `/add.done` STEP 4.3 reads it.
4. **F4** [product] — split `done.sh` into `--commit-push`, `--cleanup` and a composing `--merge`.
5. **F5** [product] — the nine context-mode probe fields.
6. **F6** [product] — the push dry-run and the two post-merge checks.
7. **F7** [product] — `/add.build` STEP 17 Publish, Completion to STEP 18, the `Publish:` row.
8. **F8** [product] — `/add.done` STEP 2's four states and route table; the model pin removed.
9. **F9** [product] — `/add.done`'s PR route and the accepted-evidence report line.
10. **F10** [product] — `/add.done`'s resume and recovery routes; STEP 8 delegating to `--cleanup`.
11. **F11** [product] — the `changelog` schema's path, ownership and complement table.
12. **F12** [product] — `/add.done` 6.3 complements.
13. **F13** [product] — `/add.pull-request` 3.1 and 3.3 complement and cite.
14. **F14** [product] — `/add.build` 10.0.4's readback and the `Readback:` row.
15. **F15** [product] — create the product `add-review-discipline` and register it.
16. **F16** [internal] — the internal sibling note.
17. **F17** [product] — the four callers cite the skill.
18. **F18** [internal] — the brainstorm set's ordinal, stated once, plus the cross-reference.

**F1 first** because adding a PR merge route while a contradicted PR flow ships to five providers
would make four PR paths in one layer, and because the block that removes an artefact must fix every
dependent inside itself.

**F2 before F3** because F3 reads the key F2 produces. **F4 before F6** because F6 lives inside the
modes F4 extracts and declares a `Consumes` for them; **F5 is independent of F4** — it edits context
mode, which F4 never touches, and it declares no `Consumes`. It is ordered here only because it shares
the file and a single-file-at-a-time sequence keeps each block's diff readable. **F7 before F8** because F8 reads the `Publish:` line F7 writes. **F4 before
F9** because the PR route calls two of F4's modes. **F8 before F10** because the resume and recovery
routes are rows of the table F8 builds.

**F11 before F12 and F13** because both consume the rule F11 writes. **F14 before F15** so the skill
documents a `/add.build` site that already exists rather than one arriving a block later. **F15 before
F16 and F17** because both consume the skill.

**F18 last, and it depends on nothing.** It touches two internal files no other block opens, so it can
also be taken first if the product work stalls. It is placed at the end because it is the smallest and
the only block whose absence leaves nothing half-wired.

**F7 before F14**, and both edit `add.build.md`: F7 appends a step at the end and renumbers Completion,
F14 appends a sub-step inside 10.0. Different regions, and this order means F14 lands on a file whose
step numbering has stopped moving.

**Working boundaries.** The repo is in a working state after every F-block. Three are natural stopping
points if the build must halt: **after F3** the ledger gate is live and enforced with nothing
half-wired; **after F6** `done.sh` is complete and the local route is strictly safer than today, with
the PR route not yet reachable; **after F10** the whole close-out half is delivered and T2 is untouched
scope. Stopping between F4 and F6 is the one boundary to avoid — F4 alone is a refactor whose new modes
nothing calls yet, which is harmless but pointless to ship on its own.

**Per-F-block validation beyond the layer default:**

- Every F-block touching `framwork/.codeadd/scripts/*.sh` runs `npm run test:scripts`. **Exit 2 is a
  refusal to run, never a red suite** — record it as unavailable and resolve the verdict from CI.
- Every F-block touching a `.md` command or skill runs `ADD_GRAPH_WARNINGS=1 node scripts/build.js`
  and compares against the F1 baseline warning list, never against zero.
- F15 additionally runs `npm test` in `cli/`, because it touches `provider-map.json`.
- Every F-block runs the cli suite serially and compares failures against the F1 baseline. **Two
  `graph-query.test.js` failures are expected on a clean tree**; a third is this block's.
- F1 additionally re-runs `node scripts/graph.js orphans` and compares the count.

## Reviewer Handoff

The review command must be able to audit this without re-reading the design set. For each F-block the
build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.
- **The baseline comparison** — the warning list, the cli failure count and the bats result, each
  against the F1 capture rather than against zero.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. **An F-block marked done whose validation level was never RED.** L3.1 and L3.2 are the two at most
   risk, because both pass today by construction and a build could report them green without ever
   having run them.
2. **A prohibition deleted whole where only half of it was false.** F1 removes the `feature-pr.sh`
   clause from a prohibition that also forbids `done.sh`. L1.4 is the only level that catches the
   over-deletion.
3. **The gate-list sweep left incomplete.** F2 touches three documents outside its own script, and a
   document that still says four while the script says five is a drift `build.js` cannot see. L2.6 is
   the only level that catches it, and it must check all three.
4. **`--merge` quietly changed while being split.** F4's whole claim is that behaviour is identical.
   A build that rewrote a `done.bats` case to make it pass has invalidated L3.1 rather than satisfied
   it. Check the diff of the suite, not only its result.
5. **`INDEX_ENTRY` reading commits instead of file content.** L3.5 is the only level that distinguishes
   them, and it is the case the duplicate entry is actually born in.
6. **A cross-layer `uses:` target.** F15 and F16 create two same-named skills in two layers. L8.3
   asserts the absence of the declaration, and L10.5 proves the build fails when it is added. A build
   that skipped L10.5 has not proven the gate exists.
7. **The readback turned into a gate.** F14's value is that it does not stop the build. L7.5 asserts
   the prohibitions; a build that added a "STOP and present" path has delivered the opposite.
8. **A speed or count figure taken from a parallel run.** Every baseline here is serial.
9. **An ordinal added to a standalone brainstorm.** F18's whole trap is that two of the eleven matching
   lines must not change. L11.3 is the only level that catches it, and L10.7 proves it bites. A build
   that reports L11 green without having run L11.3 has done the dangerous half.

## References

- Design set: `docs/brainstorming/2026-09-11T010158-product-close-out-parity-000-umbrella.md`,
  `...-001-close-out.md`, `...-002-docs-and-discipline.md`
- Prior art this plan builds on:
  - `2026-09-09T090201-PLAN--review-no-loops` — created the internal `add-review-discipline` and
    recorded the product layer's exclusion as roadmap scope. F15 and F16 close that.
  - `2026-09-10T203053-PLAN--close-out-hardening` — gate 2.1's fourth row, the five post-merge checks,
    and `add-plan-authoring` taking ownership of the internal changelog filename. F8, F10, F6 and F11
    are the product-layer equivalents. Its changelog records the fourth row and the resume path as
    **never executed**, which is why L5 tests them directly.
  - `2026-09-09T163448-PLAN--final-report-shape` — established the deliberate cross-layer sibling with
    an HTML-comment note in each file. F15 and F16 follow that arrangement exactly.
  - `2026-09-10T230600-PLAN--fast-local-bats` — the container bats runner, and exit 2 as a refusal
    rather than a red suite. Every `.sh` F-block's gate depends on it.
- In flight, and to be sequenced against: `2026-09-11T005514-PLAN--vitest-fixture-scope`.
- Measurements in Current State taken in the planning session of 2026-09-11 with
  `node scripts/graph.js impact <name> --depth 1`, `NODE_OPTIONS` cleared.

---

## Next Steps

/add-framework--build product-close-out-parity

One command executes every F-block, whichever layer each is tagged. Do NOT route part of this plan to
a second command.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-11 | Initial creation |
| 2026-09-11 | Implemented. 24 commits, `c430da5..86f8008`. Three companion blocks (F1b, F14b, F15b) were opened by the layer rule, not by this plan: a `[product]` block cannot write `CLAUDE.md` or the checked-in graph diagram, and both go stale when the artefact set changes. The review pass ran 13 auditors plus the graph queries, applied 25 findings and rejected 18 with rulings. Two of this plan's own claims were corrected in flight: the push dry-run does NOT catch server-side branch protection (client-side, never reaches the pre-receive hook), and a cross-layer `uses:` does NOT fail `build.js` (a node of that name exists in both layers, so it resolves to self). Changelog: `docs/changelog/2026-09-11T112611-add-product-close-out-parity.md` |
| 2026-09-11 | Self-check before review: three `Consumes` strings corrected to quote their `Produces` character for character (F8←F7, F10←F8, F16←F15); the F14→F15 interface declared instead of left as an ordering note; two orphan `Impact` rows resolved (`add-ecosystem`, the test suite); one wrong validation-level citation fixed in Risks |
| 2026-09-11 | Added **F18** `[internal]` on user request: the brainstorm SET gains the `-000-umbrella` / `-001-<subtopic>` ordinal the plan set already has, stated once instead of across nine sites and eleven lines, with `add-plan-authoring` gaining a cross-reference rather than the ownership. Measured and recorded: two of those eleven lines name a **standalone** brainstorm and must keep no ordinal, which is a false-positive trap of the same shape as F2's. The PRODUCT layer gets nothing, because `add.brainstorm.md` has no umbrella, set or decomposition at all, and an ordinal with no set is an invented feature; its epic subfeatures already carry `SF01`. A latent split declaration of the product brainstorm path was found and recorded in `Does NOT Include` rather than folded in. Added L11, one L10 mutation, one risk row, one reviewer-handoff gap, and three `Current State` rows. The `add-framework--brainstorm` impact figure was measured at 0, not the 2 first written |
| 2026-09-11 | Review (fix-then-ok), four Attention items and one nit applied. **F1** no longer claims `add-ecosystem` holds a `feature-pr.sh` row — verified absent, so the sweep there is empty. **F2** replaced its three-document prose with the complete measured inventory: six artefacts, seventeen lines, plus the two false-positive matches (`add.build.md:770`, `converge-gates.bats:52,54`) named as must-not-change. `add-ecosystem` line 254 was found in that sweep and is a sixth artefact neither the review nor the discovery pass had named. **Execution Order** no longer claims F5 depends on F4; F5 edits context mode and declares no `Consumes`. **F14**, its `Produces` and **L7.3** now state three `Readback:` lines plus one `Ruling:` line, matching Decision 4 verbatim. **Current State** corrected the internal `add-review-discipline` impact figure from 3 to 4. **L2** gained the completeness and false-positive levels and **L10** gained the matching mutation |
