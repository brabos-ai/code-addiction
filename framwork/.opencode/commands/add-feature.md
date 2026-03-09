<!-- AUTO-GENERATED - DO NOT EDIT. Source: framwork/.codeadd/commands/add-feature.md -->
---
description: Full feature discovery and documentation - creates about.md before implementation
---

# Feature Discovery & Documentation

> **REF:** `CLAUDE.md` for architecture patterns
> **OUTPUT:** Max 20 words per response. Tables/lists are exceptions. Straight to the point.

Full feature discovery command BEFORE implementation.

**IMPORTANT:** This command is READ-ONLY for project code. May only create/edit documentation in `docs/features/`.

---

## Spec

```json
{"gates":["init_executed","templates_loaded"],"order":["init","discovery","questionnaire_stop","complexity_gate","document","validate"],"write_allowed":"docs/features/","skills":{"mandatory":"feature-discovery, documentation-style, feature-specification"}}
```

---

## OWNER Context

**From `OWNER:name|level|language` (status.sh or owner.md):**

| Level | Communication | Detail |
|-------|--------------|--------|
| iniciante | No jargon, simple analogies, explain every step | Maximum - explain the "why" |
| intermediario | Technical terms with context when needed | Moderate - explain decisions |
| avancado | Straight to the point, jargon allowed | Minimum - essentials only |

**Language:** Use owner's language for ALL communication. Technical terms always in English. Default: en-us.
**If OWNER not found:** use defaults (intermediario, en-us)

---

## Yolo Mode

If argument contains `--yolo`:
- Skip ALL [STOP] points
- Use Recommendation options automatically at every question
- Do NOT ask for confirmation at any gate
- Execute to completion without human interaction
- Log all auto-decisions in console output

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**⛔ FIRST ACTION: VALIDATE SCOPE**
```
1. This command produces DOCUMENTATION ONLY (about.md, discovery.md)
2. Arguments = feature description for discovery (never implementation orders)
3. Proceed to Step 1 (init)
```

**⛔ PROHIBITIONS AND PERMISSIONS:**

```
THIS COMMAND DISCOVERS AND DOCUMENTS. IT DOES NOT IMPLEMENT.

READ-ONLY FOR CODE:
  ⛔ DO NOT MODIFY: Files in src/, apps/, libs/, packages/
  ⛔ DO NOT MODIFY: Configs (package.json, .env, tsconfig, etc.)
  ⛔ DO NOT MODIFY: Commands (.codeadd/commands/) or Skills (.codeadd/skills/)
  ⛔ DO NOT: Run build, test, or deploy commands
  ⛔ DO NOT: Write code, implement features, or make source changes

ALLOWED:
  ✅ MAY CREATE: docs/features/[XXXX]F-[name]/*.md
  ✅ MAY CREATE: docs/features/[XXXX]F-[name]/subfeatures/*/*.md
  ✅ MAY RUN: bash .codeadd/scripts/init.sh (Step 1 only)
  ✅ MAY RUN: git checkout -b (Step 1 only)

IF USER PROVIDES CODE/SPECS IN ARGUMENTS:
  ⛔ DO NOT: Execute, create, or apply them
  ✅ DO: Treat as REFERENCE MATERIAL for discovery and questionnaire
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

All marked with `[STOP]`:
1. Mark as `in_progress`
2. Execute action (present to user)
3. **STOP AND WAIT FOR RESPONSE**
4. Only mark `completed` AFTER user responds

---

## Instructions by Step

### 1. Run Init + Create Structure (TEMPLATES MANDATORY)

```bash
bash .codeadd/scripts/init.sh
```

**Parse RECENT_CHANGELOGS from output** - latest completed features with summaries.

**Load Product Context (if exists):**
```
Read docs/product.md (if exists).
Use product context to analyze if the proposed feature aligns with the product vision.
If misalignment detected, flag it in the questionnaire (STEP 3).
```

**Smart changelog reading rule:**

1. **Analyze RECENT_CHANGELOGS** from script output
2. **Identify matches** between user request and summaries:
   - Keywords mentioned by user
   - Related domain (ex: user asks "logging" → F0017-enhanced-logging is relevant)
3. **If match found:**
   - Read full changelog: `docs/features/{FEAT_ID}/changelog.md`
   - Extract: what was implemented, files created, patterns used
4. **Use context for:**
   - More precise questionnaire questions
   - Suggestions based on what exists
   - Avoid feature duplication
   - Correct terminology

**Example:**
```
User: "I want to add usage metrics"
RECENT_CHANGELOGS shows: F0016-user-metrics|Added metrics tracking...

