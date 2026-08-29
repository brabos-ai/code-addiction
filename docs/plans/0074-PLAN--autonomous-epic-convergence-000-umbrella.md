# Plan: Autonomous Epic Convergence — umbrella

> **Status:** implemented
> **Type:** architecture (command + script + schema + agent + skill)
> **Created:** 2026-08-27
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

`/add.plan-to-ready` ran epic `0028F` to the end and reported CONVERGED. `/add.done` rejected it about a second later, at STEP 5, on `qa-evidence.sh validate`. Two things went wrong, and this umbrella exists because of them.

The coordinator dispatched `@e2e-agent` (specs + capture) and never dispatched the dual-judge panel that writes `qa-validation-NNN.md`. It wrote its own assessment into `review-004.md` and treated that as equivalent. Separately, it wrote the `> **QA baseline:**` line by hand as a filesystem path (`_tests/run-001`) instead of taking it verbatim from `qa-evidence.sh working-baseline`, which returns the canonical `feature:run-001` form.

Neither was caught. STEP 6 gate 2 says *"the line is present and valid"* — text the coordinator grades itself. And STEP 6 draws its side-effect boundary at a **step number** (`/add.done` STEP 4.0–4.2) instead of at the property it meant. `qa-evidence.sh validate` sits in `/add.done` STEP 5 and is a pure read: `validate_baseline` (`qa-evidence.sh:199-241`) parses, compares, checks containment and symlinks, validates the report, and echoes. Only `promote_baseline` writes. **The check existed, cost nothing, changed nothing on disk, and was excluded because of where it sat in the numbering.**

That makes the command's own central claim false today:

> *"Convergence **is** `/add.done`'s gate set, evaluated without side effects. One definition of 'ready', shared by this loop and by the step that consumes it — so it is impossible to converge on something `/add.done` then rejects."*

This set makes that claim true again, and only then extends the loop to run a whole epic unattended.

**No design doc backs this set.** The decisions were taken in the consultation that produced it and are carried inline in Validated Decisions below. Each topic file restates only the decisions it implements.

## The rule behind every topic

Every topic here is one application of a single rule:

> **No gate is satisfied by the agent that executes it saying so. Either a script proves it, or the filesystem proves it. Text and a check mark are the same thing.**

| Where it applies | Topic |
|---|---|
| Gates become a script | T1 |
| Leg outputs are checked against disk, not described | T1 |
| The verdict prints the script output instead of an adjective | T1 |
| A gate that did not run says `not-probed` and never counts as a pass | T1 |
| Epic control flow reads a schema instead of matching strings | T2 |
| Resume position is read from an append-only log, never from a check mark | T4 |

A written checklist of steps, authored by the coordinator at start-up, was considered and **rejected**: it gets ticked by the same agent whose judgement is the failure mode, so it repeats the bug with more paperwork; it breaks the command's `NO NEW STATE` rule; and for a coordinator restarting on another engine it is worse than a log line, because it has to read text and trust check marks it did not write.

## Problem

1. **Convergence grades itself.** Three of STEP 6's four gates are simple greps and the fourth already had a script. All four are evaluated as text. The only one with a ready-made script was the only one forbidden.
2. **Legs describe their outputs but never check them.** STEP 5 says the review leg "emits" `review-NNN.md` and `qa-validation-NNN.md`. The only check on the leg is negative (if it modified files → BLOCKED). Nothing checks that it produced what it said it would.
3. **`epic.md` has no schema.** `/add.new` STEP 5 writes it freeform, and three places parse it by string: `/add.build` STEP 14.3 (rewrites a row), `/add.plan` STEP 8.0 (reads a dependency graph), `/add.done` STEP 4.1 (counts rows containing "done"). The autonomous loop's whole control flow would sit on that.
4. **The checkpoint tag is fake.** `/add.build` STEP 16.2 creates `checkpoint/${FEATURE_ID}-${SF}-done` while line 54 of the same file forbids committing. The tag lands on the previous HEAD, which does not contain the subfeature's work — restoring from it restores the state *before* the subfeature.
5. **Reviews do not say which subfeature they cover.** The `review` schema has no `scope:` field (the sibling `qa-validation` schema has one). An epic run produces a flat per-feature sequence with no owner per document.
6. **No plan reviewer ships.** `@plan-review-agent` exists only in the internal layer. Plan 0069, which creates the product-layer one, is still `draft`.
7. **Nothing checks consistency between subfeatures.** `${CROSS_SF_CONTEXT}` (`/add.plan` STEP 8.0) injects sibling context into prompts at plan time. It is advisory, and nothing verifies the result.
8. **The safety brake disappears under epic-wide autonomy.** The command says its 3-iteration cap is per invocation *because* re-invoking is a human act. Running a whole epic removes that human, and a checkpoint commit would make a fake convergence permanent and pushed.

