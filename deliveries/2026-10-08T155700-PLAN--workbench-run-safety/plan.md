# Plan: Workbench run safety — needs-approval stops, test-loss guard, board writes in no-push runs

> **Status:** implemented
> **Layers:** internal
> **Type:** cross-cutting
> **Created:** 2026-10-08
> **Delivery:** confirm
> **Ticket:** 0029B

---

## Objective

[from conversation, no design document] A headless run of an `add-framework--*` stage that reaches a
stop waiting on the user ends with `status: needs-approval` in the `--json-schema` result and can be
resumed with `claude -c` or `--resume`; no existing test can leave a branch through build or done
without an explicit note; and a build told not to push still moves its ticket to `doing` and
`in-review` on `main`'s board.

**When this build is done:** the internal pipeline has a native test-loss guard that build and done
both gate on, a ticket rule that no longer ties `in-review` to a PR or a "do not push" instruction to
the board, and a schema description plus call doc that let a headless caller tell a waiting run from a
finished one and resume it — with no JSON instruction added to any stage prompt.

**Ticket done when:** A command stops with status needs-approval in a result block that passes the --json-schema check, and resumes via -c or --resume; the test-loss guard fails when an existing test name disappears from the branch without a note and passes otherwise; a build run told not to push still leaves doing and in-review on main's backlog.

## Context

Ticket 0029B, opened after 0028B (agent-friendly workbench) and 0030B (result block via
`--json-schema`). 0028B's plan named this work in its "Does NOT Include": a needs-approval checkpoint,
`--resume`, and the test-loss guard. 0030B moved the result block out of the prompts entirely: the
caller passes the schema, and no stage prompt carries JSON instructions.

The test-loss origin: commit `4cccd00` (`fix/test-transport-tar`) rewrote
`scripts/tests/test-transport.test.cjs` and dropped 3 tests. Only a human review caught it; `25aa619`
restored them.

No design document and no intent file exist. Every decision below was taken at this plan's STEP 4
questionnaire (Q1–Q5, all on the recommended option) and is recorded in Validated Decisions.

## Global Constraints

- No `add-framework--*` skill or command contains `output-mode.js`, `result block` or `` `both` mode `` (scripts/tests/result-block.test.cjs, "no add-framework--* artefact carries the 0028B output-mode wording")
- No markdown under `workbench/` mentions `CODEADD_OUTPUT`, `output-mode.js` or `codeadd-result` (scripts/tests/result-block.test.cjs)
- `result-block.md` does not restate the field table and has no `## Headless callers` section (scripts/tests/result-block.test.cjs)
- `result-block.schema.json` stays the single contract: every property keeps a non-empty `description`, `additionalProperties: false`, and `STATUSES` stays `['done', 'stopped', 'needs-approval', 'failed']` (scripts/tests/result-block.test.cjs)
- The Ticket keeps naming all seven writes ticked, `in-review` included, and keeps the phrase `` `work_id` stop `` (cli/tests/board-phase-writes.test.js L11.5)
- Edit `workbench/`, never `.claude/` or the other built trees (AGENTS.md, Internal Layer)
- `node scripts/build.js` with `ADD_GRAPH_WARNINGS=1` exits 0 and emits no new warning (add-framework--build STEP 6)
- Tests run through `node scripts/run-tests.js`, never a native runner (scripts/run-tests.js header: "All local hosts use Linux Docker, never native fallback")
- Root scripts take no dependency: Node built-ins only (AGENTS.md — the workbench half "takes no dependency")

## Problem

1. **A waiting run looks like a finished one.** A headless caller gets a validated object, but nothing
   tells the model, at the moment it fills it, that a `[STOP]` waiting on the user is `needs-approval`,
   and nothing tells the caller how to continue the same session.
2. **A test can disappear silently.** Neither build nor done compares the tests on the branch with the
   tests at the branch point. `4cccd00` proves it happens.
