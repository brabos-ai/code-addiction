---
name: add-doc-reviewer
description: Use when reviewing a just-written documentation asset (about.md, brainstorm, plan.md, hotfix docs, and other schema-bound ADD docs) as a fresh stakeholder — surfaces gaps, unclear passages, and out-of-scope questions without ever reading the originating conversation. Invoke this whenever a command finishes writing a schema-bound doc and you want a cold-read sanity check before declaring the doc done, or when a user asks for a second-pass review of an existing doc. Dispatched by /add.brainstorm and /add.new automatically; can also be invoked manually.
---

# Doc Reviewer

## Overview

Reviews a generated documentation asset as if you were a fresh stakeholder reading it for the first time. Surfaces the questions a reasonable reader would still have, and classifies each into Gap / Clarity / Scope so the parent command knows how to resolve it.

The reviewer has no context beyond the doc and its schema. That blindness is the leverage: any question the reviewer raises about something the user already discussed is proof that the doc failed to capture the discussion. If you cheat and read the originating conversation, you lose the very signal the skill exists to produce.

## When to Use

- After `/add.brainstorm` writes a BRN doc — surface loose ends before the idea moves to planning
- After `/add.new` writes `about.md` — catch missing requirements, unclear scope, undocumented edge cases
- Any command that produces a schema-bound doc and wants a cold-read sanity check before declaring done
- Manual: user asks for a second-pass review of an existing doc

## When NOT to Use

- Mid-draft docs still under active editing (review the finished draft)
- Code review, security review, architecture review (`add-code-review`, `add-security-audit`)
- Schema-compliance validation — that is the validation gate inside `{{skill:add-doc-schemas/SKILL.md}}`
- Docs not generated from an ADD schema (external READMEs, vendor docs)

## Input

The caller passes two things:

1. **Doc path** — absolute path to the doc to review
2. **Schema name** — one of the types from `{{skill:add-doc-schemas/SKILL.md}}` (e.g. `feature-about`, `brainstorm`, `feature-plan`)

You read only those two files (the doc and the schema H3). Nothing else — no source code, no prior conversation, no related docs unless the doc itself links to them and the question genuinely depends on following the link.

## How You Work

### 1. Identify the lens

Check the schema against the lens table below. The lens is the first thing that determines what kinds of questions are legitimate. Getting the lens wrong turns the review into a mix-up of business and technical concerns, which is exactly what the separate schemas exist to prevent.

| Lens | Schemas | Questions in-scope | Questions out-of-scope (drop even if interesting) |
|---|---|---|---|
| **Business** | `feature-about`, `brainstorm`, `owner`, `product`, `saas-copy` | What the user does, why it matters, who is affected, in/out of scope, success criteria, user-visible behaviour, business rules | Field names, entity shapes, API routes, class/module names, DB columns, tech stack choices, libraries, implementation order, tasks, estimates |
| **Technical** | `feature-plan`, `feature-design`, `audit-report`, `diagnose-report`, `changelog`, `hotfix-related`, `landing-page` | Architecture decisions, tasks, risks, dependencies, validation steps, component/field/route specifics, migration steps, file paths | Product vision, user-facing value prose, marketing claims |
| **Mixed** | `hotfix-about` | Symptom section → Business lens (observable impact). Root Cause section → Technical lens (mechanism, failed safeguards). Stay inside the right lens per section. | Speculating about fix design beyond what the Fix section names |

**Business-lens discipline.** A real technical gap (e.g. "the about.md does not specify which fields are on the form") is NOT a Gap for `feature-about` — it belongs to the next command (`/add.plan`). Do not raise it. If the concern can be reframed as a business-level question — "does scope cover editing existing items or only creating new ones?" instead of "what's the entity shape?" — raise the business version. Otherwise drop. User-visible behaviour is Business even when it sounds technical: *"What happens if two users edit the same item?"* is Business (conflict resolution is user-facing). *"Optimistic or pessimistic locking?"* is Technical. Same phenomenon, different layer.

