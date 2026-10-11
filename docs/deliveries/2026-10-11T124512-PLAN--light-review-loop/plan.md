# Plan: Light review loop — the build closes the review it fixed, and done accepts it

> **Status:** implemented
> **Layers:** product
> **Type:** workflow
> **Created:** 2026-10-11
> **Delivery:** confirm
> **Ticket:** 0047B

---

## Objective

[from conversation, no design document — source: ticket 0047B, decisions by Maicon in its notes, 2026-10-11]
After a review with findings, `/add-build` fixes them, checks only the fix diff, records the resolution
in the same review, and `/add-done` closes the feature with it — no new full review for each fix wave.

**When this build is done:** the review → build → done loop ends in one pass for a fix wave that stays
inside the findings' scope. A newer QA run no longer forces a new review, minor/lint/format findings no
longer block the merge (they go to the ledger and, with the `board` feature on, to one backlog ticket),
and format findings are fixed by the project's formatter.

**Ticket done when:** Depois de uma review com achados, o add-build corrige, verifica so o diff das correcoes, atualiza a mesma review com a resolucao e a marca resolvida, e o add-done fecha com ela sem pedir review completa nova (salvo diff fora do escopo); mudanca de baseline de QA nao bloqueia; minor/lint/formato nao bloqueiam e viram backlog; build e testes passam.

## Context

Origin: the Organize My Finances report on feature 0035F, which went through review-004, 005 and 006 —
one full `/add-review` per fix wave. The ticket's notes carry four decisions (numbered 1-4 below) and
"menor mudança possível, sem over-engineering". No brainstorm design or intent file exists; the ticket is
the specification.

**What already exists — most of decision 1 is already built.** This plan extends it; it does not
rebuild it:

| Already there | Where |
|---|---|
| CORRECTION MODE reads `## Fix Routing` from the highest `review-NNN.md` | `add-build.md` STEP `add-build.consume` |
| Re-review of the fix diff only, `@reviewer-agent` `MODE: re-review` (declared `model: sonnet`) | STEP `add-build.re-review` |
| Resolution Annex appended to the SAME review, `status: finalized` | STEP `add-build.resolution` |
| After a CORRECTION run the re-review verdict becomes the `Final review:` ledger line, which `converge-gates.cjs` prefers over the older review ("most recent wins") | `## Final Review`, `converge-gates.cjs` gate 1 |
| `/add-review` already tells the user "No second review is required" after a fix build | `add-review.md` STEP `add-review.console-output` |

**Why 0035F still looped — the cause this plan fixes.** With `qa-pipeline` on:

1. `converge-gates.cjs` gate 2 returns `GATE_QA_BASELINE=skipped`, `BASELINE=none` whenever the build's
   line decides — even when the review it answers ran QA and a judged `run-NNN` exists. `/add-done`
   branch 5 then stops ("QA was not judged…"), and "No" sends the user to `/add-review`.
2. When the review decides, any newer working run makes `qa-evidence.cjs validateBaseline` fail
   ("Review baseline differs from current working evidence") → `broken` → `/add-review` again.
3. The `qa-pipeline` fragment's next-command in `/add-build` always names `/add-review` as "QA is still
   owed" when screens are declared — also after a correction build of a review that already judged QA.