## Proposal

Four topics, in order, each ending at a commit that leaves the framework working.

**T1** replaces STEP 6's text gates with one shipped script used by both `/add.plan-to-ready` and `/add.done`, adds positive checks on leg outputs, and makes the verdict print the script output. This is the fix for the failure that started the set, and it already pays off on single-subfeature runs.

**T2** gives `epic.md` a schema and converts its three consumers to it, fixes the fake checkpoint tag, and adds subfeature attribution to reviews. This is what makes gate 3 checkable and what lets an outer loop resolve its own work list.

**T3** adopts plan 0069 (already written) and wires the resulting reviewer into the loop's plan leg, which dispatches agents directly instead of calling `/add.plan`.

**T4** adds the outer loop over subfeatures, the epic-level budget and halt policy, the gated commit whose message carries the gate results, Decision Log compaction at subfeature boundaries, resume rules, and the cross-subfeature consistency judge.

The order is a dependency chain, not a preference: T4's checkpoint only means something once T1 makes convergence mean something, and T4's loop can only resolve its work list once T2 gives `epic.md` a contract.

## Scope

### Includes

#### T1 — Deterministic convergence gate (`…-001-convergence-gate.md`)
**F1–F9.** New `converge-gates.sh` + its bats suite; STEP 6 rewritten around it; leg output checks; verdict prints script output; `/add.done` uses the same script; `/add.review` baseline hardened to script-verbatim; `review` schema gains the baseline format; ecosystem registry.

#### T2 — Epic foundations (`…-002-epic-foundations.md`)
**F10–F19.** New `epic` schema and its index entry; `/add.new` writes it; the three string-parsing consumers converted; fake checkpoint tag fixed; `scope:` added to the `review` schema and written; gate 3 swaps its string read of `epic.md` for a schema read.

#### T3 — Plan-reviewer adoption (`…-003-plan-reviewer-adoption.md`)
**F20–F22.** Execute plan 0069 as written; dispatch `@plan-reviewer-agent` from the loop's plan leg per subfeature; ecosystem registry names the loop as a dispatcher.

#### T4 — Epic loop and cross-SF judge (`…-004-epic-loop.md`)
**F23–F36.** Epic-scoped invocation; outer loop; budget and halt policy; gated commit + push with gate results in the message trailer; Decision Log compaction; resume rules; `iterations.jsonl` logged per leg; new `consistency-agent` and its rubric skill; provider-map registration; commit trailer format; ecosystem registry.

### Does NOT Include (important!)

- **A written checkpoint checklist.** Rejected for the reason in "The rule behind every topic". What it was trying to solve is covered by leg output checks (F4), the commit receipt (F27) and per-leg logging (F30).
- **Skipping a blocked subfeature.** The loop halts on the first non-CONVERGED subfeature. Skipping needs a dependency graph you can trust to prove independence; that graph only becomes trustworthy in T2, and turning the policy on is a separate decision.
- **`CLAUDE.md` and the internal layer.** `/add-framework--build` reaches neither. Routed to a companion `/add-framework--self-plan` in Next Steps.
- **`README.md`, `web/src/pages/*.astro`, `web/public/*.svg`.** Owned by `/add-framework--sync` before release, not by a plan.
- **Rewriting plan 0069.** T3 points at it and adds only what the loop needs on top.
- **Merging.** The loop still converges and hands control back. `/add.done` stays the only merge path, and the human stays the merger.

## Validated Decisions

