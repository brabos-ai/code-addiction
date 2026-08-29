# Evidence: T1 — Deterministic convergence gate

> **Plan:** `docs/plans/0074-PLAN--autonomous-epic-convergence-001-convergence-gate.md`
> **Umbrella:** `docs/plans/0074-PLAN--autonomous-epic-convergence-000-umbrella.md`
> **Status:** in progress
> **Started:** 2026-08-27

---

## L0.1 — Injection-point baseline (recorded before any edit)

Captured with `node scripts/build.js` on a clean tree at branch point `feat/0074-autonomous-epic-convergence`.

**Total injection points: 39**

| Resource | Points | Namespaces |
|---|---|---|
| `architecture-agent` (agent) | 1 | plugin:gitnexus:graph |
| `backend-agent` (agent) | 1 | plugin:gitnexus:graph |
| `database-agent` (agent) | 1 | plugin:gitnexus:graph |
| `discovery-agent` (agent) | 1 | plugin:gitnexus:graph |
| `frontend-agent` (agent) | 1 | plugin:gitnexus:graph |
| `qa-agent` (agent) | 1 | plugin:playwright:drive |
| `reviewer-agent` (agent) | 1 | plugin:gitnexus:graph |
| `system-design-agent` (agent) | 1 | plugin:gitnexus:graph |
| `ux-agent` (agent) | 1 | plugin:gitnexus:graph |
| `ux-flow-agent` (agent) | 1 | plugin:gitnexus:graph |
| `add.build` (command) | 10 | feature:qa-pipeline:e2e-dispatch · feature:qa-pipeline:qa-fix · feature:tdd-pipeline:awareness · feature:tdd-pipeline:coverage · feature:tdd-pipeline:detect-framework · feature:tdd-pipeline:gate · feature:tdd-pipeline:tasks-flow · feature:tdd-pipeline:test-dispatch · feature:tdd-pipeline:verification · feature:tdd-pipeline:verify-red |
| `add.diagnose` (command) | 1 | plugin:gitnexus:graph-trace |
| `add.done` (command) | 1 | plugin:gitnexus:graph-reindex |
| `add.hotfix` (command) | 2 | feature:tdd-pipeline:red-gate · plugin:gitnexus:graph-impact |
| `add.new` (command) | 1 | plugin:gitnexus:graph-map |
| `add.plan` (command) | 5 | feature:qa-pipeline:qa-spec · feature:qa-pipeline:step-list · feature:tdd-pipeline:step-list · feature:tdd-pipeline:step9 · plugin:gitnexus:graph-plan |
| `add.review` (command) | 3 | feature:tdd-pipeline:spec-audit · feature:tdd-pipeline:step-list · plugin:playwright:drive |
| `add.wiki` (command) | 6 | plugin:gitnexus:graph-classify · plugin:gitnexus:graph-contract · plugin:gitnexus:graph-database · plugin:gitnexus:graph-dispatch-common · plugin:gitnexus:graph-quality · plugin:gitnexus:graph-specialist |

Baseline copy: `C:/tmp/0074-injection-baseline.json`
Checker: `C:/tmp/check-anchors.py` — compares namespace/name/section/resource AND anchor text, so a moved anchor is caught even when the total stays 39.

---

## F-block log

### F3, F4, F5 — `framwork/.codeadd/commands/add.plan-to-ready.md`

Landed. 66 insertions, 20 deletions, single file. **Zero injection markers in this file**, so no anchor risk. No STEP added, removed or renumbered — still STEP 1-9.

**F3 (STEP 6).** The four-row gate table gained a `Key` column and is now explicitly *"documentation of the script's contract, not the evaluation itself"*. The step runs `bash .codeadd/scripts/converge-gates.sh docs/features/${FEATURE_ID} [SFxx]` and parses `KEY=VALUE`. New rule: `CONVERGED requires all four gates ok` with `missing`/`broken`/`not-probed` each non-convergence, and `GATES_OK=N/4` as the summary. The subfeature-scoped rule is now passed to the script as its second argument.

**The boundary fix, verbatim:**

```diff
-  DO: Read only — /add.done STEP 4.0 through 4.2 and nothing beyond
+  DO: Any read-only probe — the boundary is side effects, not a step number
```

The `qa-evidence.sh promote` ban is intact in two places (prohibition block L54, Rules NEVER L351); only its redundant restatement at the end of STEP 6 was dropped. **Verified by grep, not by the agent's report.**

