# Feature Discovery & Documentation

> **REF:** `CLAUDE.md` for architecture patterns
> **OUTPUT:** Max 20 words per response. Tables/lists are exceptions. Straight to the point.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

Full feature discovery command BEFORE implementation.

**IMPORTANT:** This command is READ-ONLY for project code. May only create/edit documentation in `docs/features/`.

---

## Spec

```json
{"write_allowed":"docs/features/","skills":{"mandatory":"feature-discovery, documentation-style, feature-specification"}}
```

---

## Yolo Mode

If argument contains `--yolo`: skip ALL [STOP] points, use Recommendation options automatically, execute to completion without human interaction, log all auto-decisions.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**FIRST ACTION:** Validate this produces DOCUMENTATION ONLY (about.md, discovery.md). Arguments = feature description, never implementation orders.

**PROHIBITIONS AND PERMISSIONS:**
```
READ-ONLY FOR CODE:
  ⛔ DO NOT MODIFY: src/, apps/, libs/, packages/, configs, commands, skills
  ⛔ DO NOT: Run build/test/deploy, write code, implement features

ALLOWED:
  MAY CREATE: docs/features/[XXXX]F-[name]/**/*.md
  MAY RUN: bash .codeadd/scripts/init.sh, git checkout -b (Step 1 only)

IF USER PROVIDES CODE/SPECS IN ARGUMENTS:
  Treat as REFERENCE MATERIAL for discovery — do not execute or apply
```

---

## Operation Modes

### Detection Mode

```
/feature [description]     → Create new feature
/feature F0018             → Continue existing feature
/feature continue          → Continue feature from current branch
```

### Complexity Detection

Analyze the request and classify:

| Type | Keywords | TodoList |
|------|----------|----------|
| **SIMPLE** | "add field", "fix", "adjust", "bug", "remove" | 3 steps |
| **STANDARD** | "create", "implement", "new", "feature", integrations | 6 steps |

---

## Execution via TodoWrite

### On Start: Create TodoList

**SIMPLE (3 steps):**
```json
[
  {"content":"Run init and create structure","status":"pending","activeForm":"Running init"},
  {"content":"Validate scope with user [STOP]","status":"pending","activeForm":"Validating scope"},
  {"content":"Document about.md and discovery.md","status":"pending","activeForm":"Documenting"}
]
```

**STANDARD (6 steps):**
```json
[
  {"content":"Run init and create structure","status":"pending","activeForm":"Running init"},
  {"content":"Dispatch discovery subagents (features context + codebase) [parallel]","status":"pending","activeForm":"Dispatching discovery subagents"},
  {"content":"Deep thinking + present questionnaire [STOP]","status":"pending","activeForm":"Awaiting user validation"},
  {"content":"Complexity gate evaluation","status":"pending","activeForm":"Evaluating complexity"},
  {"content":"Document about.md and discovery.md (+ epic structure if needed)","status":"pending","activeForm":"Documenting"},
  {"content":"Validate generated documentation","status":"pending","activeForm":"Validating docs"}
]
```

### [STOP] Rule

Mark as `in_progress` → present to user → **STOP AND WAIT** → mark `completed` only AFTER user responds.

---

## Instructions by Step

### 1. Run Init + Create Structure (TEMPLATES MANDATORY)

```bash
bash .codeadd/scripts/init.sh
```

**Parse RECENT_CHANGELOGS from output** - latest completed features with summaries.

**Load Product Context:** Read `docs/product.md` (if exists). Flag misalignment with product vision in questionnaire.

**Smart changelog rule:** Match user request keywords against RECENT_CHANGELOGS. If match found, read full `docs/features/{FEAT_ID}/changelog.md` for implementations/patterns/files. Use for: precise questions, existing-work suggestions, duplication avoidance.

**MANDATORY GATE:** Load templates from `.codeadd/templates/` (feature-about-template.md + feature-discovery-template.md) BEFORE creating docs.

**Infer from request:** branch type (`feature`|`fix`|`refactor`|`docs`), name (kebab-case, 2-4 words).

**MANDATORY SEQUENCE:**
1. `git checkout -b [type]/[XXXX]F-[name]`
2. `mkdir docs/features/[XXXX]F-[name]/`
3. Write about.md + discovery.md with templates filled

**Output:** Feature ID (000XF), branch created, directory created, templates filled.

---

### 2. Deep Discovery (STANDARD only)

**Goal:** Collect rich context for deep thinking and consultant questionnaire.

## Agent Dispatch Rules

When dispatching: match **Capability** (read-only/read-write/full-access) and **Complexity** (light/standard/heavy) to best available agent mechanism. Verify output exists before proceeding past WAIT/GATE.

**DISPATCH SEQUENTIAL (agent 2 depends on output of agent 1):**

