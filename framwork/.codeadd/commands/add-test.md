# add-test — Automated Test Generation

Analyzes developed code and generates automated tests targeting 80% coverage. Uses parallel subagents per area (Backend, Frontend, Workers) and a dedicated Startup Test subagent. Iterates until coverage target or max 5 iterations.

---

## Spec

```json
{
  "gates": ["environment_checked", "context_loaded", "startup_tested", "tests_generated", "coverage_checked"],
  "order": ["environment_check", "context_loading", "startup_test", "dispatch_generators", "run_tests", "iterate", "report"],
  "modes": {"diff": "test changed files (git diff)", "feature": "test entire feature (about.md/plan.md)", "path": "test specific path"},
  "patterns": {"if_exists": ".codeadd/project/*.md", "action": "READ for project context"}
}
```

---

## OWNER Context

**From `OWNER:name|level|language` (status.sh or owner.md):**

| Level | Communication | Detail |
|-------|--------------|--------|
| iniciante | No jargon, simple analogies, explain every step | Maximum - explain the "why" |
| intermediario | Technical terms with context when needed | Moderate - explain decisions |
| avancado | Straight to the point, jargon allowed | Minimum - essentials only |

**Language:** Use owner's language for ALL communication. Technical terms always in English. Default: en-us.
**If OWNER not found:** use defaults (intermediario, en-us)

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Environment Check       → RUN FIRST — detect/configure test framework
STEP 2: Context Loading          → DETERMINE scope (diff/feature/path)
STEP 3: Startup Test             → DISPATCH dedicated agent
STEP 4: Dispatch Test Generators → ONLY AFTER 1-3 — parallel agents per area
STEP 5: Run Tests + Coverage     → ONLY AFTER generators return
STEP 6: Iterate                  → ONLY IF coverage < 80% (max 5x)
STEP 7: Report                   → ONLY AFTER coverage checked
```

**⛔ ABSOLUTE PROHIBITIONS:**

IF ENVIRONMENT NOT CHECKED:
  ⛔ DO NOT USE: Task for dispatching any subagent
  ⛔ DO NOT USE: Write on test files
  ⛔ DO NOT USE: Edit on test files
  ⛔ DO: Run STEP 1 environment detection FIRST

IF CONTEXT NOT LOADED:
  ⛔ DO NOT USE: Task for dispatching test generators
  ⛔ DO NOT USE: Write on test files
  ⛔ DO: Determine scope and load context FIRST

IF STARTUP TEST NOT EXECUTED:
  ⛔ DO NOT USE: Task for dispatching test generator agents
  ⛔ DO: Complete STEP 3 (startup test) FIRST

IF TEST GENERATORS NOT RETURNED:
  ⛔ DO NOT USE: Bash to run test suite
  ⛔ DO NOT: Check coverage before generators complete
  ⛔ DO: WAIT-ALL for generator agents to return

IF COVERAGE NOT CHECKED:
  ⛔ DO NOT USE: Write for report output
  ⛔ DO: Run test suite and check coverage FIRST

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

## STEP 1: Environment Check (FIRST STEP)

### 1.1 Detect Test Framework

READ `package.json` (or equivalent: `pyproject.toml`, `*.csproj`, `pom.xml`).

CHECK for existing test configuration:
- **Node.js:** Jest, Vitest, Mocha — look for `jest.config.*`, `vitest.config.*`, or `"test"` script in package.json
- **Python:** pytest, unittest — look for `pytest.ini`, `pyproject.toml [tool.pytest]`, `setup.cfg`
- **C#/.NET:** xUnit, NUnit — look for `*.Tests.csproj`
- **Java:** JUnit — look for `pom.xml` test dependencies

SET `TEST_FRAMEWORK` = detected framework name.
SET `TEST_COMMAND` = command to run tests (e.g., `npm test`, `npx vitest run`, `pytest`).
SET `COVERAGE_COMMAND` = command to run tests with coverage (e.g., `npx vitest run --coverage`, `pytest --cov`).

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

⛔ GATE CHECK: Test framework detected or configured?
- If NO → STOP. Inform user: "Could not detect or configure test framework. Please configure manually."
- If YES → Proceed.

### 1.3 Detect Project Areas

SCAN project structure to identify areas:
- **Backend:** `src/`, `apps/server/`, `apps/api/`, `server/` — look for controllers, services, modules
- **Frontend:** `apps/web/`, `apps/client/`, `src/components/`, `src/pages/` — look for components, hooks, pages
- **Workers:** `apps/workers/`, `src/jobs/`, `src/queues/` — look for job processors, queue handlers

SET `AREAS` = list of detected areas (minimum 1).

REPORT to user:
```
Environment Check:
- Framework: [TEST_FRAMEWORK]
- Test command: [TEST_COMMAND]
- Coverage command: [COVERAGE_COMMAND]
- Areas detected: [AREAS]
```

---

## STEP 2: Context Loading

### 2.1 Determine Scope Mode

PARSE user input to determine mode:

| Input | Mode | Scope |
|-------|------|-------|
| `add-test` (no args) | `diff` | Files changed in git diff |
| `add-test feature N` | `feature` | Entire feature N scope |
| `add-test <path>` | `path` | Specific directory/file |

SET `SCOPE_MODE` = determined mode.

### 2.2 Detect Existing Contract Tests (PRD0001 — TDD)

**BEFORE generating new tests, check for contract tests from `/add-plan`:**

```bash
# Find existing contract test files (generated by test-spec subagent via /add-dev)
find . -name "*.spec.ts" -o -name "*.test.ts" | head -50
```

**IF contract tests exist:**
1. READ existing test files
2. IDENTIFY which RFs/RNs are already covered (look for test names matching `[area]-[RF/RN]-[scenario]` pattern)
3. SET `CONTRACT_TESTS` = list of existing test files
4. SET `COVERED_REQUIREMENTS` = RFs/RNs already tested
5. INFORM user: "Detected [N] contract test files from /add-plan. Will focus on gaps and edge cases."

**⛔ DO NOT regenerate tests that already exist as contract tests. Focus on:**
- Edge cases not covered by contract tests
- Error handling paths
- Integration scenarios between modules
- Coverage gaps (lines/branches not hit by contract tests)

### 2.3 Load Files by Mode

**IF MODE = diff:**
```bash
git diff --name-only HEAD
git diff --name-only --cached
```
FILTER: Keep only source files (exclude tests, configs, docs, assets).
SET `TARGET_FILES` = filtered list.

IF no changed files:
  INFORM user: "No changed files detected. Specify a path or feature: `add-test src/modules/auth` or `add-test feature 1`"
  ⛔ STOP.

**IF MODE = feature:**
1. RUN: `bash .codeadd/scripts/status.sh` (if exists)
2. READ: `docs/features/F[XXXX]/about.md` — extract RF/RN requirements
3. READ: `docs/features/F[XXXX]/plan.md` — extract implementation scope
4. SET `TARGET_FILES` = files referenced in plan.md + files in feature modules

**IF MODE = path:**
1. VERIFY path exists
2. SET `TARGET_FILES` = all source files under path (exclude existing tests)

### 2.4 Map Files to Areas

For EACH file in `TARGET_FILES`, assign to area:
- Backend files → `BACKEND_FILES`
- Frontend files → `FRONTEND_FILES`
- Worker files → `WORKER_FILES`

REPORT to user:
```
Scope: [SCOPE_MODE]
Target files: [count]
- Backend: [count] files
- Frontend: [count] files
- Workers: [count] files
```

⛔ GATE CHECK: Context loaded and files mapped?
- If NO → STOP. Cannot proceed without target files.
- If YES → Proceed.

---

## STEP 3: Startup Test (Dedicated Subagent)

### 3.1 Check Existing Startup Test

SEARCH for existing startup test infrastructure:
- `scripts/startup-test.sh` or `scripts/bootstrap-check.*`
- `src/startup-check.ts` or `src/bootstrap-check.*`
- `package.json` → `"test:startup"` script

SET `STARTUP_EXISTS` = true/false.

### 3.2 Dispatch Startup Test Agent

**DISPATCH AGENT:**
- **Capability:** full-access (must create files + run scripts)
- **Complexity:** standard
- **Prompt:**

```
## ROLE
You are the STARTUP TEST specialist. Your job is to ensure application startup works correctly (IoC/DI, connections, module resolution).

