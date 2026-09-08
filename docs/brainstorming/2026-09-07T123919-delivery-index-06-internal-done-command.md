# Brainstorm: `/add-framework--done` — the Internal Close-Out

> **Status:** **APPROVED** by the owner on 2026-09-07 — ready for `/add-framework--self-plan`
> **Date:** 2026-09-07
> **Type:** command
> **Set:** `2026-09-07T123919` — **06 of 08**, subtopic 1 of `2026-09-07T123919-delivery-index-05-internal-umbrella.md`
> **Relates to:** the record shape lives in `2026-09-07T123919-delivery-index-02-product-schema.md` and its internal field usage in the `entry-join` subtopic. This document specifies *when* an entry is written, never *what it contains*

## Discovery

- **The internal layer has eight commands** — `build`, `plan`, `release`, `self-build`, `self-plan`, `shared-brainstorm`, `shared-review`, `sync` — and **no close-out**. Work ends at a commit, a hand-written `docs/changelog/` entry, and a merged PR.
- **`.github/workflows/ci.yml`** runs four things across **two jobs with different working directories**: `test-cli` sets `working-directory: cli` and runs `npm test` and `npm run test:package`, with `node scripts/build.js` overridden back to `.`; `test-scripts` runs `npm run test:scripts` at the root. Reproducing them locally without the directories produces a false gate — `test:package` exists only in `cli/package.json`, while root `package.json` carries `"test": "npm --prefix cli test"` and `test:scripts`.
- **`add-framework--shared-review` emits exactly three verdicts** — `PASS | GAPS_FOUND | BLOCKED` — with `PASS` meaning zero high-severity findings and `GAPS_FOUND` meaning one or more remain.
- **`add-framework--self-plan` forbids creating branches, commits or PRs**, and `--self-build` creates none either. Nothing in the internal layer establishes a branch or worktree; the operator does.
- **`scripts/build.js` is itself a gate.** Three artefact-graph conditions **fail** the build: a declaration naming an artefact that does not exist, an artefact on disk absent from `provider-map.json`, and a name in prose with no declared relationship. This is the internal equivalent of "the filesystem proves it".
- **`add-framework--self-build` STEP 5** validates per F-block — well-formedness, no broken references, `building-commands` checklist, CLAUDE.md currency, no command referencing a removed skill or agent — then commits the block and appends `S<n>: complete (commits <BASE>..<HEAD>, …)` to the ledger.
- **`add-framework--shared-review`** audits a plan against its implementation with four subagents and produces a verdict in a `--review-vNN.md` companion file.
- **`converge-gates.sh` does not apply here**, as the umbrella already recorded: it requires a `FEATURE_DIR` containing `epic.md`, `review-NNN.md` and a `plan.md` with a coverage table, plus a repo-root `.codeadd/manifest.json`. The internal layer has none of those.

**Measured — what reads each internal docs directory after a merge:**

| Directory | Read by | Prunable? |
|---|---|---|
| `docs/plans/` | `@framework-discovery-agent` **plus** build, plan, release, self-build, self-plan, shared-review, sync | **No** |
| `docs/brainstorming/` | `add-framework--plan`, `add-framework--shared-brainstorm` | **No** |
| `docs/changelog/` | **Written** by `add-framework--build`; no programmatic reader | **No** — kept as the human narrative record, and its retirement is out of scope |
| `docs/evidence/` | **Nothing** | Yes |

## Context & Motivation

The umbrella established that the internal layer needs a close-out and deferred two things here: **which gates run before the merge**, and **what gets cleaned up**.

The first was deferred because the obvious answer was wrong — reaching for `converge-gates.sh` is a category error the umbrella names explicitly. The second turned out to have an answer nobody expected, and it is the more interesting of the two.

## Problem / Opportunity

Three gaps, and the third reframes the whole cleanup question:

1. **No moment of closure.** Nothing marks "this landed", so nothing can be written at that moment — which is the index's entire precondition.
2. **No gate before the merge.** Today a PR can be merged with a red build; only CI complains, after the fact.
3. **The cleanup the owner asked for cannot be deletion.** `docs/plans/` is read by `@framework-discovery-agent` — the agent this very brainstorm session dispatched twice — and by seven commands. Deleting plans would blind the discovery path, which is the same mistake the product subtopic caught with `plan.md`.

