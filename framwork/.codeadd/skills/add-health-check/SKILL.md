---
name: add-health-check
description: |
  Tech health check: documentation, security, architecture, data analysis. Use when user requests project audit, tech debt review, or health check.
---

# Health Check

Suite of skills for complete technical analysis of the project. Always consult `CLAUDE.md` for general project standards.

## When NOT to Use

- Single-file or single-function review (use code-review)
- Security-only audit (use add-security-audit)
- Code-review tasks on PRs or diffs

---

## Architecture

```
/tech-health-check
├── PHASE 1 - DISCOVERY (parallel)
│   ├── context-discovery     → architecture, multi-tenancy, modules
│   ├── documentation-analyzer → CLAUDE.md, patterns
│   └── infrastructure-check   → MCP, env vars, deps
│
├── PHASE 2 - ANALYSIS (parallel, depends on Phase 1)
│   ├── security-analyzer      → RLS, secrets, boundaries
│   ├── architecture-analyzer  → clean arch, imports, CQRS
│   └── data-analyzer          → migrations, indexes, N+1
│
└── PHASE 3 - CONSOLIDATION
    └── HEALTH-REPORT.md        → scorecard + roadmap
```

---

## Criticality

| Pillar | Level | Reason |
|--------|-------|--------|
| Documentation | 🔴 Critical | impacts AI dev quality |
| Security | 🔴 Critical | data leaks, privacy |
| Architecture | 🟠 High | accumulating tech debt |
| Data | 🟡 Medium | performance, consistency |
| Infrastructure | 🔵 Info | prerequisite for analysis |

---

## Skills

Phase 1: `context-discovery` → context-discovery.md; `documentation-analyzer` → documentation-report.md; `infrastructure-check` → infrastructure-report.md.

Phase 2: `security-analyzer` (deps: context, infrastructure) → security-report.md; `architecture-analyzer` (deps: context) → architecture-report.md; `data-analyzer` (deps: context, infrastructure) → data-report.md.

---

## Usage & Output

```bash
/tech-health-check
```

Process:
1. Create folder `docs/health-checks/YYYY-MM-DD/` with current date
2. Run Phase 1 agents in parallel; wait completion
3. Run Phase 2 agents in parallel (with Phase 1 context); wait completion
4. Consolidate in HEALTH-REPORT.md

Output files: `context-discovery.md`, `documentation-report.md`, `infrastructure-report.md`, `security-report.md`, `architecture-report.md`, `data-report.md`, `HEALTH-REPORT.md`.

---

## Language

Reports written for entrepreneurs who may not be technical — accessible style, prioritized critical → desirable. Language follows `owner.md` (default English); technical terms stay in EN; glossary included in HEALTH-REPORT.md.