3. **The board falls behind in no-push runs.** An agent told "do not push" reads it as covering the
   board write too, and skips `doing`. And the current rule writes `in-review` only when a PR opens,
   so a build that ends on "no" leaves its ticket in `doing` until the close-out — days, in a headless
   flow.

## Proposal

Three independent parts, one branch, ordered so the guard lands first and protects the rest.

- **Guard** — a native script compares test names between the merge-base with `main` and `HEAD`,
  statically, and fails on any lost name not covered by a `Test-Removed:` commit trailer. Build runs
  it before publishing; done runs it as a gate.
- **Board** — `in-review` is written whenever the build reaches STEP 10 with every F-block complete,
  whatever STEP 9 answered. The Ticket states that a "do not push" instruction covers the branch and
  the PR, never the board write.
- **Approval** — the `needs-approval` description in the schema says what the model must recognise (a
  stop waiting on the user) and how the run continues; `result-block.md` documents the resume. A real
  headless smoke proves both.

## Scope

### Includes

#### T1 — Test-loss guard

- **F1** [internal] — `scripts/test-loss-guard.cjs` (new): reads the test names of every tracked test
  file at a base ref and at a head ref, without running any test, and reports the names that
  disappeared.
  - Base defaults to `git merge-base origin/main HEAD` (falling back to `main` when `origin/main` is
    absent); head defaults to `HEAD`. `--base <ref>` and `--head <ref>` override. Committed trees only:
    the working tree is never read. **The script never fetches.** A stale `origin/main` can make a test
    that `main` itself deleted read as lost; the header documents that case, and the callers (F2, F3)
    run `git fetch origin main` before calling it.
  - Test files: tracked paths matching `*.test.{cjs,js,mjs,ts,tsx}` or `*.spec.{js,ts}`, outside
    `node_modules`.
  - A name is the first argument of `describe`, `it` or `test`, and of their `.skip`, `.only` and
    `.todo` forms. For `.each(TABLE)('name', fn)` the name is the first argument of the SECOND call —
    the first is the data table. A string or template literal is compared by its inner text, with the
    outer `'`, `"` or `` ` `` removed, so a quote-style change is not a loss; any other expression is
    compared by its source text. Names are compared per file as a multiset, so a duplicated name
    losing one copy counts.
  - A renamed file (`git diff -M` between base and head) carries its names to the new path. A name
    gone from one file that appears, new, in another file on head is reported `MOVED`, not lost.
  - The note is a commit trailer on any commit in `base..head`, read with
    `git log base..head --format=%(trailers:key=Test-Removed,valueonly)`:
    `Test-Removed: <path>::<name> — <reason>`, or `Test-Removed: <path>::*` for a whole deleted file.
    `<name>` is the same normalised name the script reports; the reason starts after the LAST ` — `.
  - Must NOT run tests, read the network, or write any file. Known limit, stated in its header: cases
    generated in a loop from data (for example `scripts/tests/native-script-cases.json`) are invisible
    to a static read.
  - **Produces:** `test-loss-guard.cjs` emits `GUARD=pass|fail`, `BASE=<sha>`, `TESTS_BASE=<n>`,
    `TESTS_HEAD=<n>`, `LOST=<n>`, `NOTED=<n>`, `MOVED=<n>`, one `LOST_TEST=<path>::<name>` line per
    unnoted loss and one `NOTED_TEST=<path>::<name>` line per noted one; exit 0 on pass, 1 on fail,
    2 on caller error (bad ref, not a git repository).
  - **Produces:** the trailer key `Test-Removed`.
- **F2** [internal] — `workbench/skills/add-framework--build/SKILL.md`: STEP 9 runs the guard BEFORE
  the publish question, in both states (no PR and PR exists), after `git fetch origin main`.
  `GUARD=fail` is a stop: the build either restores the test or — only when an F-block of the plan
  decided the removal — records a ruling and adds one empty commit
  (`git commit --allow-empty`) carrying the `Test-Removed:` trailer and naming that F-block, then
  re-runs. No commit is amended. A trailer the plan never decided is a ruling the build may not
  make alone. On `main` (the existing no-publish case) the guard still runs and its result goes in the
  report. STEP 10's report names every `NOTED_TEST`. Must NOT lose: STEP 9's two behaviours and its
  stop-kind table, which stay as they are.
  - **Consumes:** `GUARD=pass|fail` (F1), `LOST_TEST=<path>::<name>` (F1), `NOTED_TEST=<path>::<name>` (F1), the trailer key `Test-Removed` (F1)
- **F3** [internal] — `workbench/skills/add-framework--done/SKILL.md`: a test-loss gate as the last
  block inside 2.2, after the fix gate and before 2.3 (CI), so it runs on the normal path and on
  `--fix`. It runs `git fetch origin main` first.
  `GUARD=fail` → report each `LOST_TEST` and STOP. On the recovery path (2.4, already merged) it does
  not run — there is no branch left to compare. On the resume path (2.5) it runs. STEP 9's report
  names every `NOTED_TEST`. Must NOT renumber the existing 2.x sections: 2.4 and 2.5 are cited by
  name elsewhere.
  - **Consumes:** `GUARD=pass|fail` (F1), `LOST_TEST=<path>::<name>` (F1), `NOTED_TEST=<path>::<name>` (F1)
- **F4** [internal] — `AGENTS.md`: one row in the Key files table for `scripts/test-loss-guard.cjs`,
  pointing at its header for usage and exit codes, per the existing "A script's contract" convention.
  No other change to `AGENTS.md`.

#### T2 — Board writes in no-push runs

- **F5** [internal] — `workbench/skills/add-plan-authoring/SKILL.md`, **The Ticket**:
  - The `add-framework--build` STEP 10 row and the paragraph under the table change from "only when a
    PR was opened or already existed" to: `in-review` is written whenever the build reaches STEP 10
    with every F-block of the plan complete, whatever STEP 9 answered. The reason replaces the old
    one: on "no", the close-out may run days later, and the work is finished and waiting on review.
  - A new rule, in the section's IF/DO form: a "do not push" instruction covers the branch and the
    PR; it never skips a board write. `backlog-commit.cjs` carries only `docs/backlog.jsonl` to
    `main` through its own route, and the stage's report names each write's `SHA`.
  - The HTML comment under `## The Ticket` records that the internal `in-review` condition now deliberately differs
    from the product's `add-build` (`lifecycle.md`, `Publish:` `pr-opened`/`pr-updated` only). The
    product side is not changed.
  - Must NOT lose: the seven ticked writes, the `work_id` stop, the degradation table.
  - **Produces:** the rule "`in-review` on every build that reaches STEP 10 with every F-block complete, whatever STEP 9 answered"
  - **Produces:** the rule "a do-not-push instruction never skips a board write"
