# Feature Discovery & Documentation

> **REF:** `CLAUDE.md` for architecture patterns
> **OUTPUT:** Max 20 words per response. Tables/lists are exceptions. Straight to the point.
> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).

Full feature discovery command BEFORE implementation.

**IMPORTANT:** This command is READ-ONLY for project code. May only create/edit documentation in `docs/features/`.

---

## STEP 1: Load Skills + Validate Context

**Load schemas and conventions (ONE-TIME):**
- `{{skill:add-doc-schemas/SKILL.md}}` (feature-about schema, validation gate)
- `{{skill:add-id-convention/SKILL.md}}` (ID/branch format)
- `{{skill:add-doc-reviewer/SKILL.md}}` (fresh-reader review)

All subsequent steps reference these loaded skills; DO NOT reload.

**Validate Execution Context:**

- [CONTINUE MODE] Read detected feature branch. If `about.md` exists AND validated (contains filled sections 1-3 from questionnaire) → skip STEP 2 and STEP 3, proceed to STEP 4.
- [NEW FEATURE] If no existing feature branch, proceed to STEP 2.

---

## Execution Constraints & Modes

**READ-ONLY GUARANTEE:**
- ⛔ DO NOT MODIFY: src/, apps/, libs/, packages/, configs, commands, skills
- ⛔ DO NOT: Run build/test/deploy, write code, implement features
- ✅ MAY: Create `docs/features/[XXXX]F-[name]/**/*.md`, run init.sh, git checkout -b

**Operation Modes:**
- `/add.new [description]` — Create new feature
- `/add.new F0018` — Continue existing feature (F-ID)
- `/add.new continue` — Continue feature from current branch

**Complexity Classification** (inferred in STEP 2):
- **SIMPLE:** "add field", "fix", "adjust", "bug", "remove" (4 steps)
- **STANDARD:** "create", "implement", "new", "feature", integrations (7 steps)

---

## STEP 2: Init + Allocate ID + Create Structure (NEW FEATURES ONLY)

**Execute init + allocate ID:**

```bash
bash .codeadd/scripts/init.sh
bash .codeadd/scripts/status.sh next-id F
```

Parse RECENT_CHANGELOGS (feature history). Read `docs/product/product.md` if it exists. Match user request keywords against changelog; if match found, read full `changelog.md` for patterns/files/implementations.

**Allocate ID** (e.g., `0042F`). Using ID/branch conventions from STEP 1 skills, infer branch type (`feature`|`fix`|`refactor`|`docs`) and name (kebab-case, 2-4 words).

**Create structure:**
1. `git checkout -b [type]/[NNNN]F-[name]`
2. `mkdir docs/features/[NNNN]F-[name]/`
3. Create skeleton `about.md` with frontmatter only (full content in STEP 4)

**Output:** Feature ID, branch, directory.

---

## STEP 3: Deep Discovery (STANDARD COMPLEXITY ONLY)

**IF SIMPLE:** Skip to STEP 4.
**IF STANDARD:** Continue below.

**Goal:** Collect rich context for questionnaire.

**Dispatch sequential agents (agent 2 depends on agent 1 output):**

1. **Agent: Past Features Discovery**
   - **Input:** RECENT_CHANGELOGS + skeleton about.md
   - **Output:** `docs/features/${FEATURE_ID}/past-features.md`
   - Extract keywords from about.md. For each feature in RECENT_CHANGELOGS, check Quick Ref in changelog.md (fallback: first 30 lines). For matches, read iterations.jsonl + about.md, classify relationship. Write past-features.md.
   - **WAIT:** Verify past-features.md exists before continuing.

2. **Agent: Codebase Discovery**
   - **Input:** past-features.md + skeleton about.md + feature request
   - **Output:** `docs/features/${FEATURE_ID}/discovery.md`
   - Read past-features.md FIRST. Prioritize files touched by related features. Perform deep analysis: reusable functionality, existing patterns, integration points, prerequisites. Include "Related Features" section with table + refs. Write discovery.md using discovery template.

**Coordinator: Deep Thinking (before questionnaire)**