## CONTEXT
- Project root: [PROJECT_ROOT]
- Areas detected: [AREAS]
- Startup test exists: [STARTUP_EXISTS]
- Test framework: [TEST_FRAMEWORK]

## TASK

### Step 1: Analyze Stack
READ package.json and project structure.
IDENTIFY frameworks: NestJS, Express, Next.js, Vite, FastAPI, Django, etc.

### Step 2: Create or Verify Startup Scripts

IF STARTUP_EXISTS = false:
  FOR EACH application that needs startup (backend, frontend if SSR):

  **Backend (NestJS example):**
  CREATE `scripts/startup-test.sh`:
  ```bash
  #!/bin/bash
  set -euo pipefail
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  cd "$SCRIPT_DIR/.."
  echo "=== Startup Check ==="
  npx ts-node src/startup-check.ts
  ```

  CREATE `src/startup-check.ts`:
  ```typescript
  import { NestFactory } from '@nestjs/core';
  import { AppModule } from './app.module';

  async function main() {
    const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
    await app.init();
    await app.close();
    console.log('✅ Startup check passed');
    process.exit(0);
  }

  main().catch((err) => {
    console.error('❌ Startup check FAILED:', err.message);
    process.exit(1);
  });
  ```

  ADD to package.json scripts: `"test:startup": "bash scripts/startup-test.sh"`

  CRITICAL: NO listen() / NO serve() / NO port binding. Init + close only.

  **Adapt for other frameworks** (Express, Fastify, Next.js, etc.) following the same pattern: initialize → verify → close → exit.

