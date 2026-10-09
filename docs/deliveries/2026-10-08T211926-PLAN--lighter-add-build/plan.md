# Plan: Lighter add-build — cut repeated review, validation and readback dispatches

> **Status:** implemented
> **Layers:** product — F4 also edits `scripts/tests/converge-gates.test.cjs`, the native suite of the product script `converge-gates.cjs` (AGENTS.md, "Where the details live": "that script's own header, plus its native `scripts/tests/<name>.test.cjs` suite")
> **Type:** architecture
> **Created:** 2026-10-08
> **Delivery:** confirm
> **Ticket:** 0034B

---

## Objective

[from conversation, no design document] Product `add-build` dispatches far fewer review, validation and readback agents per delivery, while what gets checked stays the same — users feel the build is faster.

**When this build is done:** in TASKS MODE the validator runs once per area instead of once per task,
the build no longer dispatches a readback, a fix round that only repaired build errors or test-agent
`BLOCKED` rows is gated by build + tests instead of a re-review, and `/add-review` no longer repeats the
OWASP pass and the spec audit the build's Final Review already ran on the same code. `/add-build` stops
pointing at `/add-review` as the next step. Fix attempts stay at 3, and `converge-gates.cjs` reads the
ledger exactly as before.

**Ticket done when:** add-build.md dispatches the validator once per area in TASKS MODE, has no readback-agent dispatch, skips re-review for build-error/BLOCKED-only fix rounds, and no longer suggests add-review as next step; add-review skips OWASP and spec audit when the ledger has a passing Final review with no later commit; fix attempts remain 3; npm test passes.

## Context

Users report development got slow. The 2026-10-08 analysis on ticket 0034B counted about 10 review and
test dispatches in a typical 2-area build, more than 20 in the worst case, and more than 40 in TASKS
MODE. Most of them re-check something another dispatch already checked: a validator per task over
work the area validator could read once, a second readback of a plan `/add-plan` already read back, a
re-review of a fix whose only finding was a compile error, and an `/add-review` that re-audits what the
Final Review just audited.

**Every decision here was taken in the documents below and confirmed at this plan's STEP 4 (P1–P7,
"all as recommended"). This plan does not re-derive them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-10-08T211322-lighter-add-build-intent.md` | `path: bounded`, the four cuts, `ruled N` counts as passing, fix attempts stay 3, test removal with `Test-Removed:`; `## Open` reads `None` |

## Global Constraints

- `MAX_ATTEMPTS = 3` for `@fix-agent`, unchanged (ticket 0034B notes: "Keep fix attempts at 3.")
- The `Final review:` line grammar stays `Final review: passed|ruled N|blocked N (after review-NNN)` byte for byte (`converge-gates.cjs:15`); its NNN regex is end-anchored, `/\(after review-([0-9]{3})\)[ \t]*$/` (`converge-gates.cjs:334`)
- `framwork/.codeadd/scripts/converge-gates.cjs` is not edited (intent, Cut 4)
- `/add-plan`'s readback, `readback-agent` and `add--feature-readback` stay (intent, Cut 2)
- Router `add.md` is not edited — test L4.3 requires it to call `/add-review` optional (intent, Cut 4)
- `add-hotfix` is not edited — its `MAX_ATTEMPTS=1` snapshot re-review keeps its own rule (`add-hotfix.md:465-483`)
- A removed test name needs a `Test-Removed:` commit trailer (AGENTS.md, `scripts/test-loss-guard.cjs`)
- Never write a raw `.codeadd/` path in an artefact; use `{{cmd:}}` / `{{skill:}}` — scripts excepted (AGENTS.md, Pipeline)
- `node scripts/build.js` exits 0 and the graph gate passes (AGENTS.md, Pipeline)
- Tests run through `node scripts/run-tests.js` in the container, never `npx vitest` in `cli/` (project memory)

## Problem

1. **Validator per task in TASKS MODE** — `add-build.md:546` dispatches the validator after every task,
   and `add-build.md:99` ties each task's commit to it. N tasks in an area cost N validator reads of
   overlapping code.
