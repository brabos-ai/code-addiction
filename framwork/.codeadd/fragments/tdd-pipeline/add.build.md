<!-- uses:
- agent: test-agent
- skill: add-tdd
- skill: add-delivery-mode
- mention: /add.plan
- mention: @fix-agent
-->

<!-- section:tasks-flow -->

**Flow (TDD-aware — PRD0001):**

OVERRIDE execution with TDD ordering:
- EXECUTION ORDER (TDD): test tasks FIRST → database → backend → frontend
- TDD CYCLE:
   a. Implement TEST tasks first (create test files with failing tests)
   b. Implement DATABASE tasks
   c. Implement BACKEND tasks → run tests as gate (not just build)
   d. Implement FRONTEND tasks → run tests as gate
   e. IF tests fail after implementation: iterate until tests pass (max 3 attempts)
<!-- /section:tasks-flow -->

<!-- section:gate -->

**⛔ TDD GATE:** After implementing code tasks (database/backend/frontend), run existing test files. If tests fail, iterate on the implementation — do NOT modify test files to make them pass.
<!-- /section:gate -->

<!-- section:verify-red -->

**⛔ VERIFY RED — MANDATORY (load skill: {{skill:add-tdd/SKILL.md}}):**

For each test task, before writing ANY production code:
1. Run the new test → it **MUST fail**.
2. Confirm it fails for the **RIGHT reason** (missing implementation — NOT a syntax/import error).
3. Only then write the **minimal** code to reach GREEN. No cleverness.
4. If the test passes before you implement: the test is wrong or the feature exists. Investigate, do not proceed.
<!-- /section:verify-red -->

<!-- section:awareness -->

## TDD AWARENESS (PRD0001)
IF test files exist for your area (service=test tasks already implemented):
  - After implementing each code task, RUN existing tests
  - Tests are the SUCCESS GATE — not just build
  - If tests fail: fix your IMPLEMENTATION (not the tests)
  - Iterate until tests pass (max 3 attempts per task)
  - Report: TESTS_PASSED=true/false with test output
<!-- /section:awareness -->

<!-- section:verification -->
3. **Test Verification (TDD — PRD0001):** IF test files exist (from test tasks in tasks.md), run test suite as additional gate

```
IF test files detected (*.spec.ts, *.test.ts from test service tasks):
  1. RUN test suite (TEST_COMMAND from project)
  2. IF tests pass: proceed to STEP 15
  3. IF tests fail:
     a. Analyze failures (which contract tests fail)
     b. Fix IMPLEMENTATION to satisfy tests (not the tests themselves)
     c. Re-run tests (max 3 iterations)
     d. IF still failing after 3 iterations: report failures and STOP
```

**Stop kind — the STOP in step d is deciding, in every delivery mode** (`add-delivery-mode`). Tests still
failing after three attempts is a failure no approval covered, so an automatic delivery waits on it too.
<!-- /section:verification -->

<!-- section:detect-framework -->

### Test Framework Detection (tdd-pipeline)

Runs once during context setup, in **every mode**. Test generation needs a
configured runner before any area work begins.

1. READ `package.json` (or `pyproject.toml`, `*.csproj`, `pom.xml`).
2. CHECK for existing test configuration:
   - **Node.js:** Jest, Vitest, Mocha — `jest.config.*`, `vitest.config.*`, or a `"test"` script
   - **Python:** pytest, unittest — `pytest.ini`, `pyproject.toml [tool.pytest]`, `setup.cfg`
   - **C#/.NET:** xUnit, NUnit — `*.Tests.csproj`
   - **Java:** JUnit — `pom.xml` test dependencies
3. SET `TEST_FRAMEWORK`, `TEST_COMMAND`, `COVERAGE_COMMAND`.

**IF no framework detected — auto-configure:**
1. DETECT the project stack from the project files.
2. INSTALL the appropriate framework: Vite/Vue/React → `vitest` + `@vitest/coverage-v8`; CRA/Next.js → `jest`; Python → `pytest` + `pytest-cov`; NestJS → verify `jest.config` exists.
3. CREATE a minimal config file if needed.
4. CONFIRM it works: run `TEST_COMMAND` (expect 0 tests, no errors).

IF still no framework → report it and continue the build **without** test
generation. Do NOT stop the build: implementation is not blocked on a test runner.

**Existing contract tests (TDD awareness).** Before generating anything, search
for contract tests authored by `/add.plan` (`*.spec.*` / `*.test.*`). If any
exist, read them, identify which RF/RN they already cover, and set
`CONTRACT_TESTS` + `COVERED_REQUIREMENTS`. NEVER regenerate an existing contract
test — `@test-agent` targets the gaps: edge cases, error handling, integration
scenarios.
<!-- /section:detect-framework -->

<!-- section:test-dispatch -->

### Test Generation Dispatch (tdd-pipeline)

Dispatch `@test-agent` for an area **AFTER that area's implementation agent has
returned**, interleaved into the sequential order STEP 10.1 already runs:

```
DB → test:DB → Backend → test:Backend → Frontend → test:Frontend
```

This fires in **all four modes** — the mode only changes what the agent is asked
to produce.

```
IF DISPATCHING @test-agent FOR AN AREA:
  ⛔ DO NOT: Send it alongside that area's implementation agent
  ⛔ DO NOT: Send one per area in parallel once the implementers are done
  ✅ DO: Dispatch it after that area's implementer returns, and WAIT for it
         before dispatching the next area's implementer
```

