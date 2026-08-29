# Plan: T3 — Plan-reviewer adoption

> **Status:** implemented
> **Type:** agent + skill + command
> **Created:** 2026-08-27
> **Author:** Maicon + Claude (ADD Strategy)
> **Umbrella:** `0074-PLAN--autonomous-epic-convergence-000-umbrella.md`
> **Checkpoint:** ends at **C3** · **Depends on C2**

---

## Context

The set needs a plan reviewer that ships to consumers, so the loop can check each subfeature's plan before building it. That plan is already written: **0069 — Pre-delivery plan-reviewer agent for add.new / add.brainstorm / add.plan**, status `draft`.

**This topic does not re-derive 0069.** It executes it as written and adds two things 0069 could not know about: the loop-side dispatch, and one collision with an injection anchor that 0069's own instructions walk straight into. It also supplies the proof levels 0069 never had — that plan predates the Red-Green matrix requirement, so its sections stop at ``## References`.

## Problem (T3 scope only)

1. `@plan-review-agent` exists only in the internal layer (`.claude/`). Consumers get nothing. Plan 0069 fixes this and has never been executed.
2. `/add.plan-to-ready` takes over `/add.plan`'s coordinator role for its own invocation and dispatches agents directly. So wiring the reviewer into `/add.plan` STEP 13, which is what 0069 does, does not reach the loop. The loop has to dispatch it itself.
3. **0069's edit instructions collide with an injection anchor.** See Injection Surface.

## Scope

### Includes

- **F20** — Execute plan `0069-PLAN--pre-delivery-plan-reviewer-agent.md` as written, with the amendment in Injection Surface below. It creates `framwork/.codeadd/agents/plan-reviewer-agent.md` and `framwork/.codeadd/skills/add-plan-review/SKILL.md`, registers both in `framwork/provider-map.json`, and rewires `/add.plan` STEP 13, `/add.new` STEP 8 and `/add.brainstorm` STEP 5. Its own F-blocks, decisions and validation stay in that file.
- **F21** — `framwork/.codeadd/commands/add.plan-to-ready.md` plan leg (STEP 3): after consolidating the subfeature's `plan.md`, dispatch `@plan-reviewer-agent` with `kind: feature-plan`. The verdict contract is 0069's own — `ok` / `fix-then-ok` / `blocked`, with one re-dispatch on `fix-then-ok`. **0069's loop step 5 (re-run that document's schema gate after an applied fix) is new behaviour here and must be added explicitly.** STEP 3's existing phrase “applying `/add.plan`'s own consolidation rules” does not cover it: the `feature-plan` gate is `/add.plan` STEP 12, a separate step from consolidation, and the loop does not run `/add.plan`'s steps. `blocked`, or blockers still standing after the single re-dispatch, is a BLOCKED exit for that subfeature, not a warning. The loop answers required fixes from the Decision Log; it does not stop to ask the user, per its autonomy contract.
- **F22** — `framwork/.codeadd/skills/add-ecosystem/SKILL.md`: list `/add.plan-to-ready` as a dispatcher of `@plan-reviewer-agent`, alongside the three commands 0069 wires.

### Does NOT Include

- Any change to 0069's design. If executing it surfaces a real problem, that is a change to 0069, recorded there.
- A second reviewer for `design.md`. The loop reviews the plan; the design already has `@ux-agent` in critique mode inside the plan leg.
- Cross-subfeature consistency. That is a different job with a different agent, in T4.

## Injection Surface (read before editing)

`/add.plan` carries five injection points. One of them sits exactly where 0069 tells the builder to edit; two more are near an edit that turns out to be safe once you look at the line numbers.

| Point | Line | Anchor candidates | 0069 touches it? |
|---|---|---|---|
| `feature:qa-pipeline:step-list` | L57 | L56 / L61 | Near — 0069 edits the same block, but below both anchors. Safe, see below |
| `feature:tdd-pipeline:step-list` | L59 | L56 / L61 | Near — same block, same conclusion |
| `plugin:gitnexus:graph-plan` | L198 | L196 / L201 | No |
| `feature:tdd-pipeline:step9` | L494 | L492 / L499 | No |
| **`feature:qa-pipeline:qa-spec`** | **L500** | **L499 (`## STEP 10: …`) / L503 (`**QA axis self-check:**…`)** | **Yes — directly** |

**The collision.** Plan 0069 says: *"retarget every in-file 'STEP 13 completion' pointer (including the QA axis self-check at ~line 503) to STEP 14."* Line 503 is the first text line below the `qa-pipeline:qa-spec` marker pair, which makes it either that marker's anchor or its drift hint. Rewriting it is exactly the edit that breaks the anchor, and 0069 was written without this analysis.

**Amendment to F20 (mandatory).** Before editing L503:

1. Run the build and read `framwork/.codeadd/injection-points.json`. Find the entry for `qa-pipeline:qa-spec` and read its `anchor.text`, `anchor.position` and `anchor.next`.
2. If L503 is the `anchor.text`: do not edit it. Add the STEP 14 pointer as a new line elsewhere in the self-check paragraph, leaving the anchor line byte-identical.
3. If L503 is only the `next` drift hint: the edit is allowed, but the build must run immediately after and the injection total must be unchanged.
4. If L503 is **neither** the `anchor.text` nor the `next` hint — the anchor resolved to L499 and `next` points elsewhere — the edit is allowed; still rebuild immediately and confirm the injection total is unchanged.
5. Record which of the three cases it was, in the evidence file, naming the sidecar entry that decided it.

**The STEPS IN ORDER block (L50–L64) is safe, and here is why.** The two marker pairs sit at L57–58 and L59–60, between `  - 8.4: Frontend Specialist` (L56) and `STEP 10: Consolidate plan …` (L61) — the only two anchor candidates. 0069's edit here adds a `STEP 13: Plan Review` row and renumbers `STEP 13: Completion` to `STEP 14`, both of which live at **L63–L64, below L61**. **The edit is confined to the rows below L61 and must never touch L56 or L61.** No anchor read is required, provided that confinement holds — and L2.1 checks it did.

The fragments inject their own rows into this block (`tdd-pipeline/add.plan.md` supplies STEP 9, `qa-pipeline/add.plan.md` supplies STEP 10.0), landing between L56 and L61. Adding a row below L61 does not disturb them.

**Hard constraint.** 0069 renumbers `/add.plan` STEP 13 → 14. `qa-pipeline/add.plan.md` defines STEP 10.0 and `tdd-pipeline/add.plan.md` defines STEP 9 — both below 13, so neither fragment's text goes stale. **This has to be re-verified, not assumed**, because nothing in the build checks fragment step references.

## Validated Decisions (T3)

| Question | Decision | Rationale |
|---|---|---|
| Adopt 0069 or write a new reviewer | Adopt as written | It is a finished plan that already argues why `@doc-reviewer-agent` and `@reviewer-agent` are the wrong tools. Rewriting it would duplicate a decision already taken |
| Who dispatches in the loop | The loop itself, in the plan leg | The loop dispatches agent rosters and never calls a command. Wiring only `/add.plan` STEP 13 would leave the loop unreviewed |
| `blocked` inside the loop | BLOCKED exit for that subfeature | A plan the reviewer refuses is not a plan to build from, and the loop has no human to ask |
| Where required fixes come from | The Decision Log | Same rule the plan leg already uses for clarification questions — this is what keeps the loop autonomous |
| 0069's L503 instruction | Amended, not followed blindly | It predates the anchor map and would break `qa-pipeline:qa-spec` |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|---|---|---|
| **0069's L503 edit breaks the `qa-spec` anchor** | **High if followed as written** | The mandatory amendment above + L2.1 |
| The STEPS IN ORDER edit drifts above L61 and breaks a marker at L57/L59 | Low | The confinement rule (edit only below L61, never touch L56 or L61) + L2.1 |
| The renumber leaves a fragment pointing at the wrong step | Medium | L2.3 — manual grep of both `add.plan` fragments, recorded |
| The loop's reviewer dispatch loops forever on `fix-then-ok` | Low | 0069's contract already caps it at one re-dispatch; F21 does not relax it |
| 0069's assumptions have gone stale since it was drafted | Medium | L1.1–L1.4 check its Scope list, its two contract sections and its six-step command loop item by item — 0069 has no matrix of its own to re-run |

## Ecosystem Impact

| Component | Necessary action | F |
|---|---|---|
| Plan 0069's full file set (9 files: agent, skill, provider-map, `add.plan`, `add.new`, `add.brainstorm`, `add-ecosystem`, `add-doc-reviewer`, `add-doc-schemas`) | Executed as written, with the L503 amendment | F20 |
| `framwork/.codeadd/commands/add.plan-to-ready.md` | Plan leg dispatches `@plan-reviewer-agent` per subfeature | F21 |
| `framwork/.codeadd/skills/add-ecosystem/SKILL.md` | Loop listed as a dispatcher | F22 |

---

## Red-Green Validation Matrix (T3)

**RED first**, against the post-C2 tree.

### L1 — 0069 delivered

**0069 has no Red-Green matrix.** It predates that template requirement — its sections stop at `## References`. So there is nothing to "run in full", and this topic checks it against what 0069 actually specifies instead.

