# 5 Whys

## Origin

Sakichi Toyoda, Toyota Production System. Root-cause analysis by recursive "why" until you reach a systemic cause instead of a surface cause.

## Template

```
Problem: [symptom]

Why 1: [direct cause]
Why 2: [why that happened]
Why 3: [why THAT happened]
Why 4: [why THAT happened]
Why 5: [why THAT happened]

Root cause: [final answer]
```

## Example

```
Problem: Production API returned 500 on /users endpoint at 14:32

Why 1: Database query timed out
Why 2: Query was doing a full table scan on `users`
Why 3: The index on `email` was dropped
Why 4: A migration ran this morning that rebuilt the users table
Why 5: The migration script didn't recreate indexes after rebuild

Root cause: Migration script is incomplete — it rebuilds the table but doesn't recreate indexes. The fix is not "add index back" (that's Why 3). The fix is "migration script must recreate all indexes after rebuild" (Why 5).
```

Notice how fixing at Why 3 would leave the system vulnerable to the SAME bug the next time a migration runs. Fixing at Why 5 prevents recurrence.

## When to Use

- After Phase 3 identifies a leading hypothesis — drill to systemic cause
- When a fix feels like a band-aid — test by asking "why" one more time
- Postmortems — converting an incident into a process improvement

## When NOT to Use

- The problem has multiple independent causes (use differential diagnosis instead)
- You don't have enough information to answer a Why — stop and investigate
- The causal chain is nonlinear (multiple Whys per level) — use a fishbone diagram

## Rules

- Each Why must be a FACT, not a guess. If you guess, mark it and verify.
- Stop when you reach a systemic cause (process, policy, assumption) — not necessarily at exactly 5.
- Do not stop at "human error" — ask why the system allowed the error.
- Do not stop at "we forgot" — ask why the process didn't catch it.

## Anti-patterns

- Stopping at Why 1 because it sounds like "the bug" — that's the symptom, not the cause
- Guessing the Why instead of verifying
- Forcing exactly 5 — sometimes 3, sometimes 7
- Blaming a person at the final Why — this is a process problem, not a person problem
