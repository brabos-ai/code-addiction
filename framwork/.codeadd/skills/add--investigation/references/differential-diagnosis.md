# Differential Diagnosis (Phase 3)

## Goal

Enumerate multiple candidate causes, rank them by likelihood and cost-to-test, and test systematically — instead of locking onto the first hypothesis that feels right.

Borrowed from medical practice: a doctor presented with "chest pain" does not immediately diagnose heart attack. They list possibilities (heart attack, reflux, muscle strain, panic attack, pneumonia), rank by likelihood given patient context, and test cheapest first.

## The 5 Hypothesis Classes (for ambiguous symptoms)

Every ambiguous-symptom investigation should consider at least these 5 classes before committing to one:

| # | Class | Signature | Typical test |
|---|---|---|---|
| 1 | **Real bug** | Code does X, spec says Y, clear divergence | Read code, compare to about.md/plan.md |
| 2 | **Gap functional** | Behavior was never implemented | Grep for feature, check changelog, read about.md |
| 3 | **Doc-code drift** | Docs claim behavior code doesn't have | Diff about.md vs implementation |
| 4 | **Mental-model mismatch** | Code is correct, user expectation wrong | Trace actual behavior, explain to user |
| 5 | **Inconsistent state / race / stale** | Intermittent, data crosses boundaries | Instrument component boundaries, reproduce |

Optional additional classes:
- **Configuration drift** (env-specific — dev works, prod breaks)
- **Dependency change** (library updated, behavior shifted)
- **Data anomaly** (specific row/record causes the issue)

## Ranking

For each candidate, score on two axes:

### Likelihood (given the evidence)

| Level | Criteria |
|---|---|
| **High** | Multiple evidence points match this hypothesis |
| **Medium** | At least 1 evidence point matches, no counter-evidence |
| **Low** | Possible in theory, no direct evidence |

### Cost-to-test

| Level | Criteria |
|---|---|
| **Cheap** | Read 1-2 files, grep, read a doc |
| **Medium** | Run the code, inspect at runtime, read multiple layers |
| **Expensive** | Reproduce a race, set up env, bisect history |

### Prioritization rule

**Test cheapest-high first.** Then cheapest-medium. Only reach expensive-high after cheapest options are exhausted. NEVER jump to expensive before cheap.

## Format

```markdown
## Phase 3: Differential Diagnosis

### Candidates

| # | Hypothesis | Because | Likelihood | Cost | Priority |
|---|---|---|---|---|---|
| 1 | Real bug — `NotificationService.markRead` not emitting event | Backward trace shows event handler not firing | High | Cheap | **TEST FIRST** |
| 2 | Doc-code drift — spec says realtime, impl is polling | about.md mentions websocket, code has setInterval | Medium | Cheap | Test second |
| 3 | Stale cache — React Query not invalidating | Similar pattern in OrderService had this bug | Medium | Medium | Test third |
| 4 | Mental-model — user expects global sync, code is per-tab | No backend sync mentioned in about.md at all | Low | Cheap | Rule out fast |
| 5 | Race — optimistic update races with server response | Intermittent pattern, 1-in-10 suggests timing | Low | Expensive | Defer |

### Test log

| # | Test performed | Result | Hypothesis status |
|---|---|---|---|
| 4 | Read about.md realtime section | Confirmed: spec DOES say global sync | Rejected |
| 1 | Grep markRead + event emitter | Event emitted, handler subscribes | Rejected |
| 2 | Diff about.md vs code | about says websocket, code is polling setInterval(5000) | **CONFIRMED** |

### Conclusion

Leading hypothesis: **#2 Doc-code drift** — implementation uses 5s polling instead of websocket specified in about.md. This explains:
- Delay up to 5s matches user report "sometimes"
- No event-handler bug
- No race (deterministic polling window)

Rejected alternatives: #1, #4 (tested). #3, #5 not reached — not needed.
```

## The 3-Failure Stop Rule

After 3 failed hypothesis tests → **STOP and question the framing**, not the code.

Return to Phase 0: is the observable predicate correct? Is the symptom class right? Is there a hidden assumption you made in reformulation that's wrong?

Usually the problem is in how you framed the question, not in your diagnostic skill. 3 wrong hypotheses in a row is evidence of a framing bug.

## Anti-patterns

- **Premature convergence:** locking onto hypothesis #1 before enumerating alternatives
- **Confirmation bias:** testing hypothesis by looking for confirming evidence only
- **Expensive-first:** spending an hour on a hard reproduction before checking a doc
- **Single-hypothesis tunnel:** "it must be the cache" without listing alternatives
- **Skipping the stop rule:** testing 5+ hypotheses without questioning framing
