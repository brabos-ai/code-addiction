---
name: health-check
description: |
  Tech health check: documentation, security, architecture, data analysis.
---

# Health Check

Suite de skills para análise técnica completa do projeto.

**Referência:** Sempre consultar `CLAUDE.md` para padrões gerais do projeto.

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

{"pillars":[{"name":"Documentation","level":"🔴 Critical","reason":"impacts AI dev quality"},{"name":"Security","level":"🔴 Critical","reason":"data leaks, privacy"},{"name":"Architecture","level":"🟠 High","reason":"accumulating tech debt"},{"name":"Data","level":"🟡 Medium","reason":"performance, consistency"},{"name":"Infrastructure","level":"🔵 Info","reason":"prerequisite for analysis"}]}

---

## Skills

{"phase1":[{"skill":"context-discovery","output":"context-discovery.md"},{"skill":"documentation-analyzer","output":"documentation-report.md"},{"skill":"infrastructure-check","output":"infrastructure-report.md"}]}

{"phase2":[{"skill":"security-analyzer","deps":"context,infrastructure","output":"security-report.md"},{"skill":"architecture-analyzer","deps":"context","output":"architecture-report.md"},{"skill":"data-analyzer","deps":"context,infrastructure","output":"data-report.md"}]}

---

## Output

{"folder":"docs/health-checks/YYYY-MM-DD/"}

{"files":["context-discovery.md","documentation-report.md","infrastructure-report.md","security-report.md","architecture-report.md","data-report.md","HEALTH-REPORT.md"]}

---

## Usage

```bash
/tech-health-check
```

### Process
1. Create folder with current date
2. Run Phase 1 agents in parallel
3. Wait completion
4. Run Phase 2 agents in parallel (with Phase 1 context)
5. Wait completion
6. Consolidate in HEALTH-REPORT.md

---

## Audience

Entrepreneurs who:
- Use vibe coding
- Don't understand technical details
- Need clear adjustment roadmap
- Want prioritization: critical → desirable

---

## Language

{"reports":"PT-BR"}
{"techTerms":"EN"}
{"style":"accessible for non-technical"}
{"glossary":"included in HEALTH-REPORT.md"}