IF STARTUP_EXISTS = true:
  READ existing scripts.
  VERIFY they follow the init+close pattern (no hanging).

### Step 3: Run Startup Test
EXECUTE the startup test script.

IF infrastructure not available (DB, Redis, etc.):
  REPORT: "Startup test SKIPPED — [service] not available. Run with infrastructure for full validation."
  EXIT with skip status.

IF startup fails:
  REPORT exact error (IoC resolution, missing provider, connection failure).
  Do NOT proceed — runtime errors must be fixed first.

### Step 4: Report
OUTPUT format:
```
STARTUP_STATUS: PASSED | FAILED | SKIPPED
STARTUP_SCRIPTS_CREATED: [list of files created]
STARTUP_SCRIPTS_EXISTING: [list of files that already existed]
STARTUP_ERRORS: [error details if FAILED]
STARTUP_SKIP_REASON: [reason if SKIPPED]
```
```

### 3.3 Process Startup Result

READ agent output.

IF STARTUP_STATUS = FAILED:
  INFORM user: "Startup test failed. Fix runtime errors before generating tests."
  DISPLAY errors.
  ⛔ STOP. Do NOT proceed to test generation.

IF STARTUP_STATUS = SKIPPED:
  INFORM user: "Startup test skipped ([reason]). Proceeding with test generation."
  PROCEED.

IF STARTUP_STATUS = PASSED:
  PROCEED.

---

## STEP 4: Dispatch Test Generators (Parallel by Area)

### 4.1 Prepare Dispatch

FOR EACH area with target files, prepare a subagent.

SKIP areas with 0 target files.

### 4.2 Dispatch Agents

**DISPATCH N AGENTS IN PARALLEL:**
Each agent is independent. Dispatch ALL simultaneously.

**1. Backend Test Generator** [full-access, standard]
- **Prompt:**

```
## ROLE
You are the BACKEND TEST GENERATOR for this project.

