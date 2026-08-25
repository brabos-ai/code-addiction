---
name: add-tdd
description: RED-GREEN-REFACTOR execution discipline for AI agents. Use when implementing any feature or bugfix that has (or should have) tests — forces a failing test confirmed for the right reason before any production code. Loaded by add.build.
---

# TDD — RED-GREEN-REFACTOR Discipline

> **LANG:** Respond in user's native language. Tech terms in English.

## Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

If you wrote implementation before its test: delete it, start over from RED. "Keep it as reference" is testing-after — delete means delete.

## The Cycle (one feature at a time)

### RED — write ONE failing test
1. Write a test describing the expected behavior (from the acceptance criterion / contract).
2. Run the test. It **MUST fail**.
3. Confirm it fails for the **RIGHT reason**: missing implementation, wrong return value, unmet condition — **NOT** a syntax error, import error, or typo.
4. If it passes: the feature already exists or the test is wrong. Investigate before continuing.

### GREEN — minimal code to pass
1. Write the **smallest** code that makes the test pass. No cleverness, no optimization, no extra features.
2. Run the test. It **MUST pass**.
3. Run the existing suite. No regressions.

### REFACTOR — only while GREEN
1. Improve names, remove duplication, extract helpers.
2. Tests stay green. **Never refactor while RED** — get to GREEN first.
3. Do **not** add behavior during refactor.

Then loop to RED for the next behavior. One test ↔ one implementation step. Do **not** write all tests first then all implementation (horizontal slicing produces tests for imagined, not actual, behavior).

## Anti-Rationalization

| Rationalization | Reality |
|-----------------|---------|
| "I'll add the test right after" | You won't, and the code will shape the test. Test first, always. |
| "I need to see the design first" | The test IS the design. Let it drive the interface. |
| "Already wrote it, deleting is wasteful" | Sunk cost. Delete it. Start from RED. |
| "The test passes immediately, good" | It proves nothing — it never failed. Fix the test or pick new behavior. |
| "Syntax error counts as RED" | No. It must fail because the behavior is missing. |
| "I'll batch these trivial features" | Trivial enough to batch = trivial enough to skip TDD; use a plain task. |

## When NOT to use

- Throwaway spikes / exploratory prototypes you will delete.
- Pure config or doc changes with no behavior.
- Generated code with no logic.

## Bug-fix mode

When a bug is reported: do not start by fixing it. First write a test that **reproduces** it (RED), then fix to GREEN.
