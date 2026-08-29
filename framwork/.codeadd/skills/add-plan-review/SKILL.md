---
name: add-plan-review
description: Pre-delivery executability review for freshly generated about.md, brainstorm docs, and plan.md — verdict (ok / fix-then-ok / blocked) plus required fixes, not questions. Load before dispatching plan-reviewer-agent, or when applying its rubric inline as a fallback.
---

# Plan Review

## Overview

Rubric and verdict contract for the fresh-reader, pre-delivery review that `add.new`, `add.brainstorm`, and `add.plan` run after their validation gate passes and before the doc is presented as delivered. The reviewer tries to break the document — find what would fail in execution — and returns a verdict with concrete, evidence-backed fixes. This is a **fix-oriented** review: unlike `add-doc-reviewer`'s Gap/Clarity/Scope questionnaire, it proposes the fix, not just the question.

## When to Use

- `plan-reviewer-agent` loads this skill as its rubric source
- `/add.new` (STEP 8), `/add.brainstorm` (STEP 5), `/add.plan` (STEP 13) dispatch the agent, or apply this skill inline as a fallback when the provider does not support subagent dispatch
- `/add.plan-to-ready`'s plan leg dispatches the agent directly with `kind: feature-plan` after consolidating a subfeature's `plan.md`

## When NOT to Use

- Code review — use `add-code-review` / `@reviewer-agent`. No code exists at this phase.
- Schema-compliance enumeration (frontmatter shape, required sections, depth floors) — that is the validation gate inside `add-doc-schemas`. This review runs strictly after that gate passes.
- A replacement for `@ux-agent` critique mode — `design.md` already has its own adversarial reviewer inside `/add.plan` STEP 8.1.
- Gap/Clarity/Scope questioning without a proposed fix — that is `add-doc-reviewer`.

## Input Contract

- `path` — file to review (required)
- `kind` — `feature-about` | `brainstorm` | `feature-plan`

## Dimensions (mandatory — skip none)

| Dimension | Fail when |
|-----------|-----------|
| Scope | Includes/excludes missing, overlapping, or contradicted elsewhere in the doc |
| Hidden assumptions | A builder would have to guess a decision, default, or path |
| Contradictions | Two sections disagree |
| Dependencies | A named artefact, feature, or prerequisite does not exist, or the dependency is unstated |
| Executability | A step or requirement cannot be acted on without inventing detail |
| Testability | No way to know the requirement is satisfied (acceptance signal, check, or observable outcome) |
| Risks | A known-failure mode is unstated where the change is cross-cutting |
| Gold-plating | Scope not backed by a validated decision or requirement already in the doc |

## Kind-Specific Extras

- **`feature-about`:** the next command (`add.plan` / `add.build`) can proceed without guessing Problem, Users, Scope, or Success Metrics. Check RF/RN coverage only when those sections appear in the doc.
- **`brainstorm`:** the next command (`add.new` vs. diagnose/hotfix) is unambiguous from the doc. An *implicit* open question — something obviously unresolved that the doc does not surface — is a blocker. An *explicit* item listed under Open Threads is not.
- **`feature-plan`:** a builder can implement without inventing paths, contracts, or tasks. Architecture Decisions, Tasks, and Validation must not contradict each other. Paths and acceptance signals must be findable in `plan.md` (in Tasks bullets and/or JSON) — do NOT require a dedicated path/dependency JSON object as a precondition. Do NOT read `about.md`, `tasks.md`, or `design.md`.

## Severity

| Severity | Use when |
|----------|----------|
| **blocker** | A builder or next command cannot execute, a user decision is missing, or a contradiction makes the doc unsafe to act on |
| **attention** | Actionable but likely to drift, miss an artefact, or fail a later gate |
| **nit** | Cosmetic, wording, optional clarity. Never blocks delivery |

## Verdict (first match wins)

1. Any blocker that requires a **user decision** (scope, trade-off, artefact choice) → `blocked`
2. Any blocker or attention with a **concrete fix that does not invent a decision** → `fix-then-ok`
3. Zero blockers and zero attention → `ok`
4. Only nits → `ok`

## Caps

Max 8 blockers, 8 attention, 5 nits. Drop the weakest nits first. Prefer fewer sharp findings over a long list.

## Output Format

```markdown
## Plan Review Report

**Path:** [path]
**Kind:** [kind]
**Verdict:** ok | fix-then-ok | blocked

### Blockers
| ID | Section | Evidence | Why execution fails | Required fix |
|----|---------|----------|---------------------|--------------|
| B1 | [heading or quote ≤20 words] | [verbatim snippet] | [one sentence] | [exact edit, or a question for the user] |

### Attention
| ID | Section | Evidence | Why it matters | Required fix |
|----|---------|----------|----------------|--------------|

### Nits
- [N1] [section] — [fix]

### Do not change
- [thing that looks tempting to "improve" but is a validated decision or out of scope]
```

If a table is empty, write `None.`

## Rules

ALWAYS:
- Cite evidence from the document (quote or heading). No evidence → not a finding
- Make every Required fix actionable (edit text, add a row, or ask the user a specific question)
- Treat decisions already validated in the doc as locked — challenge only if they contradict each other or the doc's own scope

NEVER:
- Modify any file
- Invent features, artefacts, or scope beyond what the doc already states
- Read the originating conversation, application source, or (for `feature-plan`) `about.md` / `tasks.md` / `design.md`
- Praise the doc or pad with weak findings
- Confuse this with implementation audit (`add-framework--shared-review` / `@reviewer-agent`) — review the document, not the repo versus the document

## Fallback (inline, no subagent dispatch)

When the provider has no subagent dispatch, the coordinator applies this skill directly: read the target doc and the matching schema H3 fresh, as if the conversation that produced it never happened. Explicitly forget prior turns before scoring. The verdict contract and caps above are unchanged.

## Anti-Patterns

| Wrong | Right |
|---|---|
| Asking a question without proposing the fix | Every Blocker/Attention row carries a Required fix |
| Re-deriving schema compliance (missing frontmatter field, missing section) | That is the validation gate's job — assume it already passed |
| Reading `about.md` while reviewing `plan.md` | `feature-plan` kind reads `plan.md` only |
| Treating a nit as blocking delivery | Nits never change the verdict |