**F4 (STEP 3, 4, 5).** Each leg gained an `Output check (MANDATORY, before advancing)` paragraph that stats files. STEP 3: `plan.md` + `design.md` when UI. STEP 4: the previous round's `review-NNN.md` carries a `## Resolution Annex` row per routed ID. STEP 5: `review-NNN.md` + its `## Fix Routing` table + `qa-validation-NNN.md` per in-scope SCOPE_DIR, with the requirement derived from `SETUP_QA:` and `QA_FEATURE_STATE` — never a hardcoded default. Missing -> BLOCKED naming the exact path.

**F5 (STEP 9).** `DO NOT print the state word alone. The state line MUST be immediately followed by converge-gates.sh's own output from STEP 6, one line per gate.` The CONVERGED row's Meaning column now reads `All four converge-gates.sh gates read ok (GATES_OK=4/4)`.

**Rules block** gained two ALWAYS and two NEVER entries consistent with the above.

### F1, F2 — `converge-gates.sh` + its bats suite (RED -> GREEN, in that order)

**F2 landed first, on purpose.** `framwork/.codeadd/scripts/tests/converge-gates.bats`, 34 tests, written while `converge-gates.sh` did not exist.

**RED proof, observed:** `npx bats framwork/.codeadd/scripts/tests/converge-gates.bats` -> `1..34`, all 34 `not ok`, every failure tracing to exit **127 "Command not found"** on `bash .../converge-gates.sh`. `ls` confirmed the script absent at that moment. The suite bit before any implementation existed.

**F1 then landed** and the same command returned **34/34 `ok` on the first run**. No test was edited to make it pass.