- **F6** [internal] — `workbench/skills/add-framework--build/SKILL.md`: STEP 10's ticket paragraph
  states the new `in-review` condition and drops "'No' writes nothing"; STEP 5.1's `doing` paragraph
  carries the one-line do-not-push rule pointing at The Ticket; STEP 10's report line for the two
  writes drops "that STEP 9's answer skipped it". A build that stopped before the last F-block writes
  no `in-review`.
  - **Consumes:** the rule "`in-review` on every build that reaches STEP 10 with every F-block complete, whatever STEP 9 answered" (F5)
  - **Consumes:** the rule "a do-not-push instruction never skips a board write" (F5)

#### T3 — needs-approval and resume

- **F7** [internal] — `workbench/skills/add-final-report/references/result-block.schema.json`: the
  `status` description's `needs-approval` clause says the run reached a stop that waits on the user —
  a question, an approval, a push — and is continued in the same session with `claude -c` or
  `--resume`. The `next_step` description says that on `needs-approval` it carries the question the
  user must answer. No key, type or enum changes; `v` stays `1`.
  - **Produces:** the `needs-approval` description naming `-c` and `--resume`
- **F8** [internal] — `workbench/skills/add-final-report/references/result-block.md`: a new section on
  resuming a stopped run — read `.session_id` from the envelope, continue with
  `claude -p "<answer>" --resume <session_id> --output-format json --json-schema "<file content>"` or
  `-c` for the most recent session in the same directory, and pass `--json-schema` again on every
  call. bash and PowerShell forms, as the existing How to call section has. Must NOT restate the
  field table or the status meanings — it points at the schema.
  - **Consumes:** the `needs-approval` description naming `-c` and `--resume` (F7)

