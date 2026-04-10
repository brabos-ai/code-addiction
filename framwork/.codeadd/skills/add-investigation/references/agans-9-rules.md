# Agans' 9 Indispensable Rules of Debugging

Source: David J. Agans, *Debugging: The 9 Indispensable Rules for Finding Even the Most Elusive Software and Hardware Problems* ([debuggingrules.com](https://debuggingrules.com/)).

Use this as a checklist when an investigation feels stuck. Each rule maps to a phase of this skill.

## The 9 Rules

### 1. Understand the system
**Before touching anything, know how it should work.** Read the spec, the docs, the architecture. If you don't know how it's supposed to work, you can't tell what's broken.

→ Phase 0 + Phase 1 start.

### 2. Make it fail
**Reproduce reliably before investigating.** Intermittent bugs investigated without repro are guesses. Find the conditions that trigger the failure and capture them.

→ Phase 0 observable predicate. Phase 1 reproduction step.

### 3. Quit thinking and look
**Read the actual values, logs, state — don't reason from assumption.** The bug is usually somewhere you'd never guess. Look at what IS, not what you think SHOULD be.

→ Phase 1 instrumentation. Backward tracing without assumption.

### 4. Divide and conquer
**Bisect the problem space.** Narrow the failure window by cutting in half and testing each side. Works for test history, commit range, data range, code path.

→ Phase 1 + Phase 3 (cheapest cost-to-test often bisects).

### 5. Change one thing at a time
**One variable per experiment.** Changing two things means you don't know which fixed (or broke) it. This applies to hypothesis tests AND to fixes.

→ Phase 3 hypothesis testing rule.

### 6. Keep an audit trail
**Write down what you tried and what happened.** Memory fails during debugging sessions. The audit trail is what lets you spot patterns and avoid re-testing.

→ Phase 3 test log table.

### 7. Check the plug
**Verify the obvious basics first.** Is the service running? Is the correct branch checked out? Is the config loaded? Is the right version deployed? Most "impossible" bugs are trivial oversights.

→ Phase 0 + Phase 1 first step.

### 8. Get a fresh view
**When stuck, explain it out loud.** Rubber duck, colleague, writing it down. Forced articulation surfaces hidden assumptions.

→ Phase 3 "3-failure stop rule" — explain framing out loud.

### 9. If you didn't fix it, it ain't fixed
**A "disappearing" bug without understanding is not fixed.** If the symptom went away but you can't explain why, the bug is still there — waiting to return. Understand the cause OR don't ship.

→ Iron Law corollary.

## Quick Checklist

```
[ ] (1) Do I understand how this SHOULD work?
[ ] (2) Can I reliably reproduce the failure?
[ ] (3) Am I looking at actual state, not assumed state?
[ ] (4) Can I bisect the problem space?
[ ] (5) Am I changing one variable at a time?
[ ] (6) Am I keeping an audit trail?
[ ] (7) Did I check the obvious basics?
[ ] (8) Have I explained this out loud / written it down?
[ ] (9) Do I actually understand the cause, or did it just "go away"?
```

Run this checklist when an investigation feels stuck. Usually 1-3 rules are being violated.
