# Diagnose - Pre-Decision Investigative Triage

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (beginner → explain why; advanced → essentials only).

Investigative triage for ambiguous user reports. Receives a vague symptom or uncertain request, applies the `add-investigation` 5-phase methodology, and delivers a diagnosis + route recommendation (hotfix / feature / extend / no-action). READ-ONLY — does NOT implement fixes or open features.

---

## Required Skills

Load `{{skill:add-doc-schemas/SKILL.md}}` before STEP 1 (schemas, IDs, universal doc rules).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load context          → status.sh + add-ecosystem
STEP 2: Capture & reformulate → STOP for user confirmation
STEP 3: Load investigation    → add-investigation skill, apply Phase 0
STEP 4: Triage investigation  → light vs agents (adaptive)
STEP 5: Execute Phases 1-3    → RCA, patterns, differential diagnosis
STEP 6: Phase 4 synthesis     → diagnosis + route from ecosystem map
STEP 7: Present report        → STOP for user decision
STEP 8: Persist (conditional) → schema-driven write
STEP 9: Validation Gate       → diagnose-report schema gate
```

---

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP 1** | Context not loaded | Grep, Read code files, dispatch agents | Run status.sh + load add-ecosystem |
| **STEP 2** | Framing not confirmed | Glob, Grep, Read code, dispatch agents, classify symptom | Present reformulation, WAIT |
| **STEP 3** | Skill not loaded | Begin investigation, suggest route | Read add-investigation skill |
| **STEP 5** | Diagnosis incomplete | Recommend route, Write | Complete Phase 3 (3+ hypotheses) |
| **READ-ONLY** | Always | Edit files, Bash (except status.sh), Write outside docs/diagnose/, branches, commits, /add.new/hotfix/build | Suggest next steps |
| **STEP 6-8** | route = no-action | Write | Conversational response only |
| **STEP 8** | User declined persistence | Write | Respond in chat only |
| **STEP 9** | Doc not written | Skip validation gate | Run gate before complete |

---

## STEP 1: Load Context

### 1.1 Run status.sh

```bash
bash .codeadd/scripts/status.sh
```

Parse: OWNER (name + level), BRANCH, FEATURE, PROJECT_DOCS, RECENT_CHANGELOGS.

### 1.2 Load ecosystem map

Read {{skill:add-ecosystem/SKILL.md}} — needed for Command Next-Steps Routing in STEP 6.

### 1.3 Conditional reads

- If OWNER not found → inform user to run `/add.init`, continue with `intermediate` defaults
- If feature mentioned in user input matches RECENT_CHANGELOGS → note it for Phase 1

---

## STEP 2: Capture & Reformulate Input [STOP]

### 2.1 Reformulate using the user's own words

Restate the user input in ONE sentence using only the nouns/verbs they used. Do NOT inject technical interpretation yet.

### 2.2 Present the reformulation

Show the user:
- Original report (verbatim)
- One-sentence reformulation
- 3-4 clarifying questions if the report is vague (WHO / WHEN / WHERE / WHAT expected vs actual)

### 2.3 WAIT for user confirmation

⛔ HARD STOP. Do not proceed to STEP 3 until the user confirms or corrects the reformulation. The entire investigation is downstream of this framing — wrong framing = wasted investigation.

---

## STEP 3: Load Investigation Skill & Apply Phase 0

### 3.1 Load skill

Read {{skill:add-investigation/SKILL.md}} — primary methodology.

Read {{skill:add-investigation/references/symptom-disambiguation.md}} — Phase 0 playbook.

### 3.2 Execute Phase 0: Symptom Disambiguation

Following the skill:
1. Classify symptom into ONE class (missing feature / wrong behavior / inconsistent state / doc-code drift / UX confusion / race / stale / unknown)
2. Write observable predicate (WHEN/THEN/BUT CURRENTLY)
3. If symptom class = "unknown" → note it and flag for Phase 1 instrumentation

Present Phase 0 output to user if any classification is non-obvious or contested.

---

## STEP 4: Investigation Triage (Adaptive)

### 4.1 Choose investigation depth

Apply this heuristic:

| Condition | Depth |
|---|---|
| Symptom class clearly in ONE layer + small codebase | **Light** — Glob/Grep + docs reads directly |
| Symptom crosses layers OR codebase large OR class = "unknown" | **Heavy** — dispatch `@discovery-agent` and/or `@architecture-agent` (read-only) |
| Doc-vs-code drift suspected | **Light** — read about.md, plan.md, changelog.md for affected feature |

### 4.2 If heavy path — dispatch agents

DISPATCH AGENT (read-only): `@discovery-agent` to map feature relationships and `@architecture-agent` to trace data flow through layers. Both MUST NOT use Write or Edit.

Wait for agent outputs before proceeding to STEP 5.

---

## STEP 5: Execute Phases 1-3

### 5.1 Load flow-tracing reference

Read {{skill:add-investigation/references/flow-tracing.md}} to choose control-flow vs data-flow vs doc-vs-code.

### 5.2 Phase 1: Root Cause Investigation

Following skill Phase 1:
1. Reproduce the observable predicate (mentally or with code read-through)
2. Check recent changes — cross RECENT_CHANGELOGS with symptom keywords
3. Read feature docs (`docs/features/[FEAT_ID]/changelog.md`, `about.md`, `plan.md`) if symptom relates to a known feature
4. Apply backward tracing — read {{skill:add-investigation/references/backward-tracing.md}}
5. Document evidence: files, line numbers, observed values

### 5.3 Phase 2: Pattern Analysis

Find a working analogue in the same codebase. Enumerate differences between working and broken cases. Check for doc-code drift and duplicated logic.

### 5.4 Phase 3: Differential Diagnosis

Read {{skill:add-investigation/references/differential-diagnosis.md}}.

1. Enumerate 3-5 candidate hypotheses across classes
2. Rank by likelihood × cost-to-test
3. Test cheapest-high first (read files, grep, verify)
4. Log each test with result
5. If 3 hypotheses fail → STOP, return to STEP 2 (question framing)

⛔ DO NOT commit to a single cause without comparing alternatives.

---

## STEP 6: Phase 4 Synthesis — Diagnosis & Route

### 6.1 Synthesize diagnosis

Build the structured output from skill Phase 4:
1. Reformulated problem (from STEP 2, confirmed)
2. Evidence found (from Phases 1-2)
3. Diagnosis with selected hypothesis + rejected alternatives + why
4. Recommended route
5. Risks of acting AND of not acting

### 6.2 Consult ecosystem routing map

Use the Command Next-Steps Routing table from {{skill:add-ecosystem/SKILL.md}} to map diagnosis → route. The mapping is NOT hardcoded here — it lives in the ecosystem map so it stays consistent across the framework.

Routes:
- **hotfix** → suggest `/add.hotfix`
- **feature** → suggest `/add.new`
- **extend existing** → suggest `/add.new` referencing the existing feature, or `/add.plan` if already in scope
- **no-action** → explain why no action is needed

⛔ DO NOT invent a route. Consult the ecosystem map.

---

## STEP 7: Present Report [STOP]

Present the full diagnosis in chat using this structure:

```
## Diagnosis Report