→ Direct match with "metrics"
→ Read docs/features/F0016-user-metrics/changelog.md
→ Discover: metrics system already exists!
→ Ask: "Want to extend existing metrics system (F0016) or create something new?"
```

**⛔ MANDATORY GATE: Read Templates BEFORE creating docs**

```bash
Read .codeadd/templates/feature-about-template.md
Read .codeadd/templates/feature-discovery-template.md
```

**Infer from request:**
- Branch type: `feature` | `fix` | `refactor` | `docs`
- Name: kebab-case, 2-4 words

**MANDATORY SEQUENCE:**
1. `git checkout -b [type]/[XXXX]F-[name]` ← Create branch
2. `mkdir docs/features/[XXXX]F-[name]/` ← Create directory
3. `Write` about.md with templates filled ← Create docs
4. `Write` discovery.md with templates filled ← Create docs

**Expected output:** Feature ID (000XF), branch created, directory created, templates filled.

---

### 2. Deep Discovery (STANDARD only)

**Goal:** Collect rich context for deep thinking and consultant questionnaire.

## Agent Dispatch Rules

When this step instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only, read-write, full-access)
2. Read the **Complexity** hint (light, standard, heavy)
3. Choose the best available agent/task mechanism in your engine that satisfies the capability
4. Verify output exists before proceeding past any WAIT or GATE CHECK

**DISPATCH SEQUENTIAL (obrigatório — agente 2 depende do output do agente 1):**

1. **Past Features Discovery Agent** [read-only, light]
   - **Skill:** `feature-discovery/SKILL.md` Phase 1.5
   - **Output:** `docs/features/${FEATURE_ID}/past-features.md`
   - **Prompt:**
     Read `.codeadd/skills/feature-discovery/SKILL.md` Phase 1.5.
     Input: RECENT_CHANGELOGS (já disponível do Step 1) + about.md da feature atual.
     Execute a análise de features passadas conforme Phase 1.5:
     - Extrair keywords do about.md
     - Para cada feature em RECENT_CHANGELOGS: verificar Quick Ref do changelog.md (fallback: 30 primeiras linhas)
     - Para matches: ler iterations.jsonl + about.md, classificar relação
     Write `docs/features/${FEATURE_ID}/past-features.md`.

   **WAIT:** past-features.md deve existir antes de continuar.

2. **Codebase Discovery Agent** [read-write, standard]
   - **Skill:** `feature-discovery/SKILL.md` Phase 2-4
   - **Output:** Write `docs/features/${FEATURE_ID}/discovery.md`
   - **Prompt:**
     Read `.codeadd/skills/feature-discovery/SKILL.md` e `.codeadd/skills/documentation-style/SKILL.md`.
     ANTES de analisar o codebase, ler `docs/features/${FEATURE_ID}/past-features.md`.
     Usar past-features.md como contexto:
     - Arquivos já tocados por features relacionadas → priorizar na busca
     - Padrões usados → seguir os mesmos
     - Decisões passadas → não contradizer
     Perform deep codebase analysis for the current feature request:
     - Similar/related functionality that can be reused or extended
     - Existing patterns (controllers, services, entities, hooks)
     - Where new feature integrates (modules, routes, stores)
     - Potential conflicts or breaking changes in existing code
     - Missing prerequisites (fields, models, services not yet created)
     Incluir seção "Related Features" no discovery.md (tabela + `<!-- refs: ... -->`).
     Write `docs/features/${FEATURE_ID}/discovery.md` using the discovery template.

### 2.3 Deep Thinking (coordinator, BEFORE questionnaire)

After both agents complete, coordinator performs deep thinking using their outputs:

**DEEP THINKING CHECKLIST (evaluate ALL):**
- [ ] Impact on existing features? (from past-features.md)
- [ ] Edge cases per functional requirement? (from discovery + request)
- [ ] Complete error flows? (timeout, conflict, partial failure)
- [ ] Consistency between requirements in the request?
- [ ] Missing UX gaps not mentioned by user?
- [ ] "What if...?" questions — non-obvious scenarios
- [ ] Implicit assumptions that need validation (auth, permissions, ordering)
- [ ] Past decisions (from past-features.md) that guide current choices
- [ ] Technology/library decisions — anything pre-decided by codebase?
- [ ] Past features analysis incorporated? (from past-features.md)
- [ ] Related features mapped with correct relation types?
- [ ] Past decisions that constrain current choices identified?

→ Generate rich, concrete questionnaire based on data, not generic questions.

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

> ⚠️ If I misunderstood, correct me before continuing.

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
| a) | [description] | ✅ [benefit] / ⚠️ [cost] |
| b) | [description] | ✅ [benefit] / ⚠️ [cost] |
| c) | [description] | ✅ [benefit] / ⚠️ [cost] |

> **Recommendation:** Option **a)** — [concrete justification based on codebase, best practice, or clear trade-off]

#### 3.2 [Behavior/UX question]

| Option | Behavior | When it makes sense |
|---|---|---|
| a) | [description] | [ideal scenario] |
| b) | [description] | [alternative scenario] |

> **Recommendation:** Option **a)** — [concrete justification based on codebase, best practice, or clear trade-off]

[Add more questions as needed]

**⛔ Recommendation Rules:**
- MANDATORY below EVERY option table — no exceptions
- Justification MUST be CONCRETE (not "it's the best option" — say WHY)
- Base on: codebase discovery, best practices, trade-off analysis, previous features
- If no option is clearly better: "Depends on [criteria]. If X → option a. If Y → option b."

---

### 4. Consultant Insights

You are now a **senior product consultant** delivering a refinement session. Your job is to bring value the user DIDN'T ask for — things they haven't considered that would elevate the feature.

Think like a senior engineer who has shipped similar features at scale:
- What do industry leaders do differently in this domain?
- What patterns have you seen fail? What works?
- What adjacent value can be unlocked with minimal extra effort?
- What would a user WISH they had asked for after the feature ships?
- What competitive edge could this feature gain with a small twist?

**IF feature type is product/UX/user-facing:**
  Perform market benchmark — combine your training knowledge with a targeted WebSearch to find how industry leaders and competitors approach this problem. Synthesize findings into actionable insights.

**IF feature type is internal/refactor/infra:**
  Skip WebSearch. Use your knowledge of engineering best practices, architecture patterns, and lessons from similar codebases.

**FORMAT — free-form, not rigid categories.** Present each insight as:

#### [emoji] [Insight title]
- [What + Why + Impact — in your own words, like a senior consultant would explain]
- **Effort:** Low/Medium/High
- → Include? `Yes` / `No` / `Later`

**⛔ Hard Rules:**
- ⛔ Section 4 MUST NOT repeat topics from Section 3
- ⛔ If the insight is about something the user ASKED → it belongs in Section 3, not here
- ✅ If the insight is about something the consultant BROUGHT → it belongs in Section 4
- Minimum 1 insight, maximum 10

**After all insights, include a response template:**

```markdown
---
📋 **Quick Response Template** (copy, paste, fill):