| Question | Decision | Rationale |
|---|---|---|
| Form of the gate | New `converge-gates.sh`, same shape as `qa-preflight.sh` | `done.sh --check` would add a read-only mode to a script whose normal path runs git commands; a separate read-only script is safe to call from anywhere and from both commands |
| Gate scope | All four gates | Three are simple greps; leaving any one as text keeps the bug alive |
| Leg output checks | Fixed list: `review-NNN.md`, `qa-validation-NNN.md` (when the receipt is present), plan-leg `plan.md` / `design.md`, the `## Fix Routing` table | Checking every artefact is fragile scope creep; checking what feeds a gate or a later leg is bounded |
| Gate 3 before the schema | Scripted in T1 with today's string rule; T2 upgrades it to a schema read | Deferring it to `not-probed` would have blocked every epic and subfeature run at C1 — a regression introduced to fix a bug |
| `not-probed` | Legal value, never counts as a pass, returned by no gate in the set | It is the honest answer for a gate the script cannot evaluate. That distinction is exactly what failed on `0028F` |
| Who commits | `/add.plan-to-ready` owns commit + push; `/add.build` stays `GIT CLEAN` | The clean-tree rule exists so a human can look at the diff first. An autonomous loop has no such human, so it has to commit |
| Commit gating | Only when that subfeature's gates all pass | A checkpoint on code that does not converge is a restore point to broken code |
| Checkpoint receipt | Gate results in the commit message trailer | Keeps the `NO NEW STATE` rule — a commit message is not a file — and makes the checkpoint describe itself and be greppable |
| Cross-SF dimensions | API contracts, data schema, requirements, design tokens (when `HAS_DESIGN`), auth/permission model | The judge reads the same plans either way, so each extra dimension costs almost nothing |
| Cross-SF timing | Full pass after each plan, delta-only pass at the end of the epic | The plan-time pass catches divergence before it becomes code; the end pass re-checks only dimensions whose files changed since the last verdict |
| Epic budget | 3 iterations per subfeature (unchanged) + halt on the first non-CONVERGED; global `3 × N_SF` backstop | With halt, the budget limits itself. If the global cap ever fires, that is a symptom worth seeing |
| Blocked subfeature | Halt | Skipping needs a dependency graph you can trust, which T2 has only just created |
| Resume | Resume at the last checkpoint commit; the in-flight subfeature starts over | Gated commits mean an in-flight subfeature has no commit, so there is no partial state worth trusting. Damage is limited to one subfeature |
| New feature flag for the epic loop | No | Already opt-in by invocation. A flag needs a fragment, the command's first marker, a CLI registry entry and a new injection point — cost with no gain |
| Plugin marker on `consistency-agent` | None, deliberately | It judges documents, not code. Code-level checking is `@reviewer-agent`'s job and that agent already carries the `gitnexus` graph section |
| Step renumbering in marker-bearing commands | Banned, one recorded exception in T3 | Fragments quote step numbers as plain text and nothing in the build checks those references |
| Checklist artefact | Rejected | Ticked by the agent that is failing; breaks `NO NEW STATE`; worse than a log line for a coordinator restarting on another engine |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| A convergence verdict that cannot grade itself | A shell script to maintain alongside `/add.done`'s gate text |
| One definition of "ready" as one piece of code | `/add.done` and `/add.plan-to-ready` now share a hard dependency |
| Epic control flow on a real schema | A migration surface: existing `epic.md` files predate the schema |
| Durable checkpoints that say why they exist | `/add.plan-to-ready` becomes a command that writes to git, which it was not |
| Cross-subfeature consistency actually judged | One more agent, one more skill, one more dispatch per subfeature boundary |
| Unattended epic delivery | The human safety brake is replaced by a declared halt policy, which has to be right |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| **Editing text near an injection marker breaks its anchor.** `add.build` has 10 injection points, `add.plan` 5, `add.review` 3, `add.new` 1, `add.done` 1 — each an open/close marker pair. The build remembers each point by the text around it, and many F-blocks edit text in those files | **High** | L0 below: record the sidecar's injection-point total before the first edit and check it is unchanged after every topic. The build already fails loudly on a broken anchor — the mitigation is running it at every checkpoint, not only at the end |
| The gate script and `/add.done`'s text drift apart again | Medium | F6 makes `/add.done` STEP 4 *call* the script instead of restating it. L1.2 checks both commands reject the same tree |
| Existing `epic.md` files fail the new schema | Medium | F10 defines the schema to accept what `/add.new` already produces, or T2 ships a normalisation path. L4 in T2 checks a pre-schema `epic.md` still parses |
| Halt-on-first-blocked strands a long epic halfway | Medium | F27's gated commit means every converged subfeature is already pushed; F29's resume restarts only the in-flight one |
| The loop pushes to a shared branch unattended | Medium | Commit is gated on convergence (F27); the branch is the feature branch `build-setup.sh` created; merge stays human |
| The cross-SF judge produces endless findings and the loop never converges | Medium | F33 fixes the rubric at five dimensions; anything outside is informational and does not block |
| `converge-gates.sh` has a bug and blocks every run | Low | F2's bats suite is written RED-first and runs in CI next to the other ten script suites |

