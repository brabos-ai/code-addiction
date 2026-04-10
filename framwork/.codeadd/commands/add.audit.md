# Tech Audit - Complete Technical Project Audit

> **DOCUMENTATION STYLE:** Follow standards defined in skill `add-documentation-style`

Execute complete technical analysis of the project, identifying security, architecture, data and documentation issues. Designed for entrepreneurs using vibe coding who need a roadmap of technical adjustments.

**Output:** `docs/audit/<YYYY-MM-DD>.md` (per `audit-report` schema) + supporting reports in `docs/audits/<YYYY-MM-DD>/`

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## Spec

```json
{"write_allowed":"docs/audit/,docs/audits/","schema":"audit-report","scoring":{"weights":{"critical":3,"high":2,"medium":1,"low":0.5},"formula":"max(0, 10 - (weighted_sum / 5))"}}
```

---

## Required Skills

Load `{{skill:add-documentation-style/SKILL.md}}` (hub) before STEP 1. It delegates to `add-doc-schemas` (schema: `audit-report`), `add-doc-ref-convention`, and `add-token-efficiency`.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1:  Create folder structure    → RUN FIRST
STEP 2:  Validate prerequisites     → BEFORE discovery
STEP 3:  Discovery (parallel)       → 3 agents in parallel
STEP 4:  Wait discovery             → WAIT-ALL for 3 agents
STEP 5:  Analysis (parallel)        → 3 agents in parallel
STEP 6:  Wait analysis              → WAIT-ALL for 3 agents
STEP 7:  Consolidation              → READ all reports
STEP 8:  Calculate scores           → BEFORE final report
STEP 9:  Write audit-report doc     → schema-driven
STEP 10: Validation Gate            → audit-report schema gate
STEP 11: Inform user                → COMPLETE
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF FOLDER STRUCTURE NOT CREATED:
  ⛔ DO NOT: Dispatch agents
  ⛔ DO NOT USE: Write to create reports
  ⛔ DO: Execute mkdir FIRST

IF DISCOVERY PHASE INCOMPLETE:
  ⛔ DO NOT: Dispatch analysis agents
  ⛔ DO: Wait for ALL 3 discovery agents to complete

IF CONTEXT-DISCOVERY.MD NOT EXISTS:
  ⛔ DO NOT: Dispatch analysis agents
  ⛔ DO: Verify discovery output files exist

IF ANALYSIS PHASE INCOMPLETE:
  ⛔ DO NOT USE: Write to create the audit-report doc
  ⛔ DO: Wait for ALL 3 analysis agents to complete

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
    ├── STEP 3 - DISCOVERY (parallel)
    │   ├── context-discovery      → Architecture, multi-tenancy, features
    │   ├── documentation-analyzer → CLAUDE.md, patterns
    │   └── infrastructure-check   → MCP Supabase, env vars
    │
    ├── STEP 5 - ANALYSIS (parallel, depends on STEP 3)
    │   ├── security-analyzer      → RLS, secrets, frontend/backend boundary
    │   ├── architecture-analyzer  → Clean arch, imports, coupling
    │   └── data-analyzer          → Migrations, indexes, queries
    │
    └── STEP 9 - CONSOLIDATION (schema-driven)
        └── Coordinator            → docs/audit/<date>.md via audit-report schema
