# add-test — Automated Test Generation

Analyzes developed code and generates automated tests targeting 80% coverage. Uses parallel subagents per area (Backend, Frontend, Workers) and a dedicated Startup Test subagent. Iterates until coverage target or max 5 iterations.

---

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante -> explain why; avancado -> essentials only).

---

## Spec

```json
{
  "modes": {"diff": "test changed files (git diff)", "feature": "test entire feature (about.md/plan.md)", "path": "test specific path"}
}
```

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

- IF FAILED: Inform user, display errors. STOP — do NOT proceed to test generation.
- IF SKIPPED: Inform user with reason. PROCEED.
- IF PASSED: PROCEED.

---

## STEP 4: Dispatch Test Generators (Parallel by Area)

### 4.1 Common Test Generator Pattern

All area generators share this structure. DISPATCH one per area that has target files, ALL simultaneously.

**Common prompt base (injected into each agent):**

```
## MANDATORY: Load Context
1. READ .codeadd/skills/add-[AREA]-development/SKILL.md (if exists) for project patterns
2. READ .codeadd/project/*.md (if exists) for project conventions

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

WAIT-ALL: ALL dispatched generators must return before proceeding.

COLLECT: `ALL_TEST_FILES`, `ALL_TESTS_PASSING`, `TOTAL_TEST_COUNT` from all agents.

IF any agent reports TESTS_PASSING = false:
  INFORM user which area has failing tests and the errors.
  ATTEMPT one fix iteration before proceeding.

---

## STEP 5: Run Tests + Coverage Check

EXECUTE: `[COVERAGE_COMMAND]`

CAPTURE: Total tests, passing/failing, coverage percentage (overall + per file).

IF tests failing: LIST, FIX test issues, RE-RUN.

REPORT: Tests passing/total, coverage %, target (80%), status (meets/below target).

SET `ITERATION_COUNT` = 1.

---

## STEP 6: Iterate (Max 5 Iterations)

IF `CURRENT_COVERAGE` >= 80: SKIP to STEP 7.
IF `ITERATION_COUNT` >= 5: Inform user max reached. SKIP to STEP 7.

### For each iteration:
1. PARSE coverage report to find files below 80% or with 0% coverage
2. For each gap file: READ source, READ existing tests, identify uncovered paths, generate additional tests
3. EXECUTE: `[COVERAGE_COMMAND]`
4. UPDATE `CURRENT_COVERAGE`, INCREMENT `ITERATION_COUNT`
5. REPORT: `Iteration [N]: Coverage [PREVIOUS]% -> [CURRENT_COVERAGE]%`
6. IF still < 80% AND iterations < 5: REPEAT

---

## STEP 7: Report

### 7.1 Final Report

```
====================================
  add-test — Final Report
====================================

Scope: [SCOPE_MODE] — [description]
Target files: [count]

STARTUP TEST:
  Status: [PASSED / FAILED / SKIPPED]
  Scripts created: [list or "none"]

TEST GENERATION:
  Areas covered: [Backend, Frontend, Workers]
  Test files created: [count]
  Total test cases: [TOTAL_TEST_COUNT]

COVERAGE:
  Final: [CURRENT_COVERAGE]%
  Target: 80%
  Status: [TARGET MET / BELOW TARGET ([X]%)]
  Iterations: [ITERATION_COUNT]

FILES CREATED/MODIFIED:
  [list of all test files]

[IF BELOW TARGET:]
SUGGESTIONS FOR MANUAL IMPROVEMENT:
  - [file1]: [uncovered area — what to test]
  - [file2]: [uncovered area — what to test]

====================================
```

**Next Steps (from ecosystem map):**
Read `.codeadd/skills/add-ecosystem/SKILL.md` Main Flows section.
- Tests passing -> `/add.check`
- Tests failing -> fix and re-run `/add.test`

### 7.2 Log Iteration

IF `.codeadd/scripts/log-iteration.sh` exists:
```bash
bash .codeadd/scripts/log-iteration.sh "test" "add-test" "Generated tests — [CURRENT_COVERAGE]% coverage" "[ALL_TEST_FILES comma-separated]"
```

---

## Rules

ALWAYS:
- Detect existing test framework BEFORE installing new one
- Run startup test BEFORE generating unit/integration tests
- Dispatch area agents in parallel when multiple areas exist
- Verify tests compile and pass BEFORE reporting coverage
- Mock external dependencies (DB, HTTP, queues) in generated tests
- Iterate on coverage gaps up to 5 times maximum
- Log iteration after completion

NEVER:
- Install a test framework if one already exists
- Generate E2E tests (only unit + integration)
- Modify source code to improve coverage (only modify test files)
- Skip startup test step (run or explicitly skip with reason)
- Dispatch test generators before startup test completes
- Report coverage without actually running the test suite
- Exceed 5 iteration attempts for coverage target
- Leave failing tests in the final output
- Regenerate contract tests that already exist from /add.plan (detect and skip)