## MANDATORY: Load Context
1. READ .codeadd/skills/backend-development/SKILL.md (if exists) for project patterns
2. READ .codeadd/project/*.md (if exists) for project conventions

## CONTEXT
- Test framework: [TEST_FRAMEWORK]
- Test command: [TEST_COMMAND]
- Target files: [BACKEND_FILES list with full paths]
- Feature docs: [about.md/plan.md content if feature mode]
- Existing contract tests: [CONTRACT_TESTS if any — DO NOT regenerate these]
- Already covered requirements: [COVERED_REQUIREMENTS if any]

## TASK
Generate unit + integration tests for target files. IF contract tests already exist, focus on GAPS: edge cases, error handling, integration scenarios not covered by contract tests.

### For EACH target file:
1. READ the source file completely
2. IDENTIFY: functions, methods, classes, exports
3. GENERATE test file at the conventional location:
   - Same directory: `*.spec.ts` / `*.test.ts`
   - Or `__tests__/` directory if project uses that convention
4. Test coverage targets:
   - ALL exported functions/methods
   - Edge cases: null/undefined, empty arrays, error paths
   - Integration: service interactions, repository calls (mock external deps)

### Test Quality Rules:
- Mock external dependencies (DB, HTTP, queues) — do NOT call real services
- Use descriptive test names: `should [expected behavior] when [condition]`
- Group related tests in describe blocks
- Include both success and error scenarios
- Follow existing test patterns in the project (if any exist)

### After generating:
RUN: [TEST_COMMAND] to verify tests compile and pass.
IF tests fail: FIX the tests (not the source code). Iterate until all pass.

## OUTPUT
```
AREA: backend
FILES_CREATED: [list of test files]
FILES_MODIFIED: [list if any existing tests updated]
TESTS_PASSING: true/false
TEST_COUNT: [number of test cases]
ERRORS: [if any tests still fail after fixes]
```
```

**2. Frontend Test Generator** [full-access, standard]
- **Prompt:**

```
## ROLE
You are the FRONTEND TEST GENERATOR for this project.

## MANDATORY: Load Context
1. READ .codeadd/skills/frontend-development/SKILL.md (if exists) for project patterns
2. READ .codeadd/project/*.md (if exists) for project conventions

## CONTEXT
- Test framework: [TEST_FRAMEWORK]
- Test command: [TEST_COMMAND]
- Target files: [FRONTEND_FILES list with full paths]
- Feature docs: [about.md/plan.md content if feature mode]
- Existing contract tests: [CONTRACT_TESTS if any — DO NOT regenerate these]
- Already covered requirements: [COVERED_REQUIREMENTS if any]

## TASK
Generate component + hook + utility tests for target files. IF contract tests already exist, focus on GAPS: edge cases, accessibility, user interactions not covered by contract tests.

### For EACH target file:
1. READ the source file completely
2. IDENTIFY: components, hooks, utilities, event handlers
3. GENERATE test file at conventional location
4. Test coverage targets:
   - Component rendering (basic render, props variations)
   - User interactions (clicks, inputs, form submissions)
   - Hook behavior (state changes, effects, return values)
   - Utility functions (input/output, edge cases)

### Test Quality Rules:
- Use testing-library patterns (@testing-library/react, @testing-library/vue)
- Mock API calls and external services
- Test user-visible behavior, not implementation details
- Include accessibility checks where relevant
- Follow existing test patterns in the project

### After generating:
RUN: [TEST_COMMAND] to verify tests compile and pass.
IF tests fail: FIX the tests. Iterate until all pass.

## OUTPUT
```
AREA: frontend
FILES_CREATED: [list of test files]
FILES_MODIFIED: [list if any]
TESTS_PASSING: true/false
TEST_COUNT: [number of test cases]
ERRORS: [if any]
```
```

**3. Workers Test Generator** [full-access, standard] *(only if WORKER_FILES > 0)*
- **Prompt:**

```
## ROLE
You are the WORKERS TEST GENERATOR for this project.

## MANDATORY: Load Context
1. READ .codeadd/skills/backend-development/SKILL.md (if exists)
2. READ .codeadd/project/*.md (if exists)

## CONTEXT
- Test framework: [TEST_FRAMEWORK]
- Test command: [TEST_COMMAND]
- Target files: [WORKER_FILES list with full paths]

## TASK
Generate unit + integration tests for job processors, queue handlers, scheduled tasks.

### For EACH target file:
1. READ the source file
2. IDENTIFY: job handlers, queue processors, cron jobs, event listeners
3. GENERATE test file
4. Test coverage targets:
   - Job execution (success path)
   - Error handling (retry logic, dead letter)
   - Input validation
   - Side effects (mock external calls)

### Test Quality Rules:
- Mock queue/job infrastructure (BullMQ, SQS, etc.)
- Test idempotency where applicable
- Verify error handling and retry behavior
- Follow existing test patterns

### After generating:
RUN: [TEST_COMMAND] to verify tests compile and pass.
IF tests fail: FIX the tests. Iterate until all pass.

## OUTPUT
```
AREA: workers
FILES_CREATED: [list]
FILES_MODIFIED: [list]
TESTS_PASSING: true/false
TEST_COUNT: [number]
ERRORS: [if any]
```
```

### 4.3 Verify Generator Outputs

**WAIT-ALL:** Verify ALL agent outputs before proceeding.
- [ ] Backend output received (if dispatched)
- [ ] Frontend output received (if dispatched)
- [ ] Workers output received (if dispatched)

⛔ GATE CHECK: All dispatched generators returned?
- If NO → WAIT. Do NOT proceed.
- If YES → Proceed.

COLLECT:
- `ALL_TEST_FILES` = combined FILES_CREATED from all agents
- `ALL_TESTS_PASSING` = true only if ALL agents report true
- `TOTAL_TEST_COUNT` = sum of TEST_COUNT

IF any agent reports TESTS_PASSING = false:
  INFORM user which area has failing tests and the errors.
  ATTEMPT one fix iteration before proceeding.

---

## STEP 5: Run Tests + Coverage Check

### 5.1 Run Full Test Suite

EXECUTE: `[COVERAGE_COMMAND]`

CAPTURE:
- Total tests run
- Tests passing / failing
- Coverage percentage (overall + per file)

### 5.2 Evaluate Coverage

SET `CURRENT_COVERAGE` = overall coverage percentage.

IF tests failing:
  LIST failing tests.
  FIX test issues (mock problems, import errors, assertion errors).
  RE-RUN suite.

REPORT to user:
```
Test Suite Results:
- Tests: [passing]/[total] passing
- Coverage: [CURRENT_COVERAGE]%
- Target: 80%
- Status: [MEETS TARGET / BELOW TARGET]
```

SET `ITERATION_COUNT` = 1.

⛔ GATE CHECK: Coverage checked?
- If NO → Run tests FIRST.
- If YES → Proceed (to STEP 6 if < 80%, or STEP 7 if >= 80%).

---

## STEP 6: Iterate (Max 5 Iterations)

### 6.1 Check If Iteration Needed

IF `CURRENT_COVERAGE` >= 80:
  SKIP to STEP 7.

IF `ITERATION_COUNT` >= 5:
  INFORM user: "Reached maximum iterations (5). Current coverage: [CURRENT_COVERAGE]%."
  SKIP to STEP 7.

### 6.2 Identify Coverage Gaps

PARSE coverage report to find:
- Files with 0% coverage (no tests at all)
- Files below 80% coverage
- Uncovered lines/branches

SET `GAP_FILES` = files needing more tests, sorted by lowest coverage.

### 6.3 Generate Additional Tests

FOR EACH file in `GAP_FILES`:
  1. READ the source file
  2. READ existing test file (if any)
  3. IDENTIFY uncovered code paths
  4. GENERATE additional test cases targeting uncovered paths
  5. ADD to existing test file or create new one

### 6.4 Re-Run and Re-Check

EXECUTE: `[COVERAGE_COMMAND]`

UPDATE `CURRENT_COVERAGE`.
INCREMENT `ITERATION_COUNT`.

REPORT:
```
Iteration [ITERATION_COUNT]: Coverage [PREVIOUS]% → [CURRENT_COVERAGE]%
```

IF `CURRENT_COVERAGE` < 80 AND `ITERATION_COUNT` < 5:
  REPEAT from 6.1.

---

## STEP 7: Report

### 7.1 Generate Final Report

```
═══════════════════════════════════════
  add-test — Final Report
═══════════════════════════════════════

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
  Status: [✅ TARGET MET / ⚠️ BELOW TARGET ([X]%)]
  Iterations: [ITERATION_COUNT]

FILES CREATED/MODIFIED:
  [list of all test files]

[IF BELOW TARGET:]
SUGGESTIONS FOR MANUAL IMPROVEMENT:
  - [file1]: [uncovered area — what to test]
  - [file2]: [uncovered area — what to test]

═══════════════════════════════════════
```

**Next Steps (from ecosystem map):**
Read `.codeadd/skills/code-addiction-ecosystem/SKILL.md` Main Flows section.
- Tests passing → `/add-review`
- Tests failing → fix and re-run `/add-test`

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
- Report coverage per area in final report
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
- Regenerate contract tests that already exist from /add-plan (detect and skip)