2. **A second readback** — `add-build.md:462-523` dispatches `@readback-agent` over the plan that
   `/add-plan` STEP `add-plan.readback` already read back cold.
3. **Re-review of build-only fixes** — `add-build.md:645` re-reviews every fix round, including a round
   whose only rows were compile errors or a test-agent `BLOCKED`. Build and tests already decide those,
   and the Final Review reads the fix diff afterwards anyway.
4. **`/add-review` repeats the Final Review** — its spec audit and OWASP pass re-run on code the Final
   Review already covered with `MODE: feature` + conditional OWASP, and `/add-build` still names it as a
   next step (`add-build.md:1580-1581`).

## Proposal

Four cuts, one F-block and one commit each, in the order below. Each cut keeps the thing that does
the check and removes only the repeat: the area validator still ticks every task, the add-plan
readback still runs, the Final Review still reads every fix diff, and `/add-review` still runs its
area reviewers, build, gates and QA.

## Scope

### Includes

- **F1** [product] — Cut 2, remove the build readback.
  - `framwork/.codeadd/commands/add-build.md`: drop `- agent: readback-agent` from `uses:`; delete STEP
    `add-build.read-plan-cold` with its dispatch, the `Readback:` ledger lines and its resume/fallback
    blocks; the preflight intro says the blocks that remain (two, not three); drop "the readback
    outcome" from STEP `add-build.rulings-i-made`.
  - `framwork/.codeadd/skills/add--review-discipline/SKILL.md`: delete the "one site gets a single
    dispatch" paragraph naming `/add-build`'s readback at 10.0.4; the by-site table keeps only the
    `/add-plan` row and its intro says one site; delete the rationalisation row "add-build's readback
    diverged…". `readback-agent` and `add--feature-readback` stay in its `uses:` (add-plan still uses them).
  - `framwork/.codeadd/skills/add--subagent-driven-development/SKILL.md`: drop the `Readback: matches …`
    line from the canonical-format example.
  - `framwork/.codeadd/skills/add--ecosystem/SKILL.md`: the `readback-agent` and `add--feature-readback`
    consumer cells name `add-plan` only; the `add--review-discipline` row stops saying "three sites".
  - `framwork/.codeadd/commands/add-new.md` (~408): "It names the sites that dispatch a readback" becomes
    singular — "It names the one site that dispatches a readback, `/add-plan`".
  - `cli/tests/product-close-out-parity.test.js`: remove L11.1–L11.8 (commit carries one `Test-Removed:`
    trailer per removed name). Must NOT lose L12.x — `add--review-discipline` still names `@readback-agent`.
  - New `cli/tests/lighter-add-build.test.js`, describe `F1`: the negative assertions in L1.1–L1.4.
