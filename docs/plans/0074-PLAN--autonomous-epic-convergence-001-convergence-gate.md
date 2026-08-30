# Plan: T1 — Deterministic convergence gate

> **Status:** implemented
> **Type:** command + script + schema
> **Created:** 2026-08-27
> **Author:** Maicon + Claude (ADD Strategy)
> **Umbrella:** `0074-PLAN--autonomous-epic-convergence-000-umbrella.md`
> **Checkpoint:** ends at **C1**

---

## Context

The umbrella carries the `0028F` post-mortem, the rule behind the set, and the cross-topic decisions. This file does not repeat them. It implements the first one:

> **No gate is satisfied by the agent that executes it saying so. Either a script proves it, or the filesystem proves it.**

T1 is worth landing on its own. It fixes the bug on single-feature and single-subfeature runs, which is every run today.

## Problem (T1 scope only)

1. STEP 6's four gates are evaluated as text by the same coordinator whose judgement failed.
2. The side-effect boundary is drawn at a step number, so `qa-evidence.sh validate` — a pure read — is excluded because of where it lives.
3. The legs describe outputs and never check them, so a skipped judge panel looks the same as a finished one.
4. STEP 9 prints a verdict word, so a wrong verdict costs nothing to produce.
5. `/add.review` may write the QA baseline by hand; the `review` schema mandates the line but never says what the value has to look like.

## Scope

### Includes

- **F1** — `framwork/.codeadd/scripts/converge-gates.sh` (new): read-only probe for the four `/add.done` gates. Output is `KEY=STATUS` lines, statuses `ok | missing | broken | not-probed`, always exit 0 — the same contract as `qa-preflight.sh`. **Gate 2 wraps `qa-evidence.sh validate`, it does not pass it through.** That script runs under `set -euo pipefail` and its `fail()` prints `STATUS=ERROR` and exits 1 — on exactly the malformed-baseline and missing-report cases this topic exists to catch. `converge-gates.sh` captures its exit code and stdout, translates any non-zero exit or `STATUS=ERROR` into its own `broken` line carrying the sub-script's message, and never propagates the exit code.

  **Gate 3 is scripted here too, using today's rule**, not deferred. Today's rule is a string read of `epic.md` — no row still pending — which is no harder to script than gate 4's coverage count. T2's F19 replaces the string read with a schema read; it does not introduce the gate. Three outcomes: `ok` when every subfeature is done, `broken` when one is pending, and `ok` on a feature with no `epic.md` at all, matching STEP 6's existing pass condition that gate 3 is *"evaluated only when `epic.md` exists"*. A subfeature-scoped run uses the scoped rule STEP 6 already defines.

  It must NOT hardcode feature defaults: like `qa-preflight.sh`, it emits the raw manifest state and lets the calling command apply the registry in `cli/src/features.js`. That raw state is what F4 needs in order to know whether `qa-validation-NNN.md` is required for this project; no gate branches on it. It must never call `qa-evidence.sh promote`, and never write.
- **F2** — `framwork/.codeadd/scripts/tests/converge-gates.bats` (new): the RED-first suite. It is the twelfth in `scripts/tests/`, next to the eleven already there. Covers every gate's `ok`, `missing`, `broken` and `not-probed` path, the `none` baseline case, and the two `0028F` failure shapes.
- **F3** — `framwork/.codeadd/commands/add.plan-to-ready.md` STEP 6: the four-row gate table stops being the evaluation and becomes documentation of what the script probes. The prohibition block is rewritten so the boundary is **side-effect-free**, not "STEP 4.0 through 4.2". `promote` stays banned by name. `CONVERGED` requires all four gates `ok`. `not-probed` never counts as a pass — it stays in the vocabulary for a gate the script genuinely cannot evaluate, and blocks when it appears. No gate returns it in T1.
- **F4** — same file, **STEP 3, STEP 4 and STEP 5**: each leg ends by checking its declared outputs exist on disk. The plan leg is STEP 3, so `plan.md` and `design.md` are checked there; STEP 4 and STEP 5 check theirs. This adds content inside existing steps and renumbers nothing. The list is fixed: `review-NNN.md`, `qa-validation-NNN.md` per in-scope `SCOPE_DIR` when the `/add.qa-setup` receipt is present, the plan leg's `plan.md` and `design.md`, and the `## Fix Routing` table inside the review document. Missing → BLOCKED naming the path. The check reads the filesystem, never a variable the leg reported.
- **F5** — same file, STEP 9: the state line is followed by the script's own output, one line per gate. Printing a state without it is banned.
- **F6** — `framwork/.codeadd/commands/add.done.md` STEP 4: calls `converge-gates.sh` as its own preflight instead of restating the gates. Its existing STEP 4.0–4.2 behaviour and its BLOCKED messages stay; the source of truth for whether a gate passed moves into the script. STEP 5 is untouched — promotion stays where it is.
- **F7** — `framwork/.codeadd/commands/add.review.md` STEP 2.2 item 4b: the `QA_BASELINE` value is the script's stdout verbatim. Authoring it, reformatting it, or converting it to a path is banned in the same breath as the existing "never copy it from a previous review document".
- **F8** — `framwork/.codeadd/skills/add-doc-schemas/references/review.md`: the `review` schema states the **format** of the baseline value, not only that the line is mandatory. It names the `feature|SFxx` + `run-NNN` shape and `none`, and points at `qa-evidence.sh` as the authority.
- **F9** — `framwork/.codeadd/skills/add-ecosystem/SKILL.md`: register `converge-gates.sh` in the Dependency Index as a **new script-keyed row**, with `/add.plan-to-ready` and `/add.done` as consumers. Every existing row is keyed by a skill or agent name and scripts appear only inline inside a skill's row, so this extends the table's convention deliberately rather than by accident.

