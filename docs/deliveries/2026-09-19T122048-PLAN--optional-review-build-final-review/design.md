# Brainstorm: Optional `/add.review` — `/add.build` Owns a Final Whole-Diff Review

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-19
> **Type:** workflow

## Objective

A feature can be closed out with `/add.done` straight after `/add.build`, without running
`/add.review`. The build itself runs one final review over the whole feature diff, applies the
corrections and moves on to the next step. `/add.review` becomes an optional pass for detail and QA;
when it does run, `/add.done` still honours it — a failed review still blocks and its QA baseline is
still validated. The `/add.build` prompt does not grow in size or complexity to get there.

## Discovery

- `add.done` STEP 4.0 (`framwork/.codeadd/commands/add.done.md:275-298`) — blocks a feature branch when
  `GATE_REVIEW` is `missing`/`broken` or `GATE_QA_BASELINE` is not `ok`; the message is "Run
  /add.review before /add.done".
- `framwork/.codeadd/scripts/converge-gates.sh` — computes five gates for every feature branch. `GATE_REVIEW` (lines 61-106) reads
  the highest `review-NNN.md`'s `**Overall**` cell; `GATE_QA_BASELINE` (108-140) reads that review's
  `> **QA baseline:**` line. Neither branches on `QA_FEATURE_STATE`, which the script already emits.
  Read by `add.done` STEP 4 and by `add.build`'s Checkpoint Sequence (`GATES_OK=5/5`) and Loop End.
- `add.build` (1609 lines) — reviews per area (STEP 11, `@reviewer-agent MODE: task`) and per task,
  deliberately narrowed by `2026-09-17T153506-PLAN--cut-review-and-build-loop-cost` because
  `/add.review` owned the end-of-feature depth. Nothing in the build looks at the whole diff at once.
  STEP 12 applies `## Fix Routing` rows that only `/add.review` writes. On `DELIVERY=automatic` it runs
  a build ⇄ review loop of at most two rounds (1.0.1 baseline, STEP 17 skip, STEP 18.2 handoff).
- `add.review` — the only place that audits the whole diff against the spec (STEP 3), dispatches the
  conditional `MODE: owasp` reviewer (STEP 4), and judges QA evidence (STEPs 8-10, `qa-pipeline`
  fragment). STEP 11.5 hands automatic deliveries back to the build.
- `2026-09-11T014333-PLAN--product-close-out-parity` — explicitly refused to collapse `/add.review`
  into `/add.build` (QA evidence, run numbering, `## Fix Routing`). This design does not collapse it:
  the review stays, with its file, its QA judgement and its Fix Routing contract — it only stops being
  mandatory.
- Internal precedent: `add-framework--build` STEP 7 — one audit after the last F-block, findings
  judged, then applied. The product build borrows that shape.
- `hotfix-diagnosis-handoff-and-review-gate` (merged to `main` as of 34731b0, archived under `docs/deliveries/`) —
  makes hotfixes never need `/add.review`, via an `about.md` receipt; also edits `add.done` and
  `add-subagent-driven-development`, and lists "feature `/add.review`, its two-round loop,
  `converge-gates.sh`" as out of its scope.

## Context & Motivation

The build already reviews what it writes, area by area. For many features `/add.review` is then a
second, heavier pass whose main value is detail and QA — yet `/add.done` refuses to merge without it,
so every feature pays for it. The user wants review to be a choice, and the build to close the one gap
that makes skipping it unsafe today: nobody looks at the whole diff at once.

## Problem / Opportunity

1. `/add.done` hard-blocks on a missing `review-NNN.md`.
2. The build's reviews are scoped to one area or one task; a cross-area break or an unmet RF/RN that
   spans areas is only caught by `/add.review`.
3. The automatic build ⇄ review loop exists only because review was mandatory; it costs the build
   prompt a baseline, a round counter and a skip branch.

## Proposed Solution

**Recommended (A): the build runs one final whole-diff review; review becomes optional at close-out.**