### Does NOT Include (important!)

- Per-stage permission profiles (`--allowedTools` / `--disallowedTools`) — the ticket puts them out
  of scope; the environment's guard hook replaced them.
- Any JSON or result instruction in a stage prompt — 0030B removed them deliberately and a test holds it.
- The guard in CI — a contributor who does not know the trailer would be blocked; a later ticket if wanted.
- Any change to `framwork/.codeadd/scripts/backlog-commit.cjs` — it already pushes to `main` on its own route.
- Any change to `scripts/run-tests.js` — it dispatches suites to the container; the guard is a git
  comparison and stays a separate script.
- Any change to the product `add-build` `in-review` rule or `lifecycle.md`.
- Running test suites to collect names — the comparison is static.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Q1 — how does `needs-approval` reach the result with no prompt instruction? | Sharpen the schema's `needs-approval` description, document resume in `result-block.md`, prove with a headless smoke | The model reads the schema when filling the object; respects 0030B's "prompts carry no JSON" |
| Q2 — where does the explicit note live? | `Test-Removed:` commit trailer | Works on a plan and on `--fix`, which has no plan — the origin case was a fix branch |
| Q3 — where does the guard run? | Build (before STEP 9) and done (STEP 2 gate, `--fix` included); not CI | What the ticket asks; CI would block contributors unaware of the trailer |
| Q4 — `in-review` on a STEP 9 "no"? | Yes: on every build that reaches STEP 10 with all F-blocks complete | The work is finished and waiting; the old reason assumed done runs immediately, which a headless flow breaks |
| Q5 — how is the no-push board write proven? | Text sentinel tests now; behavioural proof from the first headless no-push build after merge | A full throwaway build would need a ticket only the user can create |
| Base of the comparison | Merge-base with `main`, not `main`'s tip | A test added on `main` after the branch point would otherwise read as lost |
| How names are read | Statically, from the source of the first argument | Running every suite twice costs the bats-era hour the container work removed |
| Who may write a trailer during a build | Only when a plan F-block decided the removal | Otherwise the guard is bypassed by the agent it guards |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| A guard with no test run, seconds to execute | Loop-generated cases are invisible to it |
| `in-review` that matches the work's real state | Symmetry with the product's `add-build` rule |
| A board that follows the work in headless runs | "Do not push" no longer means nothing reaches the remote — the board still does |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| An operator says "do not push" meaning nothing remote, and the board still reaches `main` | Medium | F5 states exactly what reaches `main` (only `docs/backlog.jsonl`) and the report names each `SHA` (F6) |
| The agent writes a trailer to silence the guard | Medium | F2 allows a trailer only when a plan F-block decided the removal; F2/F3 reports list every `NOTED_TEST` |
| A static parser misreads a name (template literal, multi-line call) and reports a false loss | Medium | L1 covers template literals and multi-line calls; L4.1 replays `4cccd00`; a false loss fails loudly rather than silently |
| The model still answers `done` on a waiting stop | Low | L4.2 headless smoke asserts `needs-approval` on a real stop |
| Part C's behaviour is not proven before close-out | High | Stated in Q5; the close-out of this plan reports it as open (Reviewer Handoff gap 3) |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `scripts/test-loss-guard.cjs` | internal | create | The guard (F1) |
| `scripts/tests/test-loss-guard.test.cjs` | internal | create | L1/L4.1 for F1 |
| `scripts/tests/ticket-writes.test.cjs` | internal | create | L2 sentinels for F5/F6, and for F2/F3 calling the guard |
| `scripts/tests/result-block.test.cjs` | internal | modify | L3 assertions for F7/F8 |
| `workbench/skills/add-framework--build/SKILL.md` | internal | modify | F2, F6 |
| `workbench/skills/add-framework--done/SKILL.md` | internal | modify | F3 |
| `workbench/skills/add-plan-authoring/SKILL.md` | internal | modify | F5 |
| `workbench/skills/add-final-report/references/result-block.schema.json` | internal | modify | F7 |
| `workbench/skills/add-final-report/references/result-block.md` | internal | modify | F8 |
| `AGENTS.md` | internal | modify | F4 |
| `docs/changelog/<ts>-add-workbench-run-safety.md` | internal | create | build STEP 8 |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN. Run every suite with
`node scripts/run-tests.js scripts` (or `framework` for the full gate).