The opportunity in (3) is that **the relief the owner wants does not require deleting anything.** `.gitignore` already excludes `docs/*`. Plans accumulate in a *fresh clone* only because CLAUDE.md deliberately force-adds some of them — and it force-adds them for exactly one stated reason: *"a plan whose changelog or review is untracked reads as unimplemented from a fresh clone."*

An index entry states that fact in one machine-readable line. **Once entries exist, the reason to force-add disappears, and `docs/` becomes what it was always meant to be: local working artefacts.** That is the internal cleanup — retiring a practice, not deleting files.

## Proposed Solution

### The command, in execution order

```
STEP 1: Collect context      → branch, plan, ledger, changed files, gh auth
STEP 2: Gates                → ledger complete + four CI commands + review PASS  [HARD STOP]
STEP 3: Author index entry   → docs/delivered.jsonl, working tree only
STEP 4: Generate changelog   → docs/changelog/YYYY-MM-DD-<verb>-<slug>.md
STEP 5: Preview              → INFORMATIVE ONLY
STEP 6: Commit on the branch → entry + changelog, one commit, then push
STEP 7: Merge via gh         → gh pr create (if absent) + gh pr merge --squash
STEP 8: Cleanup              → worktree, branch, evidence — in that order, non-fatal
```

**The branch and worktree are the operator's, not this command's.** `add-framework--self-plan` explicitly forbids creating branches, commits or PRs, and `--self-build` creates none either; the operator makes the branch (and optionally a worktree) before either runs. This command is the first internal one to touch git at all, and it only ever *ends* what someone else started. **When the work was done on a branch in the main clone with no separate worktree, STEP 8 skips the worktree removal silently** — its absence is the normal case, not an error.

### STEP 2 — the gates, and why these

The internal gate is **the same four commands CI runs**, executed locally before the merge:

| Gate | Run from | Proves |
|---|---|---|
| `node scripts/build.js` | repo root | Every artefact is registered, every declaration resolves, no name is used without a declared relationship. The artefact-graph gates |
| `npm test` | repo root | The CLI's behaviour. Root `package.json` delegates: `"test": "npm --prefix cli test"` |
| `npm --prefix cli run test:package` | repo root, targeting `cli/` | The published package still installs. **`test:package` exists only in `cli/package.json`** — invoked from the root without the prefix it fails with "Missing script", which is a false gate, not a failed one |
| `npm run test:scripts` | repo root | The bats suite over `framwork/.codeadd/scripts/` |

The working directories are not incidental. CI's `test-cli` job sets `working-directory: cli` while its `test-scripts` job runs at the root, so "the same commands CI runs" is only true with the directories attached.

**The ledger gate.** Before any of the above, **every F-block in the plan's build ledger must read `complete`.** `add-framework--self-build` appends `S<n>: complete (commits <BASE>..<HEAD>, …)` per block, and a run that stopped halfway leaves blocks unfinished — while still passing all four CI commands and an existing favourable review, because unwritten code breaks no test. Without this gate a half-delivered plan merges and indexes as fully delivered, which is precisely the lie the index exists to prevent.

**The review gate, with the mapping spelled out.** When the branch implements a plan, a `--review-vNN.md` companion must exist, and `add-framework--shared-review` emits exactly three values:

| Verdict | At STEP 2 |
|---|---|
| `PASS` — zero high-severity findings | Proceed |
| `GAPS_FOUND` — one or more high-severity findings remain | **HARD STOP** |
| `BLOCKED` — regression, or ≥30% of validated decisions unimplemented | **HARD STOP** |

"Favourable" means `PASS` and nothing else. `GAPS_FOUND` is not a soft pass: its own definition is unresolved high-severity findings, and merging over them indexes them as delivered.

`/add-framework--done` **reads** that verdict and never produces one. Running the review inside the close-out would be a command grading its own delivery — plan 0074's founding failure.

