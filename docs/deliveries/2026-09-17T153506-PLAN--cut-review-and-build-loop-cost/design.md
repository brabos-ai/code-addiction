# Brainstorm: Cut Review and Build Loop Cost

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-17
> **Type:** architecture

## Objective

Cut the token cost that review and build burn today in both layers (internal and product), without
breaking the existing "review runs exactly once" rule:

1. The agent that reviews confirms each finding before a fix is dispatched for it, closing the loop
   where a fix + re-review pair gets spent on something that was never a real problem.
2. Review dispatch becomes a fixed, deliberate budget instead of scaling automatically with area or
   file count.
3. The build/TDD loop stops treating an inherited CI-tier suite as a local gate to chase to green,
   using the project's own wiki as the source of truth for what runs where.

## Discovery

- `internal/skill/add-review-discipline` — owns "review runs once, no verdict file" (delivered
  2026-09-09, plan `review-no-loops`). This design works *within* that rule on all three subtopics; it
  does not renegotiate it.
- `internal/agent/prompt-review-agent` — already has the closest existing precedent: a full tick once,
  then a narrow `confirm` pass scoped to the cited items, never a third pass (delivered 2026-09-10,
  plan `prompt-quality-ruler`).
- `product/agent/reviewer-agent` — already has `MODE: re-review`, scoped to the fix diff, verdicting
  each open finding `ADDRESSED`/`NOT ADDRESSED`, capped by `MAX_ATTEMPTS = 3`
  (`add-subagent-driven-development`). This catches a bad **fix**; nothing today catches a bad
  **finding** before the fix is spent.
- `internal/skill/add-framework--build` STEP 7 dispatches **"3 + N"** auditors — 3 fixed scopes plus
  one `@prompt-review-agent` call per `.md` artefact touched. `N` has no ceiling.
- `product/command/add.review` caps at 2 dispatches today (`@reviewer-agent` frontend + backend); no
  security-specific reviewer exists — security lives inside each area reviewer's checklist.
- `product/skill/add-tdd` requires the existing suite green with no distinction between a regression
  the current task caused and a suite the task inherited already broken.
- `add-subagent-driven-development`'s `MAX_ATTEMPTS = 3` breaker explicitly excludes a red build: "a
  red build is not a finding, and the breaker does not cover it" — it reports and stops, but nothing
  routes a CI-tier suite away from the interactive session in the first place.
- `add-architecture-discovery`'s spine analyzer already generates `wiki/workflows.md` with a Test
  Workflow section (unit vs. integration vs. e2e, discovered from `.github/workflows/*.yml`). The gap
  is consumption, not generation: `add.plan` does not consult it when authoring a task's `Verify:`
  line, and `add.build` only inherits whatever pages `add.plan` selected.
- Confirmed with the user: divergence between internal and product `add-review-discipline` is
  intentional and stays untouched by this design.

## Context & Motivation

The user runs this framework both to develop it (internal layer) and to build downstream products
(product layer — concretely, a Cloudflare Worker / Telegram bot project using `workerd` and D1). Both
sides are burning too much token on review, for two different reasons: **looping** (paying for a fix
and a re-review on a finding that was never real) and **over-dispatch** (specialist agents fired
regardless of whether the change touches their area). A third, related incident surfaced mid-session:
`/add.build` looped rewriting six inherited `workerd` test suites because the task's own `Verify:` line
pointed at the whole CI-tier suite, and nothing in `add-tdd`/`add.build` distinguished "red I caused"
from "red I inherited" — even though the project's own generated wiki already documents which tests
run where.

## Problem / Opportunity

- **P1 — False findings still cost a full fix + re-review cycle.** `reviewer-agent`'s `re-review` mode
  verifies the *fix*; nothing verifies the *finding* before the fix is dispatched.
- **P2 — Review dispatch scales with area/file count, not with what the diff needs.** Internal build's
  "3 + N" has no ceiling; product's roster is fixed at 2 today but has no rule stopping an added
  OWASP-focused `reviewer-agent` mode from becoming unconditional and permanent.
