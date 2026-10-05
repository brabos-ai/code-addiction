# Diagnose - Pre-Decision Investigative Triage

<!-- uses:
- skill: add--doc-schemas
- skill: add--delivery-mode
- skill: add--doc-schemas/references/review.md
- skill: add--ecosystem
- skill: add--final-report
- skill: add--investigation
- skill: add--knowledge-discovery
- skill: add--investigation/references/differential-diagnosis.md
- skill: add--investigation/references/symptom-disambiguation.md
- skill: add--subagent-driven-development
- skill: add--subagent-driven-development/references/dispatch-rules.md
- agent: architecture-agent
- agent: feature-history-agent
- agent: git-history-agent
- command: /add-hotfix
- command: /add-new
- command: /add-plan
- command: /add-wiki
- script: hotfix-gates.sh
- script: status.sh
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Investigative triage for ambiguous user reports. Receives a vague symptom or uncertain request, applies the `add--investigation` 5-phase methodology, and delivers a diagnosis + route recommendation (hotfix / feature / extend / no-action). READ-ONLY — does NOT implement fixes or open features.

---

## Required Skills

Load `{{skill:add--doc-schemas/SKILL.md}}` before STEP add-diagnose.context (schemas, IDs, universal doc rules).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP add-diagnose.context: Load context          → status.sh + add--ecosystem
STEP add-diagnose.capture: Capture & reformulate → internal only, no stop
STEP add-diagnose.investigate: Load investigation    → add--investigation skill, apply Phase 0
STEP add-diagnose.dispatch: Two-phase agent dispatch → A.1 ∥ A.2 (parallel) → B (sequential)
STEP add-diagnose.analyze: Phases 2-3            → pattern analysis, differential diagnosis
STEP add-diagnose.synthesize: Phase 4 synthesis     → diagnosis + route + diagnosis-baseline
STEP add-diagnose.report: Present report        → STOP for user agreement
STEP add-diagnose.persist: Persist on acceptance → schema-driven write
STEP add-diagnose.validate: Validation Gate       → diagnose-report schema gate
STEP add-diagnose.complete: Completion           → report the diagnosis in the shared shape
```

---

## ⛔ ABSOLUTE PROHIBITIONS (by checkpoint)

| Checkpoint | Condition | Forbidden | Allowed |
|---|---|---|---|
| **STEP add-diagnose.context** | Context not loaded | Grep, Read code files, dispatch agents | Run status.sh + load add--ecosystem |
| **STEP add-diagnose.investigate** | Skill not loaded | Begin investigation, suggest route | Read add--investigation skill |
| **STEP add-diagnose.dispatch** | A.1 + A.2 outputs not received | Dispatch @architecture-agent, Grep/Read code | WAIT for both parallel agents to return |
| **STEP add-diagnose.dispatch** | A outputs incomplete | Proceed to STEP add-diagnose.analyze, choose "light path", skip agents | Dispatch all three agents (no adaptive triage) |
| **STEP add-diagnose.analyze** | Diagnosis incomplete | Recommend route, Write | Complete Phase 3 (3+ hypotheses) |
| **READ-ONLY** | Always | Edit files, Bash (except status.sh and hotfix-gates.sh), Write outside docs/diagnose/, branches, commits, /add-new/hotfix/build | Suggest next steps |
| **STEP add-diagnose.persist** | User rejected diagnosis | Write | Resume investigation. A rejected diagnosis is not written |
| **STEP add-diagnose.validate** | Diagnosis rejected, no doc | Skip validation gate | Run gate before complete |
| **STEP add-diagnose.complete** | Always | Report before STEP add-diagnose.complete, or skip it on a no-action route | Emit the report in the shape, on every route |

---

## STEP add-diagnose.context: Load Context

### STEP add-diagnose.run-status-sh Run status.sh

```bash
bash .codeadd/scripts/status.sh
```

Parse: BRANCH, FEATURE, WIKI + WIKI_STALE_COUNT (used in STEP add-diagnose.context), RECENT_CHANGELOGS.

### STEP add-diagnose.load-ecosystem-map Load ecosystem map

Read {{skill:add--ecosystem/SKILL.md}} — needed for Command Next-Steps Routing in STEP add-diagnose.synthesize.

### STEP add-diagnose.conditional-reads Conditional reads

- If feature mentioned in user input matches RECENT_CHANGELOGS → note it for Phase 1

### STEP add-diagnose.knowledge-base Consult Knowledge Base

Load `{{skill:add--knowledge-discovery/SKILL.md}}` and run its procedure using the WIKI fields from STEP add-diagnose.run-status-sh (`WIKI:present`, `WIKI_STALE_COUNT`). SELECT the minimal page set by symptom area (from the user's report / RECENT_CHANGELOGS match). Freshness-check each selected page. IF `WIKI:present` is false → note "knowledge base unavailable — /add-wiki generates it" and proceed without it. Carry the selected page paths + one-line reasons + freshness verdicts forward — they feed the Phase 1/2 investigation agents in STEP add-diagnose.dispatch as MAP material (paths in dispatch prompts, agents read them). Investigation evidence still wins over documentation. **GRAPH question:** which delivered work items touch the area this symptom appears in? Resolve it in the skill's action table; do not name an action here. **`RELATED_WORK` destination:** STEP add-diagnose.dispatch's dispatch payload, which carries it to both Fase A agents.

```
IF `RELATED_WORK` IS STILL BLANK AFTER THE GRAPH STEP:
  ⛔ DO NOT: Carry on as though the step ran
  ✅ DO: Fill it with the hits, with `none` when the graph answered and had no match,
         or with `NOT VERIFIED` plus the reason when the graph could not be reached
