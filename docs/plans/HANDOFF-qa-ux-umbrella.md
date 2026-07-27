# HANDOFF — QA/UX Umbrella implementation (topics 01–05)

> **Written:** 2026-07-27 · **Branch:** `feature/0056-qa-pipeline-reachability` (17 commits ahead of `main`, working tree CLEAN)
> **Read this first in a new session, then read the ledger + the current plan file.**

## Where things stand

| Topic | Plan | Status |
|---|---|---|
| 01 QA pipeline reachability | `docs/plans/0056-PLAN--qa-pipeline-reachability.md` | ✅ **implemented**, evidence + changelog written |
| 02 UX agent ownership / always-on design contract | `docs/plans/0057-PLAN--ux-agent-design-ownership.md` | ✅ **implemented**, whole-topic final review passed after a 4-item fix wave |
| 03 Layout notation + measurable Design Contract | `docs/plans/0058-PLAN--layout-notation-design-contract.md` | ✅ **implemented**, whole-topic final review **CLEAN** |
| 04 Dual-judge QA validation | `docs/plans/0059-PLAN--dual-judge-qa-validation.md` | 🔄 **IN PROGRESS — 3 of 5 tasks done** |
| 05 Fix routing | `docs/plans/0060-PLAN--qa-fix-routing.md` | 📋 **plan written, not started** (4 tasks) |

Also done up front: the six brainstorm docs in `docs/brainstorming/2026-07-26-0*.md` were audited and **corrected** (27 edits) for internal contradictions — severity policy for rejected critique items (full severity with cited evidence, NOT capped at `polish`), removal of the `confidence` field from routing, a11y ownership, the cut mock-loop, `@qa-spec` naming, `add.ux` roster, preflight row renumbering. Those corrections are the source of truth the plans were written from.

## EXACTLY where to resume

**Plan 0059, Task 4.** Tasks 1–3 are committed and reviewed clean. The T3 review (an Opus reviewer) was still running when the session ended — **its verdict was never received**.

**First action in the new session:**
1. Read the ledger: `.superpowers/sdd/0059-PLAN--dual-judge-qa-validation/progress.md` (it is the recovery map; trust it and `git log` over any recollection).
2. Re-run the T3 review yourself (the old agent is gone). Diff file already exists: `.superpowers/sdd/0059-PLAN--dual-judge-qa-validation/review-38c01e1..8fdb63d.diff`. The review prompt used is reproducible from the plan's Task 3 constraints, plus this specific question that was pending:
   > **Anchor question:** T3 deleted `qa-agent.md`'s Step 0.5, which sat directly below the `plugin:playwright:drive` marker. The anchor's `text`/`ordinal`/`position` are unchanged but its **`next` drift hint changed**. Read `scripts/build.js` (`extractInjectionPoints`) and `cli/src/injection-core.js` to judge whether a changed `next` can break injection for (a) a fresh install shipping the regenerated sidecar, (b) an already-installed project holding the OLD sidecar. **This was never answered — answer it before marking T3 complete.**
3. If the review is clean → ledger `Task 3: complete` → dispatch Task 4. If it has Critical/Important findings → fix round (resume-implementer pattern, max 5 rounds).

## Plan 0059 remaining work

- **Task 4** — `qa-validation` schema (`add-doc-schemas/references/review.md`): `type` gains `spec-gap`, `root cause` required on functional findings, `unverifiable` outcome, **`Responsiveness` + `Accessibility` added to the Sections list** (they exist only in the report template today, invisible to the gate), `## TOC` required. `add-qa/SKILL.md`: axis-ownership table, approval rubric summary, root-cause taxonomy, merge rules, judge-split docs (replaces the "a later plan splits…" forward note), report template updates. `add-ecosystem/SKILL.md`: add.qa row + Agents table + Dependency Index.
- **Task 5** — sweep + tests + evidence + changelog. **The ledger has 6 accumulated sweep items** that MUST be resolved here (playwright fragment single-judge framing in two files, `add-ecosystem:31` "4 axes", the `spec-gap` six-vs-five-dimensions wording in `ux-agent.md:63`, a test pinning the playwright anchor **text**, etc.).
- Then: whole-topic final review (most capable model, diff `f35db0e..HEAD`), fix wave if needed, delete the workspace, and only then start 0060.

## How the work is being executed (keep this protocol)

Subagent-driven development, one task at a time, never two implementers in parallel:

1. `scripts/task-brief PLAN N` → brief file; record BASE (`git rev-parse HEAD`) before dispatching.
2. Dispatch implementer (Sonnet for mechanical, Opus for high-risk files) with: one line of project context, the brief path, interfaces from earlier tasks, ambiguity resolutions, report-file path. Implementer commits and writes its report.
3. `scripts/review-package PLAN BASE HEAD` → diff file; dispatch a task reviewer (never skip; spec + quality both required).
4. Findings → fix round: resume the SAME implementer (rounds 1–3), then a fresh one on a stronger model (4–5). Each round ends with a scoped re-review over the fix diff only.
5. Append to the ledger after every round and on completion. Minors → ledger as deferred, triaged at the final review.
6. Scripts live in `C:\Users\maico\.claude\plugins\cache\claude-plugins-official\superpowers\6.2.0\skills\subagent-driven-development\scripts\`.

**Hard-won lessons to carry forward:**
- `framwork/.codeadd/injection-points.json` is **gitignored** — `git diff` on it proves NOTHING. Verify anchors with `extractInjectionPoints` from `scripts/build.js` over the pre-edit blob vs the current file.
- Never hand-edit `framwork/.claude/` (or any provider dir) — regenerate with `node scripts/build.js`.
- `docs/*` is gitignored: plans, evidence, changelogs, and this handoff exist **on disk only**, never in commits. Do not "fix" that silently.
- Vitest baseline on this Windows checkout: **27 pre-existing environmental failures** (CRLF). Enumerated in `docs/plans/0057-PLAN--ux-agent-design-ownership--evidence-v01.md`. Any new failure beyond that set is a regression.
- House rule: **no fractional/inserted STEP numbering** — renumber the sequence (this bit us once with a `4.α` label).
- Agents used for judging carry **no `memory:`** (role-scoped exception to the 13/13 convention): `ux-agent`, `qa-agent`, `ux-layout-agent`. `ux-flow-agent` KEEPS `memory: project`.

## What was built (so the new session doesn't re-derive it)

**0056:** `qa-preflight.sh` (new, TDD with 21 bats tests) + two-phase block/degrade preflight in `add.qa` + `add.qa-setup` STEP 2 feature-gate (confirm→enable→verify the fragment landed, detecting the pre-sidecar no-op) + self-detection notices in `add.plan`/`add.test` + canonical feature-vs-plugin statement in `add-qa` + `## Features` section in `add-ecosystem` + `cli/tests/qa-reachability.smoke.test.js` (now 17 tests, the umbrella's regression net).

**0057:** `status.sh` emits `HAS_DESIGN` (SF-aware) + `add.build` domain-scoped precedence; new `@ux-flow-agent` / `@ux-layout-agent`, `@ux-agent` promoted to adversarial critic; `add.plan` STEP 8.1 (gate + provenance-hash idempotency + critique pass + consolidation at `SCOPE_DIR` + `feature-design` gate), STEP 8 renumbered, `--yolo` removed; `add.design` refactored to a thin dispatcher; `screens.json` ownership inverted to STEP 10.0 with read-merge-write by `sf`+`id`.

**0058:** layout-tree notation + `## Design Contract` (markdown table, 11 dimensions each naming its verification method) in the `feature-design` schema and `add-ux-design`; ASCII retired from the authoring agents; `screens.json` `expect` derives from the contract; `<surface>.qa.spec` now captures computed styles to `_tests/run-NNN/computed-styles/<screen>.<viewport>.json` — the hard dependency of 0059's deterministic conformance.

**0059 so far:** `add.qa` STEP 4 restructured (4.1 resolve run-NNN → 4.2 run+collect → 4.3 specs-absent → 4.4 coordinator coverage reconciliation → 4.5 parallel dual dispatch, WAIT-ALL) + STEP 5 merge/dedupe/precedence/contradiction rules + read-only guard naming both judges; `@ux-agent` review mode (judgement-only rubric, `## Design Review` as context-not-immunity, `spec-gap`, grounding rule); `@qa-agent` rewritten (no `memory`, no Step 0.5, no UX axis; deterministic conformance + all a11y + 7-row root-cause taxonomy + forensics).

## Open items deliberately NOT in scope (umbrella follow-ups)

Recorded so they are not mistaken for delivered: QA for non-web surfaces (bot/worker/CLI), run-evidence retention/lifecycle, `screens.json` maintenance after route refactors, and hand-edit drift on `design.md` outside the provenance path. Plan 0060 Task 4 item 5 asks for these to be appended as a status note to the umbrella brainstorm when the umbrella closes.

## Nothing is pushed

The branch is local. No PR exists. `docs/` artefacts are untracked by design. When the work is finished, the finishing step is a PR from `feature/0056-qa-pipeline-reachability` (consider renaming the branch — it now carries five topics, not just 0056).