- **P3 — The TDD/build loop has no tier awareness.** `add-tdd`'s "no regressions" rule and the review
  fix loop's `MAX_ATTEMPTS` both assume a red test is something the current task should chase to green;
  neither distinguishes a CI-tier suite (owned by `.github/workflows/*.yml`, sharded, environment-
  dependent) from a local unit test — even though `wiki/workflows.md` already records the split.

## Proposed Solution

**High-level approach:** extend the pattern this repository already proved once
(`prompt-review-agent`'s scoped `confirm` pass, never a third round) to the two places that don't have
it yet, instead of inventing a new generic verification layer.

**Alternatives considered:**

| Option | Description | Verdict |
|---|---|---|
| A. Dedicated verify-dispatch after every review | Mirrors Claude Code's own `/code-review` Review→Verify pipeline: a separate agent adversarially confirms each finding | Rejected as default — guarantees one more dispatch per review, working against the token-count goal. Kept as an **escalation path** for findings the reviewing agent cannot self-verify (e.g. runtime reachability) |
| B. In-agent self-verification | The same agent that found the issue states confidence/evidence per finding before returning it — zero extra dispatch in the common case | **Chosen as default** |
| C. Leave dispatch roster fully dynamic (status quo) | Agent decides at runtime which specialists to call | Rejected — this is the unbounded-N problem itself. Replaced with a **fixed roster + explicit trigger conditions** |

**Recommended:** B, plus a fixed/conditional reviewer roster per layer, plus wiki-sourced test-tier
routing — all three riding the same proven shape (scoped, bounded, no third pass) rather than three
different mechanisms.

## Type of Artefact

architecture (cross-cutting change to existing skills and commands in both layers; no new artefact)

## Scope

### Includes

- In-agent false-positive confirmation before fix, for review in both layers (code and doc review)
- Internal layer: "3 + N" → "3 fixed + 1 batched" `@prompt-review-agent` call
- Product layer: OWASP reviewer becomes conditional on touched area, not default
- Test-tier awareness (local / CI / manual), sourced from `wiki/workflows.md`, wired into `add.plan`'s
  `Verify:` authoring and `add.build`/`add-tdd`'s execution
- `MAX_ATTEMPTS`-style cap kept as the remaining safety net for genuine local-tier loops

### Does NOT Include

- Changing "review runs exactly once, no verdict file" itself — this design works inside that rule
- Merging internal and product `add-review-discipline` — the divergence is intentional and stays
- Wiki generation logic (`add-architecture-discovery` / `add.wiki`) — `workflows.md`'s Test Workflow
  section already captures what's needed; this design only wires consumption
- Changing `MAX_ATTEMPTS = 3` for review findings, or the Breaker's "a red build is not a finding" rule
  — subtopic 3 extends coverage to a case that rule already excludes, it does not reword it

## Key Decisions

| Decision | Serves | Rationale | Validated |
|----------|--------|-----------|-----------|
| False-positive check stays inside the same reviewing agent by default; a separate dispatch only when the finding needs independent verification the reviewer cannot do itself | P1 | Zero extra dispatch in the common case; matches Claude Code's own Review→Verify pattern only where self-verification cannot reach | ✅ |
| Internal layer's per-`.md` `@prompt-review-agent` dispatch consolidates into one batched call covering every touched artefact | P2 | Removes N's unbounded scaling; precedent already set by `plan-review-agent-speed` ("one shell call replaces per-path checks") | ✅ |
| Product layer's OWASP-focused `reviewer-agent` mode is conditional, triggered by touched area (auth, payment, upload, unsanitized input, session/token) | P2 | Avoids reintroducing the cost a 3rd unconditional dispatch would add back; security already lives in each area checklist for the common case | ✅ |
| `add.plan` consults `wiki/workflows.md`'s Test Workflow section when authoring a task's `Verify:` line | P3 | The classification already exists in the wiki; this closes the consumption gap instead of duplicating the source | ✅ |
| `add.build`/`add-tdd` never chase a CI-tier suite to green inside the interactive session — only the single file the task touched runs locally | P3 | CI (`.github/workflows/*.yml`) already owns this; local-tier is the only budget the build session should spend | ✅ |
| `MAX_ATTEMPTS`-style cap remains as the safety net for local-tier loops, but is no longer the primary defense against the CI-tier case | P3 | Routing prevents most cases; the cap still covers whatever local-tier work genuinely loops | ✅ |

## Ecosystem Impact

| Component | Layer | Called by (direct, depth 1) | Impact | Action |
|-----------|-------|------------------------------|--------|--------|
| `add-review-discipline` | internal | `add-framework--brainstorm`, `add-framework--build`, `add-framework--plan`, `add-plan-authoring` | Owns the rule this design works inside of | Extend guidance, keep the once-only rule |
| `prompt-review-agent` | internal | `add-framework--build`, `add-framework--plan`, `add-review-discipline` | Gains a batched multi-artefact input mode | Add batched mode alongside existing single-artefact mode |
| `add-framework--build` | internal | `add-framework--done`, `add-framework--plan` (hands off), `building-commands` | STEP 7 dispatch count changes | Change "1 per `.md`" to "1 batched" |
| `add-review-discipline` | product | `add.build`, `add.new`, `add.plan` | Roster/trigger guidance changes | Document fixed roster + OWASP trigger |
| `reviewer-agent` | product | `add.build`, `add.review`, `add-subagent-driven-development`, `add-plan-review`, `add-cross-sf-consistency`, `add-review-discipline`, `consistency-agent`, `plan-reviewer-agent`, gitnexus plugin fragment | Gains self-verification step and a conditional OWASP-focused mode | Add confidence/evidence per finding; add conditional mode |
| `add.review` | product | `add`, `add.build`, `add.done`, `add.plan`, `add.qa-setup`, `consistency-agent`, `e2e-agent`, `qa-agent`, `ux-agent`, `add-delivery-validation`, `add-id-convention`, `add-qa`, `add-qa-migration`, qa-pipeline/tdd-pipeline/playwright fragments | Dispatch strategy gains the OWASP trigger condition | Update STEP 4 dispatch strategy |
| `add-tdd` | product | `tdd-pipeline` fragments (`add.build`, `add.hotfix`), `add-test-specification` | GREEN step gains tier awareness | Add local/CI/manual distinction to the cycle |
| `add.build` | product | `add`, `add.done`, `add.new`, `add.plan`, `add.review`, `add.qa-setup`, `consistency-agent`, `ux-agent`, `add-architecture-discovery`, `add-code-review`, `add-commit`, `add-cross-sf-consistency`, `add-id-convention`, `add-qa`, `add-qa-migration`, `add-review-discipline`, qa-pipeline/tdd-pipeline/gitnexus fragments | Inherits tier info instead of guessing | Consume the page `add.plan` selects; no new SELECT logic |
| `add-subagent-driven-development` | product | `add.audit`, `add.build`, `add.diagnose`, `add.hotfix`, `add.new`, `add.plan`, `add.qa-setup`, `add.review`, `add.wiki`, `add-qa-migration`, `add-review-discipline` | `MAX_ATTEMPTS` scope note only (build-gate red vs. CI-tier red clarified) | Clarify, do not change the cap itself |
| `add-tasks-checklist` | product | `add.build`, `add.plan`, `add.review`, `add-doc-schemas`, `add-subagent-driven-development` | `Verify:` authoring rule changes | Forbid a whole CI-tier suite command as a task's `Verify:` line |
| `add.plan` | product | `add`, `add.build`, `add.diagnose`, `add.new`, `add.review`, `consistency-agent`, `test-agent`, `ux-agent`, `ux-flow-agent`, `add-architecture-discovery`, `add-cross-sf-consistency`, `add-delivery-validation`, `add-doc-schemas`, `add-id-convention`, `add-plan-review`, `add-qa-migration`, `add-review-discipline`, qa-pipeline/tdd-pipeline/gitnexus fragments | Gains a wiki lookup step before writing `Verify:` lines | Add `wiki/workflows.md` consult at TDD/Verify authoring |
| `add-knowledge-discovery` | product | `add.brainstorm`, `add.diagnose`, `add.hotfix`, `add.new`, `add.plan`, `add.review`, `conformance-agent`, `add-feature-discovery` | Already covers SELECT for `workflows.md`; no change, cited as the existing mechanism | None — reuse as-is |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Fewer wasted fix + re-review cycles on findings that were never real | Slightly heavier per-dispatch reasoning where self-verification adds to the same call (still cheaper than a second dispatch) |
| Bounded audit dispatch count in internal builds regardless of file count | A batched multi-artefact call needs a fallback rule for very large builds (15+ `.md` files) — deferred to subtopic 1/2 refinement |
| No more attempts to turn a CI-tier suite green inside an interactive build session | Test-tier routing depends on `wiki/workflows.md` existing and being fresh — a wiki-less or stale project falls back to today's guess |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Self-verification catches its own bad finding as good (an agent convinced of a wrong finding won't flag itself) | Med | Keep the escalation path (Option A) available for findings that need independent verification; treat a pattern of wrongly-confirmed findings as a signal to revisit at subtopic-1 refinement |
| Batched `@prompt-review-agent` call exceeds context on very large internal builds | Low/Med | Flagged now, deferred to subtopic-1 refinement for an explicit fallback (e.g. split into 2 batches past a file-count threshold) |
| Wiki-informed tiering has no source (no wiki, or a stale `workflows.md`) | Med | Reuse `add-knowledge-discovery`'s existing PRESENCE/FRESHNESS steps — no new fallback mechanism needed |
| The five-item OWASP trigger list (auth, payment, upload, unsanitized input, session/token) misses a security-relevant area outside it (e.g. encryption, SSRF, deserialization, path traversal), so that change gets only the baseline per-area checklist, never the dedicated OWASP-focused pass | Med | Flagged now, deferred to subtopic-2 refinement for the final trigger list — same "flag now, close at refinement" treatment already used for the batching risk above |
| `wiki/workflows.md` exists and is fresh but carries no Test Workflow section — `add-architecture-discovery` explicitly allows skipping it, and a project with no `.github/workflows/*` gets no section at all | Med | Falls back to the same guess-based behavior already named for the no-wiki case; PRESENCE/FRESHNESS confirm the page exists and is current, not that every section is populated |