Two tests prove the 0028F incident specifically, and each first proves `qa-evidence.sh` fails loud on that shape before asserting the wrapper translates it:
- test 6 — path-form baseline `_tests/run-001` -> `GATE_QA_BASELINE=broken` with `..._DETAIL=` carrying `Malformed baseline entry` (failure #2)
- test 7 — canonical baseline but `qa-validation-001.md` absent -> `broken` (failure #1)

Other levels observed: test 26 (no gate returns `not-probed` even on an empty dir), test 27 (exit 0 on total failure), test 33 (byte-identical tree before/after — the read-only claim, proved not asserted), test 34 (never leaks `promote` output, never creates `_tests/final`), tests 21-24 (damaging one gate's input flips exactly that gate).

**Gate 3 is scripted here, not deferred.** Three outcomes: `ok` all-done, `broken` with `EPIC_PENDING=` naming the rows, `ok` when no `epic.md` exists. The subfeature-scoped form is selected by the `SFxx` argument, never guessed. T2's F19 swaps the string read for a schema read; the outcomes do not change.

### F6, F7, F8, F9

- **F6** `add.done.md` STEP 4 — runs `converge-gates.sh` as its own preflight; 4.0/4.1/4.2 branch on `GATE_REVIEW`/`GATE_EPIC`/`GATE_COVERAGE` instead of re-reading files. Every BLOCKED message preserved verbatim, fill-ins now sourced from `GATE_EPIC_DETAIL`/`EPIC_PENDING`/`COVERAGE_UNCOVERED`. Explicit ban added: *"DO NOT re-derive a verdict by reading review-NNN.md, epic.md, or plan.md and counting/parsing them yourself."* **STEP 5 untouched** — promotion keeps its own direct `qa-evidence.sh validate` call.
- **F7** `add.review.md` item 4b — `QA_BASELINE` IS the script's stdout verbatim; authoring, reformatting or converting to a path is banned, with the 0028F substitution named as the reason.
- **F8** `references/review.md` — the `review` schema now states the baseline **format** (`none`, or `<scope>:<run>` entries, `qa-evidence.sh` the sole authority) and gained a Hard ban on a filesystem path in its place.
- **F9** `add-ecosystem/SKILL.md` — new script-keyed row for `converge-gates.sh` naming both consumers.

## Validation levels

| Level | Result | Evidence |
|---|---|---|
| **L0.1** injection baseline | recorded | 39 points, before any edit |
| **L0.2** total unchanged after T1 | **PASS** | `node scripts/build.js` -> `Injection points : 39`; checker reports all 39 intact **by anchor text**, not only by count |
| **L1** script unit | **PASS** | 34/34, incl. isolation (21-24), no-`not-probed` (26), exit-0 (27), no-writes (33) |
| **L2** gate 2 vs real `qa-evidence.sh` | **PASS** | tests 5-10, incl. both 0028F shapes and the exit-code translation |
| **L3.3** no regression | **PASS** | test 20 — a clean tree still reaches `GATES_OK=4/4` |
| **L4.7** F8/F9 landed | **PASS** | grep: schema carries the format + Hard ban; ecosystem carries the row |
| L0.3 deliberate anchor break | **NOT RUN** | see Gaps |
| L3.1/L3.2/L4.1-L4.6 command-level | **NOT RUN** | see Gaps |

## Gaps — what is NOT proven

Stated plainly rather than implied by silence:

- **L0.3** (deliberately break an anchor, confirm the build fails loudly, revert) was not run. The guard's positive path is proven 39/39; its failure path is not.
- **L3.1, L3.2, L4.1-L4.6** exercise `/add.plan-to-ready` and `/add.done` as *commands*, which needs a real feature branch with QA evidence in a real project. They are verified by inspection of the edited instructions only. The script beneath them is fully tested; the wiring is not.
- No `cli/` code changed in T1, so the vitest suite is not implicated.
- **Existing bats suites: 245 tests, 1 failure, pre-existing.** `qa-preflight.bats` test 183 (*"phase a: runner absent in project"*) fails deterministically. Baselined properly rather than assumed: `qa-preflight.sh` and `qa-preflight.bats` are byte-identical to `main` on this branch, and the same test was re-run **on `main` itself** (stash -> checkout main -> run -> return) and failed there too. **Delta introduced by T1: zero.** The failure is environmental — the test asserts a probe exits non-zero when no runner is installed, and something on this machine makes it succeed.

_Appended as each F-block lands._

## Validation levels

_Appended as each level is run._


---

## Adversarial review round (post-C4)

Three independent reviewers were dispatched with instructions to REFUTE, not to confirm. They found real defects **in the layer this plan set claimed would be proven by a script** — the layer it admitted was only inspected came out clean. That inversion is the finding worth keeping.

### What they broke, and what it cost

| Defect | Consequence if shipped |
|---|---|
| **Gate 1 grepped the whole row for `PASSED`** | A `BLOCKED` verdict whose Details cell read *"5/6 gates PASSED"* scored `ok`. `NOT PASSED` also passed — it contains its own negation. **This made `/add.done` STEP 4.0 weaker than the prose F6 replaced**, which read the cell |
| **Gate 4 keyed on `## Cobertura de Requisitos`** | Nothing in the framework writes that heading. `/add.plan` STEP 11 writes an unnamed `Covered?` table with `YES`/`EXCLUDED`. So `GATES_OK` could never reach 4/4 and **the loop could not converge on any real feature, ever**. A conditional rule was converted into a permanent deadlock |
| **Gate 4 read the feature-level `plan.md` when scoped to `SFxx`** | `missing` on exactly the scope the epic loop runs |
| **Gate 3 scoped: no `## Acceptance Checklist` counted as zero unchecked** | A stub `tasks.md` earned a real checkpoint tag. Silence and completeness indistinguishable — the 0028F failure mode |
| **Gate 3 epic-wide broke three ways** | A second table poisoned the header; an unrelated earlier `Status` column hijacked the index; rows were found by assuming `SFxx` is first, so `Name \| SF \| Status` was invisible and a pending epic scored `ok` |

**Why 38/38 did not catch any of it:** the fixtures were built from the same assumptions as the implementation. `write_plan_coverage` invented both the heading and the `X` marker; `write_review` hardcoded a benign Details cell; every epic fixture put `SF` first. The suite validated the script against itself.

### Fixed — commit `3d832a7`, then `63c13cf`

14 tests written RED first, all failing against the implementation that passed 38/38. Suite **38 -> 52, all green**, independently re-run by the reviewer at HEAD.

**One existing test was CHANGED**, and the reason is written into the file above it: it asserted `GATE_COVERAGE=missing` for a plan with no coverage section, which is precisely the deadlock. The test was wrong, not the code.

`63c13cf` then closed three doc-vs-script divergences the fix itself created — the STEP 6 gate table still described the old gate 4, its snippet passed a literal `[SFxx]` that now exits 2, and a script comment claimed parity with `/add.done` 4.2 that no longer holds.

### Corrections to earlier claims in this file

- The note that several suites "did not finish inside the time budget" was **environmental**: `NODE_OPTIONS` in that shell carried `--inspect`, and bats spawns a node per assertion. With it cleared, `converge-gates.bats` runs 52 tests in seconds. `status.bats` + `done.bats` were re-run unpiped: **76/76**.
- The "delta introduced by T1: zero" claim stands as I verified it (stash -> checkout `main` -> re-run -> return), but one reviewer could **not** independently reproduce it before its budget ran out and downgraded its own tick to unverified. Recorded here so the record is not stronger than the evidence.

### A finding this round produced that no test can close

`status.sh` was **not** migrated to header-name resolution (`:277`, `:283-291` still string-match), while the `epic` schema names it as a consumer and three commands were migrated. Its suite is green because **the blind-spot case was never written there**. So on `| SF02 | Beta | pending | done |`, `converge-gates.sh` says pending and `status.sh` counts it done. A green suite is evidence the case is untested, not absent.
