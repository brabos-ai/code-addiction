# Tech Audit - Complete Technical Project Audit

<!-- uses:
- skill: add--doc-schemas
- skill: add--ecosystem
- skill: add--delivery-mode
- skill: add--final-report
- skill: add--health-check
- skill: add--investigation
- skill: add--subagent-driven-development
- skill: add--subagent-driven-development/references/dispatch-rules.md
- command: /add-new
-->

> **DOCUMENTATION STYLE:** Follow standards defined in skill `add--doc-schemas`

Execute complete technical analysis of the project, identifying security, architecture, data and documentation issues. Designed for entrepreneurs using vibe coding who need a roadmap of technical adjustments.

**Output:** `docs/audit/<YYYY-MM-DD>.md` (per `audit-report` schema) + supporting reports in `docs/audits/<YYYY-MM-DD>/`

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

---

## Required Skills

Load `{{skill:add--doc-schemas/SKILL.md}}` before STEP add-audit.create-folder (schemas, IDs, universal doc rules).

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP add-audit.create-folder: Create folder structure    → RUN FIRST
STEP add-audit.prerequisites: Validate prerequisites     → BEFORE discovery
STEP add-audit.discovery: Discovery Phase (parallel) → dispatch 3 agents, WAIT-ALL
STEP add-audit.analysis: Analysis Phase (parallel)  → dispatch 3 agents, WAIT-ALL
STEP add-audit.consolidate: Consolidation              → READ all reports, apply differential diagnosis
STEP add-audit.score: Calculate scores           → BEFORE final report
STEP add-audit.write-report: Write audit-report doc     → schema-driven
STEP add-audit.validate: Validation Gate            → audit-report schema gate
STEP add-audit.complete: Inform user                → COMPLETE
```

**⛔ ABSOLUTE PROHIBITIONS (invariant):**

```
ALWAYS:
  ⛔ DO NOT: Make code corrections automatically
  ⛔ DO NOT USE: Bash for git add/commit/push
  ⛔ DO NOT: Execute analysis without project context
  ⛔ DO NOT: Skip discovery phase
  ⛔ DO NOT: Inline any doc template — schema is the only source of truth
```

---

## Architecture Overview

```
/audit
    │
    ├── STEP add-audit.discovery - DISCOVERY (parallel)
    │   ├── context-discovery      → Architecture, multi-tenancy, features
    │   ├── documentation-analyzer → AGENTS.md, patterns
    │   └── infrastructure-check   → MCP Supabase, env vars
    │
    ├── STEP add-audit.consolidate - ANALYSIS (parallel, depends on STEP add-audit.discovery)
    │   ├── security-analyzer      → RLS, secrets, frontend/backend boundary
    │   ├── architecture-analyzer  → Clean arch, imports, coupling
    │   └── data-analyzer          → Migrations, indexes, queries
    │
    └── STEP add-audit.complete - CONSOLIDATION (schema-driven)
        └── Coordinator            → docs/audit/<date>.md via audit-report schema