1. **DISPATCH AGENT: Past Features Discovery** [read-only, light]
   - **Intent:** Analyze past features for relevance to current request
   - **Skill:** `feature-discovery/SKILL.md` Phase 1.5
   - **Input:** RECENT_CHANGELOGS (from Step 1) + current feature's about.md
   - **Output:** `docs/features/${FEATURE_ID}/past-features.md`
   - **Steps:**
     - Read `.codeadd/skills/add-feature-discovery/SKILL.md` Phase 1.5
     - Extract keywords from about.md
     - For each feature in RECENT_CHANGELOGS: check Quick Ref in changelog.md (fallback: first 30 lines)
     - For matches: read iterations.jsonl + about.md, classify relationship
     - Write `docs/features/${FEATURE_ID}/past-features.md`
   - **WAIT:** past-features.md must exist before continuing.

2. **DISPATCH AGENT: Codebase Discovery** [read-write, standard]
   - **Intent:** Deep codebase analysis informed by past features context
   - **Skill:** `feature-discovery/SKILL.md` Phase 2-4
   - **Input:** past-features.md + about.md + feature request
   - **Output:** `docs/features/${FEATURE_ID}/discovery.md`
   - **Steps:**
     - Read `.codeadd/skills/add-feature-discovery/SKILL.md` and `.codeadd/skills/add-documentation-style/SKILL.md`
     - Read `docs/features/${FEATURE_ID}/past-features.md` BEFORE analyzing codebase
     - Use past-features.md as context: prioritize files touched by related features, follow established patterns, respect past decisions
     - Perform deep codebase analysis: reusable functionality, existing patterns, integration points, potential conflicts, missing prerequisites
     - Include "Related Features" section in discovery.md (table + `<!-- refs: ... -->`)
     - Write `docs/features/${FEATURE_ID}/discovery.md` using the discovery template

### 2.3 Deep Thinking (coordinator, BEFORE questionnaire)

After both agents complete, coordinator performs deep thinking using their outputs:

**DEEP THINKING CHECKLIST (evaluate ALL):**
- [ ] Impact on existing features? (from past-features.md)
- [ ] Edge cases per functional requirement?
- [ ] Complete error flows? (timeout, conflict, partial failure)
- [ ] Consistency between requirements in the request?
- [ ] Missing UX gaps not mentioned by user?
- [ ] "What if...?" questions — non-obvious scenarios
- [ ] Implicit assumptions that need validation (auth, permissions, ordering)
- [ ] Past decisions that guide or constrain current choices?
- [ ] Technology/library decisions pre-decided by codebase?
- [ ] Related features mapped with correct relation types?

Generate rich, concrete questionnaire based on data, not generic questions.

---

### 3. Present Consultant Questionnaire [STOP]

**IMPORTANT:** This is a STOP POINT. Present and WAIT.

**MINDSET:** You are a **product consultant**, not an order taker. Your role is:
- Help user REFINE the demand
- Bring CONTEXT from codebase that influences decisions
- SUGGEST improvements they didn't think of
- Show TRADE-OFFS of each choice
- Identify GAPS and risks

#### Smart Inference Rules

**Inference sources (priority):**

| Source | What to Extract | Example |
|---|---|---|
| **1. Codebase** | Similar features, existing patterns, entities | "Already exists `cancelSubscription()`, we can extend" |
| **2. Request** | Verbs, context, described problem | "add" → small scope, "create" → larger scope |
| **3. Best Practices** | Domain patterns | Cancellation → confirm with user? |
| **4. Previous Features** | Past decisions | Maintain UX consistency |

**Inferences by action type:**

| Action Mentioned | Infer Automatically |
|---|---|
| Cancel/delete | Confirm with user? Soft delete? |
| Form/input | Validation? Masks? |
| External integration | Fallback? Retry? Timeout? |
| List | Pagination? Filters? Sorting? |
| Notification | Email? Push? In-app? |

#### Questionnaire Structure (5 Sections)