Choosing CI's own four is not a shortcut. It means **a green local gate and a green PR are the same statement**, so the gate can never disagree with the thing it is standing in for. Inventing an internal `converge-gates.sh` equivalent would create a second definition of "ready" that drifts from CI — the precise problem `converge-gates.sh` was written to solve in the product layer, reintroduced here.

### STEP 6 and 7 — why the entry is committed before the PR

The entry and the changelog are committed **on the branch**, then pushed, then merged. If the PR is never merged, the branch dies and the entry dies with it. `main` cannot acquire an entry for work that did not land.

`gh` is a hard, non-optional dependency, which is honest here and would not be in the product layer: the internal layer has one operator who always has it. STEP 1 probes `gh auth status` and stops if it fails, rather than discovering it at STEP 7 with a half-finished close-out.

### STEP 8 — cleanup, corrected by measurement

**Order matters, and a failure here is non-fatal.** By STEP 8 the entry is already on `main`, so nothing below can invalidate the delivery. Run: **worktree first** (a branch checked out in a worktree cannot be deleted), **then the branch** local and remote, **then the evidence prune**. Any sub-step that fails is reported and skipped — never rolled back, and never a reason to undo a completed merge.

| Removed | Kept | Why |
|---|---|---|
| The worktree, if one exists | `docs/plans/` | `@framework-discovery-agent` reads them; seven commands reference them |
| The merged branch, local and remote | `docs/brainstorming/` | Read by `--plan` and `--shared-brainstorm` |
| `docs/evidence/` files for this plan | `docs/changelog/` | Retirement is out of scope, and it is the human narrative record |

Evidence files are the only class with no post-merge reader. That is a thin harvest, and it should be: **the internal relief is the force-add retirement, not deletion.** Plans stay on disk, gitignored, exactly as `.gitignore` already intends — and a fresh clone stops carrying them.

The two safety rules from the product's `docs-pruning` apply unchanged and for the same reasons: **never delete an untracked file** (unrecoverable, and "it's all in git" is false for it — which for force-added evidence means checking, not assuming), and **never clean up when no entry was written this run.**

### The sequenced retirement of force-add

The umbrella made this a hard ordering rule with a concrete trigger, and this command is where the trigger is produced:

1. `/add-framework--done` ships and runs at least once, landing one real entry on `main`.
2. **Only then** does CLAUDE.md's `docs/` tracking policy change.
3. **Whatever sets CLAUDE.md's `docs/` tracking policy currently enumerates** are **not** retroactively untracked. The list is deliberately not copied here: an earlier draft hard-coded one and got it wrong in both directions, naming sets the policy never mentions and dropping one it does. The policy is the single source of that enumeration, and the later edit reads it there. These sets record a period the index does not cover, and the umbrella's no-backfill decision means nothing else covers it either.

Reversing steps 1 and 2 deletes the record of what shipped during the window when nothing else records it.

### Alternatives considered

| Alternative | Why it was rejected |
|---|---|
| **Adapt `converge-gates.sh` for the internal layer** | Category error the umbrella already recorded. It would either fail its directory check or report every gate `ok` vacuously — worse than no gate |
| **Write a new internal `converge-gates` equivalent** | A second definition of "ready" that drifts from CI. CI's four commands are already the definition |
| **Run `/add-framework--shared-review` inside the close-out** | A command grading its own delivery. It reads the verdict; it does not produce it |
| **Fold the close-out into `--self-build` / `--build`** | A build that runs and is then discarded would index work that never shipped. The umbrella settled this |
| **Delete `docs/plans/` on close-out** | `@framework-discovery-agent` reads them. This is the internal repeat of the mistake the product subtopic caught with `plan.md` |
| **Retroactively untrack the force-added plan sets** | They are the record of the pre-index period, and there is no backfill. Untracking them destroys evidence the index will never replace |
| **Write the entry after the merge** | Requires a pull and an extra commit on `main`, and briefly allows an entry for unmerged work |

## Type of Artefact

Command — one new internal command, plus a CLAUDE.md policy change that is deliberately deferred behind a trigger.

## Scope

### Includes