**Problem:** [reformulated, confirmed]

**Symptom class:** [from Phase 0]

**Evidence:**
- [file:line — finding]
- [doc — claim]
- [diff — mismatch]

**Diagnosis:** [leading hypothesis]
- Confidence: [high/medium/low]
- Because: [evidence]

**Alternatives rejected:**
- [alt 1] — rejected because [reason]
- [alt 2] — rejected because [reason]

**Recommended route:** [hotfix / feature / extend X / no-action]
- Rationale: [why this route]
- Next command: [from ecosystem map]

**Risks of acting:** [list]
**Risks of NOT acting:** [list]
```

### 7.1 Ask for decision

Ask the user:
1. Do you agree with this diagnosis?
2. Do you want to persist this as a report (`docs/diagnose/[NNNN]-[slug].md`) that the next command can consume?
3. Ready to proceed with the suggested route?

⛔ HARD STOP. Wait for answers.

---

## STEP 8: Persist (Conditional) — schema-driven write

### 8.1 Persistence decision tree

| route | user_confirmed_persistence | Action |
|---|---|---|
| no-action | any | Skip to 8.4 (conversational only) |
| hotfix/feature/extend | no | Skip to 8.4 (conversational only) |
| hotfix/feature/extend | yes | Execute 8.2 → 8.3 → 8.4 |

### 8.2 Determine slug & schema

- slug: kebab-case from reformulated problem, max 6 words
- Doc ID: `DIAG-<slug>` (fixed per schema)
- EXECUTE schema `diagnose-report` from `{{skill:add-doc-schemas/SKILL.md}}`

### 8.3 Write (if conditions met)

Load {{skill:add-doc-schemas/SKILL.md}} schema `diagnose-report`. Write `docs/diagnose/<slug>.md` per schema (extractive only).

### 8.4 Completion output

Show the user:
- Report path (if persisted)
- Recommended next command (from ecosystem map routing)
- Reminder: `add.diagnose` is READ-ONLY; user executes the next command when ready

---

## STEP 9: Validation Gate

Only run this gate when STEP 8 actually wrote a doc. If the doc was not persisted (route = no-action OR user declined), skip directly to the conversational completion.

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `diagnose-report`.

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## Rules

| Requirement | Checkpoint | Rationale |
|---|---|---|
| **✅ Confirm reformulation before investigating** | STEP 2 | Wrong framing wastes downstream investigation |
| **✅ Apply Phase 0 before code read** | STEP 3 | Symptom classification guides triage depth |
| **✅ Enumerate 3+ hypotheses** | STEP 5 | Prevents single-cause bias |
| **✅ Consult ecosystem map** | STEP 6 | Route must be framework-consistent |
| **✅ Persist only when route ≠ no-action + user confirmed** | STEP 8 | Avoids noise in diagnose/ |
| **✅ Credit add-investigation skill** | STEP 7 | Methodology transparency |
| **⛔ No route without differential diagnosis** | STEP 5→6 | Route validity depends on evidence |
| **⛔ Never execute recommended command** | STEP 7 | add.diagnose is advisory only |
| **⛔ No code modification** | All | READ-ONLY boundary |
| **⛔ Reject "something is weird"** | STEP 2 | Push for observable predicate (WHEN/THEN/BUT) |
| **⛔ No persistence on no-action** | STEP 8 | Keeps diagnose/ focused |
| **⛔ Enforce 3-failure stop rule** | STEP 5 | Return to framing instead of guessing more |
