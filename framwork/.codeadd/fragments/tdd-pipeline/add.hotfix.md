<!-- section:red-gate -->

### RED — Pin the Bug with a Failing Test (tdd-pipeline)

⛔ **GATE:** The root cause is confirmed. Pin it with a failing test BEFORE any production edit.

Load `{{skill:add-tdd/SKILL.md}}` — its **Bug-fix mode** is the discipline this step executes. Do not restate it, follow it.

**DISPATCH AGENT: `@test-agent`** [full-access on test files only, standard]

- **Inputs:** `MODE = CORRECTION`, the confirmed root cause and its repro from STEP 7, the files named there, `TEST_FRAMEWORK` and `TEST_COMMAND`.
- **Substitution (MANDATORY):** `@test-agent`'s documented `CORRECTION` inputs name a `## Fix Routing` slice. **No such table exists here** — this flow has no review document yet. Pass the confirmed root cause plus the repro in its place, and say so in the dispatch.
- **Report:** `RED_TEST` (path + test name), `TESTS_PASSING`, `ERRORS`.

⛔ ONE new failing test that pins this bug. DO NOT regenerate the area's suite, and DO NOT rewrite passing tests. Touch an existing test only when the fix genuinely changes the contract it asserts.

#### Confirm RED yourself

⛔ **The coordinator runs the test. The agent's report is not the proof.**

`@test-agent` returns `TESTS_PASSING`; RED needs the opposite plus the reason. A test that reports failure for a syntax or import error is not RED — it is broken.

1. RUN the new test via `TEST_COMMAND`.
2. CONFIRM it fails, and read the output to confirm it fails for the **right reason** — the missing or wrong behaviour, NOT a syntax error, import error or typo.
3. IF it passes: the bug is not where the root cause says it is, or the test does not exercise it. Return to STEP 7 — do NOT proceed.

Only then continue to STEP 8, where the fix drives it GREEN.

#### When the bug is not unit-testable

Some bugs have no unit-level assertion — a CSS-only regression, a config value, an infrastructure default.

Record the escape explicitly:

```
RED_TEST: none — REASON: <why this bug has no unit-level assertion>
```

It goes in `about.md`'s `## Review` section (STEP 11) and in the STEP 15 iteration entry. An unrecorded skip is indistinguishable from a forgotten step.

⛔ DO NOT invent a test to satisfy this gate. A fabricated test that never bites is worse than a recorded escape.

#### No test runner

IF no framework is configured, follow the detection-and-auto-configure procedure the `tdd-pipeline` fragment defines for `{{cmd:add.build}}`. IF one still cannot be configured: **report it loudly and continue to STEP 8.** A production bugfix is never blocked on a missing runner — but the gap is stated, never silent.
<!-- /section:red-gate -->
