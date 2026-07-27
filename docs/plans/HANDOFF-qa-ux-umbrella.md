# HANDOFF — QA/UX Umbrella (topics 01–05) — RETIRED

> **Status:** ⛔ **RETIRED 2026-07-27.** This file was a mid-flight resume note. All five topics are implemented and the umbrella has been reviewed. It is kept only so links to it resolve — **do not follow its instructions**, they describe a state that no longer exists.
>
> **Read instead:** `docs/plans/0056..0060-PLAN--*.md` (+ their `--evidence-v01.md`), `docs/plans/HANDOFF-qa-ux-umbrella--review-v01.md` (the whole-umbrella audit), and `docs/changelog/2026-07-27-*.md`.

## Final state

| Topic | Plan | Status |
|---|---|---|
| 01 QA pipeline reachability | `0056-PLAN--qa-pipeline-reachability.md` | ✅ implemented |
| 02 UX agent ownership / always-on design contract | `0057-PLAN--ux-agent-design-ownership.md` | ✅ implemented |
| 03 Layout notation + measurable Design Contract | `0058-PLAN--layout-notation-design-contract.md` | ✅ implemented |
| 04 Dual-judge QA validation | `0059-PLAN--dual-judge-qa-validation.md` | ✅ implemented |
| 05 Fix routing | `0060-PLAN--qa-fix-routing.md` | ✅ implemented (see **amendment A1** — no legacy fallback for un-routed reports) |

Branch: `feature/0056-qa-ux-umbrella` (renamed — it carries five topics, not just 0056). Nothing is pushed; no PR exists.

## Corrections to what this file used to claim

- **Branch name** was `feature/0056-qa-pipeline-reachability`; it is now `feature/0056-qa-ux-umbrella`.
- **"`docs/*` is gitignored … never in commits"** — no longer true and never was fully. `docs/*` is still ignored, but the 20 umbrella artefacts were **deliberately force-added** in `b49352e`. The policy and its rationale now live in `CLAUDE.md` → "`docs/` tracking policy". Plans 0001–0055 remain untracked by design.
- **Vitest baseline "27 pre-existing environmental failures"** — that was a Windows/CRLF checkout. On a LF checkout the full suite is green; treat any failure as a regression, not a baseline.
- **The T3 injection-anchor question** ("can a changed `next` drift hint break injection?") is **answered**: no, in both the fresh-install and already-installed paths. The analysis is in review v01, § Side-Effect Detection.

## Lessons worth keeping

- `framwork/.codeadd/injection-points.json` is gitignored — `git diff` on it proves nothing. Verify anchors with `extractInjectionPoints` from `scripts/build.js` over the pre-edit blob vs the current file.
- Never hand-edit `framwork/.claude/` or any provider dir — regenerate with `node scripts/build.js`.
- No fractional/inserted STEP numbering — renumber the sequence.
- Judgement agents (`@ux-agent`, `@qa-agent`, `@ux-layout-agent`) carry **no `memory:`** by design; `@ux-flow-agent` keeps `memory: project`. The rationale is stated inline in each agent body.

## Deferred follow-ups (NOT delivered)

QA for non-web surfaces (bot/worker/CLI); run-evidence retention and lifecycle; `screens.json` maintenance after route refactors; hand-edit drift on `design.md` outside the provenance path. Also recorded as a status note on `docs/brainstorming/2026-07-26-00-qa-ux-umbrella.md`.
