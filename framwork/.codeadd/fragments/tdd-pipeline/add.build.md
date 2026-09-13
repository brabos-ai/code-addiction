<!-- uses:
- agent: test-agent
- skill: add-tdd
- mention: /add.plan
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

For each in-scope area, dispatch `@test-agent` alongside that area's
implementation. This fires in **all four modes** — the mode only changes what
the agent is asked to produce.

**DISPATCH AGENT: `@test-agent`** [full-access, standard] — one per area, parallel.
- **Inputs:** `AREA`, `MODE` (this build's detected mode), `TEST_FRAMEWORK`, `TEST_COMMAND`, `AREA_FILES`, feature docs, `CONTRACT_TESTS`, `COVERED_REQUIREMENTS`, `KNOWN_FAILURES`.
- **Report:** `FILES_CREATED`, `FILES_MODIFIED`, `TESTS_PASSING`, `TEST_COUNT`, `ERRORS`, `CONCERNS`, plus `RED_TEST` in CORRECTION mode.

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

**WAIT-ALL** before the coverage step. Collect `ALL_TEST_FILES`,
`ALL_TESTS_PASSING`, `TOTAL_TEST_COUNT`.

IF any area reports `TESTS_PASSING = false` → name the area and its errors, and
allow ONE fix iteration through `@test-agent`. Do not loop further.

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