## Decomposition Map

| Subtopic | Design Path | Serves the objective by | Purpose |
|----------|-------------|--------------------------|---------|
| Review confirms before fix | `2026-09-17T150746-cut-review-and-build-loop-cost-001-review-confirm-before-fix.md` | eliminates the unnecessary-fix loop while keeping review-runs-once intact | Defines how each reviewer self-verifies per finding before a fix, and when to escalate to a separate verify dispatch |
| Subagent dispatch pruning | `2026-09-17T150746-cut-review-and-build-loop-cost-002-subagent-dispatch-pruning.md` | cuts the fixed cost per review, both in internal "3 + N" and the product roster | Fixes the reviewer budget per layer: internal 3 fixed + 1 batched; product 2 fixed + OWASP conditional |
| Build/TDD test-tier cap | `2026-09-17T150746-cut-review-and-build-loop-cost-003-build-tdd-test-tier-cap.md` | closes the bottomless-pit loop on inherited CI-tier suites | Teaches `add.plan`/`add.build` to classify local/CI/manual via `wiki/workflows.md`, and never chase CI-tier locally |

## Dependencies & Relationships

Subtopics 1 and 2 both touch `add-review-discipline` (both layers) and are cheapest to refine in
sequence — 1 first, since 2's fixed roster assumes 1's per-finding self-verification shape is already
settled. Subtopic 3 touches a disjoint set of artefacts (`add-tdd`, `add.build`,
`add-tasks-checklist`, `add.plan`, `add-knowledge-discovery`) and can be refined independently,
including in parallel with 1 and 2.

## Next Steps

Run: `/add-framework--plan cut review and build loop cost`