### L1 — The guard, on temporary repositories (RED → GREEN)

`scripts/tests/test-loss-guard.test.cjs`. Each case builds a throwaway git repository in a temp
directory and removes it at the end.

1. No test file changed → `GUARD=pass`, `LOST=0`, exit 0.
2. One `test('a')` deleted from a file → `GUARD=fail`, `LOST=1`, `LOST_TEST=<path>::'a'`, exit 1.
3. Same as 2 with a commit trailer `Test-Removed: <path>::'a' — replaced` → `GUARD=pass`, `NOTED=1`,
   one `NOTED_TEST` line, exit 0.
4. A whole test file deleted with `Test-Removed: <path>::*` → pass; without it → fail with one
   `LOST_TEST` per name in the file.
5. A test file renamed with `git mv` and unchanged → pass, `LOST=0`.
6. A test moved verbatim to another file → pass, `MOVED=1`, `LOST=0`.
7. `main` gains a test after the branch point; the branch never had it → pass (merge-base).
8. `test('a')` → `test.skip('a')` → pass. A duplicated name losing one copy → fail, `LOST=1`.
9. A template-literal name and a call split over several lines are both read as one name each.
   `it.each(X)('%s name', fn)` is read as `%s name`. `test('a')` → `test("a")` → pass.
10. Uncommitted deletion in the working tree → pass (committed trees only).
11. `--base` naming a ref that does not exist → exit 2.

*RED today: `scripts/test-loss-guard.cjs` does not exist.*

### L2 — The rules, as text (RED → GREEN)

`scripts/tests/ticket-writes.test.cjs`, reading the `workbench/` sources:

1. The Ticket section of `add-plan-authoring` does not contain "only when a PR was opened or already
   existed", and states that a do-not-push instruction never skips a board write. *RED today: the
   first phrase is there and the second rule is absent.*
2. `add-framework--build` STEP 10 does not contain `"No"\nwrites nothing` / "\"No\" writes nothing",
   and STEP 5.1 points at the do-not-push rule. *RED today.*
3. `add-framework--build` STEP 9 and `add-framework--done` STEP 2 both name `test-loss-guard.cjs` and
   `GUARD=fail`. *RED today.*
4. `cli/tests/board-phase-writes.test.js` L11.5 still passes unchanged (run the `cli` suite).

### L3 — The schema and the call doc (RED → GREEN)

In `scripts/tests/result-block.test.cjs`:

1. The `status` description contains `needs-approval`, `claude -c` and `--resume`. *RED today.*
2. `result-block.md` contains `--resume`, `session_id` and `claude -c`, and still passes every existing
   assertion (no field table, no `## Headless callers`). *RED today for the three new needles.*
3. Every existing test in the file still passes — the schema keys, types and enums are unchanged.

### L4 — Behavioural acceptance

1. **The origin case, replayed.** `node scripts/test-loss-guard.cjs --base 4cccd00^ --head 4cccd00`
   prints `GUARD=fail`, `LOST=3`, three `LOST_TEST=scripts/tests/test-transport.test.cjs::…` lines,
   and exits 1. Record the output in the ledger.
