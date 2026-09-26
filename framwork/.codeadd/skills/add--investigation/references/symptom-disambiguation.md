# Symptom Disambiguation (Phase 0)

## Goal

Convert a vague user report into observable predicates that can be tested against the codebase. Without this step, you investigate the WRONG problem efficiently.

## The Core Move

**User says:** "something is weird with the notifications"
**You need:** "when user A marks notification as read, user B still sees it as unread in their session within 5 seconds"

The second is **observable** — you can verify it with code + repro. The first is not.

## Playbook

### Step 1: Restate in one sentence

Write the problem in ONE sentence using only nouns/verbs the user used. Do not add your interpretation yet.

❌ "The notification read-state synchronization has a consistency bug"
✅ "Notifications sometimes appear unread after being marked read"

### Step 2: Ask for the observable

What would you SEE if this problem were true? Push the user for specifics:
- WHO is affected? (every user / specific user / specific role)
- WHEN does it happen? (every time / sometimes / specific condition)
- WHERE does it manifest? (which screen / which endpoint / which file)
- WHAT is the expected vs actual? (spell both out)

If the user cannot answer 2 of these 4 → the symptom is too vague. Request a concrete repro or example before proceeding.

### Step 3: Classify the symptom class

Pick ONE (or mark "unknown" and flag for Phase 1 instrumentation):

| Class | Signal | Example |
|---|---|---|
| **Missing feature** | The behavior was never implemented | "I expected a filter but there is none" |
| **Wrong behavior** | Implemented but acts differently than spec | "Clicking save redirects to home instead of staying" |
| **Inconsistent state** | Data diverges across layers/users/sessions | "My view shows X, their view shows Y" |
| **Doc-code drift** | Docs/about say one thing, code does another | "about.md says email is optional, form requires it" |
| **UX confusion** | Code is correct, user mental model is wrong | "Save button is actually autosave, user expected manual save" |
| **Race / timing** | Works sometimes, not others, no clear trigger | "Intermittent — maybe 1 in 10 tries" |
| **Stale state** | Cache/old data not refreshing | "Need to hard-reload to see changes" |
| **Unknown** | Cannot classify with available info | — |

### Step 4: Write the observable predicate

Template:
```
WHEN [precondition]
THEN [expected observable]
BUT CURRENTLY [actual observable]
```

Example:
```
WHEN user marks notification as read in Session A
THEN Session B should show unread count decremented within 5s
BUT CURRENTLY Session B still shows original count until manual reload
```

### Step 5: Confirm with user [MANDATORY STOP]

Present reformulation + symptom class + predicate to user. Ask:
- "Is this what you meant?"
- "Can you confirm the 'currently' line is accurate?"

⛔ DO NOT PROCEED without explicit confirmation. The entire investigation is downstream of this framing. Wrong framing = wasted investigation.

## Output of Phase 0

```markdown
## Phase 0: Symptom Disambiguation

**Original report:** [user's words, verbatim]

**Reformulated:** [one-sentence restatement]

**Symptom class:** [from table, or "unknown"]

**Observable predicate:**
WHEN ...
THEN ...
BUT CURRENTLY ...

**Confirmed by user:** yes / no
```

## Anti-patterns

- Skipping to code grep before confirming reformulation
- Accepting "it's just weird" as a symptom — push back
- Classifying as "bug" by default — consider doc-drift, UX confusion, missing-feature
- Writing predicates in code terms ("the useState hook returns stale value") instead of observable terms ("user sees old count")