```

---

## Agent Dispatch Rules & Registry

**Dispatch rules:** When instructed to DISPATCH AGENTS, read the **Capability** and **Complexity** from the agent table below. Choose the best available agent/task mechanism in your engine that satisfies the capability. If your engine supports parallel dispatch, dispatch all agents in the phase simultaneously. Verify outputs exist before proceeding past WAIT gates.

**Before any dispatch in this command:** read `{{skill:add--subagent-driven-development/references/dispatch-rules.md}}` — a fresh dispatch leaves the engine's resume and session fields empty; only an id an earlier dispatch returned is ever passed.

**Agent Registry:**

| Phase | Agent | Skill File | Capability | Complexity | Output |
|-------|-------|-----------|------------|-----------|--------|
| **DISCOVERY** | 1: Context | `context-discovery.md` | read-write | standard | `context-discovery.md` |
| | 2: Documentation | `documentation-analyzer.md` | read-write | standard | `documentation-report.md` |
| | 3: Infrastructure | `infrastructure-check.md` | read-write | standard | `infrastructure-report.md` |
| **ANALYSIS** | 4: Security | `security-analyzer.md` | read-write | standard | `security-report.md` |
| | 5: Architecture | `architecture-analyzer.md` | read-write | standard | `architecture-report.md` |
| | 6: Data | `data-analyzer.md` | read-write | standard | `data-report.md` |

**Idempotency:** Before each phase, check if outputs exist. If all exist and are recent (< 1 hour old), skip re-dispatch and proceed to WAIT gate. This allows recovery from transient failures without re-running heavy analysis.

---

## STEP add-audit.create-folder: Create Folder Structure (RUN FIRST)

```bash
AUDIT_DATE=$(date +%Y-%m-%d)
mkdir -p "docs/audits/${AUDIT_DATE}"
mkdir -p "docs/audit"
```

**⛔ GATE CHECK: Folders created?**
- If NO → Stop and abort.
- If YES → Proceed to STEP add-audit.prerequisites.

---

## STEP add-audit.prerequisites: Validate Prerequisites (BEFORE discovery)

Check whether `AGENTS.md` exists at project root. Detect project layout (look for `apps/`, `libs/`, `src/` or equivalent).

**⛔ GATE CHECK: Project structure valid?**
- If no recognisable source directories → Warn user about non-standard structure.
- If YES → Proceed to STEP add-audit.discovery.

---

## STEP add-audit.discovery: Discovery Phase (Parallel Dispatch + Wait)

**⛔ GATE CHECK: Idempotency — Skip if discovery outputs exist and are recent (< 1 hour)?**
- If all outputs exist: skip to WAIT sub-step.
- If any missing: dispatch all agents.

**DISPATCH ALL 3 AGENTS SIMULTANEOUSLY:**
Use the Agent Registry above (rows: Context, Documentation, Infrastructure). For each agent:
1. Load prompt from skill `add--health-check` file named in Skill File column
2. Dispatch with Capability/Complexity noted
3. Instruct agent to write to output path: `docs/audits/${AUDIT_DATE}/<output>`

**⛔ WAIT-ALL: Verify outputs exist:**
- [ ] `context-discovery.md` (contains mandatory sections)
- [ ] `documentation-report.md`
- [ ] `infrastructure-report.md`

**⛔ GATE CHECK: All discovery outputs exist?**
- If NO → Do NOT proceed; wait or re-dispatch
- If YES → Proceed to STEP add-audit.analysis.

**⛔ GATE PROHIBITION:** DO NOT dispatch analysis agents until ALL discovery outputs verified.
**⛔ GATE PROHIBITION:** DO NOT proceed without `context-discovery.md` — it provides project context for analysis phase.

---

## STEP add-audit.analysis: Analysis Phase (Parallel Dispatch + Wait)

**Prerequisites:** STEP add-audit.discovery completed and `context-discovery.md` exists.

**⛔ GATE CHECK: Idempotency — Skip if analysis outputs exist and are recent (< 1 hour)?**
- If all outputs exist: skip to WAIT sub-step.
- If any missing: dispatch all agents.

**DISPATCH ALL 3 AGENTS SIMULTANEOUSLY:**
Use the Agent Registry above (rows: Security, Architecture, Data). For each agent:
1. Load prompt from skill `add--health-check` file named in Skill File column
2. **Pass context:** Provide content of `context-discovery.md` to all agents; for Security and Data agents, also pass `infrastructure-report.md`
3. Dispatch with Capability/Complexity noted
4. Instruct agent to write to output path: `docs/audits/${AUDIT_DATE}/<output>`

**⛔ WAIT-ALL: Verify outputs exist:**
- [ ] `security-report.md`
- [ ] `architecture-report.md`
- [ ] `data-report.md`

**⛔ GATE CHECK: All analysis outputs exist?**
- If NO → Do NOT proceed; wait or re-dispatch
- If YES → Proceed to STEP add-audit.consolidate.

**⛔ GATE PROHIBITION:** DO NOT proceed to consolidation without all analysis outputs — they feed the final scoring and report.

---

## STEP add-audit.consolidate: Consolidation & Differential Diagnosis

Read all generated reports from `docs/audits/${AUDIT_DATE}/`.

**Parse each report for:**
- Issue severity (Critical, High, Medium, Low)
- Issue description
- Impacted file/line (evidence)
- Pillar (Documentation, Security, Architecture, Data, Infrastructure)

**Differential diagnosis:** IF a finding lacks a clear root cause (symptom observable but cause not isolated, OR severity assessment is uncertain, OR finding crosses pillars): LOAD {{skill:add--investigation/SKILL.md}} and apply Phase 3 (Differential Diagnosis) before finalizing severity. Mark such findings as `requires investigation` rather than guessing severity.

---

## STEP add-audit.score: Calculate Scores

**Per-pillar scoring:**
- Count issues by severity (Critical=3, High=2, Medium=1, Low=0.5)
- Score = max(0, 10 - (weighted_sum / 5))
- **Status:** 8-10 Healthy · 6-7 Attention · 4-5 Risk · 0-3 Critical

**Calculate:** Individual pillar scores, overall score (average), total issues by severity.

---

## STEP add-audit.write-report: Write audit-report Doc (Schema-Driven)

**EXECUTE schema `audit-report` from {{skill:add--doc-schemas/SKILL.md}} (MANDATORY).**

- **Path:** `docs/audit/${AUDIT_DATE}.md`
- **ID:** `AUDIT-${AUDIT_DATE}`; `related: [STACK]`
- Write extractive only (per schema)
- **Link supporting reports** in References section using relative paths: `../audits/${AUDIT_DATE}/*.md`

---

## STEP add-audit.validate: Validation Gate

Execute the validation gate from {{skill:add--doc-schemas/SKILL.md}} for schema `audit-report`.

**⛔ GATE CHECK: Gate returns PASS?**
- If NO → Fix and re-run gate.
- If YES → Proceed to STEP add-audit.complete.

---

## STEP add-audit.complete: Completion - Inform User

**LOAD `{{skill:add--final-report/SKILL.md}}`.** It owns the seven blocks, the banned phrasings and
the self-check. Emit the report FIRST — the scorecard and the report path come after it, whole.

This command changes no application code, so `Files touched` names the audit documents STEP add-audit.write-report wrote
and nothing else — never "none", because those files are real. `What was delivered` is the finding
set. Fill `How it works` with what the audit actually measured
and how a score was reached. `⚠️ Needs your attention` carries the critical findings, because
nothing in this run fixes them.

Then, after the seven blocks, present the overall scorecard, issue counts by severity, top 3 priorities, and the audit-report path.

### STEP add-audit.handoff Offer the continuation

**This command is advisory — it changes no code and fixes nothing.** So the next activity exists only
when there is a finding to act on.

| Audit result | Next activity |
|---|---|
| Critical findings | `/add-new` per critical issue — each becomes a feature |
| Findings below critical | none — the report is the deliverable |
| Healthy project | none — there is nothing to continue into |

Finish the report and its metadata, then ask ONCE for instructions only on the first row. A healthy
audit ends normally with no offer; do not invent a feature to have somewhere to point.

**Eligibility is `chat-continuation-eligibility-v1` and the accepted answer's shape is
`chat-continuation-output-v1`** — both owned by `{{skill:add--delivery-mode/SKILL.md}}` and
`{{skill:add--final-report/SKILL.md}}`. Do not restate them here. This step supplies only the next
activity and its documents.

**The documents the block points at**, each with the role it plays:

| Document | Role in the next activity |
|---|---|
| `docs/audit/${AUDIT_DATE}.md` | The findings and severities the new feature is scoped from |
| `docs/features/<id>/about.md` | What the feature created for that critical issue is for |
| {{skill:add--ecosystem/SKILL.md}} | Main Flows, for the routing a new feature takes next |

---

## Rules

ALWAYS:
- Use accessible language for non-technical users
- Prioritize issues by real business impact
- Include specific paths and lines in Findings evidence
- Calculate scores using defined formula
- Check idempotency before each phase (STEP add-audit.discovery and STEP add-audit.analysis) to skip redundant re-dispatch
- Execute differential diagnosis for ambiguous findings before finalizing severity

NEVER:
- Correct code automatically
- Make commits or changes to files
- Skip discovery phase
- Execute analysis without project context
- Inline a doc template — the schema is the single source of truth
- Omit file paths or line numbers in Findings evidence
- Skip validation gate (STEP add-audit.validate)

---

## Dependencies

This command requires the following files from skill `add--health-check`:
- `context-discovery.md`
- `documentation-analyzer.md`
- `infrastructure-check.md`
- `security-analyzer.md`
- `architecture-analyzer.md`
- `data-analyzer.md`