```

---

## STEP add-diagnose.capture: Capture & Reformulate Input (internal)

### STEP add-diagnose.reformulate-using-user Reformulate using the user's own words

Restate the user input in ONE sentence using only the nouns/verbs they used. Do NOT inject technical interpretation yet.

Store this reformulation internally — it feeds Phase 0 (STEP add-diagnose.investigate) and the diagnosis presented at STEP add-diagnose.report. Do NOT present it to the user now. Do NOT ask questions. Proceed immediately to STEP add-diagnose.investigate.

---

## STEP add-diagnose.investigate: Load Investigation Skill & Apply Phase 0

### STEP add-diagnose.load-skill Load skill

Read {{skill:add--investigation/SKILL.md}} — primary methodology.

Read {{skill:add--investigation/references/symptom-disambiguation.md}} — Phase 0 playbook.

### STEP add-diagnose.disambiguate Execute Phase 0: Symptom Disambiguation

Following the skill:
1. Classify symptom into ONE class (missing feature / wrong behavior / inconsistent state / doc-code drift / UX confusion / race / stale / unknown)
2. Write observable predicate (WHEN/THEN/BUT CURRENTLY)
3. If symptom class = "unknown" → note it and flag for Phase 1 instrumentation

Present Phase 0 output to user if any classification is non-obvious or contested.

---

## STEP add-diagnose.dispatch: Two-Phase Agent Investigation (MANDATORY)

This STEP replaces the previous adaptive triage. All three sub-dispatches always run — Fase A directs Fase B; code-level tracing remains required to confirm the diagnosis.

This STEP implements Phase 1 (Root Cause Investigation) of the `add--investigation` skill in **agent-dispatched mode**. See `{{skill:add--investigation/SKILL.md}}` section "Execution Modes".

<!-- slot:gitnexus.graph-trace fallback="fallbacks/empty.md" -->
<!-- plugin:gitnexus:graph-trace -->
<!-- /plugin:gitnexus:graph-trace -->
<!-- /slot:gitnexus.graph-trace -->

### STEP add-diagnose.dispatch-payload Build the dispatch payload

Assemble from prior STEPs:
- Observable predicate from Phase 0 (STEP add-diagnose.investigate)
- Symptom class from Phase 0
- Affected area keywords (nouns/verbs from reformulation)
- Optional window (default: 30 days for git)
- Knowledge base page paths + one-line reasons + freshness verdicts (STEP add-diagnose.context), if any were selected
- **`RELATED_WORK` (STEP add-diagnose.context)** — the graph's hits, ids with one line each. **Never blank** — `none` when the graph answered and had no match, `NOT VERIFIED` plus the reason when it could not be reached. A `caused_by` edge on a past hotfix in the symptom's area is a starting point, never a conclusion

This payload is passed to BOTH Fase A agents.

### STEP add-diagnose.dispatch-history Fase A — PARALLEL dispatch (A.1 ∥ A.2)

**Before any dispatch in this command:** read `{{skill:add--subagent-driven-development/references/dispatch-rules.md}}` — a fresh dispatch leaves the engine's resume and session fields empty; only an id an earlier dispatch returned is ever passed.

⛔ **CRITICAL:** Dispatch BOTH agents in a SINGLE message with TWO Agent tool calls (parallel execution). Do NOT dispatch sequentially.

**DISPATCH AGENT: @feature-history-agent**
Prompt: "Reconstruct feature relevance for this symptom. Predicate: <predicate>. Symptom class: <class>. Keywords: <keywords>. Knowledge base pages (map material, if any): <wiki page paths + reasons + freshness>. Scan `docs/features/`, score relevance, deep-read top-10, return structured Feature History Report."

**DISPATCH AGENT: @git-history-agent**
Prompt: "Correlate recent git history with this symptom. Predicate: <predicate>. Keywords: <keywords>. Knowledge base pages (map material, if any): <wiki page paths + reasons + freshness>. Window: 30 days. Use git log/show/diff/branch (read-only) to identify suspicious commits and active branches. Return structured Git History Report."

**WAIT** for both reports before proceeding.

### STEP add-diagnose.synthesize-fase-outputs Synthesize Fase A outputs

Combine the two reports:
- **Convergent signals** — files/modules/areas mentioned in BOTH (highest priority for Fase B)
- **Divergent signals** — areas surfaced by only one source (still relevant, lower priority)
- **Confirmed gaps** — symptom aspects neither source explains (Fase B must investigate without prior pointers)

If BOTH reports return "no strong matches", Fase B receives a broad-scan brief (no narrow focus).

### STEP add-diagnose.dispatch-architecture Fase B — SEQUENTIAL dispatch (@architecture-agent)

**DISPATCH AGENT: @architecture-agent**
Prompt: "Trace control-flow and data-flow to validate or refute the hypotheses below. Predicate: <predicate>. Feature History findings: <A.1 summary with files/decisions>. Git History findings: <A.2 summary with suspicious commits + files>. Priority targets (convergent signals): <list>. Knowledge base pages (map material, if any): <wiki page paths + reasons + freshness>. Read-only — confirm or refute each hypothesis with file:line evidence."

**WAIT** for the architecture report before proceeding.

⛔ DO NOT proceed to STEP add-diagnose.analyze until @architecture-agent returns. Agents are READ-ONLY — they MUST NOT use Write or Edit. If any agent attempted Write/Edit, treat the run as invalid and reject the output.

---

## STEP add-diagnose.analyze: Phase 2 + Phase 3 — Pattern Analysis & Differential Diagnosis

The three agent reports (A.1, A.2, B) collectively cover Phase 1 of the `add--investigation` skill. Now synthesize Phases 2 and 3 on top of that evidence.

### STEP add-diagnose.phase-pattern-analysis Phase 2: Pattern Analysis

Using the architecture agent's output as starting point:
1. Identify a working analogue in the same codebase (from the architecture report or feature history)
2. Enumerate differences between working and broken cases
3. Check for doc-code drift — compare what about.md/plan.md (A.1) claim vs what the code (B) does
4. Look for duplicated logic — the broken case may be a stale copy

### STEP add-diagnose.phase-differential-diagnosis Phase 3: Differential Diagnosis

Read {{skill:add--investigation/references/differential-diagnosis.md}}.

1. Enumerate 3-5 candidate hypotheses across classes — drawing from A.1, A.2, AND B
2. Rank by likelihood × cost-to-test
3. Test cheapest-high first using the agent reports as primary evidence; only re-grep if a hypothesis lacks coverage
4. Log each test with result
5. If 3 hypotheses fail → surface framing gaps in STEP add-diagnose.report report and ask user to clarify there

⛔ DO NOT commit to a single cause without comparing alternatives.
⛔ DO NOT redo Phase 1 work (recent-changes scan, doc reads, backward tracing) — that's what the three agents just produced. Cite their outputs.

---

## STEP add-diagnose.synthesize: Phase 4 Synthesis — Diagnosis & Route

### STEP add-diagnose.synthesize-diagnosis Synthesize diagnosis

Build the structured output from skill Phase 4:
1. Reformulated problem (from STEP add-diagnose.capture)
2. Evidence found (from Phases 1-2)
3. Diagnosis with selected hypothesis + rejected alternatives + why
4. Recommended route
5. Risks of acting AND of not acting

### STEP add-diagnose.consult-ecosystem-routing Consult ecosystem routing map

Use the Command Next-Steps Routing table from {{skill:add--ecosystem/SKILL.md}} to map diagnosis → route — `/add-hotfix`, `/add-new`, `/add-plan`, or no further command. The mapping itself is NOT hardcoded here — it lives in the ecosystem map so it stays consistent across the framework.

⛔ DO NOT invent a route. Consult the ecosystem map.

### STEP add-diagnose.capture-baseline Capture repository baseline

Run:

```bash
bash .codeadd/scripts/hotfix-gates.sh diagnosis-baseline
```

Store `DIAGNOSED_BRANCH`, `DIAGNOSED_COMMIT`, and the `BASELINE_BEGIN` / `BASELINE_END` block. This is the working-tree state the investigation used. Do not recapture after the user answers. The script is read-only.

---

## STEP add-diagnose.report: Present Report [STOP]

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

### STEP add-diagnose.ask-agreement Ask for agreement

User agreement is the persistence decision for every route, including no-action.

If the recommended route is hotfix, show the `caused_by` candidates in the same stop. Agreement accepts the diagnosis and those links together.

Ask only: do you agree with this diagnosis?

⛔ HARD STOP. Wait for the answer.

---

## STEP add-diagnose.persist: Persist on acceptance — schema-driven write

### STEP add-diagnose.persistence-decision-tree Persistence decision tree

| user_agrees | Action |
|---|---|
| no | Skip to STEP add-diagnose.complete. A rejected diagnosis is not written |
| yes | Persist for hotfix/feature/extend/no-action. Execute STEP add-diagnose.determine-slug-schema → STEP add-diagnose.write-conditions-met → STEP add-diagnose.carry-these-step |

### STEP add-diagnose.determine-slug-schema Determine slug & schema

- slug: kebab-case from reformulated problem, max 6 words
- Doc ID: `DIAG-<slug>` (fixed per schema)
- EXECUTE schema `diagnose-report` from `{{skill:add--doc-schemas/SKILL.md}}`

### STEP add-diagnose.write-conditions-met Write (if conditions met)

Load {{skill:add--doc-schemas/SKILL.md}} schema `diagnose-report`. Write `docs/diagnose/YYYY-MM-DDTHHMMSS-<slug>.md` per schema (extractive only).

When the accepted route is hotfix, append `## Hotfix Handoff` from `{{skill:add--doc-schemas/references/review.md}}`. Fill scalars from STEP add-diagnose.synthesize. Fill Findings from the accepted causal chain. Fill Confirmed Relations from the links shown at STEP add-diagnose.report. Paste the Working Tree Baseline fence from `diagnosis-baseline`, or `clean`. Omit `## Hotfix Handoff` on every other accepted route.

