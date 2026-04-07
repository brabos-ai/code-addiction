---
name: add-investigation
description: Use when investigating vague symptoms, suspicious behavior, or information-flow bugs that are not obvious. Enforces differential diagnosis before route recommendation. Consumed by add.diagnose and available to any command that needs rigorous root-cause analysis before acting (hotfix triage, audit deep-dive, review follow-up).
---

# Investigation Skill

## Overview

Vague symptoms, hard-to-find bugs, and information-flow inconsistencies are NOT solved by jumping into code. They are solved by rigorous disambiguation, backward tracing, and differential diagnosis — BEFORE any fix or route decision.

This skill encodes a 5-phase methodology with a hard Iron Law. Adapted from [obra/superpowers `systematic-debugging`](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging) (MIT, credit to Jesse Vincent) and extended with Phase 0 (Symptom Disambiguation) and Differential Diagnosis — gaps the original did not cover for "ambiguous symptom, no error message" cases.

## ⛔ Iron Law

```
NO ROUTE RECOMMENDATION WITHOUT DIFFERENTIAL DIAGNOSIS FIRST
```

Corollaries:
- No "I think it is X" without at least 3 candidate hypotheses ranked.
- No code change proposal without backward tracing the data flow.
- No "this is a bug" classification without reproducing the observable predicate.
- After 3 failed hypothesis tests → STOP and question the framing (not the code).

## When to Use

- Vague symptom reports: "something seems off in X", "I don't know if this is a bug or missing feature", "this behavior looks weird".
- Pre-decision triage: before opening feature, hotfix, or dismissing as no-action.
- Pre-hotfix investigation: before committing to a fix when the cause is uncertain.
- Code review follow-up on suspicious behavior that lacks a clear repro.
- Audit findings that need deeper root-cause analysis before remediation.
- Information-flow bugs: data crosses layers and becomes inconsistent somewhere.

## When NOT to Use

- Clear error message with stack trace and obvious cause → go straight to fix.
- Feature specification already decided → use feature discovery flow.
- Project-wide health check → use audit flow.
- Simple typos, lint errors, or compile failures → fix directly.

## The 5 Phases (Blocking Sequence)

Each phase BLOCKS the next. Do not skip forward.

### Phase 0: Symptom Disambiguation

**Goal:** Convert a vague report into observable predicates.

See `references/symptom-disambiguation.md` for the full playbook.

Mandatory outputs before exiting Phase 0:
- Reformulated problem in ONE sentence the user confirmed
- At least 2 observable predicates ("what would I see if this were true?")
- Explicit classification of symptom class: missing feature / wrong behavior / inconsistent state / doc-code drift / UX confusion / unknown
- Decision: proceed with Phase 1 OR return to user for more information

⛔ DO NOT proceed to Phase 1 without user confirmation of the reformulation.

### Phase 1: Root Cause Investigation

**Goal:** Locate WHERE the problem manifests before asking WHY.

See `references/backward-tracing.md` for the backward-tracing technique and `references/flow-tracing.md` for control-flow vs data-flow vs doc-vs-code diff selection.

Mandatory steps:
1. Read errors literally (if any exist). DO NOT interpret.
2. Reproduce the observable predicate from Phase 0 (mentally or concretely).
3. Check recent changes: `git log`, changelogs, recent feature docs.
4. Instrument every component boundary in multi-layer systems (trace log points, not fixes).
5. Trace data flow BACKWARD from symptom → immediate cause → caller → origin.

⛔ DO NOT propose fixes in Phase 1. The output is a LOCATION, not a solution.

### Phase 2: Pattern Analysis

**Goal:** Find working analogues in the same codebase and diff against them.

Mandatory steps:
1. Find a similar feature/flow that works correctly.
2. Enumerate EVERY difference between working and broken cases. Do not assume "that can't matter".
3. Check for doc-code drift: does the spec say one thing and the code do another?
4. Look for duplicated logic — the "broken" case may be a stale copy.

Output: ranked list of differences with likelihood assessment.

### Phase 3: Hypothesis & Differential Diagnosis

**Goal:** Enumerate candidate causes, rank by likelihood × cost-to-test, then test.

See `references/differential-diagnosis.md` for the 5 symptom classes and ranking technique.

Mandatory steps:
1. Enumerate 3-5 candidate hypothesis CLASSES (bug / gap functional / doc drift / mental-model mismatch / race condition / stale state).
2. For each, write: "I think X because Y" (one sentence).
3. Rank by: likelihood (high/medium/low) × cost-to-test (cheap/medium/expensive).
4. Test cheapest high-likelihood first. One variable at a time.
5. Apply 5 Whys (see `references/5-whys.md`) on the leading hypothesis.

**Stop rule:** after 3 failed hypothesis tests → question the framing (Phase 0), NOT the code.

⛔ DO NOT commit to a single cause without explicitly comparing against alternatives.

### Phase 4: Synthesis

**Goal:** Convert investigation into a structured diagnosis + route recommendation.

Mandatory output structure:
1. **Reformulated problem** (from Phase 0, confirmed)
2. **Evidence found** (from Phases 1-2): files, features, hotfixes, diffs, doc-code mismatches
3. **Diagnosis** (from Phase 3): selected hypothesis + confidence + alternatives rejected + why
4. **Recommended route** (consult ecosystem routing): hotfix / feature / extend existing / no-action
5. **Risks**: of acting on recommendation AND of not acting

⛔ DO NOT recommend a route that was not the output of Phase 3 differential diagnosis.

## Companion References

| File | Use |
|------|-----|
| `references/symptom-disambiguation.md` | Phase 0 playbook: vague → observable predicates |
| `references/differential-diagnosis.md` | Phase 3: 5 symptom classes, likelihood × cost ranking |
| `references/backward-tracing.md` | Phase 1: symptom → cause backward walk (adapted from obra) |
| `references/flow-tracing.md` | Phase 1: control-flow vs data-flow vs doc-vs-code diff — deliberate choice |
| `references/agans-9-rules.md` | Debugging heuristics checklist (David Agans) |
| `references/5-whys.md` | Root cause drilling template |

## Validation Checklist

Before concluding any investigation:

```
□ Phase 0: Problem reformulated and user-confirmed
□ Phase 0: At least 2 observable predicates identified
□ Phase 1: Recent changes checked (git log / changelogs)
□ Phase 1: Backward trace performed (symptom → origin)
□ Phase 2: Working analogue found and diffed
□ Phase 3: 3+ hypotheses enumerated and ranked
□ Phase 3: Cheapest high-likelihood hypothesis tested first
□ Phase 3: "I don't understand X" admitted where true (no guessing)
□ Phase 4: Diagnosis names evidence + rejected alternatives
□ Phase 4: Route recommendation sources from differential diagnosis
□ Iron Law honored: no route without differential diagnosis
```

## Credits

- Four-phase gating structure, backward tracing, and "Iron Law" pattern adapted from [obra/superpowers `systematic-debugging`](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging) by Jesse Vincent (MIT).
- Agans 9 Rules from David Agans, *Debugging: The 9 Indispensable Rules* ([debuggingrules.com](https://debuggingrules.com/)).
- 5 Whys attributed to Sakichi Toyoda / Toyota Production System.
- Differential diagnosis framing borrowed from medical practice.
