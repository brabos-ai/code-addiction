# Plan: Vitest fixture scope — stop paying a full-tree copy in tests that never open it

> **Status:** implemented
> **Layers:** product
> **Type:** cross-cutting
> **Created:** 2026-09-11

---

## Context

The `cli/` suite takes 208 seconds serially on the Windows development machine. That number is not
spread across 44 test files. One file carries 55.7% of it, and it carries it for a reason that is
mechanical rather than architectural.

`cli/tests/qa-reachability.smoke.test.js` declares a `beforeEach` at line 56, outside every
`describe`. That hook copies `framwork/.claude` and `framwork/.codeadd` into a temporary directory,
walks all 332 markdown and JSON files in the copy rewriting CRLF, then deletes the tree in
`afterEach`. Five of its 43 tests open that directory. The other 38 read a built command file
straight out of `framwork/.claude` and assert on its text, and pay ~2.4 seconds each for a fixture
they never touch.

The measurements below were taken in this planning session, on this machine, with `NODE_OPTIONS`
cleared.

| Measure | Value |
|---|---|
| Serial wall time, whole suite | 208s |
| Sum of per-file durations | 190s |
| Tests | 1002 (999 pass, 1 skipped, 2 fail) |
| Test files | 44 |
| `qa-reachability.smoke.test.js` | 105.8s — 55.7% of all test time |
| Its median test | 2387ms |
| Its tests that open the fixture root | 5 of 43 |
| `injection-exclusivity.integration.test.js` | 29.4s across 12 tests |
| `graph-query.test.js` | 27.2s across 32 tests, 2 of them red |
| Top three files combined | 85.5% of all test time |
| Fixture cost, measured in isolation | copy 354ms + normalize walk 673ms + delete 145ms |
| Files the normalize walk rewrote | 0 of 332 |
| CI, whole workflow, both jobs | 55s to 63s |

Two prior findings are corrected here rather than restated.

**The comment in `cli/vitest.config.js` no longer describes the code.** It says `build.test.js` writes
provider output into the real tree and that the injection round-trips enable and disable injection
into `framwork/.claude/**`. Neither is true today. `build.test.js` has a `redirected()` helper that
sends every write to a temp directory, and all four round-trip suites copy the tree before touching
it. They only read the real tree, and concurrent readers do not produce EBUSY.

**Turning `fileParallelism` back on was tested and rejected on evidence.** A full parallel run
finished in 153s with 12 failures. None was EBUSY. All were timeouts in files that spawn a
subprocess, under CPU and disk contention, and `qa-reachability` itself got slower, 105.8s to 149.3s,
because twelve workers fought over the same disk. Serial stays. The comment explaining why gets the
cause it actually has.

There is no design document. The decisions are carried inline below.

## Global Constraints

- `cd cli && npx vitest run --no-file-parallelism` — serial or nothing (`add-framework-product-layer`, the cli suite)
- "**Serial is not a preference.** Parallel workers race on shared fixtures and report failures that vanish serially. Never accept a green parallel run as proof." (`add-framework-product-layer`)
- "**If stdout carries `Debugger listening on ws://…`**, an editor injected `NODE_OPTIONS`. Clear it (`unset NODE_OPTIONS VSCODE_INSPECTOR_OPTIONS`) before trusting any assertion on stdout or stderr." (`add-framework-product-layer`)
- "Requires `node scripts/build.js` to have produced framwork/.claude + framwork/.codeadd/injection-points.json" (header of `qa-reachability.smoke.test.js` and `injection-roundtrip.integration.test.js`)
- Never register a `cli/` artefact in `provider-map.json`; never bump `cli/package.json` (`add-framework-product-layer`, Rules)
- No assertion is removed or weakened: the set of full test names is byte-identical before and after, and the count stays 1002 (STEP 4 decision, 2026-09-11)
- Baseline to beat, captured this session on this machine: 208s serial, 1002 tests, 2 failures in `graph-query.test.js`

## Problem

1. **A per-test fixture charged to tests that do not use it** — `qa-reachability.smoke.test.js` copies
   332 files, walks them, and deletes them, 43 times per run. Five tests open the result. The waste is
   roughly 90 of the file's 105.8 seconds, which is 43% of the entire suite.

2. **The same fixture written four times** — `qa-reachability.smoke`, `injection-exclusivity`,
   `injection-roundtrip` and `hotfix-review-0073` each carry their own `cpSync` plus manifest-writing
   `beforeEach`. Four copies of one idea drift, and a cost fixed in one stays in the other three.