### Does NOT Include

- The **schema-based** gate 3. T1 scripts gate 3 against `epic.md` as a string, exactly as the command reads it today; T2's F19 swaps that for a schema read. T1 introduces no regression and no gap in gate coverage.
- Any change to `qa-evidence.sh`. T1 calls it; it does not touch it.
- `/add.done` STEP 5. Promotion has side effects and stays out of every read-only path.
- Renumbering any STEP. See Injection Surface below — this is a hard constraint, not a preference.

## Injection Surface (read before editing)

Four of the five files F1–F9 touch carry injection markers. The build strips the markers and remembers each one by the text next to it. Editing that text breaks the anchor.

| File | Markers | Nearest to a T1 edit | Risk |
|---|---|---|---|
| `add.plan-to-ready.md` | **none** | — | **None.** F3, F4 and F5 are the biggest edits in T1 and carry zero anchor risk |
| `add.review.md` | 3 points: `tdd-pipeline:step-list` (L31), `tdd-pipeline:spec-audit` (L362), `plugin:playwright:drive` (L815) | F7 edits STEP 2.2 around L264 — about 100 lines from either side | Low |
| `add.done.md` | 1 point: `plugin:gitnexus:graph-reindex` (L379) | F6 edits STEP 4 around L120–160 | Low |
| `add-doc-schemas/references/review.md` | none | — | None |

**Hard constraints for this topic:**

1. **No F-block adds, removes or renumbers a STEP in `add.review.md` or `add.done.md`.** Their fragments quote step numbers as plain text (`qa-pipeline/add.build.md` cites STEP 12, `tdd-pipeline/add.build.md` cites STEP 15, `tdd-pipeline/add.review.md` defines STEP 3.5). Nothing in the build checks those references, so a renumber breaks injected text silently. F6 and F7 edit **inside** existing steps only.
2. **Do not touch the lines immediately above or below any marker pair.** If a needed edit lands there, move the edit, not the anchor.
3. **Run the build after every file in this topic**, not once at the end. The anchor guard fails loudly, and that is only useful if it runs while the change is still small.

## Validated Decisions (T1)

| Question | Decision | Rationale |
|---|---|---|
| New script vs `done.sh --check` | New `converge-gates.sh` | `done.sh`'s normal path runs git commands; a read-only mode on it is one flag away from a mistake. A separate read-only script is safe from both commands |
| Which gates | All four | Three are simple greps. Leaving one as text keeps the bug |
| Gate 3 in T1 | Scripted with today's string rule; T2 upgrades it to a schema read | Deferring it to `not-probed` would have blocked every epic and subfeature run at C1 — a regression introduced to fix a bug. The string read is no harder than gate 4's |
| `not-probed` | Kept in the vocabulary, never counts as a pass, returned by no gate in T1 | It is the honest answer for a gate the script cannot evaluate |
| `qa-evidence.sh` non-zero exit | Captured and translated to `broken` | It runs `set -euo pipefail` and exits 1 via `fail()`; passing that through would break the exit-0 contract and emit a status outside the four legal values |
| Feature defaults in the script | Raw manifest state only | `qa-preflight.sh` already set this rule so the defaults registry stays in `cli/src/features.js` and is not duplicated in shell |
| `none` baseline | `ok` | `qa-evidence.sh validate` already returns `STATUS=OK` for `none`. A project without QA has nothing to prove, and must not be failed for it |
| Where the gate table lives | Stays in the command as documentation | Readers need to know what is checked; the script decides whether it passed |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| An edit near a marker breaks its anchor | Low for T1 (biggest edits are in the marker-free file) | Injection Surface constraints above + L1.4 |
| `/add.done` keeps its own gate text and the two drift again | Medium | F6 replaces the evaluation, not just adds a call. L3.2 checks both commands reject the same tree |
| The script passes a gate it never ran | Medium | L1.3: every gate key traces to a real command, proved by damaging each input in turn and seeing exactly that gate change |
| Gate 3 deferral blocks every epic and subfeature run at C1 | **Resolved in design** | Gate 3 is scripted in T1 with today's rule; L3.3 is the no-regression check |
| Gate 2 fails on projects with `qa-pipeline` off | Medium | F1's raw-state rule + L2.4 |
| The coordinator prints a plausible fake script output at STEP 9 | Low | F5 requires real stdout; L4.2 diffs the printed block against a fresh run of the script |