- **F2** [product] — Cut 1, validator once per area in TASKS MODE.
  - `framwork/.codeadd/commands/add-build.md`:
    - The COMMIT CONTRACT invariant (`:99`) splits by mode: in TASKS MODE a task commits once the build
      passes and the task's `Verify` command passes; in DEVELOPMENT and CORRECTION MODE the commit still
      waits for the area validator. The VALIDATOR MANDATORY invariant (`:95`) already reads "After each
      area implementation" and is not edited.
    - TASKS MODE flow step 5 becomes: per task, record BASE → brief → implementer → build gate → commit →
      ledger line. A new step: after the area's last task, ONE validator over the area's committed range
      `AREA_BASE..HEAD`, packaged by `review-package.cjs`, `MODE: task`. Its violations become routed
      rows for one normal fix round (Correction Dispatch), committed and re-reviewed.
    - **`AREA_BASE` is defined**: the `BASE` recorded before the area's first task, which is the `BASE` of
      that area's first `T0N: complete (commits BASE..HEAD, …)` ledger line — so a resume recomputes it
      from the ledger, never from memory.
    - "Subagent prompt addition for TASKS MODE" (`:563-578`) carries ONE brief per dispatch, matching
      flow step 5 (decision P2).
    - STEP `add-build.validate`'s "runs on the WORKING TREE" paragraph becomes per mode: working tree in
      DEVELOPMENT/CORRECTION, the area package in TASKS MODE.
    - STEP `add-build.commit` gates 1–2 (validator returned, `SPEC_STATUS`) apply in DEVELOPMENT and
      CORRECTION; in TASKS MODE gate 3 (build) plus the task's `Verify` is the gate, and `SPEC_STATUS`
      `INCOMPLETE` from the area validator routes rows to the fix round instead.
    - Ledger shapes, added to STEP 16.2's table: `T0N: complete (commits BASE..HEAD, BUILD_STATUS=pass, validation at area end)`
      and `<area>: validated (commits AREA_BASE..HEAD, N violations, SPEC_STATUS=<value>)`.
    - Resume rule: an area whose tasks all carry `complete` but no `<area>: validated` line resumes at
      its validator, never at a task.
    - Must NOT lose: STEP `add-build.merge-ticks` stays the sole `tasks.md` writer and still waits for every
      area report (WAIT-ALL); `${AREA_FILES}` still comes from the implementer's report.
  - `framwork/.codeadd/skills/add--subagent-driven-development/SKILL.md` steps 5–6: name the TASKS MODE
    variant — review once per area on the committed range, commit per task gated by build — so the
    definition and `add-build` agree (the skill is the definition, `add-build.md:53`).
  - `cli/tests/lighter-add-build.test.js`, describe `F2`: L1.5–L1.9.
  - **Produces:** ledger line shape `<area>: validated (commits AREA_BASE..HEAD, N violations, SPEC_STATUS=<value>)`
- **F3** [product] — Cut 3, no re-review on build-only fix rounds.
  - `framwork/.codeadd/commands/add-build.md`:
    - Correction Dispatch (`:645`) and STEP `add-build.re-review`: a round whose routed rows ALL come
      from build errors or from `BLOCKED` synthesis (STEP `add-build.merge-ticks`) is gated by build
      green + test command green (build only when no test runner exists) and gets no re-review. A round
      with any reviewer-sourced row — area validator, Final Review, `/add-review` `## Fix Routing` — is
      re-reviewed as today.
    - Ledger shape `T0N: fix round N/3 (build-only — build green, tests green; commits FIX_BASE..HEAD)`,
      added to STEP 16.2's table.
    - The Compliance Gate integrity check (`:1157`) accepts a `build-only` round with no re-review line
      and still refuses any other fix round without one.
    - `## Final Review`'s CORRECTION branch: when the LAST fix round was build-only, or no round was
      re-reviewed, it runs the normal `MODE: feature` review instead of taking the verdict from an
      earlier re-review. Otherwise code changed by a later build-only round would reach the verdict
      unread.
    - Error Handling rows stay correct.
  - `framwork/.codeadd/skills/add--subagent-driven-development/SKILL.md` §7 "Every fix round is re-reviewed",
    §11's gate sentence and the Validation Checklist line: state the build-only exception and scope it to
    `/add-build`, naming the reason (its Final Review reads the whole unit range later). Must NOT change
    the hotfix snapshot path.
  - `framwork/.codeadd/skills/add--review-discipline/SKILL.md` (`:99`): `MODE: re-review` is counted per
    fix round that carries a reviewer-sourced row.
  - `cli/tests/lighter-add-build.test.js`, describe `F3`: L1.10–L1.13.
  - **Consumes:** `<area>: validated (commits AREA_BASE..HEAD, N violations, SPEC_STATUS=<value>)` (F2) — the area validator's rows are reviewer-sourced, so its fix round keeps re-review.