Evaluate using agent outputs:
- Impact on existing features (from past-features.md)?
- Edge cases + error flows (timeout, conflict, partial failure)?
- Consistency between requirements?
- Missing UX gaps?
- Implicit assumptions (auth, permissions, ordering)?
- Non-obvious scenarios?
- Related features with correct relation types?
- Technology decisions pre-decided by codebase?

Generate concrete questionnaire from data (not generic).

---

## STEP 4: Present Consultant Questionnaire [STOP]

**STOP AND WAIT. This is a mandatory pause.**

**YOU ARE:** Product consultant, not order taker. Refine demand, bring codebase context, suggest improvements, show trade-offs, identify gaps.

**Inference Sources (priority):** 1) Codebase (similar features, patterns), 2) Request (verbs, problem), 3) Best practices (domain patterns), 4) Past decisions (UX consistency).

**Inferences by action:**
| Action | Infer |
|---|---|
| Cancel/delete | Confirm with user? Soft delete? |
| Form/input | Validation? Masks? |
| Integration | Fallback? Retry? Timeout? |
| List | Pagination? Filters? Sort? |
| Notification | Email? Push? In-app? |

**Questionnaire Template (5 sections):**

```markdown
## Consultant Validation - [Name] (000XF)

### 1. I understand you want...
**Goal:** [1 sentence]
**Current problem:** [Why necessary]
**Expected delivery:** [All layers]
> If wrong, correct me.

### 2. I discovered in codebase
| Finding | Relevance |
|---|---|
| [Exists X in path] | [Reuse/extend] |
| [Pattern Y] | [Follow same] |
| [Z missing] | [Create new] |
**Similar reference:** `[path]` — [leverage]

### 3. Refining the Demand
#### 3.1 [Strategic scope question]
| Option | Includes | Trade-off |
|---|---|---|
| a) | [what] | [benefit/cost] |
| b) | [what] | [benefit/cost] |
> **Recommendation:** Option **a)** — [concrete rationale from codebase/practice]

#### 3.2 [Behavior/UX question]
| Option | Behavior | When |
|---|---|---|
| a) | [what] | [scenario] |
| b) | [what] | [scenario] |
> **Recommendation:** Option **a)** — [concrete rationale]

[More questions as needed. MANDATORY Recommendation below EVERY option table — concrete, not generic.]

### 4. Consultant Insights
[Section 4 brings value user DIDN'T ask for — what they'd wish they had asked. Minimum 1, max 10.]

#### [Insight title]
- [What + Why + Impact]
- **Effort:** Low/Medium/High
- → Include? `Yes` / `No` / `Later`

[RULE: Section 4 must NOT repeat Section 3 topics. If user asked → Section 3. If consultant brought → Section 4.]

**Response Template:**
```
3.1: R:
3.2: R:
[...per refinement question...]
Insight 1: R:
[...per insight...]
```

### 5. How It Will Work
[Main flow: User → Action → System → Result. Stage table. Error cases. Before/after.]
```

**Feature Type Adaptation:**
| Type | Include | Skip |
|---|---|---|
| API only | Goal, Scope, Data, Errors | UI/UX |
| UI only | Goal, Scope, Flow, States | Persistence |
| Fullstack | ALL necessary layers | — |

**How to Respond:**
- `Ok` → Accept all recommendations
- `Ok, but 3.2b` → Override specific choice
- `3.1b, 3.2a` → Explicit choices
- `Insight X: Yes/No/Later` → Decision per insight
- `+ also want X` → Add scope

**Defaults:** Unspecified options use recommendation. Unspecified insights are NOT included.

---

## STEP 5: Complexity Gate (After Questionnaire Response)

**Summarize confirmed decisions from questionnaire.** Ask user to confirm. If confirmed → continue. If corrected → adjust and re-confirm.

**Analyze validated scope for independent user flows.**

**Independent flow** = testable in isolation, distinct objective, could be own PR. Keywords: "will also", "and then", "another flow".

**IF N = 1:** Skip decomposition, continue to STEP 6.
**IF N >= 2 [STOP]:** Propose decomposition:
```
Identified [N] independent flows:

SF01: [name] — [objective]
SF02: [name] — [objective]

Suggested order:
1. SF01 (no deps)
2. SF02 (depends on SF01)

Decompose as subfeatures? (yes/no)
```

