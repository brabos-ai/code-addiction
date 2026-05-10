# add-test — Automated Test Generation

Analyzes developed code and generates automated tests targeting 80% coverage. Uses parallel subagents per area (Backend, Frontend, Workers) and a dedicated Startup Test subagent. Iterates until coverage target or max 5 iterations.

---

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner -> explain why; advanced -> essentials only).

---

## Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only, read-write, full-access)
2. Read the **Complexity** hint (light, standard, heavy)
3. Choose the best available agent/task mechanism in your engine that satisfies the capability
4. If your engine supports parallel dispatch and mode is `parallel`, dispatch all simultaneously
5. Verify output exists before proceeding past any WAIT or GATE CHECK

You are the coordinator. You know your engine's capabilities. Map the intent to the best available mechanism.

---

## Status Enums (Standardized)

All test status values use the following enumeration:

| Status | Meaning | Context |
|--------|---------|---------|
| PASSED | Test(s) executed successfully | Startup test, test generator, full suite |
| FAILED | Test(s) did not execute successfully | Startup test, test generator, full suite |
| SKIPPED | Test(s) were intentionally skipped (no failure) | Startup test (unavailable infrastructure) |

Use these terms consistently throughout execution.

---

## Execution Order

```
STEP 1: Environment Check       -> RUN FIRST — detect/configure test framework
STEP 2: Context Loading          -> DETERMINE scope (diff/feature/path)
STEP 3: Startup Test             -> DISPATCH dedicated agent
STEP 4: Dispatch Test Generators -> ONLY AFTER 1-3 — parallel agents per area
STEP 5: Run Tests + Coverage     -> ONLY AFTER generators return
STEP 6: Iterate                  -> ONLY IF coverage < 80% (max 5x)
STEP 7: Report                   -> ONLY AFTER coverage checked
```

NEVER skip a step or execute out of order. Each step gates the next:
- No subagent dispatch until environment is checked
- No test generators until startup test completes
- No coverage check until generators return
- No report until coverage is checked

---

## STEP 1: Environment Check

### 1.1 Detect Test Framework

READ `package.json` (or equivalent: `pyproject.toml`, `*.csproj`, `pom.xml`).

CHECK for existing test configuration:
- **Node.js:** Jest, Vitest, Mocha — look for `jest.config.*`, `vitest.config.*`, or `"test"` script in package.json
- **Python:** pytest, unittest — look for `pytest.ini`, `pyproject.toml [tool.pytest]`, `setup.cfg`
- **C#/.NET:** xUnit, NUnit — look for `*.Tests.csproj`
- **Java:** JUnit — look for `pom.xml` test dependencies

SET `TEST_FRAMEWORK`, `TEST_COMMAND`, `COVERAGE_COMMAND`.

### 1.2 Auto-Configure If Missing

IF no test framework detected:
  1. DETECT project stack from package.json / project files
  2. INSTALL appropriate framework:
     - **Vite/Vue/React (Vite):** `vitest` + `@vitest/coverage-v8`
     - **CRA/Next.js:** `jest` + `@jest/coverage` (if not already present)
     - **Python:** `pytest` + `pytest-cov`
     - **NestJS:** Jest is usually included — verify `jest.config` exists
  3. CREATE minimal config file if needed
  4. CONFIRM framework works: run `TEST_COMMAND` (expect 0 tests, no errors)

IF still no framework -> STOP. Inform user: "Could not detect or configure test framework. Please configure manually."

### 1.3 Detect Project Areas

SCAN project structure to identify areas:
- **Backend:** `src/`, `apps/server/`, `apps/api/`, `server/` — controllers, services, modules
- **Frontend:** `apps/web/`, `apps/client/`, `src/components/`, `src/pages/` — components, hooks, pages
- **Workers:** `apps/workers/`, `src/jobs/`, `src/queues/` — job processors, queue handlers

SET `AREAS` = list of detected areas (minimum 1).

REPORT: Framework, test command, coverage command, areas detected.

---

## STEP 2: Context Loading

### 2.1 Determine Scope Mode