### STEP add-diagnose.carry-these-step Carry these into STEP add-diagnose.complete

⛔ **DO NOT print them here.** The report comes first, and STEP add-diagnose.complete owns it. Emitting the path and
the next command at STEP add-diagnose.carry-these-step puts metadata in front of the report and then repeats it.

STEP add-diagnose.complete states:
- Report path (if persisted)
- The accepted route, named in prose from the `add--ecosystem` routing
- When the accepted route is hotfix: that `/add-hotfix` is the next activity. ⛔ Do NOT print its full invocation here — STEP add-diagnose.handoff puts it behind the offer, where `add--delivery-mode` requires it. Never invoke `/add-hotfix`
- Reminder: `add-diagnose` is READ-ONLY; the user runs the next command when ready

---

## STEP add-diagnose.validate: Validation Gate

Only run this gate when STEP add-diagnose.persist actually wrote a doc. If the diagnosis was rejected, skip directly to STEP add-diagnose.complete.

Execute the validation gate from `{{skill:add--doc-schemas/SKILL.md}}` for schema `diagnose-report`.

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## STEP add-diagnose.complete: Completion

**LOAD `{{skill:add--final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the report path and the recommended command come after it.

**This step runs on every route, including no-action and a rejected diagnosis.** The gate above is
conditional; the report is not. A run that wrote no document still owes the user its diagnosis.

This command is advisory and changes no code, so `Files touched` reads "none" on every row unless
STEP add-diagnose.persist persisted a document. Fill `What was delivered` with the diagnosis and the route, and
`How it works` with the causal chain — what fails, where, and why the evidence points there rather
than at the runner-up hypothesis.

Then, after the seven blocks, state the accepted route and that this command never runs the command it names.

### STEP add-diagnose.handoff Offer the continuation

**This command is READ-ONLY and advisory.** The next activity exists only when the accepted route is
one an agent can pick up. Print the hotfix invocation only for an accepted hotfix route, and never
invoke it.

| Accepted route | Next activity |
|---|---|
| `hotfix` | `/add-hotfix @docs/diagnose/<file>.md` — it consumes the `## Hotfix Handoff` this report appended |
| `feature` | `/add-new` — a functional gap becomes a feature |
| `extend` | `/add-new` or `/add-plan`, per the route's own scope |
| `no-action` | none — the diagnosis was the deliverable |