```

---

## Agent Dispatch Rules

When this command instructs you to DISPATCH AGENT:
1. Read the **Capability** required (read-only, read-write, full-access)
2. Read the **Complexity** hint (light, standard, heavy)
3. Choose the best available agent/task mechanism in your engine that satisfies the capability
4. If your engine supports parallel dispatch and mode is `parallel`, dispatch all simultaneously
5. Verify output exists before proceeding past any WAIT or GATE CHECK

You are the coordinator. You know your engine's capabilities. Map the intent to the best available mechanism.

---

## STEP 1: Create Folder Structure (RUN FIRST)

```bash
# Create folders for supporting reports + final audit-report doc
AUDIT_DATE=$(date +%Y-%m-%d)
mkdir -p "docs/audits/${AUDIT_DATE}"
mkdir -p "docs/audit"
```

**Supporting reports folder:** `docs/audits/${AUDIT_DATE}/`
**Final audit-report doc (schema path):** `docs/audit/${AUDIT_DATE}.md`

**⛔ GATE CHECK: Folders created?**
- If NO → Stop. Show error and abort.
- If YES → Proceed to STEP 2.

---

## STEP 2: Validate Prerequisites (BEFORE discovery)

Check whether `CLAUDE.md` exists at project root. Detect project layout (look for `apps/`, `libs/`, `src/` or equivalent top-level directories).

**⛔ GATE CHECK: Project structure valid?**
- If no recognisable source directories → Warn user about non-standard structure
- If YES → Proceed to STEP 3.

---

## STEP 3: Discovery Phase (Execute in Parallel)

**DISPATCH 3 AGENTS IN PARALLEL:**
Each agent is independent. Dispatch ALL simultaneously.

### Agent 1: Context Discovery

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:** Content of skill `add-health-check` file `context-discovery.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/context-discovery.md`

⛔ DO NOT proceed until agent output file exists.

---

### Agent 2: Documentation Analyzer

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:** Content of skill `add-health-check` file `documentation-analyzer.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/documentation-report.md`

⛔ DO NOT proceed until agent output file exists.

---

### Agent 3: Infrastructure Check

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:** Content of skill `add-health-check` file `infrastructure-check.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/infrastructure-report.md`

⛔ DO NOT proceed until agent output file exists.

---

## STEP 4: Wait for Discovery Phase (MANDATORY)

**WAIT-ALL:** Verify ALL agent outputs exist before proceeding.
- [ ] `context-discovery.md` exists and contains mandatory sections
- [ ] `documentation-report.md` exists
- [ ] `infrastructure-report.md` exists

**⛔ GATE CHECK: All discovery outputs exist?**
- If NO → Wait. Do NOT proceed to analysis.
- If YES → Proceed to STEP 5.

---

## STEP 5: Analysis Phase (Execute in Parallel)

**DISPATCH 3 AGENTS IN PARALLEL:**
Each agent is independent. Dispatch ALL simultaneously.

Each agent MUST read `context-discovery.md` to understand:
- Which tenant identifiers to validate
- Which features exist
- Which patterns are expected

### Agent 4: Security Analyzer

**DISPATCH AGENT: @reviewer-agent**
- **Prompt:** Content of skill `add-health-check` file `security-analyzer.md`
- **Additional context:** Pass content of `context-discovery.md` and `infrastructure-report.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/security-report.md`

⛔ DO NOT proceed until agent output file exists.

---

### Agent 5: Architecture Analyzer

**DISPATCH AGENT: @architecture-agent**
- **Prompt:** Content of skill `add-health-check` file `architecture-analyzer.md`
- **Additional context:** Pass content of `context-discovery.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/architecture-report.md`

⛔ DO NOT proceed until agent output file exists.

---

### Agent 6: Data Analyzer

**DISPATCH AGENT: @database-agent**
- **Prompt:** Content of skill `add-health-check` file `data-analyzer.md`
- **Additional context:** Pass content of `context-discovery.md` and `infrastructure-report.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/data-report.md`

⛔ DO NOT proceed until agent output file exists.

---

## STEP 6: Wait for Analysis Phase (MANDATORY)

**WAIT-ALL:** Verify ALL agent outputs exist before proceeding.
- [ ] `security-report.md` exists
- [ ] `architecture-report.md` exists
- [ ] `data-report.md` exists

**⛔ GATE CHECK: All analysis outputs exist?**
- If NO → Wait. Do NOT proceed to consolidation.
- If YES → Proceed to STEP 7.

---

## STEP 7: Consolidation - Read All Reports

Read all generated reports from `docs/audits/${AUDIT_DATE}/`.

**Parse each report for:**
- Issue severity (Critical, High, Medium, Low)
- Issue description
- Impacted file/line (evidence)
- Pillar (Documentation, Security, Architecture, Data, Infrastructure)

### 7.1 Differential diagnosis for ambiguous findings

**IF a finding lacks a clear root cause** (symptom observable but cause not isolated, OR severity assessment is uncertain, OR finding crosses pillars): LOAD {{skill:add-investigation/SKILL.md}} and apply Phase 3 (Differential Diagnosis) before finalizing severity classification.

Mark such findings explicitly in the final report as `requires investigation` rather than guessing severity. The user can then run `/add.diagnose` to triage them individually.

---

## STEP 8: Calculate Scores (BEFORE final report)

**Scoring per pillar:**
- Count issues by severity (Critical=3, High=2, Medium=1, Low=0.5)
- Score = max(0, 10 - (weighted_sum / 5))

**Status by score:** 8-10 Healthy · 6-7 Attention · 4-5 Risk · 0-3 Critical.

**Calculate:** Individual pillar scores, overall score (average), total issues by severity.

---

## STEP 9: Write audit-report doc (schema-driven)

**Schema load (MANDATORY).** EXECUTE schema `audit-report` from `{{skill:add-doc-schemas/SKILL.md}}`. Apply cache technique per `{{skill:add-documentation-style/SKILL.md}}`.

- **Path:** `docs/audit/${AUDIT_DATE}.md`
- **ID:** `AUDIT-${AUDIT_DATE}` (fixed — audit-date based). `related: [STACK]`.
- Write per schema — extractive only.
- **Link supporting reports** in an optional References-style list using plain relative paths to files under `docs/audits/${AUDIT_DATE}/`.

---

## STEP 10: Validation Gate

Execute the validation gate from `{{skill:add-doc-schemas/SKILL.md}}` for schema `audit-report`.

⛔ DO NOT skip. DO NOT mark the command complete until gate returns `PASS`.

---

## STEP 11: Completion - Inform User

Present the overall scorecard, issue counts by severity, top 3 priorities, audit-report path, and suggested next steps (review report, create features for critical issues via `/add.new`, re-run audit after fixes).

**Next Steps:** Reference skill `add-ecosystem` Main Flows section for context-aware next command suggestion.

---

## Rules

ALWAYS:
- Use accessible language for non-technical users
- Prioritize issues by real business impact
- Include specific paths and lines of problems in the Findings evidence column
- Calculate scores using defined formula
- Load the `audit-report` schema from the registry before writing

NEVER:
- Correct code automatically
- Make commits or changes to files
- Skip discovery phase
- Execute analysis without project context
- Inline a doc template — the schema is the single source of truth
- Omit file paths or line numbers in Findings evidence
- Skip the validation gate

---

## Dependencies

This command requires the following files from skill `add-health-check`:
- `context-discovery.md`
- `documentation-analyzer.md`
- `infrastructure-check.md`
- `security-analyzer.md`
- `architecture-analyzer.md`
- `data-analyzer.md`