## Ecosystem Impact

| Component | Necessary action | F |
|---|---|---|
| `framwork/.codeadd/scripts/converge-gates.sh` | New | F1 |
| `framwork/.codeadd/scripts/tests/converge-gates.bats` | New | F2 |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | STEP 6 rebuilt; STEP 4/5 output checks; STEP 9 prints script output | F3, F4, F5 |
| `framwork/.codeadd/commands/add.done.md` | STEP 4 calls the script | F6 |
| `framwork/.codeadd/commands/add.review.md` | Baseline verbatim from the script | F7 |
| `framwork/.codeadd/skills/add-doc-schemas/references/review.md` | Baseline format stated | F8 |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Registry | F9 |

---

## Red-Green Validation Matrix (T1)

**RED first.** Every level below is written and shown failing before F1 lands.

### L1 — Script unit (`converge-gates.bats`) — RED → GREEN

1. Each gate returns `ok` on a well-formed tree. *RED: the script does not exist.*
2. Each gate returns `missing` / `broken` on its own damaged tree — no review file, `Overall` not PASSED, baseline line absent, coverage row with an uncovered requirement.
3. **Every gate key traces to a command.** No key may be produced by a default or a constant. Asserted by damaging each input in turn and seeing exactly that gate change.
4. **Gate 3, string-rule form.** Epic with a pending row → `broken`. Epic with every row done → `ok`. Feature with no `epic.md` → `ok`, not `broken` and not `not-probed`. Subfeature-scoped run → the scoped rule. *T2's F19 swaps the string read for a schema read and re-runs this level unchanged.*
5. **No gate returns `not-probed` in T1.** The value stays legal in the vocabulary and the suite proves nothing emits it.
6. The script exits 0 in every case above, including total failure. Exit 2 only on argument misuse.
7. The script performs no writes: run it against a tree under a filesystem snapshot and assert byte equality afterwards. *This is what makes it legal inside a read-only step.*

### L2 — Gate 2 against real `qa-evidence.sh` behaviour

1. Baseline in the canonical `feature:run-001` form with a valid report → `ok`.
2. **Baseline in path form (`_tests/run-001`) → `broken`.** *RED today: nothing rejects this; it is failure #2 of `0028F`.*
3. **Baseline correct but `qa-validation-NNN.md` absent → `broken`.** *RED today: failure #1 of `0028F`.*
4. Baseline `none` on a project with `qa-pipeline` disabled → `ok`, not `broken`. A project without QA is not a failing project.
5. Report present but schema-invalid (missing one of the eleven sections, or a bad severity count) → `broken`, with the script naming which.
6. **Exit-code translation.** For each failing case above, `qa-evidence.sh validate` exits non-zero and prints `STATUS=ERROR`; `converge-gates.sh` still exits 0, emits `broken` for gate 2, and carries the sub-script's message. *This is the level that keeps the exit-0 contract true while wrapping a `set -e` script.*

### L3 — Command integration

1. `/add.plan-to-ready` STEP 6 reports non-convergence on each L2 failure tree. *RED today: it reports CONVERGED on L2.2 and L2.3.*
2. **Agreement.** For each of the five trees in L2, `/add.plan-to-ready` and `/add.done` reach the same verdict. This is the umbrella's L1.2 restricted to T1's gates.
3. **No regression at C1.** A clean simple feature, a clean subfeature-scoped run and a clean completed epic all still reach CONVERGED after T1. *This is the level that would have caught deferring gate 3 to `not-probed`, which would have blocked all three.*
4. `CONVERGED` is impossible while any gate says `not-probed`. Nothing emits it in T1, so this level is proved with a fixture that forces the value rather than with a real tree.
5. **Anchor integrity.** After every file in this topic, the build succeeds and the injection-point total matches the umbrella's L0.1 baseline.