```markdown
## Consultant Validation - [Feature Name] (000XF)

---

### 1. I understand you want...

**Goal:** [1 clear sentence of what user wants to achieve]

**Current problem:** [Why this is necessary - inferred from request]

**Expected delivery:** [What user will have at the end - ALL layers]

> If I misunderstood, correct me before continuing.

---

### 2. I discovered in codebase

| Finding | Relevance to Feature |
|---|---|
| [Exists X in `path/file.ts`] | [Can reuse/extend] |
| [Pattern Y used in similar features] | [Follow same pattern] |
| [Z doesn't exist yet] | [Need to create] |

**Similar feature as reference:** `[path/]` - [what to leverage]

---

### 3. Refining the Demand

#### 3.1 [Strategic scope question]

| Option | What it includes | Trade-off |
|---|---|---|
| a) | [description] | [benefit] / [cost] |
| b) | [description] | [benefit] / [cost] |
| c) | [description] | [benefit] / [cost] |

> **Recommendation:** Option **a)** — [concrete justification based on codebase, best practice, or clear trade-off]

#### 3.2 [Behavior/UX question]

| Option | Behavior | When it makes sense |
|---|---|---|
| a) | [description] | [ideal scenario] |
| b) | [description] | [alternative scenario] |

> **Recommendation:** Option **a)** — [concrete justification based on codebase, best practice, or clear trade-off]

[Add more questions as needed]

**Recommendation Rules:**
- MANDATORY below EVERY option table — no exceptions
- Justification MUST be CONCRETE (not "it's the best option" — say WHY)
- Base on: codebase discovery, best practices, trade-off analysis, previous features
- If no option is clearly better: "Depends on [criteria]. If X → option a. If Y → option b."

---

### 4. Consultant Insights

You are a **senior product consultant** bringing value the user DIDN'T ask for. Think: what would they WISH they had asked for after shipping? What adjacent value comes with minimal effort? What patterns fail at scale?

**Product/UX features:** Perform market benchmark via WebSearch + model knowledge.
**Internal/refactor/infra:** Skip WebSearch. Use engineering best practices and architecture patterns.

**FORMAT — free-form, not rigid categories.** Present each insight as:

#### [emoji] [Insight title]
- [What + Why + Impact — in your own words, like a senior consultant would explain]
- **Effort:** Low/Medium/High
- → Include? `Yes` / `No` / `Later`

**Hard Rules:**
- Section 4 MUST NOT repeat topics from Section 3
- If the insight is about something the user ASKED → it belongs in Section 3, not here
- If the insight is about something the consultant BROUGHT → it belongs in Section 4
- Minimum 1 insight, maximum 10

**After all insights, include a response template:**

```markdown
---
Quick Response Template (copy, paste, fill):

3.1: R:
3.2: R:
[...one line per refinement question from section 3...]
Insight 1 ([title]): R:
Insight 2 ([title]): R:
[...one line per insight from section 4...]
```

---

### 5. How It Will Work

Present: main flow diagram (`[User] → [Action] → [System] → [Result]`), stage-by-stage table (who/what/feedback), error cases table, and before vs after comparison.

---

## How to Respond

**Accepted responses:**
- `Ok` → Accept ALL agent recommendations as default
- `Ok, but 3.2b` → Accept recommendations except where specified
- `3.1b, 3.2a` → Specific choices (overrides recommendations)
- `Insight X: Yes` / `Insight Y: No` / `Insight Z: Later`
- `+ also want X` → Add to scope

**Defaults:**
- **If you don't specify an option:** Agent's recommendation is used.
- **If you don't respond to an insight:** It is NOT included (explicit opt-in required).
```

#### Example: Feature with UI (Profile Reset)
```markdown
### 1. I understand you want...
**Goal:** Allow user to reset profile AND optionally cancel subscription
**Current problem:** Route `/account/reset` has confusing name and no integrated cancellation
**Expected delivery:** Backend `/profile/reset` route + Frontend modal with checkbox + Stripe integration

### 2. I discovered in codebase
| Finding | Relevance |
|---|---|
| `ResetAccountOnboardingCommandHandler` exists | Extend with cancellation logic |
| `SubscriptionService.cancelSubscription()` implemented | Reuse, add "immediate" mode |
| Frontend uses modal pattern in `ConfirmDialog.tsx` | Follow same pattern |

### 4. Consultant Insights
#### Two-step confirmation for destructive actions
- Separating confirmations (reset → then cancel) follows "progressive disclosure of consequences" pattern (Stripe, GitHub, AWS). Prevents accidental subscription loss.
- **Effort:** Low
- → Include? `Yes` / `No` / `Later`
```

#### Adapt to Feature Type

| Type | Sections to Include | Sections to Skip |
|---|---|---|
| API only | Goal, Scope, Data, Errors | UI/UX |
| UI only | Goal, Scope, Flow, States | Persistence |
| Refactor | What changes, What stays, Risks | New data |
| Integration | Goal, External APIs, Fallbacks | - |
| **Fullstack** | **ALL necessary layers** | - |

**CRITICAL RULE:** If questionnaire validated user UI/flow → type is **Fullstack**, not "API only".

#### After Presenting → STOP AND WAIT

#### After Receiving Response

Summarize confirmed decisions (scope choices, accepted/rejected insights, validated assumptions) and ask user to confirm. If confirmed → COMPLEXITY GATE. If corrected → adjust and confirm again.

---

### 3.5 COMPLEXITY GATE (after questionnaire response)

**Analyze the validated scope for independent user flows.**

**Independent user flow** = can be tested in isolation, has distinct objective, could be its own PR. Keywords: "will also", "and then", "another flow".

