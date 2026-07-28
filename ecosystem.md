# ADD Ecosystem Map

> Integration map of all commands, skills, and agents in the ADD framework. For gap analysis and orphaned artefacts see [0022-PLAN](docs/plans/0022-PLAN--ecosystem-master-map.md).

Four graphs: **Core Pipeline** (main development flow), **Support Commands** (auxiliary flow), **Agent Dispatch** (subagent orchestration), **Plugin Integrations** (optional MCP plugins).

**19 commands · 40 skills · 15 agents · 5 providers** (claude, codex, cursor, antigrav, opencode)

Node shapes: `(command)` rounded · `{{skill}}` hexagon · `>agent]` flag · `[plugin]` square

---

## Graph 1 — Core Pipeline

Commands in the main feature development flow and the skills they load.

```mermaid
graph LR
  NEW(add.new)
  PLAN(add.plan)
  BUILD(add.build)
  REVIEW(add.review)
  DONE(add.done)
  TEST(add.test)
  QA(add.qa)
  AUTO(add.autopilot)

  DS{{add-doc-schemas}}
  ID{{add-id-convention}}
  TC{{add-tasks-checklist}}
  BE{{add-backend-development}}
  FE{{add-frontend-development}}
  DB{{add-database-development}}
  UX{{add-ux-design}}
  CR{{add-code-review}}
  SA{{add-security-audit}}
  DV{{add-delivery-validation}}
  IV{{add-investigation}}
  KD{{add-knowledge-discovery}}
  FD{{add-feature-discovery}}
  FS{{add-feature-specification}}
  WM{{add-wiki-maintenance}}
  TDD{{add-tdd}}
  TSPEC{{add-test-specification}}
  QSPEC{{add-qa-spec}}
  QSK{{add-qa}}

  NEW --> DS & ID & FD & FS & KD
  PLAN --> DS & ID & TC & BE & FE & DB & UX & FD & KD & TSPEC & QSPEC
  BUILD --> DS & ID & TC & BE & FE & DB & UX & CR & TDD
  REVIEW --> CR & BE & FE & DB & UX & SA & DV & IV & KD
  DONE --> DS & ID & WM
  TEST --> BE & FE & TDD
  QA --> QSK & DS
  AUTO --> DS & ID & TC & BE & FE & DB & UX
```

> `add-tdd` / `add-test-specification` load only with the `tdd` feature enabled; `add-qa-spec` only with `qa-pipeline` enabled.

---

## Graph 2 — Support Commands

Auxiliary commands (gateway, discovery, emergency, analysis, QA bootstrap) and their skills.

```mermaid
graph LR
  ADD(add)
  INIT(add.init)
  DESIGN(add.design)
  DIAGNOSE(add.diagnose)
  HOTFIX(add.hotfix)
  AUDIT(add.audit)
  WIKI(add.wiki)
  BRAINSTORM(add.brainstorm)
  UX_CMD(add.ux)
  QASETUP(add.qa-setup)
  PR(add.pull-request)

  ECO{{add-ecosystem}}
  DS{{add-doc-schemas}}
  ID{{add-id-convention}}
  UX{{add-ux-design}}
  IV{{add-investigation}}
  KD{{add-knowledge-discovery}}
  PD{{add-product-discovery}}
  HC{{add-health-check}}
  AD{{add-architecture-discovery}}
  CMS{{add-claude-md-style}}
  WM{{add-wiki-maintenance}}
  DE{{add-dev-environment-setup}}
  DR{{add-doc-reviewer}}
  CM{{add-commit}}
  QMIG{{add-qa-migration}}
  SC{{add-setup-contract}}
  SDD{{add-subagent-driven-development}}

  ADD --> ECO & DE
  INIT --> DS & PD
  DESIGN --> DS & ID & UX
  DIAGNOSE --> DS & ECO & IV & KD
  HOTFIX --> DS & ID & IV & KD & UX & ECO
  AUDIT --> DS & HC & IV & ECO
  WIKI --> DS & AD & CMS & WM & ECO
  BRAINSTORM --> DS & DR
  UX_CMD --> UX
  QASETUP --> DE & DS & QMIG & SC & SDD
  PR --> DS & ID & CM
```

---

## Graph 3 — Agent Dispatch

Which commands dispatch which agents, and which skills each agent loads.