### L4 — Behavioural acceptance

1. Rebuild the exact `0028F` shape end to end and confirm `/add.plan-to-ready` refuses to report CONVERGED, naming gate 2. *This is the acceptance test for the whole topic.*
2. **The verdict cites real output.** Capture STEP 9's printed block and a fresh direct run of the script against the same tree; they match line for line.
3. **Leg output checks bite.** Delete `qa-validation-001.md` after the review leg and before STEP 6; STEP 5 reports BLOCKED naming the path, and the run never reaches the convergence check.
4. `/add.review` refuses to write a hand-authored baseline: force the script to return `feature:run-002`, confirm the review document carries exactly that.
5. **Plan-leg output check bites.** Delete `plan.md` after the plan leg and before STEP 4; **STEP 3 reports BLOCKED naming the path**. *Without this, F4's plan-leg half has no proof.*
6. **Review-leg output check bites.** Strip the `## Fix Routing` table from `review-NNN.md` after the review leg; **STEP 5 reports BLOCKED naming the review document path**, and the run never reaches the convergence check.
7. **F8 and F9 land, checked by grep.** `add-ecosystem/SKILL.md`'s Dependency Index contains a `converge-gates.sh` row naming `/add.plan-to-ready` and `/add.done` as consumers; the `review` schema in `references/review.md` names the `feature|SFxx` + `run-NNN` shape and `none`, and points at `qa-evidence.sh` as the authority. *These are the only checks covering F8 and F9.*

**RED expectations against the current tree:** L1 entirely (no script); L2.2, L2.3 and L2.6 pass silently today; L3.1 reports CONVERGED; L4.1 is the reproduction of the bug; L4.3, L4.5 and L4.6 have no check to fire; L4.7 finds neither artefact. L3.3 passes today and must keep passing — it is a regression guard, not a RED level. **GREEN = all levels pass after F1–F9.**

---

## Reviewer Handoff

Beyond the umbrella's list, for T1 specifically:

1. **Is gate 2 really calling `qa-evidence.sh validate`,** or re-implementing its checks in the new script? Re-implementation is the failure mode here — it recreates the drift the topic exists to kill.
2. **Does the script write anything?** L1.6 must have been run, not assumed.
3. **Did `/add.done` keep a second copy of the gate logic** alongside the call? F6 replaces, it does not add.
4. **Was any STEP renumbered** in `add.review.md` or `add.done.md`? If so, every fragment step reference has to be re-checked by hand, because nothing checks them automatically.
5. **Does a clean simple feature still converge after T1?** L3.3 is the no-regression check, and the easiest way to break this topic is to make gate 3 stricter than the rule it replaces.
6. **Is gate 2 translating `qa-evidence.sh`'s exit code, or inheriting it?** L2.6 must have been run — a wrapper around a `set -e` script that forgets this breaks the exit-0 contract on exactly the cases the topic exists for.

## Next Steps

This topic is built as part of the 0074 set; the invocation order is in the umbrella's Next Steps. T1 is the first build and ends at checkpoint **C1**.

## References

- `framwork/.codeadd/scripts/qa-evidence.sh:153-241` — the baseline format, `validate_baseline` (read-only), `validate_report`.
- `framwork/.codeadd/scripts/qa-preflight.sh:1-14` — the `KEY=STATUS` / exit-0 / raw-manifest-state contract copied here.
- `framwork/.codeadd/commands/add.plan-to-ready.md` STEP 6 — the boundary being rewritten.
- `framwork/.codeadd/commands/add.done.md:120-129` — the QA baseline read F6 keeps.
- Umbrella §Risks — the injection-anchor risk this topic mostly avoids.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-27 | Initial creation |
| 2026-08-27 | Review v02: L4.5 split so the review-document half names its catching step and expected message (A2). L4.7 added — F8 and F9 had no covering level, so the GREEN claim overstated what was verified (A1) |
| 2026-08-27 | Review v01: gate 3 is scripted in T1 with today's string rule instead of deferring to `not-probed`, which would have blocked every epic and subfeature run at C1 (B1). Gate 2 now wraps `qa-evidence.sh` and translates its non-zero exit rather than passing it through (B2). F4 extended to STEP 3 so the plan leg's outputs are checked, with L4.5 to prove it (B3). F9 states it adds a script-keyed row (A1). Suite count corrected, feature-default instruction tied to F4, Next Steps cross-reference added (N1–N3) |
| 2026-08-29 | Implemented at C1 (1b8631c). Adversarial round fixed five gate defects (3d832a7, 63c13cf) and the plan-reviewer tool restriction (fd36dfc). Suite 34 -> 52. Status -> implemented |