⛔ **Generating tests against a file the implementer is still writing is what this
order fixes.** The agent is told to read the source completely and identify every
testable export; run alongside the implementer, it reads a moving target and
writes coverage for a shape that no longer exists by the time the area lands.

**One agent in flight at a time**, implementer or test agent — STEP 10.1 owns that
rule and this ordering sits inside it.

**DISPATCH AGENT: `@test-agent`** [full-access, standard] — one per area, sequential, after that area's implementer.
- **Inputs:** `AREA`, `MODE` (this build's detected mode), `TEST_FRAMEWORK`, `TEST_COMMAND`, `AREA_FILES`, feature docs, `CONTRACT_TESTS`, `COVERED_REQUIREMENTS`, `KNOWN_FAILURES`, `ATTEMPT`, `MAX_ATTEMPTS = 3`.
- **`ATTEMPT` is supplied here, never by the agent.** A leaf agent cannot see its own history, so the cap lives where the loop can see it — the same route and the same value `@fix-agent` already uses.
- **On the FINAL attempt only**, pass an explicit `MODEL` one tier above the agent's declared model, matching `@fix-agent`'s round-3 escalation. Pass no `MODEL` on any earlier attempt.
- **Report:** `FILES_CREATED`, `FILES_MODIFIED`, `TESTS_PASSING`, `TEST_COUNT`, `BLOCKED`, `ERRORS`, `CONCERNS`, plus `RED_TEST` in CORRECTION mode.

**`BLOCKED` is a successful completion, and it does NOT consume an attempt.** It
means the agent's own correct test caught a source bug. Route each entry as a
row per STEP 11.2's `BLOCKED` synthesis — never re-dispatch the agent for it.

**`KNOWN_FAILURES` carries only what you have ALREADY observed in this build.** Several agents share
one working tree here, so an agent that cannot tell its own failure from a pre-existing one goes
looking for a clean baseline — and the way it reaches for one is by clearing the tree its siblings are
working in. This field is what makes that unnecessary.

```
IF DISPATCHING @test-agent:
  ⛔ DO NOT: Run TEST_COMMAND first just to populate this field — a baseline sweep
             on every build buys nothing on a first dispatch, which is empty anyway
  ⛔ DO NOT: Omit the field — an absent field and an empty one mean different things
  ✅ DO: Pass the failures already in hand — the ones named in the fix-iteration
         branch below, or CORRECTION mode's RED_TEST — one per line, `<test>: <area>`
  ✅ DO: Pass an EMPTY value when nothing has been observed yet. The brief renders it
         as `none observed`, which is a usable answer; omitting it renders `not supplied`,
         which is not
```

**`CONCERNS` is where a failure that is not the agent's own comes back.** It is not `ERRORS`, which is
the agent reporting on its own work. A red test surfaced under `CONCERNS` belongs to whoever owns the
file it comes from — route it, do not dispatch a fix for it back to the agent that reported it.

**WAIT-ALL** before the coverage step. Collect `ALL_TEST_FILES`, `TOTAL_TEST_COUNT`
and every area's `BLOCKED` entries.

#### Run `TEST_COMMAND` yourself at the WAIT-ALL

⛔ **The coordinator runs `TEST_COMMAND` here, and its exit status — not any
agent's `TESTS_PASSING` — is what `ALL_TESTS_PASSING` means.**

```
IF EVERY AREA HAS REPORTED:
  ⛔ DO NOT: Set ALL_TESTS_PASSING by AND-ing the agents' TESTS_PASSING fields
  ⛔ DO NOT: Skip the run because every area reported true
  ✅ DO: Run TEST_COMMAND in this session, read its exit status, and use that
```

**Two things make this load-bearing, not a double-check.**

Interleaving means an area's tests are written and green before the next area's
implementer runs — so a later area can break an earlier area's passing test, and
no agent is left running to notice. This run is the only thing that catches that
class, which is the price the interleaved order pays and this step is what pays it.

It is also what makes a `BLOCKED` claim checkable: the named assertion is either
red in this run or the claim is wrong. A `BLOCKED` entry whose assertion is green
here is not routed — record the discrepancy as a ruling.

IF `TEST_COMMAND` exits non-zero → name the failing tests and their areas, and
allow ONE fix iteration through `@test-agent` for the areas that own them. Do not
loop further.

**This branch is where `KNOWN_FAILURES` gets its content.** At the WAIT-ALL you
hold every area's failures and know which area each came from — that is the
whole field, already in hand. Pass it on the re-dispatch: an agent re-entering a
tree where three sibling areas are still red, told nothing about them, has no way
to attribute a failure except by clearing the tree.

**CORRECTION mode is red-green, not regeneration.**

```
IF MODE = CORRECTION:
  ⛔ DO NOT dispatch @test-agent for a regeneration sweep over the area
  ⛔ DO NOT rewrite passing tests in the touched areas
  ✅ DO dispatch @test-agent for ONE new failing test that pins the bug,
     written RED before the fix, so the bug cannot recur
```

An existing test may be touched only when the fix genuinely changed the contract
that test asserts, and the agent must say so in its report.
<!-- /section:test-dispatch -->

<!-- section:coverage -->

4. **Coverage (tdd-pipeline — informational):** run `COVERAGE_COMMAND` and report tests passing/total plus coverage percentage, overall and per file.

Coverage is an **informational signal**. There is NO enforced threshold and NO
forced iteration loop. Surface low- and zero-coverage files so the user can
decide whether more tests are worth writing.

**Idempotency:** if a coverage results file exists from a previous run, validate
its timestamps against the current test files. If stale, delete it before
re-running.
<!-- /section:coverage -->