3.1: R:
3.2: R:
[...one line per refinement question from section 3...]
Insight 1 ([title]): R:
Insight 2 ([title]): R:
[...one line per insight from section 4...]
```

---

### 5. How It Will Work

**Main flow:**
```
[User] → [Action] → [System] → [Feedback] → [Result]
```

| Stage | Who | What happens | What they see/get |
|---|---|---|---|
| 1 | User | [action] | [screen/feedback] |
| 2 | System | [processing] | [loading/status] |
| 3 | System | [result] | [confirmation] |

**Error cases:**

| Situation | What happens | Message |
|---|---|---|
| [Error 1] | [behavior] | "[text for user]" |

**Before vs After:**
- **Today:** [how it currently works]
- **After:** [how it will work]

---

## How to Respond

**Accepted responses:**
- ✅ `Ok` → Accept ALL agent recommendations as default
- ✅ `Ok, but 3.2b` → Accept recommendations except where specified
- ✅ `3.1b, 3.2a` → Specific choices (overrides recommendations)
- ✅ `Insight X: Yes` / `Insight Y: No` / `Insight Z: Later`
- ✅ `+ also want X` → Add to scope

**Defaults:**
- **If you don't specify an option:** Agent's recommendation is used.
- **If you don't respond to an insight:** It is NOT included (explicit opt-in required).
```