3. **A normalize walk that rewrites nothing** — `normalizeLineEndings` reads all 332 copied files
   looking for CRLF on every single test. On this checkout it rewrote 0 of them. The work is correct
   and must stay, because a CRLF checkout needs it. It does not need to run 43 times against a source
   that never changes.

4. **Two red tests nobody can distinguish from a regression** — `graph-query.test.js` drives the real
   `delivered.sh`, which takes ~1.2s per call on Windows. Two of its `history` tests cross the default
   5000ms timeout and fail. A suite that is red on a clean tree forces every future build to baseline
   against `git stash` to tell noise from its own change.

5. **A config comment that argues from a world that no longer exists** — the stated cause of
   `fileParallelism: false` was fixed in the code and never removed from the comment. A wrong reason in
   place is an invitation to remove the setting and take 12 failures.

## Proposal

One shared fixture helper, then four call sites moved onto it, then the two unrelated cleanups.

The helper inverts when the copy happens. Today every test gets a fixture whether or not it asks. The
helper builds the normalized template **once per test file**, and hands out a private copy **only when
a test asks for one**. A test that never asks pays nothing. A test that asks still gets its own root,
so isolation between the five real users is unchanged.

Sequencing is by payoff. The helper lands first because everything consumes it. `qa-reachability`
lands second because it alone is 55.7% of the cost, so the first consumer commit is where the number
moves.

## Current State

| Artefact | Today | Depends on it |
|---|---|---|
| `cli/tests/qa-reachability.smoke.test.js` | top-level `beforeEach` at line 56, 43 tests, 105.8s | nothing |
| `cli/tests/injection-exclusivity.integration.test.js` | top-level `beforeEach` at line 248, copies every provider dir plus `.codeadd`, 29.4s | nothing |
| `cli/tests/injection-roundtrip.integration.test.js` | top-level `beforeEach` at line 37, 4 tests, 4.0s | nothing |
| `cli/tests/hotfix-review-0073.test.js` | `beforeEach` at line 176, already scoped inside a describe, 2.5s | nothing |
| `cli/tests/graph-query.test.js` | `history` describe drives real `delivered.sh`, 27.2s, 2 red | nothing |
| `cli/vitest.config.js` | `fileParallelism: false` plus a stale 25-line justification | the whole suite |
| `.claude/skills/add-framework-product-layer/SKILL.md` | mandates the serial run; impact depth-1 = 1, risk MEDIUM | `/add-framework--build` |
| `cli/tests/run-bats.test.js:277` | asserts that skill's serial line verbatim | nothing |

The last two are listed so the build knows they are deliberately untouched. The serial rule stays, so
the assertion that guards its wording stays green without edits.

## Scope

### Includes

- **F1** [product] — `cli/tests/helpers/tree-fixture.js` (new): the shared fixture helper. Builds a
  normalized template once per test file from a caller-named set of source directories, then hands a
  fresh private copy to any test that asks, and removes every copy it handed out. It must NOT hand two
  callers the same root, and must NOT leave a copy behind when a test throws. The filename must not
  match vitest's `include` glob, so nothing under `helpers/` is collected as a suite.
  - **Produces:** a per-file fixture handle exposing `root()` (create-on-demand, returns the copy's
    path) and `cleanup()` (removes every root handed out)

- **F2** [product] — `cli/tests/qa-reachability.smoke.test.js`: delete the top-level `beforeEach` copy
  and take the fixture through F1's handle inside the five tests that open it, at lines 73, 96, 170,
  229 and 391. It must NOT lose `warnSpy.mockClear()` for every test — two assertions at lines 82 and
  179 read that spy, and a spy left dirty by an earlier test makes them meaningless. It must NOT lose
  the `normalizeLineEndings` behaviour; that moves into the template F1 builds once.
  - **Consumes:** a per-file fixture handle exposing `root()` and `cleanup()` (F1)

- **F3** [product] — `cli/tests/injection-exclusivity.integration.test.js`: same move, through F1. Its
  template copies every provider directory plus `.codeadd`, so the per-file template saves more here
  per call than anywhere else. It must NOT lose `forceDetectableCatalog()` or the
  `CODEADD_PLUGINS_CATALOG` cleanup, both of which are environment state rather than fixture state.
  - **Consumes:** a per-file fixture handle exposing `root()` and `cleanup()` (F1)