```mermaid
graph LR
  AUTO(add.autopilot)
  BUILD(add.build)
  DESIGN(add.design)
  NEW(add.new)
  DIAGNOSE(add.diagnose)
  HOTFIX(add.hotfix)
  REVIEW(add.review)
  PLAN(add.plan)
  BRAINSTORM(add.brainstorm)
  QA(add.qa)
  QASETUP(add.qa-setup)
  TEST(add.test)

  BA>backend-agent]
  FA>frontend-agent]
  DA>database-agent]
  RA>reviewer-agent]
  UXA>ux-agent]
  UXF>ux-flow-agent]
  UXL>ux-layout-agent]
  DISCO>discovery-agent]
  DOCR>doc-reviewer-agent]
  ARCH>architecture-agent]
  SDA>system-design-agent]
  FHA>feature-history-agent]
  GHA>git-history-agent]
  QAA>qa-agent]
  E2EA>e2e-agent]

  BE{{add-backend-development}}
  FE{{add-frontend-development}}
  DB{{add-database-development}}
  CR{{add-code-review}}
  SA{{add-security-audit}}
  UX{{add-ux-design}}
  FD{{add-feature-discovery}}
  FS{{add-feature-specification}}
  DR{{add-doc-reviewer}}
  DS{{add-doc-schemas}}
  AD{{add-architecture-discovery}}
  BARCH{{add-backend-architecture}}
  FARCH{{add-frontend-architecture}}
  IV{{add-investigation}}
  QSK{{add-qa}}

  AUTO --> BA & FA & DA & RA & ARCH
  BUILD --> BA & FA & DA & RA & UXA & E2EA
  DESIGN --> UXF & UXL & UXA
  NEW --> DISCO & DOCR
  PLAN --> DISCO & BA & FA & DA & ARCH & UXF & UXL & UXA
  REVIEW --> RA
  BRAINSTORM --> DOCR
  DIAGNOSE --> FHA & GHA & ARCH
  HOTFIX --> FHA & GHA & ARCH
  QA --> QAA & UXA
  QASETUP --> QAA & E2EA
  TEST --> E2EA

  BA --> BE & DB
  FA --> FE
  DA --> DB
  RA --> CR & SA
  UXA --> UX
  UXF --> UX
  UXL --> UX
  DISCO --> FD & FS
  DOCR --> DR & DS
  ARCH --> AD & BARCH & FARCH
  SDA --> AD
  FHA --> IV
  GHA --> IV
  QAA --> QSK
```

> **UX pipeline.** `add.plan` STEP 8.1 runs `@ux-flow-agent → @ux-layout-agent → @ux-agent` (critique) automatically for any UI-touching feature and consolidates `design.md` itself. `/add.design` is the manual entry point to that same pipeline, not a required prior step.
>
> **QA dual judge.** `/add.qa` dispatches `@ux-agent` (review mode — judgement axes) in parallel with `@qa-agent` (deterministic axes, functional delivery, a11y, failure forensics), then merges their findings.

---

## Graph 4 — Plugin Integrations

Optional MCP plugins that inject additive guidance into commands and agents. Disabled by default — enable via `codeadd plugins enable <name>`.

```mermaid
graph LR
  GNX[gitnexus plugin]
  GNX_SK{{add-gitnexus}}

  NEW(add.new)
  DIAGNOSE(add.diagnose)
  HOTFIX(add.hotfix)
  DONE(add.done)
  UXF>ux-flow-agent]

  GNX -->|injects into| NEW & DIAGNOSE & HOTFIX & DONE & UXF
  GNX -->|activates skill| GNX_SK

  PW[playwright plugin]
  PW_SK{{add-qa}}

  QA(add.qa)
  QAA>qa-agent]

  PW -->|injects into| QA & QAA
  PW -->|activates skill| PW_SK
```

---

## Features

| Feature | Default | Injects into | Purpose |
|---------|---------|--------------|---------|
| `tdd` | enabled | add.plan, add.build, add.review | RED-GREEN-REFACTOR discipline + contract-test specs |
| `qa-pipeline` | disabled | add.plan, add.test, add.build | E2E spec authoring + agent QA validation |

Enable/disable via `codeadd features enable|disable|list <name>`.

---

> Auto-generated by `/add-framework--sync` — do not edit manually.
> Source of truth for AI agents: `framwork/.codeadd/skills/add-ecosystem/SKILL.md`