- `/add-framework--done`: all eight steps, in order
- The gate set, and why it is CI's four rather than a new script
- The review-verdict document gate
- The `gh` merge, and the STEP 1 auth probe
- Cleanup: evidence, worktree, branch — and what is deliberately not cleaned
- The two safety rules inherited from `docs-pruning`
- The trigger and ordering for retiring force-add

### Does NOT Include

- The record shape — the product schema owns it
- What the internal entry adds or drops — the `entry-join` subtopic
- `graph.js history` and internal consumers — the `query` subtopic
- Producing a review verdict — `/add-framework--shared-review` owns that
- The `docs/` tracking **policy** edit in CLAUDE.md — gated behind the trigger. The internal command-table **row** is in scope and added now; only the policy text waits
- Retroactive untracking of existing force-added plans
- Any change to `/add-framework--release`

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| **The gate is CI's own four commands, run locally, with their working directories attached** | A green gate and a green PR become the same statement, so they cannot disagree. A bespoke internal gate would be a second definition of "ready" that drifts. The directories are part of the decision: `test:package` exists only in `cli/package.json`, so invoking it from the root yields "Missing script" — a **false** gate, which is worse than a failing one | ✅ |
| **The ledger gate runs before the four commands** | Unwritten code breaks no test. A `--self-build` run that stopped halfway passes all four CI commands and an existing review, and would merge and index as fully delivered — the exact lie the index exists to prevent | ✅ |
| **Favourable means `PASS` only** | `add-framework--shared-review` emits three values. `GAPS_FOUND` is defined as unresolved high-severity findings; merging over it indexes them as delivered | ✅ |
| **The branch and worktree belong to the operator; a missing worktree is normal** | `--self-plan` forbids creating branches, commits or PRs and `--self-build` creates none. This command only ever ends what someone else started | ✅ |
| **STEP 8 runs worktree → branch → evidence, and its failures are non-fatal** | A branch checked out in a worktree cannot be deleted, so the order is forced. By STEP 8 the entry is on `main`, so nothing there can invalidate the delivery — reporting beats rolling back a completed merge | ✅ |
| **`converge-gates.sh` is not reused, and not re-implemented** | Category error, already recorded in the umbrella; and re-implementing it recreates the drift | ✅ |
| **The review verdict is read, never produced, by this command** | A close-out that runs its own review grades its own delivery — plan 0074's founding failure | ✅ |
| **`gh` is a hard dependency, probed at STEP 1** | One operator who always has it. Probing at STEP 1 avoids discovering it at STEP 7 with the close-out half done | ✅ |
| **Entry and changelog committed on the branch, before the PR** | If the PR never merges, both die with the branch. `main` cannot acquire an entry for work that did not land | ✅ |
| **`docs/plans/` is NOT deleted on close-out** | `@framework-discovery-agent` reads them, and seven commands reference them (build, plan, release, self-build, self-plan, shared-review, sync). The umbrella's cleanup language implied more deletion than the evidence permits — the internal twin of the correction the product's `consumption` subtopic made to `plan.md`. **The owner asked for "as devidas limpezas de documentação"; this delivers that as retiring force-add rather than deleting, which is a narrower reading than the words invite** — carried to the owner in the handoff summary rather than left open here | ✅ decided, flagged upstream |
| **Only `docs/evidence/` is pruned** | The one class with no post-merge reader, by the same derivation rule the product layer uses | ✅ |
| **The internal relief is retiring force-add, not deleting files** | `.gitignore` already excludes `docs/*`. Plans reach a fresh clone only because CLAUDE.md force-adds them, for one stated reason the index answers directly | ✅ |
| **Existing force-added plan sets are never retroactively untracked** | They record a period the index does not cover, and there is no backfill | ✅ |
| **The CLAUDE.md policy change is out of this delivery, behind a trigger** | One real entry on `main` first. Reversing the order deletes the record of the window when nothing else records it | ✅ |
| **Safety rules from `docs-pruning` apply unchanged** | Never delete untracked; never clean when no entry was written | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `.claude/commands/add-framework--done.md` | New | Create — eight steps |
| `.opencode/commands/add-framework--done.md` | Adapter mirror | Create alongside |
| `provider-map.json` | Internal commands are not distributed, but the artefact graph gates unregistered artefacts | Verify against the graph's rules |
| `CLAUDE.md` | Internal command table gains a row; the `docs/` policy changes **later**, behind the trigger | Add the row now; policy change is separate work |
| `add-framework--self-build` | Unchanged. It commits F-blocks; this merges the branch | None |
| `add-framework--shared-review` | Its verdict becomes a gate input | None — it already writes the file |
| `add-framework--release` | Untouched. Releases tag `main`; this lands work on it | None |
| `.github/workflows/ci.yml` | Unchanged, and deliberately: the local gate mirrors it, so CI stays the backstop | None |
| `docs/delivered.jsonl` + `.gitignore` | The index, and its single negation line | Created by the first run |
| `@framework-discovery-agent` | Keeps reading `docs/plans/` — the reason they survive | None here; `query` subtopic wires the index in |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A moment of closure the internal layer never had | One more command to maintain |
| A gate before the merge instead of after it | Local runtime on every close-out |
| A fresh clone that stops carrying dead plans | Nothing — the plans stay on the author's disk |
| A gate that cannot disagree with CI | The freedom to gate on something CI does not check |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| The CLAUDE.md policy is relaxed before an entry exists, losing the record in between | **High** | The trigger is concrete and this command produces it. The policy edit is explicitly outside this delivery |
| The local gate drifts from CI when CI gains a step | Med | The command names the four commands rather than duplicating their logic. A CI change is a one-line change here — and a `npm`-script indirection would make even that unnecessary, which the plan should consider |
| The gate is skipped under time pressure and a red build is merged | Med | HARD STOP at STEP 2 with no override flag. If an override is ever added, it must write its use into the changelog |
| `gh` is unavailable and the close-out strands a branch mid-way | Low | STEP 1 probes `gh auth status` before anything is written |
| Cleanup deletes evidence someone still wanted | Low | Only `docs/evidence/`, only for this plan, only when tracked, only after the entry is written |
| A second operator without `gh` inherits this repo | Low | Accepted and stated. The internal layer is not a distributed product |