1. **Every file in 0069's Scope > Includes (L38–L47) exists and matches its stated change.** Nine files: the agent, the skill, `provider-map.json`, `add.plan`, `add.new`, `add.brainstorm`, `add-ecosystem`, `add-doc-reviewer`, `add-doc-schemas`. *RED: none of them carry the change.*
2. **The skill matches 0069's `### Skill add-plan-review` contract (L111–L127)** — its declared dimensions and shape, checked item by item against that section.
3. **The agent matches 0069's `### Agent plan-reviewer-agent` contract (L128–L142)** — frontmatter fields, read-only flag, and the verdict shape.
4. **The six-step command loop (0069 L143–L152) is present in each of the three commands it names**, including step 5's re-run of that document's schema gate after an applied fix, and the `add.plan`-only rule that UX/area subagents are never re-dispatched to satisfy a finding.
5. `@plan-reviewer-agent` and `add-plan-review` are registered in `provider-map.json` and build to every provider that takes agents. *RED: neither exists.*
6. **`add-ecosystem/SKILL.md` lists `/add.plan-to-ready` as a dispatcher of `@plan-reviewer-agent`,** alongside `add.plan`, `add.new` and `add.brainstorm`. *This is the only check covering F22.*

### L2 — Injection integrity (this topic's own risk)

1. **Build immediately after the `/add.plan` edits.** Injection total equals the umbrella's L0.1 baseline, and `qa-pipeline:qa-spec`, `tdd-pipeline:step9`, and both `step-list` markers still resolve.
2. Enable/disable round-trip for `tdd-pipeline` and `qa-pipeline` on a fresh install from the post-T3 build: files come back byte-identical.
3. **Fragment step references re-verified by hand.** Grep `STEP N` in `tdd-pipeline/add.plan.md` and `qa-pipeline/add.plan.md`; confirm each still names the step it meant after the renumber. Recorded in the evidence file.
4. The anchor case for L503 (anchor vs drift hint) is recorded, with the sidecar entry that decided it.

### L3 — Loop integration

1. The loop's plan leg dispatches `@plan-reviewer-agent` after consolidating a subfeature's `plan.md`. *RED: no dispatch exists.*
2. `ok` → the leg proceeds. `fix-then-ok` → fixes applied, one re-dispatch, then proceed. `blocked` → BLOCKED exit naming the subfeature and the blockers.
3. Blockers still standing after the single re-dispatch produce BLOCKED, not a warning and not CONVERGED.
4. The loop never stops to ask the user during the reviewer exchange.
5. On an engine without the named agent, the inline fallback 0069 defines is used and the verdict contract still holds.

**RED expectations:** L1 entirely; L2.1 has no baseline to compare against until the umbrella's L0.1 exists; L3 entirely. **GREEN = all levels pass after F20–F22.**

---

## Reviewer Handoff

Beyond the umbrella's list:

1. **Were L1.1–L1.4 checked item by item, or waved through as “0069 done”?** 0069 has no validation matrix of its own — these four levels are the only proof it landed correctly.
2. **Which of the three cases was L503 — anchor, drift hint, or neither?** The evidence must name it and show the sidecar entry. "The build passed" is not an answer; a broken anchor can still build if the total happens to match.
3. **Were fragment step references checked by hand after the renumber?** Nothing automates it.
4. **Does the loop's dispatch honour the one-re-dispatch cap,** or has it grown a retry loop?
5. **Is `blocked` a real exit** in the loop, or has it been softened into a finding routed to the next iteration?

## Next Steps

This topic is built as part of the 0074 set; the full invocation order is in the umbrella's Next Steps. T3 is the third build and ends at checkpoint **C3**. It requires **C2**. Plan 0069 is executed **inside this build** via F20, never as its own `/add-framework--build` invocation — building it standalone would follow its unamended L503 instruction and break an injection anchor.

## References

- `docs/plans/0069-PLAN--pre-delivery-plan-reviewer-agent.md` — the plan adopted whole, including its file list at L38–L46 and its verdict contract.
- `framwork/.codeadd/commands/add.plan.md:492-505` — the two marker pairs and the line 0069 tells the builder to edit.
- `framwork/.codeadd/commands/add.plan.md:56-61` — the STEPS IN ORDER block, its two back-to-back markers, and the rows below L61 that 0069 actually edits.
- `framwork/.codeadd/commands/add.plan-to-ready.md` STEP 3 — the plan leg F21 extends.
- Umbrella §Risks — the injection-anchor risk this topic hits hardest per line of change.

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-27 | Initial creation |
| 2026-08-27 | Review v01: L1 rewritten — 0069 has no validation matrix, so T3 checks its Scope, contracts and command loop instead (B1). Third branch added to the L503 procedure (A1). STEPS IN ORDER shown safe, edit confined below L61 (A2). F22 now covered by L1.6 (A3). Schema-gate re-run named as new behaviour in F21 (A4). Marker-pair wording (N1) |
| 2026-08-29 | Implemented at C3 (54cbe9b). The agent shipped to Claude without a tool restriction (readonly is dropped by that dialect); fixed in fd36dfc. Status -> implemented |