## Injection Surface (set-wide)

Features and plugins inject into commands **and** agents after install. The build strips every `<!-- feature: -->` / `<!-- plugin: -->` marker and remembers each one by the text next to it, in `injection-points.json`. Editing that text breaks the anchor. This is the map the whole set edits against.

### Where the markers are

| File | Injection points | Touched by | Risk |
|---|---|---|---|
| `add.build.md` | 10 — `qa-pipeline:qa-fix` L201 · `tdd-pipeline:detect-framework` L214 · `tasks-flow` L278 · `gate` L280 · `verify-red` L282 · `awareness` L295 · `test-dispatch` L355 · `qa-pipeline:e2e-dispatch` L531 · `tdd-pipeline:verification` L592 · `coverage` L594 | F13, F14 (T2) at ~L637/L645 | Medium — ~45 lines clear |
| `add.plan.md` | 5 — `qa-pipeline:step-list` L57 · `tdd-pipeline:step-list` L59 · `plugin:gitnexus:graph-plan` L198 · `tdd-pipeline:step9` L494 · `qa-pipeline:qa-spec` L500 | **F16 (T2) at L206 — 7 lines below the gitnexus marker** · **F20 (T3) edits L503 and the L56–61 block** | **High — the two tightest points in the set** |
| `add.review.md` | 3 — `tdd-pipeline:step-list` L31 · `tdd-pipeline:spec-audit` L362 · `plugin:playwright:drive` L815 | F7 (T1) ~L264 · F18 (T2) ~L925 | Low |
| `add.new.md` | 1 — `plugin:gitnexus:graph-map` L91 | F12 (T2) ~L205–240 | Low |
| `add.done.md` | 1 — `plugin:gitnexus:graph-reindex` L379 | F6 (T1), F15 (T2) ~L120–160 | Low |
| `add.plan-to-ready.md` | **0** | F3, F4, F5, F21, F23–F31 — the largest edits in the set | **None** |
| Skills (`add-doc-schemas`, `add-commit`, `add-ecosystem`) | 0 — plugins activate skills wholesale, they never inject into them | F8, F10, F11, F17, F33, F35, F36 | None |

The two riskiest edits in the set are both in `add.plan.md`, and both are covered by a read-the-anchor-first procedure in their own topic file: T2 §Injection Surface for F16, T3 §Injection Surface for F20.

### Fragments quote step numbers, and nothing checks them

Six feature fragments and eight plugin command fragments exist. Several quote step numbers as plain text — `qa-pipeline/add.build.md` cites STEP 12, `tdd-pipeline/add.build.md` cites STEP 15, `tdd-pipeline/add.plan.md` defines STEP 9, `qa-pipeline/add.plan.md` defines STEP 10.0, `tdd-pipeline/add.review.md` defines STEP 3.5, `tdd-pipeline/add.hotfix.md` cites STEP 7, 8, 11 and 15.

**The build validates anchors, not these references.** A renumbered step leaves the fragment injecting cleanly and pointing at the wrong step, and no gate catches it.

Set-wide rule: **no F-block adds, removes or renumbers a STEP in a marker-bearing command.** T1 and T2 hold this absolutely. T3 breaks it once — plan 0069 renumbers `/add.plan` STEP 13 → 14 — so T3 carries a manual re-verification of both `add.plan` fragments, recorded in the evidence file.

### The new agent carries no plugin marker, on purpose

Plugin agent injection is opt-in by putting a marker in the agent's source; leaving it out is how the framework excludes an agent. `gitnexus` injects a `graph` section into nine code-reading agents; `playwright` injects `drive` into `qa-agent`. The new `consistency-agent` (F32) compares contracts declared across plan documents — document against document — so it gets no marker. Code-level checking is `@reviewer-agent`'s job, and that agent already has the graph. **The evidence file must record this as a decision**, because a missing marker looks identical to a forgotten one.

### No new feature flag

