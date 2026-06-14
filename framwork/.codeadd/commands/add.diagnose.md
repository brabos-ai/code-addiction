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
STEP 2: Capture & reformulate → internal only, no stop
STEP 3: Load investigation    → add-investigation skill, apply Phase 0
STEP 4: Two-phase agent dispatch → A.1 ∥ A.2 (parallel) → B (sequential)
STEP 5: Phases 2-3            → pattern analysis, differential diagnosis
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
| **STEP 3** | Skill not loaded | Begin investigation, suggest route | Read add-investigation skill |
| **STEP 4** | A.1 + A.2 outputs not received | Dispatch @architecture-agent, Grep/Read code | WAIT for both parallel agents to return |
| **STEP 4** | A outputs incomplete | Proceed to STEP 5, choose "light path", skip agents | Dispatch all three agents (no adaptive triage) |
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

## STEP 2: Capture & Reformulate Input (internal)

### 2.1 Reformulate using the user's own words

Restate the user input in ONE sentence using only the nouns/verbs they used. Do NOT inject technical interpretation yet.

Store this reformulation internally — it feeds Phase 0 (STEP 3) and the final report (STEP 7). Do NOT present it to the user now. Do NOT ask questions. Proceed immediately to STEP 3.

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

## STEP 4: Two-Phase Agent Investigation (MANDATORY)

This STEP replaces the previous adaptive triage. All three sub-dispatches always run — Fase A directs Fase B; code-level tracing remains required to confirm the diagnosis.

This STEP implements Phase 1 (Root Cause Investigation) of the `add-investigation` skill in **agent-dispatched mode**. See `{{skill:add-investigation/SKILL.md}}` section "Execution Modes".

<!-- plugin:gitnexus:graph-trace -->
<!-- /plugin:gitnexus:graph-trace -->

### 4.1 Build the dispatch payload

Assemble from prior STEPs:
- Observable predicate from Phase 0 (STEP 3.2)
- Symptom class from Phase 0
- Affected area keywords (nouns/verbs from reformulation)
- Optional window (default: 30 days for git)

This payload is passed to BOTH Fase A agents.

### 4.2 Fase A — PARALLEL dispatch (A.1 ∥ A.2)

⛔ **CRITICAL:** Dispatch BOTH agents in a SINGLE message with TWO Agent tool calls (parallel execution). Do NOT dispatch sequentially.

**DISPATCH AGENT: @feature-history-agent**
Prompt: "Reconstruct feature relevance for this symptom. Predicate: <predicate>. Symptom class: <class>. Keywords: <keywords>. Scan `docs/features/`, score relevance, deep-read top-10, return structured Feature History Report."

**DISPATCH AGENT: @git-history-agent**
Prompt: "Correlate recent git history with this symptom. Predicate: <predicate>. Keywords: <keywords>. Window: 30 days. Use git log/show/diff/branch (read-only) to identify suspicious commits and active branches. Return structured Git History Report."

**WAIT** for both reports before proceeding.

### 4.3 Synthesize Fase A outputs

Combine the two reports:
- **Convergent signals** — files/modules/areas mentioned in BOTH (highest priority for Fase B)
- **Divergent signals** — areas surfaced by only one source (still relevant, lower priority)
- **Confirmed gaps** — symptom aspects neither source explains (Fase B must investigate without prior pointers)

If BOTH reports return "no strong matches", Fase B receives a broad-scan brief (no narrow focus).

### 4.4 Fase B — SEQUENTIAL dispatch (@architecture-agent)

**DISPATCH AGENT: @architecture-agent**
Prompt: "Trace control-flow and data-flow to validate or refute the hypotheses below. Predicate: <predicate>. Feature History findings: <A.1 summary with files/decisions>. Git History findings: <A.2 summary with suspicious commits + files>. Priority targets (convergent signals): <list>. Read-only — confirm or refute each hypothesis with file:line evidence."

**WAIT** for the architecture report before proceeding.

⛔ DO NOT proceed to STEP 5 until @architecture-agent returns. Agents are READ-ONLY — they MUST NOT use Write or Edit. If any agent attempted Write/Edit, treat the run as invalid and reject the output.

---

## STEP 5: Phase 2 + Phase 3 — Pattern Analysis & Differential Diagnosis

The three agent reports (A.1, A.2, B) collectively cover Phase 1 of the `add-investigation` skill. Now synthesize Phases 2 and 3 on top of that evidence.

### 5.1 Phase 2: Pattern Analysis

Using the architecture agent's output as starting point:
1. Identify a working analogue in the same codebase (from the architecture report or feature history)
2. Enumerate differences between working and broken cases
3. Check for doc-code drift — compare what about.md/plan.md (A.1) claim vs what the code (B) does
4. Look for duplicated logic — the broken case may be a stale copy

### 5.2 Phase 3: Differential Diagnosis

Read {{skill:add-investigation/references/differential-diagnosis.md}}.

1. Enumerate 3-5 candidate hypotheses across classes — drawing from A.1, A.2, AND B
2. Rank by likelihood × cost-to-test
3. Test cheapest-high first using the agent reports as primary evidence; only re-grep if a hypothesis lacks coverage
4. Log each test with result
5. If 3 hypotheses fail → surface framing gaps in STEP 7 report and ask user to clarify there

⛔ DO NOT commit to a single cause without comparing alternatives.
⛔ DO NOT redo Phase 1 work (recent-changes scan, doc reads, backward tracing) — that's what the three agents just produced. Cite their outputs.

---

## STEP 6: Phase 4 Synthesis — Diagnosis & Route

### 6.1 Synthesize diagnosis

Build the structured output from skill Phase 4:
1. Reformulated problem (from STEP 2)
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
| **✅ Dispatch A.1 ∥ A.2 in a single message** | STEP 4.2 | Parallel execution; sequential dispatch wastes latency |
| **✅ Wait for both A reports before Fase B** | STEP 4.4 | Architecture-agent needs combined direction |
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