| Input | Mode | Scope |
|-------|------|-------|
| `add-test` (no args) | `diff` | Files changed in git diff |
| `add-test feature N` | `feature` | Entire feature N scope |
| `add-test <path>` | `path` | Specific directory/file |

### 2.2 Detect Existing Contract Tests (TDD Awareness)

BEFORE generating new tests, check for contract tests from `/add.plan`:

Search for existing test files matching `*.spec.ts` / `*.test.ts` patterns.

IF contract tests exist:
1. READ existing test files
2. IDENTIFY which RFs/RNs are already covered (look for test names matching `[area]-[RF/RN]-[scenario]` pattern)
3. SET `CONTRACT_TESTS` and `COVERED_REQUIREMENTS`
4. INFORM user: "Detected [N] contract test files from /add.plan. Will focus on gaps and edge cases."

NEVER regenerate existing contract tests. Focus on: edge cases, error handling, integration scenarios, coverage gaps.

### 2.3 Load Files by Mode

**IF MODE = diff:**
Get list of changed files (staged + unstaged) from git.
FILTER: Keep only source files (exclude tests, configs, docs, assets).
IF no changed files -> STOP with guidance.

**IF MODE = feature:**
1. RUN: `bash .codeadd/scripts/status.sh` (if exists)
2. READ: `docs/features/[XXXX]F/about.md` — extract RF/RN requirements
3. READ: `docs/features/[XXXX]F/plan.md` — extract implementation scope
4. SET `TARGET_FILES` = files referenced in plan.md + files in feature modules

**IF MODE = path:**
1. VERIFY path exists
2. SET `TARGET_FILES` = all source files under path (exclude existing tests)

### 2.4 Map Files to Areas

Assign each target file to `BACKEND_FILES`, `FRONTEND_FILES`, or `WORKER_FILES`.

REPORT: Scope mode, total target files, count per area.

IF no target files -> STOP. Cannot proceed.

---

## STEP 3: Startup Test (Dedicated Subagent)

### 3.1 Check Existing Startup Test

SEARCH for existing startup test infrastructure:
- `scripts/startup-test.sh` or `scripts/bootstrap-check.*`
- `src/startup-check.ts` or `src/bootstrap-check.*`
- `package.json` -> `"test:startup"` script

### 3.2 Dispatch Startup Test Agent

**DISPATCH AGENT:** [full-access, standard]

**Prompt:**

```
## ROLE
You are the STARTUP TEST specialist. Ensure application startup works correctly (IoC/DI, connections, module resolution).

## CONTEXT
- Project root: [PROJECT_ROOT]
- Areas detected: [AREAS]
- Startup test exists: [STARTUP_EXISTS]
- Test framework: [TEST_FRAMEWORK]

## TASK

1. READ package.json and project structure. IDENTIFY frameworks (NestJS, Express, Next.js, Vite, FastAPI, Django, etc.)

2. IF no startup test exists, CREATE one following the init+close pattern:
   - Initialize the application (e.g., create app, resolve DI container)
   - Verify initialization succeeded
   - Close/destroy the app cleanly
   - Exit with 0 (pass) or 1 (fail)
   - CRITICAL: NO listen() / NO serve() / NO port binding. Init + close only.
   - ADD `"test:startup"` script to package.json

3. IF startup test exists, VERIFY it follows the init+close pattern (no hanging).

4. EXECUTE the startup test.
   - If infrastructure unavailable: report SKIPPED with reason.
   - If startup fails: report exact error. Do NOT proceed.

Report: STARTUP_STATUS (PASSED/FAILED/SKIPPED), files created/existing, errors if any, skip reason if any.
```

### 3.3 Process Startup Result

| Status | Action |
|--------|--------|
| PASSED | PROCEED to STEP 4 |
| FAILED | Inform user + display errors. STOP — do NOT proceed |
| SKIPPED | Inform user + reason. PROCEED to STEP 4 |

---

## STEP 4: Dispatch Test Generators (Parallel by Area)

### 4.1 Common Test Generator Pattern