- **F4** [product] — `cli/tests/injection-roundtrip.integration.test.js` and
  `cli/tests/hotfix-review-0073.test.js`: move both onto F1's helper. Neither is slow enough to
  matter; the reason is that one fixture implementation is the thing that keeps the cost fixed. It
  must NOT change what either file asserts, and `hotfix-review-0073`'s already-scoped hook stays
  scoped.
  - **Consumes:** a per-file fixture handle exposing `root()` and `cleanup()` (F1)

- **F5** [product] — `cli/tests/graph-query.test.js`: give the `history` describe an explicit timeout
  sized to the measured cost of the real `delivered.sh` call, which is ~1.2s per invocation on
  Windows. The two tests red today go green. It must NOT stub, mock or bypass `delivered.sh` — the
  file's own header says driving the real script is the point of the verb, and a mocked read would
  assert the one thing the design forbids reimplementing there.

- **F6** [product] — `cli/vitest.config.js`: replace the justification comment with the cause measured
  in this session. `fileParallelism: false` itself does not change. The new text states the parallel
  result (153s, 12 failures, all timeouts under contention, `qa-reachability` slower not faster) and
  drops the EBUSY-on-real-tree-writes story that the code no longer produces.

### Does NOT Include (important!)

- **Turning `fileParallelism` on, on any platform.** Measured this session: 153s against 208s, bought
  with 12 new failures. Re-measuring after this plan lands is reasonable and is a separate decision
  with a separate number.
- **Rewriting the real-tree suites onto a synthetic fixture root.** The current config comment calls
  this "a much larger change". The measurement says it is also unnecessary: they already copy to temp.
  The defect is when the copy happens, not that it happens.
- **Changing the serial rule in `add-framework-product-layer`, or `run-bats.test.js:277` which asserts
  its wording.** The rule stays as written.
- **Switching the vitest pool from forks to threads.** Startup overhead is 18s of 208s. It is real and
  it is not the problem this plan solves.
- **Raising `testTimeout` globally.** F5 scopes a timeout to the one block whose cost is understood and
  measured. A global raise hides the next slow test instead of sizing it.
- **A lint rule or guard test forbidding a full-tree copy in a top-level hook.** F1 is the guard: with
  one implementation, the cost is fixed in one place.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|---|---|---|
| How far does the plan go? | Mechanical fixes plus a shared helper | STEP 4, 2026-09-11. Four hand-written copies of one fixture is how the cost came back in the first place |
| What happens to `fileParallelism: false`? | Stays off, comment rewritten with the measured cause | STEP 4, 2026-09-11. Parallel measured 153s with 12 failures; the comment's stated cause no longer reproduces |
| Do the two red `graph-query` tests enter this plan? | Yes, F5, same delivery | STEP 4, 2026-09-11. Same root cause as the slowness, and a suite red on a clean tree makes every future baseline harder |
| How is "nothing got weaker" proven? | Identical test-name set and count, plus a deliberate mutation | STEP 4, 2026-09-11. A test that quietly became a no-op passes a green suite |
| Does the fixture move into a `describe`, or become on-demand? | On-demand | The five tests that need it in `qa-reachability` sit in five different describes (scenarios 1, 2, 5, 6 and 8). No single hook placement covers them |
| Is `normalizeLineEndings` dropped? | No, it runs once on the template | It rewrote 0 of 332 files on this checkout and is still required on a CRLF checkout. Once per file is correct; once per test is waste |

## Accepted Trade-offs

| We gain | We give up |
|---|---|
| Roughly 90 seconds off one file, and a suite fast enough to run per F-block | A helper module the four suites must be read together with, instead of each being self-contained |
| One fixture implementation, so a cost fixed once stays fixed | The per-test `cpSync` that made isolation obvious by brute force is now a helper contract that L1 has to prove |
| Two red tests go green, so a build no longer baselines against `git stash` to read its own result | A timeout sized to one machine's measurement, which will need revisiting if `delivered.sh` gets slower |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| A test that looks read-only reaches the fixture through a helper taking `cwd`, and loses its root | Medium | The build determines the set by reading each test, never by the line numbers quoted in F2. L2 proves the full test-name set is unchanged and L4 proves the suite is green |
| `warnSpy.mockClear()` is dropped with the hook, and the two spy assertions silently stop biting | Medium | F2 states it explicitly. L3's mutation targets one of those two tests and requires it to go red |
| State leaks between the five tests that do take a fixture, because the template is now shared | Medium | F1 hands a fresh copy per call and never the template itself. L1 asserts two calls return different roots and that a write in one is invisible in the other |
| The timeout in F5 is sized to this machine and masks a real slowdown later | Low | F5 sizes it against the measured 1.2s call, not against the observed failure. CI, which runs the same tests in well under a minute, owns the verdict |
| The speed target is machine-specific and unreproducible on another box | Low | L4 states the target as this machine's serial wall plus the per-file figure for `qa-reachability`. The ratio, not the absolute, is the claim |
| Removing the stale config comment loses the EBUSY history that a future reader may need | Low | F6 rewrites rather than deletes: the new text records that the EBUSY cause was fixed in the code and what replaced it as the reason to stay serial |

