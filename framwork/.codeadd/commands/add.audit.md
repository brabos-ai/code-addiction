# Tech Audit - Complete Technical Project Audit

> **DOCUMENTATION STYLE:** Follow standards defined in `.codeadd/skills/add-documentation-style/SKILL.md`

Execute complete technical analysis of the project, identifying security, architecture, data and documentation issues. Designed for entrepreneurs using vibe coding who need a roadmap of technical adjustments.

**Output:** `docs/audits/YYYY-MM-DD/`

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.
> **OWNER:** Adapt detail level to owner profile from status.sh (iniciante → explain why; avancado → essentials only).

---

## Spec

```json
{"scoring":{"weights":{"critical":3,"high":2,"medium":1,"low":0.5},"formula":"max(0, 10 - (weighted_sum / 5))"}}
```

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Create folder structure    → RUN FIRST
STEP 2: Validate prerequisites     → BEFORE discovery
STEP 3: Discovery (parallel)       → 3 agents in parallel
STEP 4: Wait discovery             → WAIT-ALL for 3 agents
STEP 5: Analysis (parallel)        → 3 agents in parallel
STEP 6: Wait analysis              → WAIT-ALL for 3 agents
STEP 7: Consolidation              → READ all reports
STEP 8: Calculate scores           → BEFORE final report
STEP 9: Generate AUDIT-REPORT.md   → WRITE final report
STEP 10: Inform user               → COMPLETE
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF FOLDER STRUCTURE NOT CREATED:
  ⛔ DO NOT: Dispatch agents
  ⛔ DO NOT USE: Write to create reports
  ⛔ DO: Execute mkdir FIRST

IF DISCOVERY PHASE INCOMPLETE:
  ⛔ DO NOT: Dispatch analysis agents
  ⛔ DO NOT USE: Read for context-discovery.md
  ⛔ DO: Wait for ALL 3 discovery agents to complete

IF CONTEXT-DISCOVERY.MD NOT EXISTS:
  ⛔ DO NOT: Dispatch analysis agents
  ⛔ DO NOT: Start security/architecture/data analysis
  ⛔ DO: Verify discovery output files exist

IF ANALYSIS PHASE INCOMPLETE:
  ⛔ DO NOT USE: Write to create AUDIT-REPORT.md
  ⛔ DO NOT USE: Read for report consolidation
  ⛔ DO: Wait for ALL 3 analysis agents to complete

ALWAYS:
  ⛔ DO NOT: Make code corrections automatically
  ⛔ DO NOT USE: Bash for git add/commit/push
  ⛔ DO NOT: Execute analysis without project context
  ⛔ DO NOT: Skip discovery phase
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
    └── STEP 7 - CONSOLIDATION
        └── Coordinator            → AUDIT-REPORT.md final
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
# Create folder with current date
AUDIT_DATE=$(date +%Y-%m-%d)
mkdir -p "docs/audits/${AUDIT_DATE}"
```

**Output folder:** `docs/audits/${AUDIT_DATE}/`

**⛔ GATE CHECK: Folder created?**
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
- **Prompt:** Content of skill `.codeadd/skills/add-audit/context-discovery.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/context-discovery.md`

⛔ DO NOT proceed until agent output file exists.

---

### Agent 2: Documentation Analyzer

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:** Content of skill `.codeadd/skills/add-audit/documentation-analyzer.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/documentation-report.md`

⛔ DO NOT proceed until agent output file exists.

---

### Agent 3: Infrastructure Check

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:** Content of skill `.codeadd/skills/add-audit/infrastructure-check.md`
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

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:** Content of skill `.codeadd/skills/add-audit/security-analyzer.md`
- **Additional context:** Pass content of `context-discovery.md` and `infrastructure-report.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/security-report.md`

⛔ DO NOT proceed until agent output file exists.

---

### Agent 5: Architecture Analyzer

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:** Content of skill `.codeadd/skills/add-audit/architecture-analyzer.md`
- **Additional context:** Pass content of `context-discovery.md`
- **Output:** Write `docs/audits/${AUDIT_DATE}/architecture-report.md`

⛔ DO NOT proceed until agent output file exists.

---

### Agent 6: Data Analyzer

**DISPATCH AGENT:**
- **Capability:** read-write (must write output file)
- **Complexity:** standard
- **Prompt:** Content of skill `.codeadd/skills/add-audit/data-analyzer.md`
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
- Impacted file/line
- Pillar (Documentation, Security, Architecture, Data, Infrastructure)

---

## STEP 8: Calculate Scores (BEFORE final report)

**Scoring per pillar:**
- Count issues by severity (Critical=3, High=2, Medium=1, Low=0.5)
- Score = max(0, 10 - (weighted_sum / 5))

**Status by score:**
- 8-10 → 🟢 Healthy
- 6-7 → 🟡 Attention
- 4-5 → 🟠 Risk
- 0-3 → 🔴 Critical

**Calculate:**
- Individual pillar scores (Documentation, Security, Architecture, Data, Infrastructure)
- Overall score (average of all pillars)
- Total issues by severity

---

## STEP 9: Generate AUDIT-REPORT.md (WRITE final report)

**Create:** `docs/audits/${AUDIT_DATE}/AUDIT-REPORT.md`

**Template:**

```markdown
# Technical Audit Report