All area generators share this structure. DISPATCH one per area that has target files, ALL simultaneously.

**Common prompt base (injected into each agent):**

```
## MANDATORY: Load Context
1. READ skill add-[AREA]-development (if exists) for project patterns
2. IF PROJECT_SKILL in status.sh output: run `bash .codeadd/scripts/pattern-search.sh [AREA]` and read relevant topic ranges (especially "Testing" topic)
   IF PROJECT_DOCS in status.sh output: READ matching .codeadd/project/*.md for project conventions

## CONTEXT
- Test framework: [TEST_FRAMEWORK]
- Test command: [TEST_COMMAND]
- Target files: [AREA_FILES list with full paths]
- Feature docs: [about.md/plan.md content if feature mode]
- Existing contract tests: [CONTRACT_TESTS if any — DO NOT regenerate these]
- Already covered requirements: [COVERED_REQUIREMENTS if any]

## TASK
Generate unit + integration tests for target files. IF contract tests exist, focus on GAPS: edge cases, error handling, integration scenarios not covered.

### For EACH target file:
1. READ the source file completely
2. IDENTIFY all testable exports (functions, methods, classes, components, hooks)
3. GENERATE test file at conventional location (co-located `*.spec.ts`/`*.test.ts` or `__tests__/`)
4. After generating: RUN [TEST_COMMAND]. IF tests fail: FIX the tests (not the source). Iterate until pass.

### Test Quality Rules:
- Mock external dependencies (DB, HTTP, queues) — do NOT call real services
- Use descriptive test names: `should [expected behavior] when [condition]`
- Group related tests in describe blocks
- Include both success and error scenarios
- Follow existing test patterns in the project

Report: AREA, FILES_CREATED, FILES_MODIFIED, TESTS_PASSING (true/false), TEST_COUNT, ERRORS (if any).
```

### 4.2 Area-Specific Additions

**Backend** [full-access, standard] — Skill: `add-backend-development`
- Coverage targets: ALL exported functions/methods, edge cases (null/undefined, empty arrays, error paths), integration (service interactions, repository calls with mocked deps)

**Frontend** [full-access, standard] — Skill: `add-frontend-development`
- Coverage targets: Component rendering (basic + props variations), user interactions (clicks, inputs, form submissions), hook behavior (state changes, effects, return values), utility functions
- Use testing-library patterns (@testing-library/react, @testing-library/vue)
- Test user-visible behavior, not implementation details
- Include accessibility checks where relevant

**Workers** [full-access, standard] *(only if WORKER_FILES > 0)* — Skill: `add-backend-development`
- Coverage targets: Job execution (success path), error handling (retry logic, dead letter), input validation, side effects (mocked external calls)
- Mock queue/job infrastructure (BullMQ, SQS, etc.)
- Test idempotency where applicable
- Verify error handling and retry behavior

### 4.3 Verify Generator Outputs

| Check | Action |
|-------|--------|
| **WAIT-ALL** | ALL dispatched generators must return before proceeding |
| **COLLECT** | Gather `ALL_TEST_FILES`, `ALL_TESTS_PASSING`, `TOTAL_TEST_COUNT` from all agents |
| **TESTS_PASSING = false** | Inform user which area failed + errors. ATTEMPT one fix iteration |
| **Ready** | Proceed to STEP 5 only if all generators completed |

---

## STEP 5: Run Tests + Coverage Check

### 5.1 Execute Coverage Command

**Idempotency:** Check if test results file exists from previous run. If yes, validate timestamps match current test files. If stale, delete before re-running.

EXECUTE: `[COVERAGE_COMMAND]`

CAPTURE: Total tests, passing/failing, coverage percentage (overall + per file).

IF tests failing: LIST, FIX test issues, RE-RUN.

### 5.2 Record Initial Coverage

REPORT: Tests passing/total, coverage %, target (80%), status (meets/below target).

SET `ITERATION_COUNT` = 1.
SET `COVERAGE_BASELINE` = current coverage.

---

## STEP 6: Iterate (Max 5 Iterations)

### 6.1 Coverage Gate