The epic loop is already opt-in by invocation. A flag would need a fragment file, the first-ever marker in `add.plan-to-ready.md`, a `cli/src/features.js` registry entry and a new injection point — cost with no gain.

## Ecosystem Impact

Complete map. Every file any F-block touches is here.

| Component | Necessary action | F |
|---|---|---|
| `framwork/.codeadd/scripts/converge-gates.sh` | New: four gates, `KEY=STATUS` output, exit 0 | F1, F19 |
| `framwork/.codeadd/scripts/tests/converge-gates.bats` | New: RED-first suite | F2, F19 |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | STEP 6 rebuilt on the script; STEP 4/5 output checks; STEP 9 prints script output; plan-leg reviewer dispatch; epic args; outer loop; budget/halt; gated commit; Decision Log compaction; resume; per-leg logging; cross-SF dispatch | F3, F4, F5, F21, F23–F31 |
| `framwork/.codeadd/commands/add.done.md` | STEP 4 calls the script; STEP 4.1 counts by schema | F6, F15 |
| `framwork/.codeadd/commands/add.review.md` | Baseline taken verbatim from the script; writes `scope:` | F7, F18 |
| `framwork/.codeadd/commands/add.new.md` | STEP 5 writes `epic.md` per schema | F12 |
| `framwork/.codeadd/commands/add.build.md` | STEP 16.2 fake tag fixed; STEP 14.3 updates by schema | F13, F14 |
| `framwork/.codeadd/commands/add.plan.md` | STEP 8.0 reads the dependency graph by schema | F16 |
| `framwork/.codeadd/skills/add-doc-schemas/SKILL.md` | Schema Index gains `epic` | F11 |
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | New `epic` schema | F10 |
| `framwork/.codeadd/skills/add-doc-schemas/references/review.md` | Baseline format; `scope:` field | F8, F17 |
| `framwork/.codeadd/skills/add-commit/SKILL.md` | Commit trailer format for the gate results | F35 |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Registers script, agent, skill, and the command's new scope | F9, F22, F36 |
| `framwork/.codeadd/skills/add-cross-sf-consistency/SKILL.md` | New: five-dimension rubric | F33 |
| `framwork/.codeadd/agents/consistency-agent.md` | New: read-only cross-subfeature judge | F32 |
| `framwork/provider-map.json` | Registers the new agent and skill | F34 |
| Plan 0069's own file set | Executed as written | F20 |

---

## Red-Green Validation Matrix (cross-topic)

Per-topic levels live in each topic file. These are the ones no single topic owns.

**Discipline: RED first.** Every level is written and shown failing against the current tree before any F-block lands.

### L0 — Injection-point integrity (runs at every checkpoint)

1. **Baseline recorded first.** Before F1, run the build and record the injection-point total from `framwork/.codeadd/injection-points.json`. *RED today: no baseline is on record, so no later check can be made.*
2. **Total unchanged after every topic.** After T1, T2, T3 and T4, the build succeeds and the sidecar total equals the recorded baseline. A changed total means an anchor moved and has to be explained, not accepted.
3. **Build fails loudly on a broken anchor.** Deliberately edit the text next to one anchor in `add.build.md`, confirm the build fails, revert. *This proves the guard works before we trust it across roughly 30 text edits.*

### L1 — The false claim is now true (the whole point of the set)

1. Rebuild the `0028F` failure: a `review-NNN.md` whose baseline line is in path form, and a run directory with no `qa-validation-NNN.md`. `/add.plan-to-ready` STEP 6 must report non-convergence. *RED today: it reports CONVERGED.*
2. Any tree `/add.plan-to-ready` calls CONVERGED, `/add.done` accepts through its own STEP 4. Any tree `/add.done` rejects at STEP 4, `/add.plan-to-ready` refuses to call CONVERGED. Checked on at least: a clean pass, the path-form baseline, the missing report, an uncovered requirement, and a pending subfeature.

### L2 — Cross-topic end state