**IF epic confirmed:**
1. Create `docs/features/${FEATURE_ID}/epic.md` with subfeature table + order + notes
2. Create `docs/features/${FEATURE_ID}/subfeatures/SF01-[name]/` directory
3. Create compact `about.md` per subfeature
4. Continue to STEP 6

**IF single feature:** Continue to STEP 6.

---

## STEP 6: Document (Feature + Codebase Analysis)

**Completeness Check:**
Verify: Section 1 confirmed, ALL Section 3 options chosen, ALL insights decided (Yes/No/Later). IF MISSING → ask first. DO NOT document incomplete questionnaire.

**Consistency Check:**
- New route/endpoint → Backend MANDATORY
- New field/entity → Database MANDATORY
- User needs UI → Frontend MANDATORY
- NEVER exclude layers needed to deliver validated scope

**Write about.md:**
- **Path:** `docs/features/[NNNN]F-[name]/about.md`
- **Schema:** Use `feature-about` (loaded in STEP 1)
- **Technique:** Read skeleton → Preserve frontmatter → Complement with validated decisions → Bump `updated:` timestamp
- Write extractive only (requirements, not implementation)

**Dispatch Agent: Codebase Analysis**
- **Input:** Feature name, about.md path
- **Output:** Write `docs/features/${FEATURE_ID}/discovery.md` (prerequisites, related files, existing patterns)

---

## STEP 7: Validation Gate

Execute validation gate for `feature-about` schema (from STEP 1 skills).

**MANDATORY.** DO NOT skip. DO NOT mark complete until gate returns `PASS`.

---

## STEP 8: Fresh-Reader Review (Max 2 Rounds)

**Dispatch:** `doc-reviewer-agent` in fresh context (does NOT see this conversation). Pass about.md path + schema name.

**Present findings:** Three buckets: Gap (schema expected something missing), Clarity (doc is ambiguous), Scope (reasonable questions outside discussion).

**Resolve per item:**
- **Gap:** Update doc → re-run STEP 7 gate + STEP 8 reviewer
- **Clarity:** Rewrite passage → re-run STEP 7 gate + STEP 8 reviewer
- **Scope:** User decides: extend scope + address now / mark out-of-scope with reason / ignore

**Hard cap:** 2 review rounds per invocation. After round 2, present findings as informational. Advise re-invoking `/add.new F[NNNN]` in continue mode later for deeper iteration.

---

## Continue Mode (Re-Invocation)

**Detect:** Feature ID from argument or current branch.

**Skip Logic:**
- If `about.md` exists AND contains completed questionnaire sections (1, 3, validated decisions) → Skip STEP 4 questionnaire, proceed to STEP 5
- If `discovery.md` exists AND contains "Related Features" → Skip STEP 3 discovery agents, proceed to STEP 5
- If validation gate passed (logged state) → Skip STEP 7, proceed to STEP 8

**Load iterations.jsonl** (if exists) to understand prior implementations/pivots. Avoid re-work.

**Create TodoList with ONLY missing steps.** Continue execution.

---

## Completion

Summarize created artifacts. Suggest next command based on discovery: `/add.plan` for technical planning, `/add.build` for implementation, `/add.design` for UI features.

---

## Execution Rules

**ALWAYS:**
- Act as consultant — bring codebase context, trade-offs, gaps, risks
- Recommendation block MANDATORY below every option table (concrete rationale, not generic)
- Accept `Ok` as confirmation of all recommendations
- Combine WebSearch + model knowledge for product feature benchmarks
- Section 4 insights must be genuinely new (not Section 3 repeats)
- Include Quick Response Template after insights
- Skip questionnaire [STOP] if re-invoked and about.md already validated

**NEVER:**
- Be passive; validate what user asked without consulting
- Infer without codebase basis; make generic suggestions
- Present options without clear trade-offs
- Skip Consultant Insights section
- Proceed without response to [STOP] points
- Exclude layers that make feature unusable
- Document incomplete questionnaire
- Skip fresh-reader review after gate passes
- Exceed 2 review rounds per invocation
- Let reviewer see conversation (fresh context only)