- After the last F-block of each delivery unit (the feature; on an epic, each subfeature, before its
  Checkpoint Sequence), `/add.build` runs a final review: one `@reviewer-agent` over the whole unit diff
  in a new whole-feature mode, plus the conditional `MODE: owasp` pass on the same trigger
  `/add.review` STEP 4.1 uses. The coordinator judges each finding before applying it, dispatches one
  `@fix-agent` wave, and runs the existing scoped re-review (STEP 12.2) on the fix diff only.
  **Non-blocker** findings still open become `Ruling:` ledger lines, surfaced by STEP 18.1 and at the
  publish question. **A `blocker` still open is never ruled away** — it blocks (see below).
- The build appends one ledger line: `Final review: passed (after review-NNN)`,
  `Final review: ruled N (after review-NNN)` or `Final review: blocked N (after review-NNN)`, where
  `NNN` is the highest `review-NNN.md` that existed when the review ran (`000` when none).
- **A blocked final review always comes with a suggestion.** For each open blocker the build prints
  what it would do next, reasoned from the objective in the feature's `about.md`/`plan.md` — e.g. the
  fix direction it recommends, whether the plan needs revisiting, or that `/add.review` would add
  evidence — each as a ready-to-paste command line. `/add.done` shows the same when it stops on it.
- **After the final review the build goes straight into `## Loop End`, on every delivery mode.** The
  user is never expected to know or type `--loop-end`. The same holds after a CORRECTION-mode run (the
  user ran `/add.review`, then `/add.build` applied its `## Fix Routing`): the build continues into
  `## Loop End` by itself. `--loop-end [SFxx]` stays only as an internal entry; wherever any command
  suggests a next command, it prints the complete line, arguments included, ready to copy and paste.
- `converge-gates.sh` accepts that line as the review verdict under a "most recent wins" rule (below).
- The mechanics live in `add-review-discipline`; the build carries a short step that points there.
- The automatic build ⇄ review loop is removed.

**Alternatives considered:**

| Option | Why not taken |
|---|---|
| (B) The build writes a `review-NNN.md` itself | Two commands writing one file; the build would have to carry the whole review schema, growing the prompt |
| (C) Keep the automatic loop after the new final review | Two full reviews back to back; the build prompt only grows |
| (D) Replicate `/add.review` STEP 4 (frontend ∥ backend ∥ owasp) inside the build | Heaviest option in both prompt size and cost |
| (E) Up to 3 fix rounds with model escalation | Re-opens the loop `cut-review-and-build-loop-cost` just cut; one wave, one re-review is the rule |

## Type of Artefact

workflow — changes to existing product commands, one skill, one agent and one script. No new artefact.

## Scope

### Includes

- `/add.build`: a short final-review step per delivery unit; the `Final review:` ledger line; removal
  of the automatic loop (1.0.1's review baseline, STEP 17's automatic skip, STEP 18.2's automatic
  handoff to `/add.review`); STEP 12.3's "run `/add.review`" instruction when `## Fix Routing` is
  absent stays, since STEP 12 still consumes a review when one was run. Net line count of
  `add.build.md` ≤ 0 against its size at branch start.
- `/add.build` `## Loop End`: its entry text changes from "reached with `--loop-end` from `/add.review`"
  to "reached right after the final review (development) or after a correction run"; STEP 17's
  automatic-skip note and STEP 18.2's next-command table are rewritten to match.
- `/add.build` Checkpoint Sequence step 0: reads the source `converge-gates.sh` reports as operative.
  `REVIEW_SOURCE=review` → the highest `review-NNN.md`'s `## Fix Routing`, as today.
  `REVIEW_SOURCE=build` → the last `Final review:` ledger line; `blocked N` stops the checkpoint and
  prints the blockers with their suggestions.