#### Examples by Context

**Example: Feature with UI (Profile Reset)**
```markdown
### 1. I understand you want...

**Goal:** Allow user to reset profile AND optionally cancel subscription

**Current problem:** Route `/account/reset` has confusing name and no integrated cancellation

**Expected delivery:**
- Backend: New `/profile/reset` route with cancellation option
- Frontend: Modal with checkbox + cancellation type choice
- Integration: Stripe for cancellation

### 2. I discovered in codebase

| Finding | Relevance |
|---|---|
| `ResetAccountOnboardingCommandHandler` exists | Extend with cancellation logic |
| `SubscriptionService.cancelSubscription()` implemented | Reuse, add "immediate" mode |
| Frontend uses modal pattern in `ConfirmDialog.tsx` | Follow same pattern |

### 4. Consultant Insights

#### 🛡️ Two-step confirmation for destructive actions
- Users who reset profiles often don't realize cancellation is bundled. Separating the confirmations (reset → then cancel) follows the "progressive disclosure of consequences" pattern used by Stripe, GitHub, and AWS. Prevents accidental subscription loss with zero UX overhead.
- **Effort:** Low
- → Include? `Yes` / `No` / `Later`

#### 💰 Show remaining paid period before cancellation
- Industry standard (Netflix, Spotify, GitHub): always show "You have access until DD/MM/YYYY" before confirming cancellation. Users who see remaining value often choose to keep the subscription. This is a retention micro-pattern with high ROI.
- **Effort:** Low
- → Include? `Yes` / `No` / `Later`

---
📋 **Quick Response Template** (copy, paste, fill):

3.1: R:
3.2: R:
Insight 1 (Two-step confirmation): R:
Insight 2 (Remaining paid period): R:
```

**Example: Technical feature (API Logging)**
```markdown
### 1. I understand you want...

**Goal:** Instrument APIs with tracing for production debugging

**Current problem:** Production errors are hard to trace without context

**Expected delivery:**
- Backend: `@Traceable()` decorator + correlationId middleware
- Structured logs with propagated traceId

### 4. Consultant Insights

#### 🔗 Sentry correlation with traceId
- Your codebase already uses Sentry for error tracking. Attaching the traceId to Sentry events means every production error links directly to the full request trace — no more context-switching between tools. This is table stakes for observability at scale (Datadog, New Relic, and Honeycomb all push this pattern).
- **Effort:** Low (SDK already available)
- → Include? `Yes` / `No` / `Later`

---
📋 **Quick Response Template** (copy, paste, fill):

3.1: R:
Insight 1 (Sentry correlation): R:
```

#### Adapt to Feature Type

