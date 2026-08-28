# Evidence: T1 — Deterministic convergence gate

> **Plan:** `docs/plans/0074-PLAN--autonomous-epic-convergence-001-convergence-gate.md`
> **Umbrella:** `docs/plans/0074-PLAN--autonomous-epic-convergence-000-umbrella.md`
> **Status:** in progress
> **Started:** 2026-08-27

---

## L0.1 — Injection-point baseline (recorded before any edit)

Captured with `node scripts/build.js` on a clean tree at branch point `feat/0074-autonomous-epic-convergence`.

**Total injection points: 39**

| Resource | Points | Namespaces |
|---|---|---|
| `architecture-agent` (agent) | 1 | plugin:gitnexus:graph |
| `backend-agent` (agent) | 1 | plugin:gitnexus:graph |
| `database-agent` (agent) | 1 | plugin:gitnexus:graph |
| `discovery-agent` (agent) | 1 | plugin:gitnexus:graph |
| `frontend-agent` (agent) | 1 | plugin:gitnexus:graph |
| `qa-agent` (agent) | 1 | plugin:playwright:drive |
| `reviewer-agent` (agent) | 1 | plugin:gitnexus:graph |
| `system-design-agent` (agent) | 1 | plugin:gitnexus:graph |
| `ux-agent` (agent) | 1 | plugin:gitnexus:graph |
| `ux-flow-agent` (agent) | 1 | plugin:gitnexus:graph |
| `add.build` (command) | 10 | feature:qa-pipeline:e2e-dispatch · feature:qa-pipeline:qa-fix · feature:tdd-pipeline:awareness · feature:tdd-pipeline:coverage · feature:tdd-pipeline:detect-framework · feature:tdd-pipeline:gate · feature:tdd-pipeline:tasks-flow · feature:tdd-pipeline:test-dispatch · feature:tdd-pipeline:verification · feature:tdd-pipeline:verify-red |
| `add.diagnose` (command) | 1 | plugin:gitnexus:graph-trace |
| `add.done` (command) | 1 | plugin:gitnexus:graph-reindex |
| `add.hotfix` (command) | 2 | feature:tdd-pipeline:red-gate · plugin:gitnexus:graph-impact |
| `add.new` (command) | 1 | plugin:gitnexus:graph-map |
| `add.plan` (command) | 5 | feature:qa-pipeline:qa-spec · feature:qa-pipeline:step-list · feature:tdd-pipeline:step-list · feature:tdd-pipeline:step9 · plugin:gitnexus:graph-plan |
| `add.review` (command) | 3 | feature:tdd-pipeline:spec-audit · feature:tdd-pipeline:step-list · plugin:playwright:drive |
| `add.wiki` (command) | 6 | plugin:gitnexus:graph-classify · plugin:gitnexus:graph-contract · plugin:gitnexus:graph-database · plugin:gitnexus:graph-dispatch-common · plugin:gitnexus:graph-quality · plugin:gitnexus:graph-specialist |

Baseline copy: `C:/tmp/0074-injection-baseline.json`
Checker: `C:/tmp/check-anchors.py` — compares namespace/name/section/resource AND anchor text, so a moved anchor is caught even when the total stays 39.

---

## F-block log

_Appended as each F-block lands._

## Validation levels

_Appended as each level is run._
