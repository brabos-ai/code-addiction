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
  2. IF tests pass: proceed to STEP 12
  3. IF tests fail:
     a. Analyze failures (which contract tests fail)
     b. Fix IMPLEMENTATION to satisfy tests (not the tests themselves)
     c. Re-run tests (max 3 iterations)
     d. IF still failing after 3 iterations: report failures and STOP
```
<!-- /section:verification -->