| Type | Sections to Include | Sections to Skip |
|---|---|---|
| API only | Goal, Scope, Data, Errors | UI/UX |
| UI only | Goal, Scope, Flow, States | Persistence |
| Refactor | What changes, What stays, Risks | New data |
| Integration | Goal, External APIs, Fallbacks | - |
| **Fullstack** | **ALL necessary layers** | - |

**⚠️ CRITICAL RULE:** If questionnaire validated user UI/flow → type is **Fullstack**, not "API only".

#### After Presenting

1. Mark all as `in_progress`
2. **STOP AND WAIT FOR RESPONSE**
3. Only mark `completed` after user responds

#### After Receiving Response (MANDATORY)

Before proceeding, confirm what was decided:

```markdown
## ✅ Confirmed Decisions

**Scope validated:**
- 3.1: [chosen option or recommendation used] → [what it means]
- 3.2: [chosen option or recommendation used] → [what it means]

**Insights accepted:**
- ✅ [Insight X] - included in scope
- ❌ [Insight Y] - not included
- ⏳ [Insight Z] - later

**Assumptions confirmed:**
- ✅ [Inferred assumption that user confirmed]

---

Confirm this understanding? Can I proceed to document?
```

**If user confirms:** Proceed to COMPLEXITY GATE.
**If user corrects:** Adjust and confirm again.

---

### 3.5 COMPLEXITY GATE (after questionnaire response)

**Analyze the validated scope for independent user flows.**

**Definition — Independent user flow:**
- Can be tested in complete isolation (own start → success state)
- Has distinct user objective separate from other flows
- Could be its own sprint card / PR
- Keywords: "will also", "and then", "another flow", multiple screens with unrelated objectives

**COUNT N = number of independent user flows in the validated scope**

**IF N = 1 → Feature (skip gate, continue to step 4)**

**IF N ≥ 2 → Propose decomposition [STOP — await user]**

Present:
```
Identified [N] independent flows in the validated scope:

SF01: [name] — [1-sentence objective]
SF02: [name] — [1-sentence objective]
SF03: [name] — [1-sentence objective]

Suggested implementation order:
1. SF01 (no dependencies)
2. SF02 (depends on: SF01)
3. SF03 (depends on: SF01)

Decompose as subfeatures? (yes / no — keep as single feature)
```

**⛔ DO NOT proceed before user responds.**

**IF user confirms epic decomposition:**

1. Create `docs/features/${FEATURE_ID}/epic.md` with this format:
```markdown
# Epic: [Name]

## Subfeatures

| ID | Nome | Objetivo | Status | Checkpoint |
|----|------|----------|--------|------------|
| SF01 | [name] | [objective] | pending | - |
| SF02 | [name] | [objective] | pending | - |

## Ordem de Implementação

1. SF01 (sem dependências)
2. SF02 (depende: SF01)

## Notas

[Any relevant notes about dependencies or constraints]
```

