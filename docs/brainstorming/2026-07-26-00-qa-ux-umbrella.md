# Brainstorm 00: QA Pipeline — UX Agent Ownership & Dual-Axis Judgement (Umbrella)

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-07-26
> **Type:** architecture (spans commands + skills + agents)
> **Layer:** product (`framwork/.codeadd/`)
> **Refinements:** `01`–`05` in this folder. **File numbers are the execution order**, not a priority ranking.
> **Note (2026-07-27):** `01` is implemented (plan 0056). It renumbered `add.qa-setup`: the catalog-scaffold step formerly STEP 7 is now **STEP 8**, and the smoke test formerly STEP 9 is now **STEP 10**. References below to those old numbers describe the pre-0056 state.

## Discovery

Relevant existing artefacts and prior decisions grounding this design:

- **`add.qa` + `add-qa` skill + `qa-agent`** — the 4-axis judge (UX / functional / responsiveness / a11y; the agent file's own wording is "dual-axis" — UX + functional — judged across viewports and a11y: same four dimensions), Level C model. Prior decision: *"There is no pixel-diff and no Figma baseline — fidelity is agent judgement against `design.md`."* Audit, not gate; never fixes.
- **`add.qa-setup`** — owns prerequisite install (`@playwright/test` runner + chromium + MCP), the generated `qa-project` skill, `docs/qa/config.json`, and STEP 7 scaffolding of `FEATURE_DIR/_tests/screens.json` from `design.md`.
- **`add-qa-spec` skill + `add.plan` STEP 10.0** — `qa-pipeline`-gated subagent producing `plan-qa-spec.md` (reachability intent, capture states, viewports, a11y). Carries the explicit rule `Do NOT write screens.json`.
- **`e2e-agent`** — dispatched by `add.test` under `qa-pipeline`; authors `<surface>.qa.spec` (functional assertions + multi-viewport capture + axe), finalizes `screens.json` selectors, appends missing entries.
- **`add.design` + `ux-agent` + `add-ux-design` skill** — `design.md` authoring via a two-pass reducer (Flow → Layout) with a human `[STOP]` at STEP 7. Writes to `docs/features/${FEATURE_ID}/design.md` (feature level only). Produces ASCII wireframes.
- **`feature-design` schema** (`add-doc-schemas/references/new-feature.md`) — sections `TL;DR · Screens · Components · Flows · Tokens · References`; **hard bans inline SVG and ASCII wireframes**. Directly contradicted by `add.design` STEP 6.
- **`qa-validation` schema** (`references/review.md`) — findings require severity, type, evidence, observed, expected, fix hint. No responsible-agent field. Hard-bans findings without evidence.
- **`cli/src/features.js`** — `qa-pipeline` registered `default: false`, gating fragments in `add.plan`, `add.test`, `add.build`.

## Context & Motivation

A real project ran the full canonical flow — `add.new → add.plan → add.build → add.review → add.test → add.qa` — with the `playwright` plugin enabled and `add.qa-setup` already executed. `/add.qa` still could not run: no `design.md`, no `screens.json`, no persisted run evidence. The failure reproduces on **every** feature.

The QA capability is architecturally sound but operationally unreachable: the artefacts it judges are produced by upstream steps that are optional, off by default, or write to a different path than the judge reads. The command was technically correct to stop and practically useless.

Beyond unblocking, the owner wants `/add.qa` to act as a **senior designer approving the delivered layout** — reading screenshots and recording what must change before the feature is user-ready — and to explain functional failures rather than report pass/fail. The report must carry **which agent applies each fix**, so `/add.build qa` routes work instead of guessing.

## Problem / Opportunity

Four silent breaks in the chain, plus five missing capabilities.

### Breaks

| # | Break | Consequence |
|---|-------|-------------|
| 1 | `qa-pipeline` is `default: false`, and the `playwright` plugin is orthogonal to it | `add.plan` STEP 10.0 never runs (no `plan-qa-spec.md`); `add.test` never dispatches `@e2e-agent` (no `<surface>.qa.spec`, no selector finalization); `add.build qa` mode absent. All three degrade **without warning** |
| 2 | `/add.design` is routed only when a feature *"has complex UI (3+ screens)"* | Features skip it; no `design.md` exists, so the UX axis has no contract and `qa-setup` STEP 7 cannot derive screens (inventing routes is forbidden) |
| 3 | Path contract mismatch: `add.design` writes `FEATURE_DIR/design.md`; `add.qa` reads `SCOPE_DIR/design.md` (SF level); `screens.json` references `subfeatures/SFxx-*/design.md` | **No command writes a subfeature-level `design.md`.** Even after `/add.design`, an SF-scoped `/add.qa` cannot find the contract |
| 4 | `screens.json` is per-feature but `add.qa-setup` is a bootstrap command taking one `feature-id` | Features created after setup are born without a catalog; the only recovery (`@e2e-agent` appending entries) depends on Break 1 |

### Missing capabilities

| Capability | Current state |
|---|---|
| Pixel-perfect / design-conformance judgement | Out of scope by prior decision. No measurable rubric — `design.md` is descriptive prose, which is not assertable |
| Current-practice layout proposal | ASCII wireframes, which the `feature-design` schema itself bans. No visual verification of a proposal before implementation |
| Senior-designer-grade UX review | Rubric is generic (layout/hierarchy/spacing, tokens, single primary CTA); not approval-grade |
| Root-cause analysis of functional failures | `qa-agent` folds in a pass/fail roll-up only; zero forensics on *why* a scenario failed |
| Fix routing | Findings carry a free-text `fix hint`; no responsible-agent field. `/add.build qa` groups by severity/axis with no dispatch signal |

## Proposed Solution

Move design-contract ownership **upstream into `add.plan`**, make the contract **measurable and visually verifiable**, and split QA judgement into **two specialist judges** whose findings carry routing metadata.

The unifying idea: **the author of the contract becomes the judge of the delivery.** `@ux-agent` critiques the proposed design before it is written and judges the rendered result against it after implementation — the same critical eye at both ends. It carries **no persistent memory**, so the judge reads `design.md` and the run evidence rather than recalling its own rationale.

### Alternatives considered

| Option | Verdict |
|---|---|
| **Self-healing preflight in `add.qa`** — a STEP 0 that diagnoses every missing piece and auto-repairs (enables the feature, scaffolds the catalog, dispatches the spec author) | Rejected as primary. Treats symptoms; blurs the judge/author separation. Retained in reduced form as `01` |
| **Diagnostic-only preflight** — report all missing pieces at once with the exact remedy for each | Insufficient alone; keeps the inter-command ping-pong. Adopted as part of `01` |
| **Harden upstream (chosen)** — always produce the contract when a screen exists, at the path the judge reads, with the QA catalog owned by the step that already carries the gate | Chosen. Removes Breaks 2 and 3 by construction. **Break 4 only in projects that enable `qa-pipeline`** — STEP 10.0 is a gated fragment and `01` deliberately keeps the default `false`, so a default install still produces no `screens.json`. What `01` delivers for that install is a precise diagnosis, not a catalog |
| **Smallest viable version** — `01`, plus `design.md` written unconditionally at `SCOPE_DIR`, plus a `## Design Contract`, handed to the **existing** `qa-agent`, plus a `root cause` field on functional findings | **Not chosen, but recorded as the fallback.** Closes all four breaks and makes the report diagnostic while dropping two new agents, the critique pass, the judge split, and the routing section — roughly 80% of the value at 20% of the surface. If cost or schedule pressure appears, cut back to this rather than shipping the full set partially |

### Pixel-perfect without a baseline

A senior designer approving a layout does not overlay images — they measure against the system. Pixel-perfect judgement is tractable with **no Figma baseline** if `design.md` declares assertable values: spacing scale, permitted tokens, typographic scale, grid, per-breakpoint behaviour, minimum tap-target size, required states. The reviewer then checks *conformance to the declared system* from the screenshots.

**"Pixel perfect" here means measurable conformance to the design system, not image diffing.** This reframes rather than contradicts the prior "no pixel-diff, no baseline" decision — there is still no baseline image.

### Conformance is verified, not eyeballed

A vision model cannot measure pixel gaps, read a computed `font-size`, or compute a contrast ratio from a downscaled full-page screenshot. So the contract splits by **verification method**: spacing, tokens, type scale and container geometry are checked by comparing **captured computed-style values** against the declared contract; tap-target and contrast are existing deterministic axe rules; only hierarchy, optical alignment, primary-CTA reading and declared reflow go to agent judgement. The persisted spec gains a computed-style capture alongside its screenshots. Detailed in `03`, consumed in `04`.

A rendered-mock critique loop at plan time was proposed and **cut** — it would have had the layout agent critique a render of its own spec, on tooling absent from the default install. See `03` Layer 3 for the full reasoning.

## Type of Artefact

Architecture — spans commands (`add.plan`, `add.design`, `add.qa`, `add.qa-setup`, `add.build`), skills (`add-qa`, `add-qa-spec`, `add-ux-design`, `add-doc-schemas`, `add-ecosystem`), agents (`ux-agent`, `qa-agent` + two new), the feature registry (`cli/src/features.js`), and `provider-map.json`.

## Scope

### Includes

- `@ux-flow-agent` and `@ux-layout-agent` (new) — the two-pass spec reducer, plus design-system inspection moved down from the coordinator
- `@ux-agent` gains two roles: **critique** (pre-implementation, on the proposal) and **review** (post-implementation, on the rendered delivery)
- `add.plan` — unconditional UX dispatch whenever the Frontend Specialist is selected, with an agent critique pass and no human gate
- `design.md` written at the scope `add.qa` reads (SF level for epics, feature level otherwise), plus a `## Design Review` decision record and a measurable `## Design Contract` block
- Layout notation that replaces schema-banned ASCII, plus the measurable `## Design Contract` block and the computed-style capture (see `03`)
- `screens.json` ownership inverted to `add.plan` STEP 10.0 (the generic subagent loading `add-qa-spec`); `add.qa-setup` STEP 7 demoted to bootstrap/legacy
- `add.qa` dispatching two parallel judges per SF: `@ux-agent` (review) and `@qa-agent` (functional + a11y + failure forensics)
- `qa-validation-NNN.md` gains fix routing; `/add.build qa` consumes it to dispatch
- `qa-pipeline` reachability: loud OFF state, all-at-once diagnostics, and opt-in at the setup moment
- `/add.design` retained as a standalone entry point, dispatching the same agents, without its `[STOP]`

### Does NOT Include

- Image-baseline visual regression, pixel-diff tooling, or Figma/paid-tool integration
- Rendered-mock critique of the proposal — proposed and cut, see `03` Layer 3
- `add.qa` mutating application code — it stays an audit
- QA for non-web surfaces (Telegram bot, worker, CLI) — a real gap observed on the motivating feature, deliberately deferred
- Changing the `e2e-agent` contract (it keeps authoring specs and finalizing selectors)
- Provider expansion — the agent-driven QA pipeline stays Claude-only per the v1 distribution decision
- Run-evidence retention/lifecycle policy across `run-NNN` versions
- Design-token authoring (`/add.design` Foundations mode) — unchanged

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Trigger UX dispatch off the existing STEP 7 subagent matrix (Frontend Specialist selected ⇒ screens involved) | "Has a screen" is already a decision `add.plan` makes; no new heuristic, fully deterministic | ✅ |
| Two sequential spec agents (`@ux-flow-agent` → `@ux-layout-agent`) rather than one single-pass agent | Preserves the Flow→Layout reducer that produces better design today; a leaf agent cannot dispatch itself twice | ✅ |
| `@ux-agent` kept and given the critic/reviewer identity at both moments, as a single agent | No orphaned agent, no fourth UX agent, and the same eye that critiques the proposal judges the delivery. With `memory` removed and `disallowedTools` declined, splitting the review role buys no enforceable difference | ✅ |
| `memory` removed by **role**: gone from `@ux-agent`, `@qa-agent`, `@ux-layout-agent`; **kept on `@ux-flow-agent`** | Structure and architecture live in the project, so persistent memory is for momentary state — and a judge that recalls its own rationale is the anchoring failure to avoid. The exception is narrow: `@ux-flow-agent` re-derives the design system every run, which is exactly the case `add-framework-development:637` names as a defect to fix with memory. A role-scoped deviation from 13/13 practice, not a framework-wide policy change | ✅ |
| `--yolo` and the approval `[STOP]`s removed together | The flag's only purpose was bypassing approval gates; with the gates gone it skips nothing and is dead surface. Error gates and conditional clarification are untouched | ✅ |
| Design-system inspection moves from the coordinator into `@ux-flow-agent` | Otherwise `add.plan` and `add.design` duplicate ~60 lines of inspection and `add.plan` gains 5+ file reads | ✅ |
| No human `[STOP]` — replaced by an adversarial agent critique, one bounded pass | The agent is the specialist; the human is the user. Preserves `add.new → add.plan → add.build` ergonomics | ✅ |
| The critic must be adversarially prompted (hunt defects), not asked to "review" | A reviewer without a defect mandate becomes an echo | ✅ |
| Accepted/rejected critique items recorded in `design.md` `## Design Review` with rationale | Prevents `@ux-agent`, three commands later in `add.qa`, from re-raising a consciously rejected decision as a finding | ✅ |
| The coordinator applies accepted critique items; no re-dispatch of `@ux-layout-agent` | Accepted items are localized, and consolidation already does gap-filling. A third dispatch per feature does not pay for itself | ✅ |
| `design.md` scope: `SF_DIR` for epics, `FEATURE_DIR` for normal features | Matches the `SCOPE_DIR` resolution `add.qa` STEP 2 already performs — closes Break 3 | ✅ |
| `screens.json` ownership moves to `add.plan` STEP 10.0 (the generic subagent loading `add-qa-spec`), inverting the skill's `Do NOT write screens.json` rule | The catalog references the `design.md` path, which exists only after consolidation; STEP 10.0 runs after it and **already carries the `qa-pipeline` gate**. Putting the gate inside a UX agent would hardcode an `if` that ignores the real flag state (agents receive plugin fragments, not feature fragments) | ✅ |
| `add.qa-setup` STEP 7 demoted to bootstrap/legacy rather than deleted | Pre-existing projects and features created before this change still need a scaffolding path | ✅ |
| Pixel-perfect = measurable conformance to a declared contract, no baseline image | Achievable from screenshots alone; reframes rather than contradicts the prior decision | ✅ |
| Layout notation replaces ASCII wireframes | The `feature-design` schema already bans ASCII; the command violates its own schema today. Notation choice detailed in `03` | ✅ |
| Two parallel judges in `add.qa` rather than one 4-axis generalist | The UX axis is the weakest of the four today precisely because a generalist judges it without design intent | ✅ |
| `@ux-agent` review mode reports `spec-gap` as its own finding category | Makes the "author judges against its own blind spot" weakness visible instead of silent | ✅ |
| `/add.design` survives as a standalone entry point, `[STOP]` removed, dispatching the same agents | Design-first and redesign flows stay possible; logic lives in the agents, so both paths produce identical output | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `add.plan` | New UX spec step before the area subagents; STEP 10.0 gains `screens.json` ownership | Modify — new step + fragment change |
| `add.design` | Loses inspection (moves to agent), loses the `[STOP]`, gains the critique loop; becomes a thin dispatcher | Refactor |
| `add.qa` | STEP 4 dispatches two judges in parallel; STEP 3 follows the new `design.md` scope rule; STEP 1 becomes all-at-once diagnostics | Modify |
| `add.qa-setup` | STEP 7 demoted to bootstrap/legacy; gains a `qa-pipeline` opt-in moment | Modify |
| `add.build` | The `qa-fix` fragment consumes fix routing to dispatch the named agent; the command's Named Agent Mapping gains `@e2e-agent` and `@ux-agent` rows with fallbacks (see `05`) | Modify (fragment + command body) |
| `add.test` | Contract unchanged; `@e2e-agent` now always finds a populated catalog | None |
| `ux-agent` | Gains **critique** and **review** modes; **`memory` removed**; `disallowedTools` left empty | Rewrite |
| `ux-flow-agent`, `ux-layout-agent` | New agents. Flow keeps `memory: project` (expensive, stable inspection); layout omits it | Create + register in `provider-map.json` |
| `qa-agent` | Sheds the UX axis; gains deterministic conformance + failure forensics + routing; **`memory` removed** | Rewrite |
| `add.plan` (arguments) | `--yolo` removed together with the approval `[STOP]`s; error gates and conditional STEP 6 untouched | Modify |
| `add-qa` skill | Report template gains routing; judge split documented; conformance rubric added | Modify |
| `add-qa-spec` skill | `Do NOT write screens.json` inverted; gains the catalog schema | Modify |
| `add-ux-design` skill | Gains layout notation, the measurable-contract spec, and the critique rubric | Modify |
| `add-doc-schemas` skill | `feature-design` gains `## Design Contract` + `## Design Review`; `qa-validation` gains routing | Modify |
| `add-ecosystem` skill | Agent table, dispatch map, and command routing table all change | Modify |
| `cli/src/features.js` | None — `01` keeps `default: false` and detects the pre-sidecar enable no-op rather than fixing it | Verify only |
| `cli/src/plugins.json` | `playwright.agents[]` lists only `qa-agent`; if `@ux-agent` joins the live-driving path (`04`), it needs a catalog row and a drive fragment (`05`) | Verify/Modify |
| `scripts/status.sh` | SF-level `design.md` detection; emit `HAS_DESIGN` (never emitted today) | Modify |
| `add-id-convention` skill | SF-qualified design ID, so SF-scoped `design.md` files do not share one ID | Modify |
| `provider-map.json` | Two new agents registered (Claude only — agents build only for providers with an `agents` pattern) | Modify |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Every feature with a screen gets a design contract, automatically | `add.plan` gets heavier: 2–3 extra sequential dispatches on any UI feature |
| A judge that measures against a declared system instead of guessing | `design.md` must carry assertable values — a stricter authoring bar |
| Conformance verified from captured computed styles + axe, not eyeballed | No visual check of the proposal before implementation — the mock loop was cut, so the first render seen is the delivered one |
| Design decisions traceable (accepted/rejected critique with rationale) | One more section to maintain in `design.md` |
| Fix routing turns the QA report into actionable dispatch input | Coupling between the report format and the agent roster |
| No human gate — daily flow ergonomics preserved | No human sign-off on design before implementation |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Author-judges-its-own-spec blind spot: a thin `design.md` yields a review that validates nothing | Med | `spec-gap` finding category — the reviewer must report when the contract failed to declare what was needed to judge something |
| The adversarial critic degrades into an agreeable reviewer | Med | Prompt mandates hunting a specific defect list; empty critique output must be justified, not accepted silently |
| `add.plan` latency/cost growth on UI features | High | Dispatches are sequential by existing design; critique is one bounded pass; no iteration-to-convergence; mock rendering is gated |
| Structural critique arrives too late — the coordinator stitches instead of re-architecting | Med | Accepted: structural critique at this phase signals a weak `about.md`, not a weak layout, and surfaces as a gap |
| Fix routing points at an agent that cannot fix the finding | Med | Multiple routed agents per finding allowed; routing validated against each agent's write capability; `/add.build qa` confirms before changing code |
| Removing the `[STOP]` ships a bad design straight into implementation | Low | The critique pass and `add.qa`'s post-delivery review are two distinct checkpoints (not fully independent — see Finding C); `/add.design` remains available for a deliberate redesign |
| Rejected-critique records ignored by the delivery reviewer, resurfacing closed decisions | Med | Reviewer must read `## Design Review`; re-raising requires rendered evidence contradicting the recorded rationale, cited in the finding — evidence gates re-litigation; severity is never capped |
| Non-web features (bot, worker, CLI) still have no coherent QA answer | High | Explicitly out of scope; recorded as a follow-up so it is not mistaken for covered |

## Decomposition Map

**File numbers are the execution order.** Refine and implement `01` → `05`.

| File | Subtopic | Purpose |
|------|----------|---------|
| `01-qa-pipeline-reachability.md` | Pipeline reachability | Make the `qa-pipeline` OFF state loud instead of silent; `add.qa` reports **all** missing prerequisites at once with the exact remedy for each; opt-in at the `add.qa-setup` moment. **Independent — the shortest path to unblocking the observed failure** |
| `02-ux-agent-design-ownership.md` | UX agent ownership & always-on design contract | `@ux-flow-agent` + `@ux-layout-agent` + `@ux-agent` critique; the new `add.plan` UX step; `design.md` scope fix; `screens.json` ownership inversion; `/add.design` refactor |
| `03-layout-notation-design-contract.md` | Layout notation & measurable design contract | Replace schema-banned ASCII with current agent-native layout notation; the render-and-screenshot proposal verification loop; the assertable contract block that makes conformance judgement possible |
| `04-dual-judge-qa-validation.md` | Dual-judge QA validation | `add.qa` splitting into `@ux-agent` (review) ∥ `@qa-agent`; the senior-designer approval rubric; the conformance rubric; **functional failure forensics**; finding-merge rules |
| `05-qa-fix-routing.md` | Fix routing | The `qa-validation` routing field, agent-selection rules per finding root cause, and how `/add.build qa` consumes it to dispatch in dependency order |

## Dependencies & Relationships

```
01 (independent, ship first)

02 ──> 03 ──> 04 ──> 05
```

- **`01`** is independent and is the fastest path to unblocking the motivating project. Ship it first; it needs none of the others.
- **`02`** is the base for the rest: without an always-present `design.md` at the right scope, `03`–`05` have nothing to build on.
- **`03`** must precede `04` — the reviewer's rubric can only assert values the contract declares. Designing the rubric first would produce a rubric with nothing to measure against.
- **`04`** must precede `05` — routing metadata is a property of a finding, so the finding shape has to be settled first. `04` also produces the root-cause taxonomy that `05`'s routing rules key off.

## Next Steps

Each refinement doc is self-contained and planning-ready. Start with:

`/add-framework--plan implement docs/brainstorming/2026-07-26-01-qa-pipeline-reachability.md`

## Findings Raised by Adversarial Review

Three findings survived verification against the source. **All three are now resolved** — A as plumbing rather than architecture, B and C by owner decision. The reasoning is recorded here because each changed the design.

### A. Contract consumption — **resolved: plumbing, not architecture**

Review reported this as a blocker: five topics invest in *authoring* and *judging* the design contract while none changes *consumption*, so the rubric would grade an implementation that never received its inputs.

Verification showed the consumption path **already exists in full**:

```
add.build.md:118  - `design.md` (if exists)
add.build.md:130  - **HAS_DESIGN** — use design.md for UI
add.build.md:184  - `design.md` (if HAS_DESIGN=true) — follow mobile-first layouts, component specs, design tokens
add.build.md:190  **Priority:** plan.md > design.md + about.md > about.md + discovery.md
add.build.md:340  For Frontend: skill will auto-load ux-design if design.md exists
```

`add.build.md:64` declares it receives `HAS_DESIGN` from `status.sh`, and the script **never emits it** (verified: zero occurrences). The architecture is right; the gate is permanently false.

**Decision — keep `design.md` as its own document.** The alternative (fold it into `plan.md`, which the builder already reads) was rejected on four grounds, the first eliminating:

1. **`plan.md` is regenerated by `add.plan`.** A replan would destroy design decisions, including the `## Design Review` record of what was rejected and why. `design.md` needs an independent lifecycle: redesign without replanning, replan without redesigning.
2. **It kills design-first.** `/add.design` runs *before* `/add.plan` in the canonical flow; if the design lives in `plan.md` there is nothing for the standalone command to write.
3. **`add.qa` reads `design.md` as the UX contract**, and `screens.json` entries carry a `design` path reference. Folding makes the judge extract its contract from a technical plan and points the catalog at one.
4. **Different audiences and lifecycles.** `plan.md` is a technical contract (endpoints, DTOs, migrations) read in full by every `add.build` mode, including modes with no frontend.

**Fix, now in `02`'s scope:**

- `status.sh` emits `HAS_DESIGN` and detects it at SF level — this alone activates the wired path.
- `add.build.md:190` precedence becomes **domain-scoped** instead of blanket: `plan.md` wins on technical contracts, `design.md` wins on layout, hierarchy, tokens, states, and every `## Design Contract` dimension.
- The frontend section of `plan.md` **references** `design.md` for layout rather than restating it, keeping the layout tree single-sourced.

The third and fourth points are the only genuine design changes; without the precedence fix, a lossy paraphrase in `plan.md` outranks the contract that `04` grades against.

### B. Author-and-judge in one agent — **resolved: keep one, drop `memory`**

Review flagged two mechanisms that made a single author-and-judge agent unsound: `@ux-agent` carries `memory: project`, so the delivery reviewer shares persistent memory with the critic that approved the design; and it has no `tools`/`disallowedTools` while `04`/`05` assert it is read-only as a judge — a distinction static frontmatter cannot express.

**Decisions:**

- **`memory` removed by role.** Gone from `@ux-agent` (critique + review), `@qa-agent` (judge), and `@ux-layout-agent` (per-dispatch author) — structure and architecture live in the project, so persistent memory is for momentary state, and none of those three has any. This is what resolves the finding: with nothing to recall, the reviewer must read `design.md` and the run evidence. **Kept on `@ux-flow-agent`**, the one agent that re-derives an expensive but stable artefact (the design-system inspection) on every screen-bearing feature — exactly the case `add-framework-development:637` names as a defect to fix *with* memory. Discovery confirmed `memory: project` is on 13/13 product agents today, so this is a deliberate role-scoped deviation, documented as such rather than proposed as framework-wide policy.
- **`disallowedTools` stays empty**, matching existing practice — `@qa-agent` has no restrictions either, and `add.qa` protects the boundary with a command-level guard (`add.qa.md:105`). That guard is extended to name `ux-agent` and becomes **mandatory**, since it is now the only mechanism.
- **One agent, not two.** With memory gone and tool restriction declined, splitting the review role into a separate definition buys no enforceable difference — the command-level guard is identical either way — while adding a fourth UX agent. `@ux-agent` keeps both critique and review.

Residual circularity is handled where it belongs: the `## Design Review` evidence rule in `04` (a rejected item may be raised at full severity when rendered evidence contradicts the recorded rationale) and the `spec-gap` category, whose honest limit is stated rather than overclaimed.

### C. The approval gate and `--yolo` — **resolved: both removed**

Review's objection was that removing the human `[STOP]` was justified by ergonomics while `add.plan` **already had `--yolo`** (`:6`, `:20-21`: *"Skip ALL [STOP] points and clarification questions"*) — so the fast path existed and the gate could have been kept for free.

**Decision: remove both.** `--yolo`'s only purpose is bypassing approval gates; once the design confirmation is replaced by the agent critique loop and `add.design`'s STEP 7 `[STOP]` is deleted, there is no approval gate left to skip. A flag that skips nothing is dead surface that still has to be parsed, documented, and reasoned about.

Two boundaries this must not cross, spelled out in `02`:

- **Error gates stay.** `add.plan`'s `docs_loaded` and `coverage_validated` gates, and the Error Handling table, are refusals to proceed on broken input — not requests for approval.
- **STEP 6 clarification stays**, and now has no bypass. It is already conditional on `about.md`/`discovery.md` leaving critical decisions undefined, so it is a genuine information need; a plan built on undefined critical decisions is worse than a question.

The accepted cost is real and worth naming: **no check in the pipeline catches *"this is not the screen I asked for"***, since `about.md` is the only proxy for product intent and the same pipeline authored it. The critique pass and the `add.qa` review are also **not fully independent** — same agent, same skill, same contract, differing only in what evidence they see. The umbrella's earlier "two independent checks" framing overstated that; the real backstop is that `add.qa` runs on the delivered result and `/add.design` remains available for a deliberate redesign.

## Validation Plan

Every Key Decision across these six documents is marked "Validated ✅", which means *agreed in the design session* — not *empirically tested*. Four load-bearing claims are testable and untested:

| Claim | Cheapest test |
|---|---|
| A specialist visual judge beats the generalist | Run both against one delivered feature; compare finding precision |
| The adversarial critique pass finds real defects | Measure critique yield over the first N features; a yield trending to zero means the critic degraded |
| Root-cause classification is accurate enough to route | Sample classified functional findings; check the routed agent could actually fix them |
| Computed-style capture makes conformance verifiable | Confirm the captured values are sufficient for every declared dimension on one real feature |

Pick one feature as a golden case and measure before/after. Without it, five interdependent topics ship on assertion.

## Deferred Follow-ups

Recorded so they are not mistaken for covered:

- **QA for non-web surfaces** — `add.qa` assumes a renderable surface for all four axes, so a subfeature that ships only a worker, a bot handler, or a CLI path has no coherent QA answer beyond the functional assertions. A general framework gap, not a blocker for the motivating feature (which does ship a web surface). Needs its own design.
- **Run-evidence lifecycle** — no policy on retention, cross-run comparison, or surfacing regressions between `run-NNN` versions.
- **`screens.json` maintenance** — no documented workflow for re-indexing after route refactors, deprecating screens, or validating catalog completeness when a feature is deleted.
- **`design.md` drift — partially resolved, narrowed.** `02` adds an `about.md` provenance hash that triggers a re-run when requirements move, and `05` specifies the fix-wave path: amendments append to `## Design Review` with the originating `run-NNN`, and `qa-validation` frontmatter records the contract hash it judged so a red→green flip under an amended contract is never reported as a fix. **What remains open:** a hand edit to `design.md` outside both paths — no command detects it, and whether the contract should be locked after spec generation is undecided.

## Implementation Status (2026-07-27) — umbrella CLOSED

All five topics are implemented and reviewed on branch `feature/0056-qa-pipeline-reachability`:

| Topic | Plan | Status |
|---|---|---|
| 01 Pipeline reachability | `0056-PLAN--qa-pipeline-reachability.md` | ✅ implemented |
| 02 UX agent ownership / always-on design contract | `0057-PLAN--ux-agent-design-ownership.md` | ✅ implemented |
| 03 Layout notation + measurable Design Contract | `0058-PLAN--layout-notation-design-contract.md` | ✅ implemented |
| 04 Dual-judge QA validation | `0059-PLAN--dual-judge-qa-validation.md` | ✅ implemented, whole-topic review clean |
| 05 Fix routing | `0060-PLAN--qa-fix-routing.md` | ✅ implemented, whole-topic review clean |

Each plan has an `--evidence-v01.md` file and a dated changelog. The `qa-validation` doc schema changed (topics 04–05), so the release that ships this must bump the framework version.

**Still-open deferred follow-ups (NOT delivered — carried forward as their own future work):**

- **QA for non-web surfaces** (worker / bot / CLI) — no coherent QA answer beyond functional assertions.
- **Run-evidence lifecycle** — no retention / cross-run-comparison / regression-surfacing policy across `run-NNN`.
- **`screens.json` maintenance workflow** — no re-indexing after route refactors, screen deprecation, or catalog-completeness validation on feature deletion.
- **Hand-edit `design.md` drift** — an edit outside the provenance path + fix-wave amendment trail is undetected; whether to lock the contract after spec generation is undecided.