Finish the report and its metadata, then ask ONCE for instructions only on the first three rows. A
`no-action` diagnosis ends normally with no offer.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by `{{skill:add--delivery-mode/SKILL.md}}` and
`{{skill:add--final-report/SKILL.md}}`. Do not restate them here. This step supplies only the next
activity and its documents.

**The documents the block points at**, each with the role it plays:

| Document | Role in the next activity |
|---|---|
| `docs/diagnose/YYYY-MM-DDTHHMMSS-<slug>.md` | The causal chain and the `## Hotfix Handoff` the next command reads |
| `docs/features/<id>/about.md` | What the feature created for this gap is for, on the `feature` and `extend` routes |
| {{skill:add--ecosystem/SKILL.md}} | Main Flows, for the routing the accepted route takes next |

---

## Rules

ALWAYS:
- Confirm the reformulation with the user before investigating (STEP add-diagnose.capture) — wrong framing wastes downstream investigation
- Apply Phase 0 before reading code (STEP add-diagnose.investigate) — symptom classification guides triage depth
- Dispatch A.1 and A.2 in a single message (STEP add-diagnose.dispatch) — parallel execution; sequential dispatch wastes latency
- Wait for both A reports before Fase B (STEP add-diagnose.dispatch) — architecture-agent needs combined direction
- Enumerate 3+ hypotheses (STEP add-diagnose.analyze) — prevents single-cause bias
- Consult the ecosystem map for the route (STEP add-diagnose.synthesize) — the route must stay framework-consistent
- Capture diagnosis-baseline after synthesis and before the user answers (STEP add-diagnose.synthesize)
- Persist every accepted diagnosis, including no-action (STEP add-diagnose.persist)
- Credit the add--investigation skill (STEP add-diagnose.report) — methodology transparency

NEVER:
- Recommend a route without a differential diagnosis (STEP add-diagnose.analyze→6) — route validity depends on evidence
- Execute the recommended command (STEP add-diagnose.report) — add-diagnose is advisory only
- Modify code — READ-ONLY boundary, applies throughout
- Accept "something is weird" as a symptom (STEP add-diagnose.capture) — push for an observable predicate (WHEN/THEN/BUT)
- Persist a rejected diagnosis (STEP add-diagnose.persist)
- Invoke `/add-hotfix` from this command — reserve its copy-ready invocation for the accepted continuation response
- Guess past the 3-failure stop rule (STEP add-diagnose.analyze) — return to framing instead