**IF N = 1 → skip gate, continue to step 4.**
**IF N >= 2 → Propose decomposition [STOP]:**
```
Identified [N] independent flows in the validated scope:

SF01: [name] — [1-sentence objective]
SF02: [name] — [1-sentence objective]

Suggested implementation order:
1. SF01 (no dependencies)
2. SF02 (depends on: SF01)

Decompose as subfeatures? (yes / no — keep as single feature)
```

**DO NOT proceed before user responds.**

**IF user confirms epic decomposition:**

1. Create `docs/features/${FEATURE_ID}/epic.md`:
```markdown
# Epic: [Name]

## Subfeatures

| ID | Name | Objective | Status | Checkpoint |
|----|------|----------|--------|------------|
| SF01 | [name] | [objective] | pending | - |
| SF02 | [name] | [objective] | pending | - |

## Implementation Order

1. SF01 (no dependencies)
2. SF02 (depends on: SF01)

## Notes

[Any relevant notes about dependencies or constraints]
```

2. Create directory `docs/features/${FEATURE_ID}/subfeatures/SF01-[name]/`
3. Create `about.md` per subfeature (compact — focus on the subfeature's scope)
4. Continue to step 4 (documentation of main about.md as Epic overview)

**IF user says "no, keep as single feature":** Continue normally to step 4.

---

### 4. Document

**BEFORE writing:** Validate completeness + consistency + load skills.

#### Completeness Checklist

Verify: Section 1 confirmed, ALL Section 3 options chosen, ALL insights decided (Yes/No/Later), no unanswered questions. **IF ANSWER MISSING → DO NOT DOCUMENT** — ask user first.

#### Consistency Validation

If validated new route/endpoint → Backend MANDATORY. If validated new field/entity → Database MANDATORY. If user needs UI → Frontend MANDATORY. **NEVER exclude layers needed to deliver what was validated.**

#### Load Skills
```
.codeadd/skills/add-documentation-style/SKILL.md
.codeadd/skills/add-documentation-style/business.md
.codeadd/skills/add-feature-specification/SKILL.md
.codeadd/skills/add-feature-discovery/SKILL.md
```

**Apply cache technique:** Read → Preserve → Complement → Metadata

#### about.md
- Path: `docs/features/[XXXX]F-[name]/about.md`
- Content: Feature SPECIFICATION (WHAT + WHY)
- Use validated questionnaire answers

#### discovery.md
- Path: `docs/features/[XXXX]F-[name]/discovery.md`
- Content: CODEBASE ANALYSIS (WHAT ALREADY EXISTS)

**DISPATCH AGENT: Deep Codebase Analysis** [read-only, standard]
- **Intent:** Analyze codebase against feature requirements, map related files, identify prerequisites
- **Input:** Feature name, about.md path, skills (feature-discovery + documentation-style/business)
- **Output:** Write `docs/features/${FEATURE_ID}/discovery.md` with Prerequisites Analysis filled

---

### 5. Validate (STANDARD only)

Auto-verify:

| Doc | Check |
|---|---|
| about.md | RFs listed? RNs listed? No code? |
| discovery.md | Prerequisites filled? Files mapped? |

If missing → fix before completing.

---

## Continue Mode

If `/feature F0018` or `/feature continue`:

1. Detect feature (ID passed or current branch)
2. Check what exists — skip completed steps (filled about.md → skip questionnaire; filled discovery.md → go to validation)
3. **Past Features cache:** If `past-features.md` exists AND `discovery.md` has "Related Features" → skip Phase 1.5. Otherwise run Past Features Discovery Agent first.
4. **Load iterations.jsonl** (if exists) — parse to understand what was implemented, areas touched, any pivots. Use to avoid re-work.
5. Create TodoList with ONLY missing steps and continue execution

---

## Completion

After all steps complete, summarize what was created and suggest the logical next command based on what was discovered (read `.codeadd/skills/add-ecosystem/SKILL.md` Main Flows for context): `/add.design` for UI features, `/add.plan` for technical planning, `/add.build` for simple features, or `/add.autopilot` for autonomous execution.

---

## Rules

ALWAYS:
- Act as CONSULTANT — bring codebase context, show trade-offs, identify gaps/risks
- Add Recommendation block below EVERY option table with concrete rationale
- Accept 'Ok' as confirmation of all agent recommendations
- Combine WebSearch + model knowledge for benchmarks (product features)
- Ensure Section 4 insights are genuinely new (not repeats of Section 3)
- Infer based on codebase + best practices
- Include Quick Response Template after insights

NEVER:
- Be passive or just validate what user asked
- Make generic inferences without codebase basis
- Present options without clear trade-offs
- Skip Consultant Insights section
- Proceed without response to [STOP]
- Exclude layer that makes feature unusable
- Document without confirming all decisions