**Technical-lens discipline.** Do not ask product/vision questions. If `feature-plan` seems to solve the wrong problem, that's an upstream gap in `feature-about` — note it in the Verdict, do not enumerate as a Gap.

**Mixed-lens discipline.** In `hotfix-about`, each section has its own lens. Symptom questions must be observable and user-facing; Root Cause questions must be mechanical and specific (the exact code path, the exact failed safeguard). Do not blur the two — a mechanism question in Symptom is wrong-lens; an impact question in Root Cause is wrong-lens.

When in doubt: check the schema's section list. Problem/Users/Scope/Metrics → Business. Decisions/Tasks/Risks/Validation → Technical.

### 2. Generate questions a fresh reader would ask

Walk the doc section by section. For each section, ask: if this doc landed in my inbox and I had to act on it, what would I need to ask before I could proceed?

Ask as many questions as the doc genuinely warrants — a clean doc may prompt one; a shaky one may prompt a dozen. Quality beats count. A question that would actually block a reader is worth more than five that wouldn't. Padding the list to look thorough hurts the user more than it helps.

Keep questions concrete. *"What happens if the user is offline?"* is useful. *"Is the scope comprehensive?"* is not — the user cannot act on it.

### 3. Classify each question

| Bucket | Definition | Signal to the user |
|---|---|---|
| **Gap** | The schema's depth floor expects this fact and it's missing or underspecified | Update the doc — add the content |
| **Clarity** | The fact is in the doc but ambiguous, buried, or contradicted by another section | Rewrite the passage — rephrase, not add |
| **Scope** | A reasonable stakeholder question, but nothing in the schema or the doc suggests it was part of the original intent | User decides: extend scope, mark out-of-scope with a reason, or ignore |

**Tie-breaker (Gap vs. Scope):** check the schema's depth floor for the section. If the required fact covers the question → Gap. If the schema is silent → Scope.

**Tie-breaker (Gap vs. Clarity):** if you can locate the fact in the doc but two readers could interpret it differently → Clarity. If you cannot locate the fact at all → Gap.

### 4. Brainstorm-specific rule

`brainstorm` docs have an "Open Threads" section. An unresolved question listed explicitly there is fine — the doc is acknowledging what remains open. But an *implicit* unresolved question — something obviously open that the doc does not surface as a thread — is a Gap. The point of closing a brainstorm is that loose ends are either resolved or explicitly listed. A brainstorm that leaves a big question unacknowledged has failed its purpose.

This is the one schema rule worth calling out; the rest are already covered by the depth-floor mechanism.

## Output Format

Return a textual review. The parent agent reads the prose and decides how to act.

```markdown
## Doc Review: <doc path>

**Schema:** <schema type>
**Lens:** <Business | Technical | Mixed>
**Total questions:** <N> (<gaps> gap · <clarity> clarity · <scope> scope)

### Gaps

1. **<section name>** — <question>
   Why: <which schema depth-floor item is not met>

### Clarity

1. **<section name>** — <question>
   Why: <the ambiguous phrase and the two or more ways it could be read>

### Scope

1. <question>
   Why: <why this is a reasonable stakeholder question but not covered by the schema or the doc>

### Verdict

<One paragraph. Name the 1–2 most important items to address first. If the doc has no Gaps or Clarity items, say so plainly and flag any Scope questions as the user's call. If the frontmatter is malformed or a required section is missing entirely, mention it here — schema compliance is the validation gate's job, not yours, but you can flag it in passing.>
```

Notes on the format:

- **Empty buckets**: if a bucket has no items, omit the heading entirely. The parent agent handles variable structure fine.
- **Section prefix** on questions: use `**<section name>** — ` for Gaps and Clarity (which always map to a section). Omit the prefix for Scope questions that genuinely don't map to any existing section.
- **No JSON.** The consumer is a reasoning agent, not a parser.

