# Evidence: T3 — Plan-reviewer adoption

> **Plan:** `docs/plans/0074-PLAN--autonomous-epic-convergence-003-plan-reviewer-adoption.md`
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

### F20 — plan 0069 executed

New artefacts: `framwork/.codeadd/agents/plan-reviewer-agent.md`, `framwork/.codeadd/skills/add-plan-review/SKILL.md`, both registered in `provider-map.json`. Build now reports **41 skills** (was 40) and **21 agents** (was 20).

Rewired: `/add.plan` (new `## STEP 13: Plan Review (GATE: plan_reviewed)`, Completion renamed to STEP 14, STEPS IN ORDER updated), `/add.new` STEP 8, `/add.brainstorm` STEP 5, plus `add-ecosystem`, `add-doc-reviewer` and the `add-doc-schemas` Validation Gate parenthetical.

STEP 13 implements 0069's contract literally: dispatch, `ok` -> proceed, `fix-then-ok` -> apply Required fixes, **re-run STEP 12's gate**, re-dispatch **once**, `blocked` or remaining blockers -> STOP. Plus 0069's `add.plan`-only rule that UX subagents are never re-dispatched to satisfy a plan-review finding.

### The L503 amendment — resolved as case 3, from the sidecar, not from a guess

Read `injection-points.json` directly before any edit. For `feature:qa-pipeline:qa-spec` in `add.plan.md`:

```
anchor.text = "## STEP 10: Consolidate Plan (APPEND + VALIDATE + FILL GAPS)"   <- L499
anchor.next = "**QA axis self-check:** ... Add one line to the STEP 13 completion output ..."   <- L503
```

**L503 is the `next` drift hint, not the anchor text.** That is case 3 of the mandatory amendment: the edit is allowed, with an immediate rebuild. It was made — the line now reads `STEP 14 completion output` — and **L499 is byte-identical to HEAD**, verified by diffing against `git show HEAD:...`.

Both `step-list` markers (L57, L59) share `anchor.text = "- 8.4: Frontend Specialist"` (L56) with `anchor.next` at L61. 0069's STEPS IN ORDER edit lands at L63-L64, below both. Neither line was touched.

### The one allowed renumber, and its manual check

`/add.plan` STEP 13 -> 14 is the only renumber in this plan set. **Nothing in the build validates fragment step references**, so this was checked by hand and the result is recorded here rather than assumed:

| Fragment | References | Still correct? |
|---|---|---|
| `tdd-pipeline/add.plan.md` | defines `STEP 9`, cites `STEP 9` | Yes — below 13, unaffected |
| `qa-pipeline/add.plan.md` | defines `STEP 10.0`, cites `STEP 9`, `STEP 8.1` | Yes — all below 13 |
| `gitnexus/add.plan.md` | no `STEP N` references at all | N/A |

### F21, F22

- **F21** `add.plan-to-ready.md` STEP 3 gained a `Plan review (MANDATORY, after the output check passes)` block. It states in the file itself that the schema re-run is **new behaviour beyond** *"applying /add.plan's own consolidation rules"*, because the `feature-plan` gate is `/add.plan` STEP 12 — a step this loop never runs. Required fixes are answered from the Decision Log; the loop never stops for the user. One re-dispatch. `blocked` is a BLOCKED exit. The plan roster table now lists `@plan-reviewer-agent`.
- **F22** `add-ecosystem/SKILL.md` lists `/add.plan-to-ready` as a dispatcher.

## Validation levels

| Level | Result | Evidence |
|---|---|---|
| **L1.1-L1.4** 0069 delivered, checked against what it actually contains | **PASS** | Nine files present and changed as its Scope>Includes lists; STEP 13 matches its six-step command loop including step 5's gate re-run and the UX no-re-dispatch rule |
| **L1.5** agent + skill registered and built | **PASS** | build: 41 skills, 21 agents |
| **L1.6** ecosystem lists the loop as dispatcher (F22) | **PASS** | grep |
| **L2.1** build after the `add.plan` edits | **PASS** | `Injection points : 39`; checker 39/39 intact **by anchor text** |
| **L2.3** fragment step references re-verified by hand | **PASS** | table above; no reference went stale |
| **L2.4** the L503 case recorded | **PASS** | case 3, with the sidecar entry that decided it, quoted above |
| **L2.2** feature/plugin enable-disable round-trip | **NOT RUN** | needs an install target |
| **L3.1-L3.5** loop dispatch behaviour | **NOT RUN** | needs a live epic run; the instruction is written and inspected only |

## Gaps — what is NOT proven

- **L3 entirely.** F21 is an instruction to a coordinator. Whether a live run actually dispatches the reviewer, honours the one-re-dispatch cap and exits BLOCKED correctly cannot be shown without running an epic. Inspected, not executed.
- **L2.2 round-trip** not run — no project installed from this build.
- **`add-plan-review` and `plan-reviewer-agent` are unexercised.** They are authored to 0069's contract and they build, but no plan has been reviewed by them yet.

_Appended as each F-block lands._

## Validation levels

_Appended as each level is run._