4. A red `lint` or `format` gate on a touched file marks the review `BLOCKED` as a `blocker` row, and every
   `minor`/`polish` row is fixed and re-reviewed, so small findings keep the loop alive.

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (AGENTS.md, Pipeline)
- Never write a raw `.codeadd/` path. Use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the exception — always `.codeadd/scripts/` (AGENTS.md, Pipeline)
- HTML comments (`<!-- -->`) are stripped at build. Injection markers and `<!-- uses: -->` blocks rely on this (AGENTS.md, Pipeline)
- Every standalone feature or plugin marker pair sits in exactly one slot; a marker outside a slot fails the build (add-framework-injection, Declare a slot)
- `converge-gates.cjs` — "Exit: always 0 — this is a diagnosis, never a gate" and "READ-ONLY IS LOAD-BEARING … It never writes, and it never calls the evidence `promote` operation" (its header)
- The `Final review:` grammar stays byte-identical: `Final review: passed|ruled N|blocked N (after review-NNN)` (converge-gates.cjs header; kept by three prior deliveries)
- "Critical — a `blocker` — is never turned into a `Ruling:`. It stops the delivery." (add--review-discipline, The Build's Final Review)
- Board writes never stop a stage: "a refused or degraded write is one line in the build's final report, and the build continues" (fragments/board/add-build.md, ticket-doing)
- Tests run through `scripts/run-tests.js`, never `npx vitest` inside `cli/` (project memory, test rules)

## Problem

1. **A judged QA run is ignored when the build decides** — `GATE_QA_BASELINE=skipped` → done stops or sends back to `/add-review`.
2. **A newer QA run breaks the review** — baseline mismatch is `broken`, though the newer run carries its own validated report.
3. **The build always says QA is owed** — the qa-pipeline next-command points to `/add-review` after every build with screens.
4. **Small findings block** — lint/format red is a `blocker`; minor/polish rows are fixed and re-reviewed like real defects.
5. **The resolution has no evidence** — the annex carries `Files` and `Note`, not the `file:line` that closes each finding nor the test that covers it.
6. **No guard when a fix wave grows** — after a correction, the re-review verdict is accepted even when the fix diff touched code no finding named.

## Proposal

Keep the existing correction contract and close its four leaks:

- **QA (decision 3):** gate 2 validates the CURRENT working evidence. The newest working run, with a valid
  report, is the gate — whoever decided gate 1. `skipped` stays only for "no working run at all".
- **Light verification (decision 1):** correction rounds keep the Sonnet re-review on the fix diff; the
  routed correction runs the validation gates after its last round; the annex gains `Evidence` and `Test`.
- **Full review only when needed (decision 2):** the build, not done, makes the call — after a correction
  run it compares the fix diff with the routed rows' files and a size limit. Out of scope or large → it runs
  its normal `MODE: feature` Final Review (already defined) instead of reusing the re-review verdict. Done
  keeps reading one gate script and needs no diff logic.
- **Small findings (decision 4):** `/add-review` routes red lint/format gates as `minor`, not `blocker`; the
  build defers `minor`/`polish`/lint rows to the ledger (and one board ticket when the `board` feature is
  on) and fixes format rows by running the project formatter.

## Scope

### Includes

- **F1** [product] — `framwork/.codeadd/scripts/converge-gates.cjs` gate 2, and `scripts/tests/converge-gates.test.cjs`.
  New rule: compute `current = evidence.workingBaseline(FEATURE_DIR)` (already exported).
  - `REVIEW_SOURCE=build`: `current === 'none'` → `skipped`, `BASELINE=none`, exactly as today. Otherwise
    `evidence.validateBaseline(FEATURE_DIR, current)` → `ok` with `BASELINE=<current>`, or `broken` with the
    flattened error.
  - `REVIEW_SOURCE=review`: a missing `> **QA baseline:**` line stays `missing`. A line equal to `current`
    behaves as today. Otherwise parse the line first with `evidence.parseBaseline` (already exported): a
    malformed line, or one whose set of scopes differs from `current`'s, stays `broken` exactly as today
    (`validateBaseline(FEATURE_DIR, line)`'s error). Only a well-formed line with the same scopes and an
    older run is the **advanced** case: validate `current` — `ok` → `BASELINE=<current>` and
    `GATE_QA_BASELINE_DETAIL=QA baseline advanced from <line> to <current>; the newer run's report validated`;
    failure → `broken` with the error.
  - Update the header comment block to state the rule ("the newest working run with a valid report is the gate").
  - Must NOT lose: exit 0 always, read-only, `pass()` counting, the `none` path, gate 1 untouched.
  - **Produces:** `GATE_QA_BASELINE=ok` with `BASELINE=<current working baseline>` whenever a working run with a valid report exists, for both review sources
- **F2** [product] — `framwork/.codeadd/commands/add-done.md` STEP `add-done.quality-gate-verification`.
  Branch 5 now fires only when no working QA run exists (`BASELINE=none`): reword its condition line and
  question to say so; keep its anchor text `5. IF \`GATE_QA_BASELINE=skipped\`` and `QA_PROMOTION_STATUS=skipped`
  (pinned by `cli/tests/lighter-product-qa.test.js`). Branch 6: `broken` now means the newest working run's
  report is invalid, not that the baseline moved — say so and keep the `/add-review` remedy. Add one line:
  an advanced baseline is not a block; `BASELINE` from the preflight is what STEP `add-done.promote-qa` promotes.
  - **Consumes:** `GATE_QA_BASELINE=ok` with `BASELINE=<current working baseline>` whenever a working run with a valid report exists, for both review sources (F1)
- **F3** [product] — `framwork/.codeadd/commands/add-review.md`, every place that states the touched-gate
  rule: the Gate 6 table under `## GATES AND PRECONDITIONS` (the `TOUCHED_FAILURES` row and the `Failure:`
  line after it), STEP `add-review.re-run-procedure` item 2.3, and STEP `add-review.hard-requirements`
  (both the "MUST be BLOCKED" and the "`blocker` row" lines). A red gate whose intent is `lint` or `format` on touched files: tick
  `[!]`, gate row `⚠️ KNOWN ISSUES` (not `❌ BLOCKED`), and one `## Fix Routing` row per gate with severity
  `minor` — route `formatter` for `format`, `@fix-agent` for `lint`. Every other red gate keeps the
  `blocker` rule. Must NOT lose: gates still re-run independently, untouched failures still go to Known Issues.
  - **Produces:** Fix Routing route `formatter` (severity `minor`) for a red `format` gate
- **F4** [product] — `framwork/.codeadd/skills/add--doc-schemas/references/review.md`, `review` schema.
  Resolution Annex columns become `ID | Route | Outcome | Evidence | Test | Files | Note`, outcome adds
  `deferred`; Fix Routing `Route` lists `formatter`. `formatter` is produced only by `/add-review`'s gate
  step (F3) and consumed only by `/add-build`'s consume step (F6); it never reaches `@fix-agent` and is not a
  QA-judge route, so `fix-agent.md`, `add--qa` and its coordinator reference do not enumerate it. Keep the
  append-only and `finalized`-once rules. "Resolved" in the ticket = `status: finalized` plus the build's
  `Final review:` line; no new status value.
  - **Produces:** annex columns `ID | Route | Outcome | Evidence | Test | Files | Note` with outcome `resolved / failed / not-mine / disputed / deferred`
- **F5** [product] — `framwork/.codeadd/agents/reviewer-agent.md`, Re-Review Report Format. The `FINDINGS`
  line's evidence becomes `[evidence: file:line; test: <test path or none>]` for an `ADDRESSED` finding.
  Nothing else in the agent changes.
  - **Produces:** re-review evidence `file:line; test: <path or none>` per ADDRESSED finding
- **F6** [product] — `framwork/.codeadd/commands/add-build.md`, the routed correction and its Final Review:
  - STEP `add-build.consume`: before the dispatch, split the rows. `minor`/`polish` rows and `lint` rows →
    not dispatched; one `T0N: minor (deferred): <ID> <symptom>` ledger line each (existing format) and annex
    outcome `deferred`. `formatter` rows → run the mutating form of AGENTS.md's `format` gate once, limited
    to `TOUCHED_FILES` for the four tool rows below (passed as file arguments; `dotnet format --include`), and
    over the whole script for the `npm run` row, which takes no file list; commit it
    as one batch through STEP `add-build.commit`, re-run the `format` gate; green → annex `resolved`, evidence
    `formatter`; no derivable mutating form or still red → `deferred`. Mutating-form table (only these):
    `prettier --check`→`prettier --write`, `ruff format --check`→`ruff format`, `gofmt -l`→`gofmt -w`,
    `dotnet format --verify-no-changes`→`dotnet format`, and `npm run <x>:check`→`npm run <x>` when
    `package.json` declares `<x>`. Remaining rows → one `@fix-agent` wave as today. No remaining rows → no
    `@fix-agent`, no re-review. Replace the sentence "Every row in the table is fixed" accordingly; keep
    "no pre-fix confidence check".
  - After the last round of a routed correction: run the Validation Gates Procedure (same as STEP
    `add-build.validation-gates`), so "gates" run on the fixed tree.
  - STEP `add-build.resolution`: the annex uses F4's columns; `Evidence`/`Test` come from F5's re-review
    line, `—` for a deferred row.
  - `## Final Review`, "After a CORRECTION run": add the scope check. `FIX_FILES` = files changed across the
    ranges of this run's `fix round` ledger lines (the formatter batch is excluded). `SCOPE` = every path in
    the dispatched rows' `File` cells (a cell with several paths is split on `,`; an empty cell adds
    nothing) plus each path's directory. Out of scope when a `FIX_FILES` entry is neither in `SCOPE` nor
    inside one of its directories and is not a test file (path contains `test`, `spec` or `__tests__`), or
    when `git diff --shortstat` over those ranges exceeds **300 changed lines**. Out of scope → run the
    normal review (the existing exception path); in scope → the re-review verdict as today.
  - **No `@fix-agent` round ran** (every row was deferred or fixed by the formatter): no reviewer is
    dispatched and the "no round was re-reviewed" exception does NOT apply — the formatter batch and
    deferrals are not rounds. Write `Final review: passed (after review-NNN)` and its `Final review head:`
    line. Such a run holds no `blocker`/`major` row by construction, since those are always dispatched.
  - Must NOT lose: `FIX_BASE`, `MAX_ATTEMPTS = 3`, model escalation at round 3, the breaker, a blocker never ruled, the `Final review head:` line.
  - **Consumes:** Fix Routing route `formatter` (severity `minor`) for a red `format` gate (F3); annex columns `ID | Route | Outcome | Evidence | Test | Files | Note` with outcome `resolved / failed / not-mine / disputed / deferred` (F4); re-review evidence `file:line; test: <path or none>` per ADDRESSED finding (F5)
  - **Produces:** `T0N: minor (deferred): <ID> <symptom>` ledger lines from a routed correction
- **F7** [product] — `framwork/.codeadd/fragments/board/add-build.md` + its slot in `add-build.md` STEP
  `add-build.complete`. New section `deferred-minors`: when this run wrote any `minor (deferred)` ledger
  line, ONE board ticket through `{{skill:add--backlog/SKILL.md}}` (`add`), title naming the feature and
  the review number, one note per deferred line, `labels` empty, `ticket` relation none. Never a stop; a
  refused/degraded write is one report line. In `add-build.md`, add the member pair
  `feature:board:deferred-minors` after `feature:board:ticket-in-review` in that slot, and rename the slot
  markers to `slot:board.ticket-in-review+board.deferred-minors` (both open and close; fallback stays
  `fallbacks/empty.md`). With `board` off the deferred lines are
  already surfaced by STEP `add-build.rulings-i-made` ("deferred minors (count + one line each)").
  - **Consumes:** `T0N: minor (deferred): <ID> <symptom>` ledger lines from a routed correction (F6)
- **F8** [product] — `framwork/.codeadd/fragments/qa-pipeline/add-build.md`. Section `qa-fix` steps 2 and 4:
  "every agent-routed row is fixed" → every agent-routed row except those the base contract defers (F6).
  Section `next-command`: "QA is still owed" stays the rule, with one exception — this run was a routed
  CORRECTION (it consumed a review's `## Fix Routing`) AND `node .codeadd/scripts/qa-evidence.cjs working-baseline "${FEATURE_DIR}"`
  prints a `BASELINE` other than `none`. Then the next step is `/add-done`. A normal development build after
  an older review still owes QA, because its new code was never judged.
  - **Consumes:** `GATE_QA_BASELINE=ok` with `BASELINE=<current working baseline>` whenever a working run with a valid report exists, for both review sources (F1)
- **F9** [product] — `cli/tests/light-review-loop.test.js` (new): text-contract tests for F2-F8 (L2 below).

### Does NOT Include (important!)

- `/add-review` writing backlog tickets for minors when the review PASSES and no build runs — minor rows then stay listed in the review; no board fragment exists for `add-review`, and adding one is a separate change.
- A new review `status` value (`resolved`) — `finalized` + the `Final review:` line already mean it (F4).
- Any diff logic in `/add-done` or `converge-gates.cjs` gate 1 — decision 2 is enforced in the build (F6).
- Gating on QA findings at done — done already displays them and never gates on them.
- Hotfix flow (`hotfix-gates.cjs`) — not part of the review → build → done loop of a feature.
- `add--review-discipline` — its Build's Final Review steps are unchanged; the CORRECTION exception lives in `add-build.md`.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Light check after fixes | Existing `MODE: re-review` on the fix diff (Sonnet), plus gates after the last round | Ticket note 1; the re-review already exists |
| Where the resolution lives | Same `review-NNN.md`, Resolution Annex with `Evidence` and `Test` | Ticket note 1 |
| Who decides "full review again" | The build, at its Final Review, by file scope + 300-line limit | Ticket note 2 asks a simple threshold; putting it in the build keeps done a reader of one script and runs the review without a human round trip. Derived, recorded here |
| QA baseline change | Newest working run with a valid report is the gate, both sources | Ticket note 3 |
| Minor/polish/lint | Not fixed, not blocking; ledger + one board ticket per run | Ticket note 4; one ticket per run, not per row, to keep the board readable. Derived |
| Board writes gated by the `board` feature | Yes — through the board fragment | Every board write in product commands lives in a `board` fragment |
| Format | Build runs the mutating form of the `format` gate | Ticket note 4; AGENTS.md stores only the check form, so a fixed 5-row map, else deferred |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| A QA run judged before the fixes is promoted as final evidence | Medium | Accepted by note 3; done already shows open QA findings at the preview. L1 #3 pins that an unreported run still breaks |
| A real lint error (e.g. undefined name) is deferred as minor | Low | The `typecheck`, `test` and `build` gates keep `blocker`; L2 #3 asserts only `lint`/`format` change |
| The scope check fires on every fix that adds a test | Medium | Test paths excluded (F6); L2 #6 asserts the exclusion text |
| A new slot member breaks injection bytes | Low | L3 asserts build exit 0 and the end-state map |
| Pinned text in `lighter-product-qa.test.js` breaks | Medium | F2 keeps the branch 5/6 anchors; L4 runs the full suite |
| The `npm run <x>` formatter rewrites files outside the feature | Medium | Accepted: that row takes no file list; the batch is its own commit and excluded from the scope check (F6). The four tool rows are limited to `TOUCHED_FILES` |
| The scope check sends the build to the normal review often (fix touches a caller or an import elsewhere) | Medium | Accepted cost: the fallback is the build's own Final Review, not a new `/add-review`; directories of routed files count as in scope (F6) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/scripts/converge-gates.cjs` | product | modify | F1 |
| `scripts/tests/converge-gates.test.cjs` | product | modify | F1 — the native suite of a shipped script belongs to that script (AGENTS.md, Where the details live: "that script's own header, plus its native `scripts/tests/<name>.test.cjs` suite") |
| `framwork/.codeadd/commands/add-done.md` | product | modify | F2 |
| `framwork/.codeadd/commands/add-review.md` | product | modify | F3 |
| `framwork/.codeadd/skills/add--doc-schemas/references/review.md` | product | modify | F4 |
| `framwork/.codeadd/agents/reviewer-agent.md` | product | modify | F5 |
| `framwork/.codeadd/commands/add-build.md` | product | modify | F6, F7 (slot member) |
| `framwork/.codeadd/fragments/board/add-build.md` | product | modify | F7 |
| `framwork/.codeadd/fragments/qa-pipeline/add-build.md` | product | modify | F8 |
| `cli/tests/light-review-loop.test.js` | product | create | F9 |

Graph gate (`impact --depth 1`, artefact graph of 2026-10-11): `add-build` 26 direct dependants, `add-done`
16, `add-review` 18, `reviewer-agent` 10, `converge-gates.cjs` 3 (add-build, add-done, add--commit),
`fragments/qa-pipeline/add-build.md` 1 (feature qa-pipeline) → **HIGH** for the four hubs, MEDIUM for the
fragment. No change to `AGENTS.md`. Delivery index (product layer): `converge-gates.cjs` no entry;
`add-build` live under `lighter-add-build`; `optional-review-build-final-review` superseded, its grammar kept.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against the current tree.

### L1 — `converge-gates.cjs` (scripts/tests/converge-gates.test.cjs) (RED → GREEN)

1. Build line `passed (after review-001)` + `feature/_tests/run-001` with a valid report → `GATE_QA_BASELINE=ok`, `BASELINE=feature:run-001`, `GATES_OK` counts it. *RED: today `skipped`, `BASELINE=none`.*
2. Build line + no working run → `GATE_QA_BASELINE=skipped`, `BASELINE=none` (existing #062 stays green).
3. Build line + `run-001` without a report → `GATE_QA_BASELINE=broken`, detail names the missing report. *RED: today `skipped`.*
4. Review (decides) with baseline `feature:run-001` + valid `run-001` and `run-002` → `ok`, `BASELINE=feature:run-002`, detail contains `advanced from feature:run-001`. *RED: today `broken` "differs".*
5. Same as 4 but `run-002` has no report → `broken`. (In 4 and 5 `run-001` may or may not still exist: `workingBaseline` takes the highest working run.)
5b. Review with a malformed baseline line (`_tests/run-001`) → still `broken` (existing tests at lines ~358 and ~883 stay green). Review baseline scope `SF01:run-001` while `current` is `feature:run-002` → `broken`.
6. Existing tests #005-#010, #042, #062-#077 stay green unchanged.

### L2 — text contracts (cli/tests/light-review-loop.test.js) (RED → GREEN)

1. `add-done.md` branch 5 text mentions no working QA run; branch 6 says an advanced baseline is not a block. *RED.*
2. `add-review.md` re-run procedure: red `lint`/`format` on touched files → `minor`, `⚠️ KNOWN ISSUES`, route `formatter` for format. *RED.*
3. `add-review.md` still says the other red gates on touched files are `blocker` (guard against widening), and no remaining sentence calls a touched `lint` or `format` failure BLOCKED (Gate 6 table, re-run procedure, hard requirements).
4. `review.md` schema annex header is `ID | Route | Outcome | Evidence | Test | Files | Note` and lists `deferred`. *RED.*
5. `reviewer-agent.md` re-review format carries `test:`. *RED.*
6. `add-build.md`: consume step defers `minor`/`polish`/`lint`, names the 5-row formatter map, runs the Validation Gates Procedure after the last round, and the Final Review CORRECTION text names the 300-line limit and the test-path exclusion. *RED.*
6b. `add-build.md` Final Review states that a run with no `@fix-agent` round writes `Final review: passed (after review-NNN)` with no reviewer dispatch. *RED.*
7. `fragments/board/add-build.md` has section `deferred-minors`; `add-build.md` carries `slot:board.ticket-in-review+board.deferred-minors`; `fragments/qa-pipeline/add-build.md` next-command names the routed-CORRECTION exception and `working-baseline`. *RED.*
8. Each file still holds what F-blocks must not lose: `MAX_ATTEMPTS = 3`, `Final review head:`, `QA_PROMOTION_STATUS=skipped`, `status: finalized` exactly once.

### L3 — build and injection end state

1. `node scripts/build.js` exits 0 with no new warning.
2. End-state map: `board` injects into `add-build` sections `ticket-doing`, `ticket-in-review`, `deferred-minors`, `ticket-attention`, `ticket-metadata` (5, was 4); `qa-pipeline` sections in `add-build` unchanged in count. `injection-points.json` reflects it.
3. `board` on/off: the installed `add-build` carries the `deferred-minors` text exactly once / not at all; reversed enable order of `board` + `qa-pipeline` gives identical bytes (existing injection suites).

### L4 — full suite

1. `node scripts/run-tests.js` (all suites, in the container) green, including `lighter-product-qa.test.js`, `optional-review-build-final-review.test.js` and `lighter-add-build.test.js`.

### L5 — Behavioural acceptance

1. Fixture walk (L1 #1 + #4): a review-001 `BLOCKED` with baseline `feature:run-001`, a ledger `Final review: passed (after review-001)`, and a valid run → `converge-gates.cjs` prints `GATES_OK` with gates 1 and 2 `ok`, so `/add-done` reaches merge with no new review.

**RED expectations against the current tree:** L1 #1, #3, #4, #5; L2 #1, #2, #4-#7; L3 #2.
**GREEN = all levels pass after F1–F9.**

---

## Execution Order

- **F9 + L1 tests first** (RED), then **F1 → F2** (QA gate and its reader; repo is consistent after F2),
  **F4 → F5 → F3** (schema and agent before their users), **F6 → F7 → F8** (build and its fragments).
- Safe stopping points: after F2, after F3, after F8.
- After F7 run `node scripts/build.js` before going on (slot change).

## Reviewer Handoff

For each F-block the build leaves, in the evidence file: what changed, which level covers it and its pass
state, any decision altered.

Gaps a reviewer must hunt:

1. An F-block marked done whose validation level was never RED.
2. F1 widening gate 1 or touching the `Final review:` regex — out of scope.
3. F6 deferring a `blocker` or `major` row — only `minor`/`polish`/`lint` may be deferred.
4. F7 making a board write that can stop the build.

## References

- Prior art: `2026-09-19T122048-PLAN--optional-review-build-final-review` (Final review line, REVIEW_SOURCE), `2026-10-08T211926-PLAN--lighter-add-build` (build-only rounds, Final review head), `2026-10-09T114527-PLAN--lighter-product-qa` (branch 5 dead end)

---

## Next Steps

/add-framework--build docs/plans/2026-10-11T124512-PLAN--light-review-loop.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-11 | Initial creation |
| 2026-10-11 | Plan review (fix-then-ok): F1 keeps `broken` for a malformed or different-scope baseline (+L1 5b); F6 defines the no-round verdict (`passed`), the formatter's file limit and the scope matching rule (+L2 6b); F3 lists every touched-gate location; F4 bounds the `formatter` route; F7 spells the slot rename; F8 limits the QA exception to routed corrections; two accepted risks added; test-file layer cited |
| 2026-10-11 | Implemented on feat/light-review-loop (commits 854c3dc..HEAD) |
