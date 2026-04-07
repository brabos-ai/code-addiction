# Flow Tracing: Control vs Data vs Doc-vs-Code (Phase 1)

## Goal

Before tracing, CHOOSE the right kind of trace. The wrong kind wastes time and misses the cause.

Three kinds of traces exist. They answer different questions.

## The Three Traces

### 1. Control-flow trace

**Question answered:** "What code PATH executed?"

**Use when:**
- Multiple branches and you don't know which ran
- A function was expected to run but seems not to have
- Conditional logic with many guards
- Event handlers / callbacks / dispatch tables

**How:**
- Add log at each branch entry
- Trace function call stack
- Check conditionals — which evaluated true/false

**Output:** ordered list of functions/branches that ran.

### 2. Data-flow trace

**Question answered:** "How did this VALUE get here, and where did it change?"

**Use when:**
- A value is wrong or unexpected
- Data crosses layers (UI → API → DB)
- State looks stale or inconsistent
- You know WHERE it is wrong but not HOW it became wrong

**How:**
- Backward trace (see `backward-tracing.md`)
- Read the value at each layer boundary
- Track transformations, assignments, mutations

**Output:** chain of transformations from origin to symptom.

### 3. Doc-vs-Code diff

**Question answered:** "Does the implementation match the specification?"

**Use when:**
- Symptom class is "doc-code drift" (Phase 0)
- User expectations come from docs
- Behavior "feels wrong" but code "looks right"
- Feature was specified and implemented at different times
- Another engineer wrote the spec

**How:**
1. Read `about.md` (feature spec), `plan.md` (technical plan), `changelog.md` (what shipped)
2. List EVERY behavioral claim in the docs (requirements RF*, business rules RN*)
3. For each claim, verify in code: does the implementation match?
4. Note every mismatch — each is a candidate cause

**Output:** list of claims with match/mismatch status.

**⚠ This is the most underused technique.** Doc-code drift is extremely common in projects with rapid iteration. If the spec says one thing and the code does another, the "bug" is either the spec being stale or the code never implementing it correctly.

## Choosing Which Trace

Use Phase 0 symptom class to pick:

| Symptom class | First trace | Second trace |
|---|---|---|
| Missing feature | **Doc-vs-code** | Grep for feature keywords |
| Wrong behavior | **Doc-vs-code** | Control-flow |
| Inconsistent state | **Data-flow** | Control-flow |
| Doc-code drift | **Doc-vs-code** | — |
| UX confusion | **Doc-vs-code** | — (code is correct) |
| Race / timing | **Data-flow** with instrumentation | Control-flow at boundaries |
| Stale state | **Data-flow** | Doc-vs-code (cache strategy) |
| Unknown | All three in parallel — cheap first | — |

## Combining Traces

Real investigations often combine. Example:

1. Start with **doc-vs-code** to confirm the spec.
2. If spec matches symptom expectation → do **data-flow** to find where the value diverges.
3. If data-flow lands at a specific function → do **control-flow** inside that function.

## Anti-patterns

- Using only control-flow when the problem is a wrong value (should be data-flow)
- Using only data-flow when the code is branching wrong (should be control-flow)
- Never checking doc-vs-code — this misses 30-50% of "mysterious" bugs
- Tracing code without reading the spec first
- Assuming the spec is correct just because the code runs