- `/add.build` DELTA pass (epic's last subfeature): runs **before** that subfeature's final review, and
  its findings join the final review's list — same judgement, same fix wave. When a `review-NNN.md` is
  operative for that scope it still routes into that review's `## Fix Routing`, as today.
- `add-review-discipline` (product): a new section owning the final review — dispatch, modes, OWASP
  trigger, finding judgement, one fix wave, re-review, rulings, and the ledger line format.
- `reviewer-agent`: a whole-feature mode — cross-area consistency and RF/RN compliance against
  `plan.md`, over a review package.
- `framwork/.codeadd/scripts/converge-gates.sh` and its `.bats` suite:
  - `GATE_REVIEW`, most recent wins: read the last `Final review:` line of the ledger and the `NNN` it
    names. If no `review-NNN.md` is numbered above it → the build's verdict counts: `passed` or
    `ruled N` → `ok`; `blocked N` → `broken`, with the blockers in `GATE_REVIEW_DETAIL`. If a higher `review-NNN.md` exists → its `**Overall**` cell counts, as
    today. No ledger line and no review → `missing`, as today.
  - `GATE_QA_BASELINE`: when the operative verdict is the build's line → `skipped`, counted as passing,
    `BASELINE=none`. When the operative verdict is a review → unchanged.
  - Emits which source decided (e.g. `REVIEW_SOURCE=build|review|none`).
- `/add.done`:
  - STEP 4.0 no longer blocks on the absence of `/add.review` when the build's line is operative.
  - A review that exists and is operative and not `PASSED` still blocks, as today.
  - `qa-pipeline` enabled (`QA_FEATURE_STATE`) and `REVIEW_SOURCE=build` → a deciding stop: "QA was
    not judged — close out without it?" Yes continues with `BASELINE=none`; no stops and suggests
    `/add.review`.
  - STEP 5 promotes nothing when `BASELINE=none` (already a documented no-op).
- `/add.review`: remove STEP 11.5 (the automatic handoff back to the build) and the "LAST gate"
  wording; its next-step line suggests `/add.build` when `## Fix Routing` has agent-routed rows, else
  `/add.done`.
- `add-delivery-mode`: remove the build ⇄ review loop section and its rules (round counting, the cap of
  two); the build's closing handoff on `automatic` goes to the publish question.
- Wording updates where the graph and discovery show "run `/add.review` before `/add.done`":
  `add.md` router row, `add.qa-setup` STEP 14 handoff, `fragments/qa-pipeline/add.build.md` (lines
  ~28-30 and ~54-61, which reference the loop and re-running review),
  `add-doc-schemas/references/review.md`.
- `cli/tests` assertions for the above.

### Does NOT Include

- Hotfix branches — owned by the merged hotfix delivery (`hotfix-gates.sh`, `about.md` receipt).
- Proving the reviewed tree still matches the merged tree (a fingerprint). `GATE_REVIEW` does not check
  this today either; recorded as a known gap, not introduced by this change.
- Any change to `/add.review`'s own audit, reviewers or QA judgement.
- Any change to `GATE_EPIC`, `GATE_COVERAGE` or `GATE_LEDGER`.
- The internal pipeline (`add-framework--*`).

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| The build's verdict is a `build-ledger.md` line, not a `review-NNN.md` | "closed out straight after the build" | `converge-gates.sh` already reads the ledger for `GATE_LEDGER`; `review-NNN.md` stays owned by one command | ✅ |
| Remove the automatic build ⇄ review loop | "the build prompt does not grow" | The loop only existed because review was mandatory; removing 1.0.1 and the automatic branches pays for the new step | ✅ |
| `qa-pipeline` on + no review → done asks, does not block | "`/add.review` becomes optional for QA" | The user opted into QA, so skipping it is confirmed, not silent; it stays their call | ✅ |
| Final review = whole diff + spec + conditional OWASP | "the build runs one final review over the whole feature diff" | Covers exactly what the per-area reviews cannot see; 1-2 dispatches | ✅ |
| One fix wave + scoped re-review; non-blocker leftovers become `Ruling:` | "applies the corrections and moves on" | Same "one review, one fix wave" rule as PR #75; nothing is dropped silently | ✅ |
| An open `blocker` blocks, and comes with a suggestion drawn from the objective | "a failed review still blocks" | Keeps the checkpoint's "no unresolved blocker survives" guarantee; a stop without a next action hands the work back to the user | ✅ |
| The build enters `## Loop End` by itself after the final review or a correction run, on every mode; any suggested command is printed complete | "moves on to the next step" | The user will not know to type `--loop-end`; a copy-paste line is the only safe manual step | ✅ |
| DELTA findings join the last subfeature's final review | "one final review over the whole feature diff" | Without a `review-NNN.md` the DELTA pass has no `## Fix Routing` to write to | ✅ |
| Mechanics owned by `add-review-discipline`; `add.build.md` net lines ≤ 0 | "the build prompt does not grow" | A checkable budget instead of a judgement call; the skill already owns review dispatch in the product layer | ✅ |
| Most recent verdict wins, decided by the `NNN` named in the ledger line | "when `/add.review` runs, done still honours it" | Resolves review BLOCKED → build correction → done without re-running review, deterministically and without dates | ✅ |
| On an epic the final review runs per subfeature, before the Checkpoint Sequence | "closed out straight after the build" | The checkpoint already requires `GATES_OK=5/5`; the ledger line must exist before it runs | ✅ |

## Ecosystem Impact

Layer of every artefact below: **product**.

| Component | Called by | Impact | Action |
|-----------|-----------|--------|--------|
| `commands/add.build.md` | add, add.done, add.new, add.plan, add.qa-setup, add.review, consistency-agent, ux-agent, skills add-architecture-discovery, add-code-review, add-commit, add-cross-sf-consistency, add-id-convention, add-qa, add-qa-migration, add-review-discipline; fragments qa-pipeline/add.build.md, tdd-pipeline/add.build.md, plugins/gitnexus/add.build.md (inject) | New final-review step; automatic loop removed | Modify; net lines ≤ 0; check the three injected fragments still anchor |
| `commands/add.done.md` | add, add.build, add.plan, add.pull-request, add.review, add-doc-schemas, add-qa, fragment qa-pipeline/add.review.md; fragments docs-pruning/add.done.md, plugins/gitnexus/add.done.md (inject) | STEP 4.0 gate relaxed; new QA stop | Modify |
| `commands/add.review.md` | add, add.build, add.done, add.plan, add.qa-setup, consistency/e2e/qa/ux agents, add-delivery-validation, add-id-convention, add-qa, add-qa-migration; fragments qa-pipeline, tdd-pipeline, plugins/playwright (inject) | STEP 11.5 removed, next-step wording | Modify; check injected fragments still anchor |
| `scripts/converge-gates.sh` | add.build, add.done, add-commit | `GATE_REVIEW` / `GATE_QA_BASELINE` rules, `REVIEW_SOURCE` | Modify + `.bats` cases |
| `skills/add-review-discipline` (product) | add.build, add.new, add.plan | New final-review section | Modify |
| `skills/add-delivery-mode` | add.brainstorm, add.build, add.new, add.plan, add.review; fragments qa-pipeline/add.build.md, tdd-pipeline/add.build.md | Loop section removed | Modify; tdd-pipeline fragment only uses its stop kinds — verify |
| `agents/reviewer-agent.md` | add.build, add.review, consistency-agent, plan-reviewer-agent, add-cross-sf-consistency, add-plan-review, add-review-discipline, add-subagent-driven-development; plugins/gitnexus agent fragment (inject) | New whole-feature mode | Modify |
| `commands/add.md` | none — the graph returned no dependant (entry-point router) | Router text | Modify wording |
| `commands/add.qa-setup.md` | add.build, add.review, fragment qa-pipeline/add.review.md, add-qa, add-qa-migration, add-setup-contract | Handoff text | Modify wording |
| `fragments/qa-pipeline/add.build.md` | injects into add.build | References the loop and re-running review | Modify wording |
| `skills/add-doc-schemas/references/review.md` | add-doc-schemas, add-cross-sf-consistency | "must re-run /add.review" wording stays valid for STEP 12; check only | Check |
| `CLAUDE.md` / web docs / README | not graph nodes | Any "review is mandatory" wording | Sweep by grep; `add-framework--sync` at release |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A feature closes out right after the build | The mandatory second, deeper review before every merge |
| Cross-area and spec checks inside the build, where the fix happens | One extra reviewer dispatch (two with OWASP) per delivery unit |
| A smaller build prompt (loop removed) | The automatic two-round correction loop |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Merges with only the build's single fix wave | Med | Leftovers are `Ruling:` lines shown in 18.1 and at the publish question; `/add.review` stays one command away |
| The hotfix delivery just changed `add.done` and `add-subagent-driven-development` | Med | Branch from current `main` (34731b0 or later); keep the hotfix receipt gate untouched |
| `add.build.md` grows despite the budget | Med | Net-lines ≤ 0 is an acceptance criterion with a test |
| Removing the loop breaks a fragment anchor in `add.build`/`add.review` | Low | `injection-points.json` build + cli injection tests |
| Code changes after the final review and still merges | Low | Same gap as today; out of scope, recorded |

## Next Steps

Run: `/add-framework--plan optional review with build final review`