- **F4** [product] — Cut 4, `/add-review` does not repeat the Final Review.
  - `framwork/.codeadd/skills/add--review-discipline/SKILL.md` § The Build's Final Review step 6: right
    after the verdict line, write `Final review head: <sha>` (`git rev-parse HEAD` at that moment) through
    `build-ledger.cjs`. § Where a Verdict May Reach Disk names it as part of the ledger record.
  - `framwork/.codeadd/commands/add-build.md`: `## Final Review` and STEP 16.2's table carry the
    `Final review head:` line; STEP `add-build.next-command` drops "with `/add-review ${FEATURE_ID}` named
    as optional". `Blocker suggestion:` lines may still name `/add-review` (decision P7).
  - `framwork/.codeadd/fragments/qa-pipeline/add-build.md` (~61-62): drop the "Re-running add-review is
    optional" suggestion; the "No `## Fix Routing` → re-run add-review" remedy stays (it is a remedy, not a
    next step).
  - `framwork/.codeadd/commands/add-review.md`: a new sub-step after STEP `add-review.bootstrap` sets
    `BUILD_REVIEW_COVERS=yes` only when, for every in-scope ledger (`build-ledger.md` of the feature, or
    of each `SFxx` in `REVIEW_SCOPE`): the last `Final review:` line is `passed` or `ruled N`; a
    `Final review head: <sha>` line follows it; `git diff --name-only <sha>..HEAD` excluding
    `docs/features/${FEATURE_ID}` is empty; and `git status --porcelain` shows nothing outside that
    folder. On `yes`: the base spec-audit sub-steps are skipped and Gate 3 counts as met, the report
    records `Spec audit: SKIPPED — covered by Final review: <verdict> at <sha>`, and the OWASP dispatch is
    skipped with the same reason. The `tdd-pipeline.spec-audit` slot (test-spec coverage), area
    reviewers, build, gates and QA still run. An old ledger with no head line → `no`, full review.
  - `framwork/.codeadd/skills/add--ecosystem/SKILL.md`: the `add-review` row says it skips the two audits
    when the build's Final Review covers the tree.
  - `scripts/tests/converge-gates.test.cjs`: a case where `Final review head: <sha>` follows a `passed`
    verdict and the gate still emits `GATE_REVIEW=ok`; and one after `blocked N` where the Blocker
    suggestions are still collected.
  - `cli/tests/lighter-add-build.test.js`, describe `F4`: L1.14–L1.19.

### Does NOT Include (important!)