**Project:** [Project name]
**Date:** [YYYY-MM-DD]
**Version:** 1.0

---

## Executive Summary

[2-3 paragraphs in simple language about project overall state, main identified risks and priority recommendations. Accessible language for non-technical users.]

---

## Scorecard

| Pillar | Score | Status | Issues |
|-------|-------|--------|--------|
| Documentation | X/10 | 🔴/🟠/🟡/🟢 | X critical, Y high |
| Security | X/10 | 🔴/🟠/🟡/🟢 | X critical, Y high |
| Architecture | X/10 | 🔴/🟠/🟡/🟢 | X critical, Y high |
| Data | X/10 | 🔴/🟠/🟡/🟢 | X critical, Y high |
| Infrastructure | X/10 | 🔴/🟠/🟡/🟢 | X critical, Y high |
| **OVERALL** | **X/10** | **🔴/🟠/🟡/🟢** | **X total** |

**Legend:** 🟢 8-10 (Healthy) | 🟡 6-7 (Attention) | 🟠 4-5 (Risk) | 🔴 0-3 (Critical)

---

## Consolidated Issues by Priority

### 🔴 CRITICAL (Resolve IMMEDIATELY)

These issues can cause data leaks, security failures or prevent system functioning.

| ID | Pillar | Issue | Impact | File |
|----|-------|-------|---------|---------|
| C01 | [Pillar] | [Brief description] | [Impact in simple language] | [path:line] |

---

### 🟠 HIGH (Resolve within 1 week)

These issues can cause performance problems, hard-to-debug bugs or significant technical debt.

| ID | Pillar | Issue | Impact | File |
|----|-------|-------|---------|---------|
| A01 | [Pillar] | [Brief description] | [Impact in simple language] | [path:line] |

---

### 🟡 MEDIUM (Resolve within 1 month)

These issues are important improvements but not urgent.

| ID | Pillar | Issue | Impact | File |
|----|-------|-------|---------|---------|
| M01 | [Pillar] | [Brief description] | [Impact in simple language] | [path:line] |

---

### 🟢 LOW (Technical backlog)

Desirable improvements for code quality.

| ID | Pillar | Issue | Impact | File |
|----|-------|-------|---------|---------|
| B01 | [Pillar] | [Brief description] | [Impact in simple language] | [path:line] |

---

## Suggested Roadmap

### Sprint 1 (Immediate)
- [ ] [C01] - [Brief description]
- [ ] [C02] - [Brief description]

### Sprint 2 (1 week)
- [ ] [A01] - [Brief description]
- [ ] [A02] - [Brief description]

### Sprint 3 (2 weeks)
- [ ] [M01] - [Brief description]

### Backlog
- [ ] [B01] - [Brief description]

---

## How to Use This Report

1. **Create features for fixes:**
   ```bash
   # For each critical issue, create a feature
   git checkout -b feature/[XXXX]F-fix-[issue-id]
   ```

2. **Use /feature command with context:**
   ```
   /feature Fix [C01]: [issue description]
   ```

3. **Execute audit again after fixes:**
   ```
   /audit
   ```

---

## Detailed Reports

For complete technical details, see:
- [Context Discovery](./context-discovery.md)
- [Documentation Report](./documentation-report.md)
- [Infrastructure Report](./infrastructure-report.md)
- [Security Report](./security-report.md)
- [Architecture Report](./architecture-report.md)
- [Data Report](./data-report.md)

---

## Glossary

| Term | Meaning |
|-------|-------------|
| RLS | Row Level Security - user-level data protection in database |
| Multi-tenancy | Data isolation between different clients/accounts |
| Clean Architecture | Code organization pattern in layers |
| Migration | Script that changes database structure |
| N+1 Query | Performance issue with multiple unnecessary queries |

---

*Report automatically generated by `/audit` command*
```

---

## STEP 10: Completion - Inform User

Present the overall scorecard, issue counts by severity, top 3 priorities, report location, and suggested next steps (review report, create features for critical issues, re-run audit after fixes).

**Next Steps:** Reference `.codeadd/skills/add-ecosystem/SKILL.md` Main Flows section for context-aware next command suggestion.

---

## Rules

ALWAYS:
- Use accessible language for non-technical users
- Prioritize issues by real business impact
- Include specific paths and lines of problems
- Calculate scores using defined formula
- Generate comprehensive executive summary

NEVER:
- Correct code automatically
- Make commits or changes to files
- Skip discovery phase
- Execute analysis without project context
- Use technical jargon without explanation in report
- Generate false positives without verifying context
- Skip score calculation
- Omit file paths or line numbers in issues

---

## Dependencies

This command requires the following skills in `.codeadd/skills/add-audit/`:
- `context-discovery.md`
- `documentation-analyzer.md`
- `infrastructure-check.md`
- `security-analyzer.md`
- `architecture-analyzer.md`
- `data-analyzer.md`