| Condition | Action |
|-----------|--------|
| `CURRENT_COVERAGE >= 80%` | SKIP to STEP 7 (target met) |
| `ITERATION_COUNT >= 5` | Inform user max iterations reached. SKIP to STEP 7 |
| Otherwise | PROCEED to 6.2 |

### 6.2 Iteration Loop

**For EACH iteration [1..5]:**

1. **Idempotency Check:** Verify test result snapshots exist. Delete stale entries before continuing.

2. **Parse Gaps:** From coverage report, identify files with < 80% or 0% coverage.

3. **Generate Missing Tests:**
   - For each gap file: READ source, READ existing tests
   - Identify uncovered branches/paths
   - Generate additional tests targeting those gaps
   - EXECUTE: `[TEST_COMMAND]` to verify new tests compile

4. **Measure Coverage:**
   - EXECUTE: `[COVERAGE_COMMAND]`
   - CAPTURE new coverage %, per-file breakdown

5. **Record Progress:**
   - INCREMENT `ITERATION_COUNT`
   - REPORT: `Iteration [N]: Coverage [PREVIOUS]% -> [CURRENT]%`

6. **Check Loop Condition:**
   - IF `CURRENT_COVERAGE >= 80%`: BREAK to STEP 7
   - IF `ITERATION_COUNT >= 5`: Inform user max reached. BREAK to STEP 7
   - ELSE: REPEAT loop

---

## STEP 7: Report

### 7.1 Final Report Template

| Section | Content |
|---------|---------|
| **Scope** | [SCOPE_MODE] — [description] + [count] target files |
| **Startup Test** | Status: [PASSED/FAILED/SKIPPED], Scripts: [created list \| none] |
| **Test Generation** | Areas: [Backend, Frontend, Workers], Files created: [count], Total cases: [TOTAL_TEST_COUNT] |
| **Coverage** | Final: [CURRENT_COVERAGE]%, Target: 80%, Status: [MET \| BELOW ([X]%)], Iterations: [ITERATION_COUNT] |
| **Files** | [list of all test files created/modified] |
| **Gaps** | [If below target] — list uncovered areas with recommendations |

**Next Steps (from ecosystem map):**
- Tests passing (CURRENT_COVERAGE >= 80% OR manual resolution complete) → `/add.review`
- Tests below target → See gap recommendations above or re-run `/add.test`

### 7.2 Log Results (Idempotent)

**Only if log file does NOT exist from this execution:**

IF `.codeadd/scripts/log-iteration.sh` exists:
```bash
bash .codeadd/scripts/log-iteration.sh "test" "add-test" "Generated tests — [CURRENT_COVERAGE]% coverage" "[ALL_TEST_FILES comma-separated]"
```

**Idempotency:** Verify log entry timestamp differs from current time. Only write if new.

---

## Rules (Consolidated)

### Sequence Gates (Strict Order)
- Detect test framework BEFORE installing
- Run startup test BEFORE generating unit/integration tests
- Complete startup (pass/fail/skip) BEFORE dispatching generators
- Complete all generators BEFORE running coverage
- Complete coverage BEFORE iterating

### Idempotency (Prevent Duplication)
- Check for existing test result files; validate timestamps match current state
- Delete stale snapshots before re-running coverage
- Verify log entries (by timestamp) before appending new iteration records
- Detect existing contract tests from `/add.plan` — DO NOT regenerate

### Test Generation Standards
- Dispatch area agents in parallel (all at once, not sequentially)
- Mock external dependencies (DB, HTTP, queues) — do NOT call real services
- Modify test files only; NEVER modify source code for coverage
- Only generate unit + integration; NEVER E2E tests
- Run tests immediately after generation; verify compile + pass before reporting

### Coverage Iteration Limits
- Iterate maximum 5 times
- Stop early if >= 80% or max iterations reached
- Do NOT exceed 5 attempts under any condition

### Final Output Standards
- All tests must pass before reporting
- Report actual coverage measurement (not estimated)
- Log iteration only once per execution
- Provide gap recommendations if below 80%