- `converge-gates.cjs` — the head line is a separate line it ignores, so the script stays untouched.
- `add-hotfix` and its snapshot re-review.
- The `/add-plan` readback, `readback-agent`, `add--feature-readback`.
- `MAX_ATTEMPTS` or the round-3 model escalation.
- One implementer per area in TASKS MODE (P2-B) — a separate ticket if wanted.
- The internal sibling `workbench/skills/add-review-discipline` — the divergence is deliberate (`add--review-discipline/SKILL.md:29-44`).
- Router `add.md`.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| P1 — when the TASKS MODE validator runs | Commit per task gated by build + `Verify`; one validator per area over `AREA_BASE..HEAD`; its rows feed a normal, re-reviewed fix round | Intent Cut 1; staging without committing breaks per-task commits and ledger resume |
| P2 — per-task vs per-area implementer | Per task; fix the prompt text that hands a whole area | Clears a contradiction without new scope |
| P3 — build-only round ledger and gate | `fix round N/3 (build-only — …)`; build + tests green; scoped to add-build; CORRECTION with only build-only rounds runs the normal Final Review | Intent Cut 3; hotfix has no later whole-range read |
| P4 — how "no commit after Final review" is known | A separate `Final review head: <sha>` line, plus the intent's `git diff <sha>..HEAD` excluding feature docs, plus a clean tree | **Departs from intent Cut 4**, which appends ` at <sha>` to the verdict line and says the regex is prefix-anchored. It is not: `converge-gates.cjs:334` anchors the NNN match at the end of the line, so a suffix makes `finalNnn` empty and the gate emits `GATE_REVIEW=broken`. A separate line keeps the grammar and the script untouched. User confirmed P4-A on 2026-10-08 |
| P5 — which verdicts count | `passed` and `ruled N` | Intent; gate 1 already treats both as ok |
| P6 — what add-review still runs | Area reviewers, build, gates, QA, the tdd test-spec coverage; the report records the skip | The Final Review covers neither gates nor test-spec coverage |
| P7 — next step | `/add-done` only; `Blocker suggestion:` may still name `/add-review` | A blocker suggestion answers a blocker, not "what next" |
| Epic scope in add-review | Skip only when every in-scope SF ledger qualifies | One uncovered SF means part of the diff was never reviewed by a Final Review |
| Fix attempts | Stay 3 | Ticket notes, intent |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/commands/add-build.md` | product | modify | F1, F2, F3, F4 |
| `framwork/.codeadd/commands/add-review.md` | product | modify | F4 |
| `framwork/.codeadd/commands/add-new.md` | product | modify | F1 — one sentence goes singular |
| `framwork/.codeadd/skills/add--review-discipline/SKILL.md` | product | modify | F1, F3, F4 |
| `framwork/.codeadd/skills/add--subagent-driven-development/SKILL.md` | product | modify | F1, F2, F3 |
| `framwork/.codeadd/skills/add--ecosystem/SKILL.md` | product | modify | F1, F4 |
| `framwork/.codeadd/fragments/qa-pipeline/add-build.md` | product | modify | F4 |
| `cli/tests/product-close-out-parity.test.js` | product | modify (remove L11.x) | F1 |
| `cli/tests/lighter-add-build.test.js` | product | create | F1–F4 |
| `scripts/tests/converge-gates.test.cjs` | internal path, product subject | modify | F4 — the test of a product script; tagged with F4 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Before F1, write every level in the working tree and run it once against
the current tree; record the RED/guard result per item as a ledger line. Do not commit them yet:
each F-block's commit carries only its own describe block (and L2 with F4), so every commit is green.

### L1 — Text contract, `cli/tests/lighter-add-build.test.js` (RED → GREEN)

F1:
1. `add-build.md` contains no `@readback-agent`, no `agent: readback-agent`, no `Readback:`, and no `STEP add-build.read-plan-cold`. *RED: all four present today.*
2. `add--subagent-driven-development` has no line matching `^Readback: `. *RED: line 145.*
3. `add--review-discipline` does not name `/add-build` as a readback site (no `10.0.4`, no "add-build's readback"). *RED: lines 105, 122, 281.*
4. `add--ecosystem`'s `readback-agent` row does not name `add-build`. *RED: lines 209, 252.*

F2:
5. The TASKS MODE section says the validator runs once per area, after the area's last task. *RED: flow step 5 dispatches it per task.*
6. The COMMIT CONTRACT names the build as the TASKS MODE commit gate and keeps the validator gate for DEVELOPMENT/CORRECTION. *RED.*
7. `add-build.md` carries the `<area>: validated (commits` ledger shape and the area-validator resume rule. *RED.*
8. The TASKS MODE prompt addition no longer says "Execute ALL tasks". *RED.*
9. `add--subagent-driven-development` steps 5–6 name the per-area TASKS MODE variant. *RED.*

F3:
10. `add-build.md` carries `fix round N/3 (build-only` and states it gets no re-review. *RED.*
11. The Compliance Gate integrity check accepts `build-only` rounds and still refuses other un-re-reviewed rounds. *RED.*
12a. `## Final Review`'s CORRECTION branch names both triggers for the normal review — last round build-only, or no round re-reviewed. *RED.*
12. `add--subagent-driven-development` §7 scopes the exception to `/add-build`; `add-hotfix.md` still contains its `MODE: re-review` snapshot dispatch. *RED for the first half.*
13. `MAX_ATTEMPTS = 3` still appears in `add-build.md`; no `MAX_ATTEMPTS = 2` or `4` anywhere in it. *Guard — GREEN today, must stay GREEN.*

F4:
14. `add--review-discipline` and `add-build.md` both name the `Final review head:` line. *RED.*
15. `add-build.md` STEP `add-build.next-command` has no `/add-review` outside `Blocker suggestion`. *RED: line 1580-1581.*
16. `fragments/qa-pipeline/add-build.md` no longer says re-running add-review is optional. *RED: line 61.*
17. `add-review.md` carries `BUILD_REVIEW_COVERS`, the four conditions, the `Spec audit: SKIPPED` record, and the OWASP skip. *RED.*
18. `add-review.md` still contains the `tdd-pipeline.spec-audit` slot and the area-reviewer dispatch unconditionally. *Guard.*
19. `add.md` still matches `/\/add-review[^\n]*optional|optional[^\n]*\/add-review/i`. *Guard (L4.3).*

### L2 — Script behaviour, `scripts/tests/converge-gates.test.cjs`

1. Ledger `Final review: passed (after review-000)` then `Final review head: abc1234` → `GATE_REVIEW=ok`. *GREEN today by construction; written to lock it.*
2. Ledger `Final review: blocked 1 (after review-000)`, `Final review head: abc1234`, `Blocker suggestion: FR-1 — /add-plan F0001` → `GATE_REVIEW` blocked with the suggestion collected.

### L3 — Build and suite

1. `node scripts/build.js` exits 0; the graph gate passes; `artefact-graph.json` has no `add-build → readback-agent` DISPATCHES edge and keeps `add-plan → readback-agent`.
2. `node scripts/run-tests.js` (all suites, in the container) is green, including `optional-review-build-final-review`, `cut-review-and-build-loop-cost` and `product-close-out-parity` L12.x.
3. `scripts/test-loss-guard.cjs` passes: every removed L11 name has its `Test-Removed:` trailer.

### L4 — Behavioural acceptance (read-through)

1. Walk a 2-area TASKS MODE build with 3 tasks per area through the edited `add-build.md`: validator dispatches = 2, readback = 0; a build-only fix round leaves a `build-only` line and no re-review, and the Compliance Gate passes it. Then a CORRECTION run with round 1 re-reviewed and round 2 build-only: the Final Review runs `MODE: feature`.
2. Walk `/add-review` on a ledger with `Final review: ruled 1 (after review-000)` + head = HEAD and a clean tree: no OWASP dispatch, spec audit recorded SKIPPED; then the same with one source commit after the head: full review.

**RED expectations against the current tree:** L1.1–L1.12 and L1.14–L1.17 fail today; L1.13, L1.18, L1.19, L2.1 are guards.
**GREEN = all levels pass after F1–F4.**

---

## Execution Order

F1 [product] → F2 [product] → F3 [product] → F4 [product]

- **F1 first** — it is self-contained (delete a step, align four texts), and it shrinks `add-build.md` before the larger edits.
- **F2 before F3** — F3's rule "a reviewer-sourced row keeps re-review" includes the area validator's rows, which F2 creates; both edit the commit/Compliance sections, so F3 is written on F2's text.
- **F4 last** — it edits `## Final Review` and the next-command step after F3 settled the CORRECTION branch of `## Final Review`.
- Every boundary leaves the repo green: each F-block lands with its own describe block of L1 and runs the full suite before its commit.
- F1's commit carries the `Test-Removed:` trailers.

## Reviewer Handoff

For each F-block the build leaves in the ledger: the files touched, the L-level items covering it and
their pass state, and any departure from this plan with the reason.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED.
2. A leftover sentence still saying the validator runs per task, or that every fix round is re-reviewed, in a section F2/F3 did not list — grep `add-build.md` and `add--subagent-driven-development` for "after each task", "per task", "Every fix round".
3. The TASKS MODE resume path: a ledger with all of an area's tasks `complete` and no `validated` line must resume at the validator.
4. `add-review`'s skip on an epic where one in-scope SF ledger lacks a head line — it must NOT skip.
5. Any edit to `converge-gates.cjs` or `add-hotfix.md` — both are out of scope.

---

## Next Steps

/add-framework--build docs/plans/2026-10-08T211926-PLAN--lighter-add-build.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-08 | Initial creation |
| 2026-10-08 | Review fix-then-ok applied: A1 Final Review CORRECTION trigger covers a last build-only round (+ L1.12a, L4.1); A2 `AREA_BASE` defined from the ledger; A3 RED run up front, describes committed per F-block; A4 Layers line names the `scripts/tests/` suite with the AGENTS.md reason; N1 add-new edit made concrete; N2 `:95` left untouched |
| 2026-10-08 | Status implemented. Commits b077f0d (F1), 5506cee (F2), 6dcbe09 (F3), e6bb42f (F4), bdcea9b (final review fixes); changelog docs/changelog/2026-10-08T215212-refactor-lighter-add-build.md |