## Impact

| Artefact | Layer | Action | Reason |
|---|---|---|---|
| `cli/tests/helpers/tree-fixture.js` | product | create | F1 — the one fixture implementation |
| `cli/tests/qa-reachability.smoke.test.js` | product | modify | F2 — 55.7% of the suite's cost sits in its top-level hook |
| `cli/tests/injection-exclusivity.integration.test.js` | product | modify | F3 — same hook shape, copies every provider dir |
| `cli/tests/injection-roundtrip.integration.test.js` | product | modify | F4 — onto the shared helper |
| `cli/tests/hotfix-review-0073.test.js` | product | modify | F4 — onto the shared helper |
| `cli/tests/graph-query.test.js` | product | modify | F5 — the two timeouts red on a clean tree |
| `cli/vitest.config.js` | product | modify | F6 — the justification comment, not the setting |

No file outside `cli/` changes. `provider-map.json`, `cli/package.json`,
`.claude/skills/add-framework-product-layer/SKILL.md` and `cli/tests/run-bats.test.js` are all
deliberately untouched.

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree — that is the proof the tests bite. Then drive them GREEN.

### L1 — The fixture helper (RED → GREEN)

1. A test file that never calls `root()` produces no copy of the source tree on disk. *RED today:
   `cli/tests/helpers/tree-fixture.js` does not exist.*
2. Two `root()` calls return two different paths, and a file written under the first is absent under
   the second. *RED today: the helper does not exist.*
3. The template is built once: a second `root()` call in the same file does not re-run the line-ending
   normalization. *RED today: the helper does not exist.*
4. `cleanup()` removes every root handed out, including one whose test threw. *RED today: the helper
   does not exist.*
5. A source directory that carries CRLF produces a copy carrying LF, matching what
   `normalizeLineEndings` does today. *RED today: the helper does not exist.*

### L2 — Nothing was lost

1. The full test-name set after F2 through F5 is byte-identical to the set captured before F1, and the
   count is 1002. Capture both with the JSON reporter and diff them. *RED today: no baseline set has
   been captured.*
2. Every file that used a `cpSync` hook reports the same number of tests it reported before. **Take
   each number from the L2.1 baseline the reporter produced, never by counting `it(` call sites in the
   source.** A call site inside a loop registers one test per iteration: `injection-roundtrip` has two
   call sites and reported 4 tests, because one of them iterates `FEATURES`, which has 3 keys today.
   The baseline captured in this session reported `qa-reachability.smoke` 43, `injection-exclusivity`
   12, `injection-roundtrip` 4 and `hotfix-review-0073` 25; the build re-captures rather than trusting
   those figures, because `FEATURES` gaining or losing a key moves one of them legitimately.

### L3 — The tests still bite (mutation)

Run each mutation against the post-change tree, confirm the named tests go red, then restore with
`node scripts/build.js`, which regenerates the gitignored provider output.

1. Remove the OFF-state notice text from the built `framwork/.claude/commands/add.plan.md`. The
   `qa-reachability` test at scenario 3 goes red. *This is a test that LOSES the fixture — if it still
   catches this, the fixture was never what made it work.*
2. Break one of the two spy-reading tests' precondition so an injection warning fires. The assertion
   reading `warnSpy` goes red. *This is what proves `warnSpy.mockClear()` survived F2.*
3. Alter one byte in a built command that a fixture-using round-trip restores. The round-trip
   byte-identity assertion goes red. *This proves the on-demand root still carries real built content,
   not an empty directory.*

### L4 — Speed, measured the way the baseline was