2. Create directory `docs/features/${FEATURE_ID}/subfeatures/SF01-[name]/`
3. Create `about.md` per subfeature (compact — focus on the subfeature's scope)
4. Continue to step 4 (documentation of main about.md as Epic overview)

**IF user says "no, keep as single feature":**
→ Continue normally to step 4.

---

### 4. Document

**BEFORE writing:** Validate completeness + consistency + load skills.

#### Completeness Checklist (MANDATORY)

Before documenting, verify ALL questions were answered:

```
□ Section 1 (Understanding) was confirmed or corrected?
□ ALL Section 3 questions answered with specific option?
□ ALL suggestions decided (Yes/No/Later)?
□ ALL gaps handled (Yes/No with justification)?
□ No unanswered questions remain?

IF ANSWER MISSING → DO NOT DOCUMENT
→ Ask user: "Missing answer [X]. What's your choice?"
```

#### Consistency Validation (MANDATORY)

For EACH item validated in questionnaire, check:

| Question | If YES |
|---|---|
| Did we validate new route/endpoint? | Backend MANDATORY in scope |
| Did we validate new field/entity? | Database MANDATORY in scope |
| Does user need UI to use it? | Frontend MANDATORY in scope |

**⚠️ PROHIBITED to exclude layers needed to deliver what was validated.**

If validated "checkbox checked by default" → CANNOT exclude frontend.
If validated "user chooses type" → CANNOT exclude frontend.

#### Load Skills
```
.codeadd/skills/documentation-style/SKILL.md
.codeadd/skills/documentation-style/business.md
.codeadd/skills/feature-specification/SKILL.md
.codeadd/skills/feature-discovery/SKILL.md
```

**Apply cache technique:** Read → Preserve → Complement → Metadata

#### about.md
- Path: `docs/features/[XXXX]F-[name]/about.md`
- Content: Feature SPECIFICATION (WHAT + WHY)
- Use validated questionnaire answers

#### discovery.md
- Path: `docs/features/[XXXX]F-[name]/discovery.md`
- Content: CODEBASE ANALYSIS (WHAT ALREADY EXISTS)
- **Use subagent** for deep analysis:

```
Task(subagent_type="Explore", prompt="
Feature: [NAME]
about.md: [PATH]

1. Read skills: feature-discovery + documentation-style/business
2. Read about.md to understand requirements
3. For EACH requirement, check prerequisites:
   - Does field/model exist?
   - Does dependent flow exist?
4. Map related files
5. Write discovery.md with Prerequisites Analysis filled
")
```

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
2. Check what exists:
   - Only structure? → Complete TodoList
   - about.md filled? → Skip questionnaire
   - discovery.md filled? → Go to validation
3. **Past Features cache check:**
   - SE `past-features.md` existe E `discovery.md` tem seção "Related Features" → Skip Phase 1.5, usar cache
   - SE `past-features.md` não existe → Rodar Phase 1.5 (Past Features Discovery Agent) antes da Phase 2
4. **Load iterations.jsonl** (if exists) for implementation context:
   - Read `docs/features/${FEATURE_ID}/iterations.jsonl`
   - Parse entries to understand: what was already implemented, which areas were touched, any pivots
   - Use this context to avoid re-work and inform questionnaire/documentation
4. Create TodoList with ONLY missing steps
5. Continue execution

---

## Completion

```
Feature Discovery Complete!
Docs: docs/features/[XXXX]F-[name]/
**Next Steps (load code-addiction-ecosystem skill for context):**
Read `.codeadd/skills/code-addiction-ecosystem/SKILL.md` Main Flows section.
Based on what was discovered, suggest the logical next command:
- If feature has UI components → `/design`
- If feature is ready for technical planning → `/plan`
- If feature is simple enough → `/add-dev`
- If user wants autonomous execution → `/autopilot`
```

---

## Rules

ALWAYS:
- Act as CONSULTANT, not order taker
- Bring context from codebase that influences decisions
- Add explicit Recommendation block below EVERY option table
- Justify recommendations with concrete rationale
- Accept 'Ok' as confirmation of all agent recommendations
- Think like senior consultant bringing unexpected value
- Combine WebSearch + model knowledge for benchmarks
- Ensure Section 4 insights are genuinely new
- Show TRADE-OFFS in each option
- Identify GAPS and risks
- Infer based on codebase + best practices
- Use TodoWrite for tracking
- Read skills before documenting
- Stop at [STOP] and wait for user response
- Validate questionnaire-to-scope consistency
- Include ALL necessary layers
- Include Quick Response Template after insights
- Confirm decisions before documenting

NEVER:
- Be passive or just validate what user asked
- Make generic inferences without codebase basis
- Present options without clear trade-offs
- Skip Consultant Insights section
- Repeat Section 3 topics in Section 4
- Use generic recommendation justifications
- Proceed without response to [STOP]
- Exclude layer that makes feature unusable
- Document without confirming all decisions
- Ignore insights without explicit decision