## RED Test Matrix

| # | Setup | Expected |
|---|---|---|
| 1 | `node scripts/build.js` fails | STEP 2 HARD STOP, nothing written, no PR |
| 2 | `npm test` fails | Same |
| 3 | Branch implements a plan with no `--review-vNN.md` | HARD STOP |
| 4 | Review verdict is unfavourable | HARD STOP |
| 5 | `gh auth status` fails | Stop at STEP 1, before any file is written |
| 6 | PR created but merge refused | Entry and changelog exist on the branch, absent from `main` |
| 7 | Successful run | Exactly one entry on `main` for this plan |
| 8 | Cleanup with `docs/evidence/` untracked | Nothing deleted, notice printed |
| 9 | Cleanup when STEP 3 wrote no entry | Nothing deleted |
| 10 | After a run | `docs/plans/` is intact; `@framework-discovery-agent` still finds the plan |
| 11 | Run twice on the same branch | The second run **stops at STEP 2**: its ledger and gates are unchanged but `gh pr view` reports the PR already merged, so there is nothing to close out |
| 12 | The plan's ledger has an F-block that is not `complete` | HARD STOP before any of the four commands run |
| 13 | Review verdict is `GAPS_FOUND` | HARD STOP — it is not a soft pass |
| 14 | `npm run test:package` invoked without `--prefix cli` | The gate implementation must not do this; a test asserts the prefixed form is used |
| 15 | Work done on a branch with no separate worktree | STEP 8 skips worktree removal silently and still deletes the branch |
| 16 | STEP 8 fails to delete the remote branch after a successful merge | Reported, not rolled back; the entry stays on `main` |

## Next Steps

**The set is complete — all eight documents are written and reviewed.** Nothing remains to refine.

It awaits the owner's approval of the handoff summary, which carries two decisions that reverse or narrow earlier ones: `plan.md` and `iterations.*` are kept rather than pruned (04), and the internal cleanup is retiring force-add rather than deleting (06).

On approval, both layers are plannable — the product layer first, since it owns the schema:

```
/add-framework--plan delivery index for the product layer
/add-framework--self-plan delivery index for the internal layer
```
