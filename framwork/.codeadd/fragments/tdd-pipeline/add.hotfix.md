<!-- uses:
- agent: test-agent
- skill: add-tdd
- mention: @fix-agent
-->

<!-- section:red-gate -->

### RED — Pin the Bug with a Failing Test (tdd-pipeline)

⛔ **GATE:** The root cause is confirmed. Pin it with a failing test BEFORE any production edit.

Load `{{skill:add-tdd/SKILL.md}}` — its **Bug-fix mode** is the discipline this step executes. Do not restate it, follow it.

**DISPATCH AGENT: `@test-agent`** [full-access on test files only, standard]

- **Inputs:** `MODE = CORRECTION`, the confirmed root cause and its repro from STEP 7, the files named there, `TEST_FRAMEWORK`, `TEST_COMMAND`, `KNOWN_FAILURES`, `ATTEMPT = 1` and `MAX_ATTEMPTS = 1`.
- **`ATTEMPT` is supplied here, never by the agent**, and it travels the same route `@fix-agent`'s already does — one field with one meaning must not have two routes. ⛔ The VALUE is 1, not 3: this flow dispatches once and, on a test that is not RED for the right reason, returns to STEP 7 rather than re-dispatching. Passing 3 would name two attempts that do not exist and tell the agent to keep trying where the coordinator has already left.
- **Substitution (MANDATORY):** `@test-agent`'s documented `CORRECTION` inputs name a `## Fix Routing` slice. **No such table exists here** — this flow has no review document yet. Pass the confirmed root cause plus the repro in its place, and say so in the dispatch.
- **Report:** `RED_TEST` (path + test name), `TESTS_PASSING`, `ERRORS`, `CONCERNS`. ⛔ No `BLOCKED`: the agent's contract excludes that state in `CORRECTION` mode, because there the red test is what was ordered.

**`KNOWN_FAILURES` here is whatever was already red before this hotfix started**, one per line as
`<test>: <area>` — typically nothing, since a hotfix branches from a green main. **Pass it EMPTY
rather than omitting it**: the brief then reads `none observed`, which tells the agent the tree was
checked, where `not supplied` tells it nothing and leaves it to find out on its own. The one thing it
must not do to find out is clear a tree other agents are working in.

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

It goes in `about.md`'s `## Review` section (STEP 12) and in the STEP 11 iteration entry. An unrecorded skip is indistinguishable from a forgotten step.

⛔ DO NOT invent a test to satisfy this gate. A fabricated test that never bites is worse than a recorded escape.

#### No test runner

IF no framework is configured, follow the detection-and-auto-configure procedure the `tdd-pipeline` fragment defines for `{{cmd:add.build}}`. IF one still cannot be configured: **report it loudly and continue to STEP 8.** A production bugfix is never blocked on a missing runner — but the gap is stated, never silent.
<!-- /section:red-gate -->