1. **Gate count and names.** `converge-gates.sh` prints exactly four gate keys from T1 onward, and no gate ever returns `not-probed` on any tree in this set.
2. **`not-probed` never passes.** Forced through a fixture, a tree with one gate `not-probed` and the other three `ok` never yields `CONVERGED`, at any point in the set.
2b. **No regression at any checkpoint.** A clean simple feature, a clean subfeature-scoped run and a clean completed epic reach CONVERGED at C1, C2, C3 and C4 alike.
3. **Commit receipt round-trip.** After T4, every converged subfeature has exactly one checkpoint commit whose trailer names all four gates; a non-converged subfeature has none.
4. **Resume equivalence.** Kill the loop mid-subfeature, resume: the resulting tree and commit graph match an uninterrupted run of the same epic, except for the restarted subfeature's intermediate files.
5. **Cold-engine resume.** A coordinator with no conversation history works out where it is from `epic.md` + checkpoint commits + `iterations.jsonl` alone, with no file this set did not already ship.

**RED expectations against the current tree:** L0.1 has no baseline; L0.3 is unproven; L1.1 currently reports CONVERGED on the failure shape; L1.2 diverges on at least the two `0028F` cases; every L2 level is impossible to run. **GREEN = all levels pass after F1–F36.**

---

## Execution Order

`T1 → T2 → T3 → T4`, with L0.1 recorded before T1 and the whole matrix written before any F-block.

- **T1 first** because it is the fix for the failure that started the set, it pays off on single-subfeature runs on its own, and every later topic's proof depends on convergence meaning something.
- **T2 before T4** because the outer loop gets its work list, its order and its halt decisions from `epic.md`, and because gate 3's string read is only as reliable as the text it matches until the schema exists.
- **T3 before T4** because T4's plan leg dispatches the reviewer T3 creates.
- **T4 last** because its checkpoint commit makes every earlier guarantee durable, and a checkpoint minted before T1 would make a fake convergence permanent.

### Commit checkpoints

The set is implemented in one pass, separated only by commits. Each boundary below leaves the framework working — the build passes, the bats suites pass, and no command points at something that does not exist.

| Checkpoint | Ends after | Working state |
|---|---|---|
| **C0** | L0.1 baseline + the full matrix written and shown RED | No behaviour change. **Commits the five force-added plan files and the four evidence files** carrying the RED runs and the recorded injection-point baseline. Nothing under `framwork/` changes |
| **C1** | T1 (F1–F9) | All four gates script-proven. Gate 3 still reads `epic.md` as text, so it inherits today's blind spots — but nothing that converged before stops converging |
| **C2** | T2 (F10–F19) | `epic.md` has a contract, gate 3 reads it as a schema, reviews carry `scope:`. **The fake checkpoint tag is gone — dropped, not fixed.** No tag exists between C2 and C4; T4's F27 creates the first truthful one |
| **C3** | T3 (F20–F22) | The plan reviewer ships and the loop dispatches it |
| **C4** | T4 (F23–F36) | Epic-wide autonomous delivery with gated checkpoints that carry their gate results |

A build that has to stop should stop at a checkpoint. Stopping between them leaves commands pointing at half-built contracts.

## Evidence Artefacts

Each topic build leaves its own evidence file, following the repo's existing convention (`0056-PLAN--…--evidence-v01.md`):

```
docs/plans/0074-PLAN--autonomous-epic-convergence-001-convergence-gate--evidence-v01.md
docs/plans/0074-PLAN--autonomous-epic-convergence-002-epic-foundations--evidence-v01.md
docs/plans/0074-PLAN--autonomous-epic-convergence-003-plan-reviewer-adoption--evidence-v01.md
docs/plans/0074-PLAN--autonomous-epic-convergence-004-epic-loop--evidence-v01.md
```

**These five plan files and their four evidence files are force-added** (`git add -f`), the same deliberate exception `CLAUDE.md` records for the QA/UX umbrella (plans 0056–0060), for the same stated reason: this set is the spec of record for a shipped behaviour change across a script, a schema, five commands and two new agents, and a plan whose evidence is untracked reads as unimplemented from a fresh clone. The `docs/*` gitignore stays exactly as it is — do not un-ignore it.

Recording that exception in `CLAUDE.md` is internal-layer work and belongs to the companion `/add-framework--self-plan` in Next Steps.

## Reviewer Handoff

`/add-framework--shared-review` has to audit this set without re-reading the conversation. For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id and the checkpoint commit it landed in.
- **Which validation levels cover it**, and their pass state.
- **The injection-point total** recorded at L0.1 and re-read at each checkpoint.
- **Any decision deferred or changed**, with the Validated Decisions row it departs from and why.

Gaps a reviewer has to actively hunt, because they are the ones this set is most likely to leak:

1. **An F-block marked done whose validation level was never RED.** A test written after the fix proves nothing, and this set exists because of a gate that never ran.
2. **A gate reporting `ok` without having run.** Check that each of the four keys traces to a real command in the script, not to a default value.
3. **A leg output check that reads a variable instead of the disk.** F4 has to stat files, not consult what the leg reported.
4. **An anchor that moved without anyone noticing.** If the injection total changed and the evidence file explains it away, treat it as unexplained until a marker-by-marker diff says otherwise.
5. **The verdict printing script output it never ran.** F5's output has to be the script's real stdout, not a reconstruction.
6. **`/add.done` restating gates instead of calling the script.** F6 drifting back to text brings the whole bug back.

## References

- Post-mortem of the `0028F` epic run (this consultation) — the two failures and their root cause.
- `framwork/.codeadd/scripts/qa-evidence.sh:153-241` — `parse_baseline` (the `^(feature|SF[0-9][0-9]):(run-[0-9][0-9][0-9])$` format), `validate_baseline` (read-only), `validate_report` (frontmatter, 11 sections, 4 severity counts).
- `framwork/.codeadd/scripts/qa-preflight.sh:1-14` — the `KEY=STATUS`, always-exit-0, `ok | missing | broken | not-probed` contract this set copies.
- Plan 0070 L117 and `docs/brainstorming/2026-08-24-development-loop-consolidation-005-plan-to-ready-orchestrator.md` L109, L126 — the explicit deferral of epic-wide orchestration that T4 reverses.
- Plan 0069 (`draft`) — the product-layer plan reviewer T3 adopts.
- `framwork/.codeadd/commands/add.build.md:54` vs `:637-641` — the `GIT CLEAN` rule against the checkpoint tag it contradicts.

---

## Next Steps

**`/add-framework--build` reads exactly one plan file** (`docs/plans/[NNNN]-PLAN--[slug].md`, its STEP 1). It has no umbrella concept and cannot fan out. This umbrella is a **reading order and a contract**, never a build target — invoking it would build nothing.

Run the topics in order, one invocation each, committing at the checkpoint between them:

```
/add-framework--build 0074-PLAN--autonomous-epic-convergence-001-convergence-gate       → C1
/add-framework--build 0074-PLAN--autonomous-epic-convergence-002-epic-foundations       → C2
/add-framework--build 0074-PLAN--autonomous-epic-convergence-003-plan-reviewer-adoption → C3
/add-framework--build 0074-PLAN--autonomous-epic-convergence-004-epic-loop              → C4
```

**Plan 0069 is executed inside the 003 build, not as its own invocation.** T3's F20 owns it, together with the anchor amendment 0069 does not carry. Building 0069 standalone would follow its unamended L503 instruction and break an injection anchor.

C0 comes before all four — see Commit checkpoints.

Then, for the internal layer (`/add-framework--build` reaches neither `CLAUDE.md` nor `.claude/`):

- `/add-framework--self-plan bump the Project Anatomy counts for the new agent and skills, and record the convergence-gate script in the pipeline section`

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-27 | Initial creation |
| 2026-08-27 | Review v02: C2's row reworded — T2 drops the tag rather than correcting it, so "no longer lies" read as if a correct tag existed from C2 (A1). T4's F27 staging corrected to name `epic.md` and `review-NNN.md` at the feature root; both reviewers found it independently (B1). T2's gate-3 outcome vocabulary aligned to `ok`/`broken` (A2) |
| 2026-08-27 | Review v01: Next Steps rewritten as four ordered `/add-framework--build` invocations — the command reads one plan file and cannot fan out from an umbrella (B1). Evidence Artefacts section added, naming the four files and the force-add decision (A1). C0's contents stated (A2). F31's plan-time findings routed to `plan.md` in T4, not to a review document that does not exist yet (A3). Marker figures corrected from marker-lines to injection points (N1). `add.plan` STEP 7 corrected to STEP 8.0 throughout. T1's gate 3 no longer deferred to `not-probed`; T2's F13 pinned to dropping the tag, re-created by T4's F27 |
| 2026-08-29 | Implemented across commits 4cb00ec (C0) .. 4b8cd62. All 36 F-blocks landed. An adversarial round then found five defects in the script layer and four in the command layer; all nine fixed, each reproduced before the fix. Status -> implemented |