All runs with `NODE_OPTIONS` cleared, serial, on the development machine.

1. `cd cli && npx vitest run --no-file-parallelism` completes under 120s. *Baseline 208s.*
2. `qa-reachability.smoke.test.js` reports under 25s as a file. *Baseline 105.8s.*
3. `injection-exclusivity.integration.test.js` reports under 22s as a file. *Baseline 29.4s.*
4. The suite reports 1002 tests and zero failures.

### L5 — The clean-tree red is gone

1. Three consecutive serial runs report zero failures in `graph-query.test.js`. *RED today: two tests
   in its `history` describe time out at 5000ms on this machine.*

**RED expectations against the current tree:** L1 fails entirely because the helper does not exist. L2.1
fails because no baseline has been captured. L5 fails because the two timeouts are present today. L3 is
written before F2 lands and is run after, because a mutation proves a test bites only against the tree
that test now runs on.

**GREEN = all levels pass after F1–F6.**

---

## Execution Order

1. **F1** [product] — the helper, with L1 written RED first.
2. **F2** [product] — `qa-reachability.smoke`, the 55.7% file.
3. **F3** [product] — `injection-exclusivity`.
4. **F4** [product] — `injection-roundtrip` and `hotfix-review-0073`.
5. **F5** [product] — `graph-query`'s `history` timeout.
6. **F6** [product] — the `vitest.config.js` comment.

**F1 first** because F2, F3 and F4 all consume its handle. **F2 before F3 and F4** because it alone
carries 55.7% of the cost, so the suite's wall time moves at the first consumer commit rather than the
last, and a build forced to stop early still leaves the main win in place.

**Working boundaries:** the repo is in a working state after every F-block, because each one is a
self-contained test-file change and the suite must be green before the commit. F5 and F6 are
independent of F1 through F4 and of each other; either can be taken first if the earlier blocks stall.

**Per-F-block validation beyond the layer default:** every F-block from F2 to F5 runs the single file
it touched (`npx vitest run --no-file-parallelism <file>`) before the full serial suite, and records
that file's reported duration in the ledger. That per-file figure is the evidence L4.2 and L4.3 are
graded on. Before F1, capture the baseline with
`npx vitest run --no-file-parallelism --reporter=json` and keep it. That one capture serves both L2.1
(the full test-name set) and L2.2 (the per-file counts), which is why neither is allowed to be
hand-counted from source.

## Reviewer Handoff

The review command must be able to audit this without re-reading anything else. For each F-block the
build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **The file's reported duration before and after**, for F2 through F5.
- **Any decision deferred or altered**, with the reason.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose validation level was never RED — a test written after the fix proves
   nothing. L1 and L5 are the two most at risk here, because both are easy to write green.
2. **A test that quietly stopped asserting.** The whole plan removes setup from tests. L2 catches a
   test that disappeared; only L3's mutation catches one that survived and stopped biting. A build
   that reports L2 green and skips L3 has proven the cheaper half.
3. **A speed number taken from a parallel run.** The baseline is serial. A comparison against anything
   else is not a comparison.
4. **`warnSpy.mockClear()` silently dropped** with the hook it currently shares. F2 names it; L3.2 is
   the only level that proves it.
5. **A fixture root leaked on a throwing test.** L1.4 covers it. A build that only tests the happy
   path leaves temp directories behind on every failed run.

## References

- Prior art: `2026-09-10T230600-PLAN--fast-local-bats` — established that vitest stays native on
  Windows, measured at 3m20 native against 5m46 in the Linux container. This plan attacks that 3m20
  rather than relocating it.
- The measurements in Context were taken in the planning session of 2026-09-11 with the vitest JSON
  reporter, `NODE_OPTIONS` cleared, on the development machine.

---

## Next Steps

/add-framework--build vitest-fixture-scope

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-11 | Initial creation |
| 2026-09-11 | Implemented on branch worktree-vitest-fixture-scope, commits 0440ff2, f669611, 48c3267, 8d204a0, d021c25, 6afaa42 and the review remediation 44deccf. L4.3 missed at the edge; see the ledger |
| 2026-09-11 | Review (fix-then-ok): `injection-roundtrip.integration.test.js` corrected from 2 tests to 4 in Current State, and L2.2 rewritten to take every per-file count from the L2.1 baseline capture instead of from hand-counted `it(` call sites. One of that file's two call sites sits inside a loop over `FEATURES`, so the source count and the registered count differ |