2. **A real stop, headless, then resumed.** After the workbench rebuild
   (`node scripts/build-workbench.js`), from the repository root:
   `claude -p "/add-framework--plan add a one-line note to AGENTS.md about nothing" --output-format json --json-schema "<schema file content>"`.
   With no intent file, the plan's STEP 4 is a deciding stop on every delivery mode, so the run must
   stop there. Assert: `.structured_output` validates with `validateResultBlock`, its `status` is
   `needs-approval` and `needs_approval` is `true` (the plan stops at STEP 4 before writing anything).
   Then `claude -p "cancel; write nothing" --resume <.session_id> --output-format json --json-schema "<same>"`:
   its `.session_id` equals the first, its `.structured_output` validates and its `status` is
   `stopped` or `done`, and `git status --short` shows no new file under `docs/plans/`. Record both
   objects in the ledger. **One attempt, no retry until it passes.** A mismatch is recorded as a
   ruling with the raw objects and is a hard stop before STEP 9: it means the ticket's first
   `done_when` clause is unmet, and the user decides.
3. **This delivery's own tests.** `node scripts/test-loss-guard.cjs` on the finished branch prints
   `GUARD=pass`: this plan removes no test.
4. **No-push board write — deferred.** Proven by the first headless build run told not to push after
   this merges: the ticket of that plan must read `doing` and then `in-review` on `main`. This plan
   does not claim it; see Reviewer Handoff gap 3.

**RED expectations against the current tree:** L1 (script missing), L2.1–L2.3, L3.1–L3.2.
**GREEN = L1–L4.3 pass after F1–F8; L4.4 is the stated open item.**

---

## Execution Order

1. **F1** [internal] — the guard first: it is the only new code, and it then protects every later block.
2. **F2** [internal], **F3** [internal] — both consume F1's output.
3. **F4** [internal] — the `AGENTS.md` row, once the script exists.
4. **F5** [internal] → **F6** [internal] — the rule owner first, then the build that follows it.
5. **F7** [internal] → **F8** [internal] — the schema text, then the doc that points at it.
6. L4.2 — after F8 and a workbench rebuild, since the smoke runs the built skills.

Every boundary between T1, T2 and T3 leaves the repository working: each topic stands alone.

Per F-block beyond the layer default: after F2, F3, F5, F6, F7 and F8, run
`node scripts/build-workbench.js` and `node scripts/run-tests.js scripts`. After F5, also
`node scripts/run-tests.js cli` for L11.5.

## Reviewer Handoff

For each F-block the build must leave, in the ledger:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the plan section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves nothing.
2. The guard silenced by a trailer the plan never decided — `git log --format=%(trailers:key=Test-Removed)` on the branch is empty for this delivery, since the plan removes no test; in general every trailer names an F-block of the plan.
3. Ticket 0029B's third `done_when` clause (no-push board write) is not proven by this delivery — L4.4.
   The close-out must report it as open, not as met.
4. A stage edit that reintroduces the words `result block` into an `add-framework--*` skill — the
   existing test fails on it; F2/F3/F6 must describe the guard and the ticket without that phrase.

## References

- Ticket: 0029B on `docs/backlog.jsonl`
- Prior art: `2026-10-07T192430-PLAN--agent-friendly-workbench` (0028B — named this work out of scope),
  `2026-10-07T220115-PLAN--result-block-json-schema` (0030B — the schema as the single contract, no
  JSON in prompts)
- Origin of the guard: commits `4cccd00` and `25aa619`

---

## Next Steps

/add-framework--build docs/plans/2026-10-08T155700-PLAN--workbench-run-safety.md

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-10-08 | Initial creation |
| 2026-10-08 | Review fixes: `.each` name rule and quote normalisation (A1, A2); no fetch in the script, callers fetch (A3); done gate position inside 2.2 (A4); trailer on an empty commit with a ruling (A5); L4.2 one attempt and hard stop on mismatch (A6); `claude -c` needle (A7); handoff gap 2 reworded (A8) |
| 2026-10-08 | Implemented on feat/workbench-run-safety: commits 4dbbec6..3cc7df6 (F1-F8 and the review fixes) |
