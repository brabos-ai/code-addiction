# Plan: Cut Review and Build Loop Cost — bound review dispatch, verify findings before fixing them, and route tests by tier

> **Status:** implemented
> **Layers:** both
> **Type:** architecture
> **Created:** 2026-09-17
> **Delivery:** automatic

---

## Objective

Cut the token cost that review and build burn today in both layers (internal and product), staying
inside each layer's own dispatch-count rule: the internal layer's "the adversarial reviewer runs
exactly once per subject... there is no second review pass" (`.claude/skills/add-review-discipline`,
"The Counts" — governs T2/F3-F4), and the product layer's "one dispatch, plus at most one re-dispatch,
legal only after apply → re-gate" plus `reviewer-agent`'s existing `MODE: re-review`, capped by
`MAX_ATTEMPTS = 3` (`framwork/.codeadd/skills/add-review-discipline`, "The Counts, and What Makes a
Second Dispatch Legal" — governs T1/F1-F2, which adds a confirm-before-fix step *inside* that rule,
never a second full review):

1. The agent that reviews confirms each finding before a fix is dispatched for it, closing the loop
   where a fix + re-review pair gets spent on something that was never a real problem.
2. Review dispatch becomes a fixed, deliberate budget instead of scaling automatically with area or
   file count.
3. The build/TDD loop stops treating an inherited CI-tier suite as a local gate to chase to green,
   using the project's own wiki as the source of truth for what runs where.

**When this build is done:** a product-layer code review will route each finding by confidence before
spending a fix dispatch on it; an internal build's quality audit will cost one batched call instead of
one per touched file; a product review will add a security-focused pass only when the diff actually
touches a sensitive area; and a build session will never attempt to turn a CI-tier suite green inside
itself — only the file the current task touched runs locally, and the wiki says which is which.

## Context

The user runs this framework both to develop it (internal layer) and to build downstream products
(product layer). Both sides were burning too much token on review — looping on false findings, and
dispatching specialists regardless of whether the change touches their area — and a live incident
showed a third, related cost: `/add.build` looped rewriting six inherited `workerd` test suites because
nothing routed "this suite belongs in CI" information into the build session, even though the project's
own generated wiki already documents which tests run where.