## Example

**Input**

- Doc: `docs/features/0042F-notifications/about.md`
- Schema: `feature-about`

**Doc body (excerpted)**

```markdown
## Problem
Users miss important updates because we have no in-app notification system.

## Users
| role | goal | pain |
|---|---|---|
| End user | See recent activity | Misses updates posted while offline |

## Scope
### Includes
- In-app notification center
- Mark-as-read

### Does NOT Include
- Push notifications
```

**Expected review**

```markdown
## Doc Review: docs/features/0042F-notifications/about.md

**Schema:** feature-about
**Lens:** Business
**Total questions:** 3 (1 gap · 1 clarity · 1 scope)

### Gaps

1. **Scope** — The "Does NOT Include" list has only one item. The schema requires the three most likely scope-creep requests with reasoning. Email notifications, digest/summary frequency, and per-type mute controls are obvious candidates — are any of them out of scope, and why?
   Why: `feature-about` depth floor requires "Does NOT Include" to cover the three most likely scope-creep requests with reasoning.

### Clarity

1. **Problem** — "Users miss important updates" can be read two ways: updates the user should act on (account alerts, mentions) or updates about system state (someone commented, file changed). These imply very different notification volumes. Which does the feature target?
   Why: The phrase is load-bearing and ambiguous; downstream plan decisions depend on which interpretation is correct.

### Verdict

The Scope gap is the most important — without explicit exclusions, /add.plan will re-open the conversation. Address that first, then tighten the Problem statement.
```

**What the review does NOT include** (wrong-lens traps avoided):

- No question about the notification entity shape, API routes, or database schema (those belong to `feature-plan`)
- No question about which library to use for WebSocket transport (Technical — out of scope here)
- No question about marketing copy or landing page positioning (Business, but not this doc's Business)

## Constraints

- **Read-only.** Never edit the doc. The parent decides whether to re-invoke the generator.
- **Quality beats count.** One sharp question beats five generic ones.
- **Be specific.** Name a section or a phrase. *"Scope is unclear"* is not a question; *"Scope says 'notifications are in scope' but does not specify whether push notifications are included alongside in-app"* is.
- **No implementation advice.** You ask; you do not propose how to answer. The parent and the user decide.

## Loop Context

The skill performs one review per invocation. The parent command owns the loop, the 2-round cap, and the user interaction. If you are dispatched as a subagent, your response is a single review; the parent reads it and decides whether to re-dispatch.

## Anti-Patterns

| Wrong | Right |
|---|---|
| Reading the source conversation before reviewing | Read only the doc and the schema H3 |
| "This section is too short" | Name the missing fact by its schema depth-floor requirement |
| 20 questions, most nitpicks | As many as the doc warrants, each one a blocker |
| Proposing answers to your own questions | Ask; let the parent and user decide |
| Flagging an explicit Open Thread in a brainstorm as a Gap | Only flag unacknowledged open questions |
| Field names / API routes / class names in a Business-lens review | Wrong lens — reframe as user-visible scope, or drop |
| Product-vision questions in a Technical-lens review | Wrong lens — note upstream gap in Verdict, don't enumerate |
| Padding to hit a count | Submit the real number, even if it's 1 or 0 |

## Checklist

- [ ] Read only the doc + schema H3 for the given schema name
- [ ] Identified the lens (Business / Technical / Mixed) before generating questions
- [ ] Every question stays inside the doc's lens — no cross-lens leakage
- [ ] Every question names a specific section or phrase
- [ ] Each question classified into exactly one of Gap / Clarity / Scope
- [ ] Gaps justified against a schema depth-floor requirement
- [ ] Clarity items include at least two possible interpretations
- [ ] Scope items explain why the question is reasonable but unschema-bound
- [ ] Verdict names the 1–2 most important items (if any)
- [ ] Empty buckets omitted; no `none.` filler
- [ ] Output is prose, not JSON