**Every decision here was taken and reviewed in the documents below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-17T150746-cut-review-and-build-loop-cost-000-umbrella.md` | The three-subtopic decomposition, the alternatives considered and rejected, the Key Decisions table, and the full Ecosystem Impact map this plan narrows against direct file reads |
| `docs/brainstorming/2026-09-17T150746-cut-review-and-build-loop-cost-intent.md` | The closed decisions carried into this plan verbatim, and the approval mode (`automatic`) |

## Global Constraints

- The adversarial reviewer runs exactly once per subject; there is no second review pass (`.claude/skills/add-review-discipline/SKILL.md`, "The Counts") — F3/F4's batching changes HOW MANY CALLS deliver that one pass, never the count of passes per artefact
- `MAX_ATTEMPTS = 3` for the review fix loop is unchanged (`framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` L415) — F2 adds a routing axis, not a new cap
- Internal and product `add-review-discipline` stay divergent — no merge, no byte-identity check (`.claude/skills/add-review-discipline/SKILL.md`, header comment)
- `mcp/` is product layer despite sitting at the repository root (CLAUDE.md, Project Anatomy) — not touched by this plan, stated because two F-blocks sit at a root-adjacent path (`framwork/`) that could be misread otherwise

## Problem

1. **A false finding still costs a full fix + re-review cycle** — `reviewer-agent`'s `re-review` mode
   verifies the fix; nothing verifies the finding before the fix is dispatched for it.
2. **Review dispatch scales with area/file count, not with what the diff needs** — internal build's
   quality audit is "3 fixed + one `@prompt-review-agent` call per `.md` file touched", with no ceiling
   on the file count; product's roster has no conditional security-focused pass, so adding one the
   naive way (a permanent third dispatch) would reintroduce the cost this plan cuts elsewhere.
3. **The TDD/build loop has no tier awareness** — `add-tdd`'s "no regressions" rule and the tdd-pipeline
   fragment's `TEST_COMMAND` gate both treat every red test as something the current build session
   should chase to green, with no distinction between a CI-tier suite (owned by `.github/workflows/*`)
   and a local unit test — even though `wiki/workflows.md`'s Test Workflow section already records the
   split, and the architect subagent that writes `Verify:` lines never reads it.

## Proposal

Extend the pattern this repository already proved once (`prompt-review-agent`'s scoped `confirm` pass:
bounded, never a third round) to the two places that do not have it yet, instead of inventing a new
generic verification layer. Three independent groups of F-blocks, each closing one subtopic:

- **T1 — Review confirms before fix** (F1-F2, product only): `reviewer-agent` gains a per-finding
  `Confidence` field; the fix loop routes on it.
- **T2 — Subagent dispatch pruning** (F3-F6, internal + product): `prompt-review-agent` gains a batched
  multi-artefact input, closing the internal "N per file" gap; `reviewer-agent` gains a conditional
  `MODE: owasp`, dispatched by `add.review` only when the diff touches a sensitive area.
- **T3 — Build/TDD test-tier cap** (F7-F9, product only): the architect subagent that writes `Verify:`
  lines reads `wiki/workflows.md` first; the tdd-pipeline fragment and `add-tdd` stop chasing a
  CI-tier suite to green inside the interactive session.

## Scope

### Includes

#### T1 — Review confirms before fix (ref: design `## Key Decisions` row 1)

- **F1** [product] — `framwork/.codeadd/agents/reviewer-agent.md`: `MODE: task` Report Format gains a
  `Confidence: confirmed | needs-verification` field per finding, with the criterion for
  `needs-verification` (the reviewer cannot confirm the finding from a static read alone — e.g. a
  reachability or runtime-behavior claim). Does not touch `Re-Review Mode` — that mode already verifies
  the fix, not the finding.
  - **Produces:** `reviewer-agent` finding rows carry `Confidence: confirmed|needs-verification`
- **F2** [product] — `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` §7 "Fix Loop,
  Escalation and the Scoped Re-Review": routing gains a confidence axis alongside the existing severity
  one — a `needs-verification` finding gets one scoped confirm dispatch to `@reviewer-agent` before
  `@fix-agent` is dispatched for it; a `confirmed` finding goes straight to fix, unchanged from today.
  - **Consumes:** `Confidence` field (F1)

#### T2 — Subagent dispatch pruning (ref: design `## Key Decisions` rows 2-3)

- **F3** [internal] — `.claude/agents/prompt-review-agent.md`: Input Contract gains a batched form —
  accept a list of artefact ids in one dispatch (alongside the existing single-`node` form), running
  Phases 1-4 per artefact and returning one report block per artefact in the same reply. Does not
  change `confirm` mode's narrow scope or the two-pass-per-artefact count.
  - **Produces:** `prompt-review-agent` accepts a batched list of artefact ids and returns one report
    per artefact in one call
- **F4** [internal] — `.claude/skills/add-framework--build/SKILL.md` STEP 7.1, scope 4 (Quality):
  dispatch changes from "one `@prompt-review-agent` call per `.md` artefact touched" to "one batched
  call covering every touched artefact in this build's diff". `N` in "3 + N" becomes a constant 1.
  - **Consumes:** `prompt-review-agent` accepts a batched list of artefact ids and returns one report
    per artefact in one call (F3)
- **F5** [product] — `framwork/.codeadd/agents/reviewer-agent.md`: `Input: MODE` table gains a third
  value, `MODE: owasp` — a security-only pass against the OWASP Top 10, scoped to the touched files,
  dispatched only when triggered (never by default).
  - **Produces:** `reviewer-agent` accepts `MODE: owasp`
- **F6** [product] — `framwork/.codeadd/commands/add.review.md`: STEP 4.1 "Detect Scope" gains an
  OWASP trigger — the diff touches auth, payment, upload, unsanitized input, or session/token paths;
  STEP 4.2 "Dispatch Strategy" adds the conditional third dispatch, in parallel with frontend/backend
  when it fires; the "### Agent Roster" table between them gains a third row, `@reviewer-agent
  (owasp)`, since that table is load-bearing for an orchestrator dispatching directly. The backend
  reviewer's existing "Security (OWASP)" checklist line (L538) is **not removed or narrowed** — accept
  the overlap as intentional double coverage on sensitive-area diffs only, never on every diff (see
  Risk row below).
  - **Consumes:** `MODE: owasp` (F5)

#### T4 — Per-task review is narrower than `/add.review` (added post-STEP-7, same delivery)

- **F10** [product] — `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md`, step 5
  "Review Subagent's Work": drops `add-code-review`'s ten-category audit from the per-task dispatch —
  it duplicated `/add.review`'s own end-of-feature depth on nearly every category. The per-task
  dispatch now checks only the task's own `Consumes`/`Produces` contract, the wiki's documented
  conventions for the task's area (when `WIKI:present`), and a named "sniff test" for anything
  specific and obvious — never a category-by-category audit. `SCORE` (never consumed downstream) is
  dropped with it. Not in the original plan; added from a follow-up conversation after PR #75 was
  already open, confirmed with the user before implementing (see ledger).

#### T3 — Build/TDD test-tier cap (ref: design `## Key Decisions` rows 4-6)

- **F7** [product] — `framwork/.codeadd/skills/add-tasks-checklist/SKILL.md`, "Architect Subagent
  Prompt Template": `## CONTEXT` gains a read of `{{addpath:wiki/workflows.md}}` (its Test Workflow
  section) when the wiki is present; `## RULES` gains a tier-classification rule — a task whose `Files`
  include a CI-tier test spec writes a `Verify:` line scoped to that single file, never the whole suite
  command. Silent no-op when the wiki, or its Test Workflow section, is absent (falls back to today's
  behavior — see design `## Trade-offs & Risks`).
  - **Produces:** `tasks.md` `Verify:` lines never name a whole CI-tier suite command for a task whose
    scope is a single file
- **F8** [product] — `framwork/.codeadd/fragments/tdd-pipeline/add.build.md`, sections `gate`,
  `verification`, `awareness`: the "run existing tests" / `TEST_COMMAND` gate becomes tier-aware —
  local-tier commands still run wholesale, as today; a task whose `Verify:` line is CI-tier-scoped (F7)
  runs only that line, never the project's full `TEST_COMMAND`, inside the interactive session.
  - **Consumes:** `tasks.md` `Verify:` lines never name a whole CI-tier suite command for a task whose
    scope is a single file (F7)
- **F9** [product] — `framwork/.codeadd/skills/add-tdd/SKILL.md`, GREEN step: "Run the existing suite.
  No regressions" gains a one-line tier caveat — a CI-tier suite is CI's job; the cycle re-runs only
  the file(s) the current task's `Verify:` line names. **Inert wherever no `Verify:` line exists** —
  `add-tdd` is also used by `fragments/tdd-pipeline/add.hotfix.md`, which has no `tasks.md` and no
  `Verify:` concept at all; GREEN there keeps running "the existing suite" exactly as today.
  - **Consumes:** `tasks.md` `Verify:` lines never name a whole CI-tier suite command for a task whose
    scope is a single file (F7)

### Does NOT Include (important!)

- Changing "review runs exactly once, no verdict file" (internal) — this plan works inside that rule
- Merging internal and product `add-review-discipline` — confirmed divergent, on purpose (design
  `## Discovery`)
- Any edit to `add-review-discipline` (either layer), `add.plan.md`, or `add-subagent-driven-development`'s
  Breaker section (§8) — investigated during STEP 1-3 of this plan and found already sufficient: the
  internal layer's "coordinator judges each finding before applying it" rule already gives it the
  safeguard T1 adds to the product layer's fix-loop, and the Breaker's "a red build is not a finding"
  wording does not need to change — T3 prevents most CI-tier reds from reaching it in the first place
- Wiki generation logic (`add-architecture-discovery` / `add.wiki`) — `workflows.md`'s Test Workflow
  section already captures what F7 needs; this plan only wires consumption
- Changing `MAX_ATTEMPTS = 3` itself, or adding a new cap — F2 adds a routing axis on top of the
  existing cap, not a second cap
- Finalizing the OWASP trigger's path list, or a fallback for a batched `@prompt-review-agent` call
  that exceeds context on a very large build — both are named risks below with a default the build
  implements; either can be revisited later without touching this plan's other F-blocks

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where does false-positive checking live? | Inside the same reviewing agent by default; a separate dispatch only when the finding needs independent verification | Zero extra dispatch in the common case (design `## Proposed Solution`, Option B) |
| Does the internal layer need a T1 change? | No | It already judges every finding before applying it (`add-review-discipline`, "What the Caller Owes the Report") — investigated at this plan's STEP 1-3, narrower than the design's Ecosystem Impact table |
| How does internal "3 + N" get capped? | One batched `@prompt-review-agent` call replaces N per-file calls | Precedent: `plan-review-agent-speed` ("one shell call replaces per-path checks") |
| When does the OWASP pass fire? | Conditional on touched area (auth, payment, upload, unsanitized input, session/token), never by default | Avoids reintroducing the cost of a permanent third dispatch (design `## Key Decisions` row 3) |
| Where does test-tier info come from? | `wiki/workflows.md`'s existing Test Workflow section, read by the architect subagent at `Verify:`-authoring time | Already generated by `add-architecture-discovery`; this plan wires consumption only (design `## Discovery`) |
| Does `MAX_ATTEMPTS` change? | No — T3 routes CI-tier suites away from the interactive session; the cap remains the safety net for whatever local-tier work genuinely loops | Design `## Scope` → Does NOT Include |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Fewer wasted fix + re-review cycles on findings that were never real | Slightly heavier `reviewer-agent` output per dispatch (one field per finding) |
| A bounded internal quality-audit dispatch count regardless of file count | A batched call needs a fallback for very large builds (15+ `.md` files) — not designed here, flagged as a risk |
| No more attempts to turn a CI-tier suite green inside an interactive build session | Test-tier routing depends on `wiki/workflows.md` existing and carrying a Test Workflow section — silent no-op otherwise |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| A reviewer marks its own wrong finding `confirmed` (self-verification doesn't catch its own error) | Med | F2's escalation path (a separate confirm dispatch) stays available for findings the reviewer itself is unsure about; not a full second opinion on every finding |
| F3's batched call exceeds context on a very large internal build (15+ `.md` files) | Low/Med | Not designed in this plan — F4's dispatch step should note the file count and can fall back to per-file dispatch above a threshold; left as an explicit follow-up, not blocking T2 |
| F6's five-item OWASP trigger list misses a security-relevant area outside it (e.g. encryption, SSRF, deserialization, path traversal) | Med | Named now; the trigger list is data in `add.review.md`, editable later without touching F5's `MODE: owasp` contract |
| F7 finds `wiki/workflows.md` present but with no Test Workflow section (e.g. a project with no `.github/workflows/*`) | Med | Falls back to today's un-scoped `Verify:` authoring — same behavior as a missing wiki, no new failure mode |
| `MODE: owasp` (F5/F6) overlaps the backend reviewer's existing "Security (OWASP)" checklist line on the same sensitive-area diff, producing duplicate findings on the same issue | Low/Med | Accepted, not deduped — dedup would mean editing the backend reviewer's checklist scope, which is outside this plan; double coverage only fires on sensitive-area diffs, never on every diff, so the cost this plan cuts elsewhere is not reintroduced broadly |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/agents/reviewer-agent.md` | product | modify | F1 (Confidence field), F5 (MODE: owasp) |
| `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` | product | modify | F2 (confidence-based routing in §7) |
| `.claude/agents/prompt-review-agent.md` | internal | modify | F3 (batched artefact-list input) |
| `.claude/skills/add-framework--build/SKILL.md` | internal | modify | F4 (STEP 7.1 batched dispatch) |
| `framwork/.codeadd/commands/add.review.md` | product | modify | F6 (OWASP trigger + dispatch) |
| `framwork/.codeadd/skills/add-tasks-checklist/SKILL.md` | product | modify | F7 (wiki read + tier rule in Architect Prompt Template) |
| `framwork/.codeadd/fragments/tdd-pipeline/add.build.md` | product | modify | F8 (tier-aware gate) |
| `framwork/.codeadd/skills/add-tdd/SKILL.md` | product | modify | F9 (GREEN tier caveat) |
| `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` | product | modify (further) | F10 (step 5 review narrowed, added post-STEP-7) |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level BEFORE any F-block lands and verify each fails against
the current tree. Then drive them GREEN.

### L1 — Text/structure assertions (RED → GREEN), one file per F-block, following this repo's own
`cli/tests/*.test.js` convention (e.g. `review-no-loops.test.js`, `prompt-quality-ruler.test.js`)

1. `reviewer-agent.md` Report Format includes a `Confidence` field with both allowed values documented.
   *RED today: the field does not exist.*
2. `add-subagent-driven-development` §7 names a confidence-based branch before the fix dispatch.
   *RED today: routing reads severity only.*
3. `prompt-review-agent.md` Input Contract documents a batched (multi-artefact) form.
   *RED today: `node` is singular and required.*
4. `add-framework--build` STEP 7.1 scope 4 reads "one batched call", not "one per `.md` artefact".
   *RED today: the text says "one dispatch per `.md` command, skill or agent".*
5. `reviewer-agent.md` `Input: MODE` table lists `owasp` as a third value.
   *RED today: only `task` and `re-review` exist.*
6. `add.review.md` STEP 4.1/4.2 name the OWASP trigger condition and the conditional third dispatch.
   *RED today: only frontend/backend detection exists.*
7. `add-tasks-checklist.md` Architect Prompt Template `## CONTEXT` lists `wiki/workflows.md`; `## RULES`
   states the CI-tier `Verify:` scoping rule. *RED today: CONTEXT lists four sources, none is the wiki.*
8. `tdd-pipeline/add.build.md` sections `gate`/`verification`/`awareness` name the local/CI-tier
   distinction. *RED today: they say "run existing test files" / "run TEST_COMMAND" unconditionally.*
9. `add-tdd/SKILL.md` GREEN step names the CI-tier caveat. *RED today: "Run the existing suite. No
   regressions" carries no exception.*

### L2 — Cross-artefact consistency

1. Every `Consumes` in this plan's F-blocks matches, character for character, the `Produces` string on
   its named earlier F-block (F2↔F1, F4↔F3, F6↔F5, F8↔F7, F9↔F7).
2. `node scripts/build.js` exits 0 with no new warning after all nine F-blocks land — graph edges for
   the two modified agents and the modified skills/fragment stay closed (`add-artefact-graph`).

### L3 — Behavioural acceptance

1. A product-layer review with a `needs-verification` finding does NOT reach `@fix-agent` before a
   confirm dispatch resolves it to `confirmed` or drops it.
2. An internal build touching 3 `.md` artefacts dispatches `@prompt-review-agent` exactly once for
   scope 4, not three times.
3. A product-layer review whose diff touches none of the OWASP trigger's paths dispatches exactly 2
   reviewers (frontend/backend), never 3.
4. A generated `tasks.md` task whose `Files` include a CI-tier spec (per a test project's
   `wiki/workflows.md`) carries a `Verify:` line naming that one file, never the project's full
   integration-test command.

**RED expectations against the current tree:** all nine L1 items are red today, per the file:line
evidence gathered at this plan's STEP 1-3 (quoted per F-block above). **GREEN = all levels pass after
F1-F9.**

---

## Execution Order

T1, T2 and T3 are independent groups — no F-block in one group is consumed by a block in another. Within
each group:

- **F1 before F2** — F2 reads the `Confidence` field F1 adds.
- **F3 before F4** — F4's batched dispatch needs F3's batched input to exist first.
- **F5 before F6** — F6 dispatches the `MODE: owasp` F5 adds.
- **F7 before F8 and F9** — both read the scoped `Verify:` shape F7 produces.

A build may interleave the three groups in any order (e.g. F1, F3, F7, F2, F4, F8, F5, F9, F6) — each
boundary after a group's last F-block (F2, F6, F9 in whatever order they land) leaves the repo in a
working state, since no group depends on another.

Run each F-block's L1 assertion as part of its own commit's validation, per this repo's standard
one-commit-per-F-block discipline (`add-build-ledger`).

## Reviewer Handoff

The review command must be able to audit this without re-reading the design docs. For each F-block the
build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt:

1. An F-block marked done whose L1 assertion was never RED — a test written after the fix proves
   nothing.
2. A `Consumes` string that does not match its `Produces` string character for character (F2/F1,
   F4/F3, F6/F5, F8/F7, F9/F7) — the five pairs this plan's interfaces depend on.
3. F7 landing without F8 and F9 — a `Verify:` line that is correctly scoped but a build gate that still
   runs the whole suite regardless makes F7 cosmetic.
4. F5 landing without F6 — a `MODE: owasp` nobody dispatches is dead capability, not a cut.

## References

- Design set: `docs/brainstorming/2026-09-17T150746-cut-review-and-build-loop-cost-000-umbrella.md`,
  `docs/brainstorming/2026-09-17T150746-cut-review-and-build-loop-cost-intent.md`
- Prior art this plan builds on: `2026-09-09T090201-PLAN--review-no-loops` (review runs once, no
  verdict file — the rule this plan works inside of); `2026-09-09T061636-PLAN--plan-review-agent-speed`
  ("one shell call replaces per-path checks" — the precedent for F3/F4's batching);
  `2026-09-10T173216-PLAN--prompt-quality-ruler` (the scoped `confirm` pass this plan's shape is modeled
  on)

---

## Next Steps

/add-framework--build cut-review-and-build-loop-cost

One command executes every F-block, whichever layer each is tagged. Do NOT route part of the plan to
a second command.

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-17 | Initial creation |
| 2026-09-17 | Implemented: F1-F9 (commits 8c509f1..e266555), plus STEP 7 review fixes (commits 8cd733e..8fb571f). Changelog: `docs/changelog/2026-09-17T171659-feat-cut-review-and-build-loop-cost.md` |
| 2026-09-17 | T4/F10 added post-STEP-7, same PR (#75): per-task review narrowed vs `/add.review`. Commit `9dc8a9b` |
