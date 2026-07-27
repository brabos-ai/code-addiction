# Brainstorm 02: UX Agent Ownership & The Always-On Design Contract

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-07-26
> **Type:** agents + commands + skills
> **Layer:** product (`framwork/.codeadd/`)
> **Umbrella:** `2026-07-26-00-qa-ux-umbrella.md` · **Depends on:** nothing (may ship after `01`) · **Blocks:** `03`, `04`, `05`
> **Note (2026-07-27):** plan 0056 (`01`) renumbered `add.qa-setup` — its catalog-scaffold step formerly STEP 7 is now **STEP 8** (smoke test STEP 9 → **STEP 10**). This doc's `add.qa-setup STEP 7/STEP 9` references describe the pre-0056 numbering.

## Discovery

- **`add.design`** (359 lines) — STEP 3 inspects the design system (tokens, layout shell, component audit, 3–5 reference pages) and writes a temp `design-context.md`; STEP 4 is a complexity gate (<3 screens = inline, ≥3 = subagent); STEP 5 dispatches `@ux-agent` as FLOW, STEP 6 dispatches it again as LAYOUT (reducer — Layout reads Flow's output); STEP 7 is a human `[STOP]`; STEP 8 consolidates into `design.md` and deletes temps. Has a dispatch idempotency guard: *"Check if output file exists before dispatching. If yes, skip."*
- **`ux-agent`** — `model: sonnet`, `skills: [add-ux-design]`, `memory: project`, **no `tools`/`disallowedTools` frontmatter**. Body says *"Write specs or modify files as needed"*. Explicit constraint: *"You are a leaf agent — do NOT dispatch other agents."* Carries a `plugin:gitnexus:graph` marker anchored at `ux-agent.md:24`. Dispatched by `add.design`. **NOT dispatched by `add.ux`** — that command is an inline *"Lightweight UX loader"* with no agent dispatch; only the stale `add-ecosystem/SKILL.md:85` claims otherwise.
- **`add.plan` STEP 7** — subagent selection matrix: `pages, components, UI, forms, hooks → Frontend Specialist`, plus the LLM judgement *"Only create subagents the feature actually needs."* The result is **informed to the user, never persisted**.
- **`add.plan` STEP 8** — SEQUENTIAL only. `8.0` = Cross-SF Context (epic only), `8.1` Database, `8.2` Backend, `8.3` Frontend. Each writes `plan-[area].md`, deleted after consolidation. **`- 8.3: Frontend Specialist` (`:64`) is the content anchor for both the `feature:qa-pipeline:step-list` and `feature:tdd:step-list` injection markers.** Further references at `:61-64`, `:225` (*"shared across 8.1-8.3"*), `:246`, `:293`, `:361`.
- **`add.plan` STEP 5** — the file-loading matrix reads `design.md` **only on the Normal-feature row**. The **Epic row (`:146`) lists no `design.md` at all** — `${SF_DIR}/about.md`, `${FEATURE_DIR}/discovery.md`, `${SF_DIR}/plan.md`, `${FEATURE_DIR}/epic.md`, `docs/design-system.md`. The *"Use design.md to inform backend contracts"* line belongs to the Normal path only.
- **`status.sh`** — detects `design.md` **only** at feature level (`:137`, `:147` → `PHASE="designed"`, `:375`). And **`HAS_DESIGN` is never emitted by the script** (zero occurrences), despite `add.plan` STEP 2/4/5 and `add.build` STEP 5 branching on it. Pre-existing defect.
- **`add.design`** — `:19` *"does NOT allocate a new ID. Read `id: [NNNN]F` from the feature's `about.md`… The generated `design.md` carries the SAME `[NNNN]F`."* Zero epic awareness: STEP 1.2 extracts `FEATURE_ID, FEATURE_DIR, HAS_FOUNDATIONS, FRONTEND.*` only. Write path is hardcoded in the **coordinator** (STEP 8A step 4, 8B): `docs/features/${FEATURE_ID}/design.md`.
- **`add-doc-schemas`** — `:179` *"Every generator command MUST paste the [validation gate] block as the final STEP that operates on the doc."* `feature-design` schema hardcodes `id: [NNNN]F` and declares an ordered section list.
- **`add-framework-development` SKILL** — `:668` *"Named Agent Dispatch (MANDATORY for commands that dispatch agents) — Always include fallback table for providers without agent support"*; `:552` agent `skills:` frontmatter preloads the skill; `:633` *"Use `disallowedTools: Write, Edit, NotebookEdit`"* for read-only agents.
- **`add-qa-spec` skill** — reads `about.md` + `design.md` + area plans + `screens.json` + `config.json`; explicit rule `Do NOT write screens.json`. **Dispatched as a generic subagent**, not a named agent — `fragments/qa-pipeline/add.plan.md` §10.0 has no `DISPATCH AGENT:` line, and no `qa-spec` agent exists in `provider-map.json`.
- **`add.qa-setup`** — STEP 7 derives each `screens.json` entry from `design.md`; **STEP 9 (`:224`) gates its own smoke test on `screens.json` existing** (*"IF no feature with a scaffolded `screens.json` exists → DEFER"*).
- **`provider-map.json`** — agents build only for providers with an `agents` pattern (Claude only). `add.plan` has no `providers` restriction, so it ships to all 5.
- **`cli/src/plugins.json`** — agent injection requires both a `plugins/{plugin}/fragments/agents/{agent}.md` file and a catalog `agents[]` row; a marker alone injects nothing.

## Context & Motivation

Three of the four chain breaks in the umbrella share one root cause: **the design contract is optional, and when it exists it is written where the judge does not look.**

`/add.design` is routed only for features with *"complex UI (3+ screens)"*. In practice the daily flow is `add.new → add.plan → add.build`, so most features never get a `design.md` at all. The `frontend-agent`'s `If design.md exists` branch is a coin flip, `add.qa-setup` STEP 7 cannot derive a screen catalog from a document that does not exist, and the QA UX axis has no contract to judge against.

Even when `/add.design` does run, it writes `FEATURE_DIR/design.md` while `add.qa` reads `SCOPE_DIR/design.md` — the subfeature folder for epics. No command in the framework writes a subfeature-level `design.md`, so an SF-scoped `/add.qa` fails on a feature that was properly designed.

The fix is to make the contract unconditional and put it where the judge reads it.

## Problem / Opportunity

| Problem | Effect |
|---|---|
| `design.md` production is conditional on a routing heuristic | Most features have no UX contract |
| `add.design` writes feature-level, `add.qa` and `screens.json` read SF-level | A designed epic still fails QA |
| Design-system inspection lives in the `add.design` coordinator | Any second caller must duplicate ~60 lines |
| The human `[STOP]` at STEP 7 makes design a blocking interruption | It is skipped, which is why the flow omits `/add.design` |
| `screens.json` has three owners across three moments | Nobody owns the case "feature created after project setup" |
| `@ux-agent` is a single generalist doing flow, layout, and review | Cannot express the Flow→Layout reducer, since a leaf agent cannot dispatch itself twice |

## Proposed Solution

Split the spec author into two sequential agents, promote `@ux-agent` to critic/reviewer, dispatch them from `add.plan` whenever a screen is involved, and move the screen catalog to the step that already carries the QA gate.

### Agent roster

| Agent | Role | Writes | Dispatched by |
|---|---|---|---|
| `@ux-flow-agent` (new) | Design-system inspection + screen inventory + action classification + entry points + state transitions | `design-context.md`, `design-flow.md` (temp) | `add.plan`, `add.design` |
| `@ux-layout-agent` (new) | Layout structure per screen + component inventory + states + the measurable contract block (see `03`) | `design-layout.md` (temp) | `add.plan`, `add.design` |
| `@ux-agent` (rewritten) | **critique** mode on the proposal; **review** mode on the delivery (`04`) | `design-review.md` (temp) in critique mode; findings only in review mode | `add.plan`, `add.design`, `add.qa` |

All three remain leaf agents. `@ux-flow-agent` absorbs `add.design` STEP 3 verbatim so both callers share one implementation.

**Frontmatter policy — `memory` by role, `disallowedTools` empty:**

- **`memory` is removed from judging and per-dispatch agents, kept only where re-derivation is expensive.** The governing principle: structure and architecture live in the project, so persistent memory is for momentary state — and a judge that recalls its own rationale instead of reading the artefact is precisely the anchoring failure this design must avoid.

  | Agent | Role | `memory` |
  |---|---|---|
  | `@ux-agent` | critique + review | **removed** — with nothing to recall, the reviewer must read `design.md` and the run evidence |
  | `@qa-agent` (in `04`) | judge | **removed** — same reason |
  | `@ux-layout-agent` | author, works from the flow agent's output each dispatch | **omitted** — nothing stable to carry |
  | `@ux-flow-agent` | re-inspects the design system every run | **`project` — kept** |

  The `@ux-flow-agent` exception is deliberate and narrow. It re-derives tokens, layout shell, component inventory, and 3–5 reference pages on every screen-bearing feature; that result is stable across features, and re-paying for it each time is the exact scenario `add-framework-development/SKILL.md:637` names as a defect (*"No `memory: project` for agents that should learn | Agent rediscovers same patterns every session"*). It is also the mitigation for this topic's own inspection-cost risk.

  **Context for the deviation:** `memory: project` is present on **13/13** product agents today, and the supporting skill treats it as a defining agent property (`:209`, `:223`). Removing it from three agents is an intentional departure justified by role — judges and per-dispatch authors have nothing legitimate to remember — not a blanket policy change for the framework.
- **`disallowedTools` stays empty**, consistent with existing practice: `@qa-agent` has no tool restrictions either, and `add.qa` protects the audit boundary with a command-level guard (`add.qa.md:105` — *"if an agent edited code, reject the run"*). That guard becomes **mandatory to extend to `ux-agent`**, since it is now the sole mechanism. `@ux-agent` is genuinely write-capable in critique mode (it writes `design-review.md`), so static per-agent restriction could not express the distinction anyway.

**One agent, not two.** `@ux-agent` holds both critique and review. With `memory` gone and `disallowedTools` empty, splitting the review role into a separate definition buys no enforceable difference — the command-level guard is identical either way — while adding a fourth UX agent. The residual circularity is handled by the `## Design Review` evidence rule and the `spec-gap` category in `04`, not by agent multiplication.

`@ux-agent` keeps its `plugin:gitnexus:graph` marker; the two new agents get the same marker only if they benefit from graph navigation — the flow agent does (it inventories existing components), the layout agent does not.

### The new `add.plan` UX step

`add.plan` STEP 8 is already SEQUENTIAL, so ordering is free. The UX block must run **before** the area subagents, not just before Frontend: STEP 5 already establishes that `design.md` informs backend contracts (*"endpoints serve UI needs"*), so Database and Backend both benefit.

Because `8.0` is taken by Cross-SF Context, the area steps renumber:

| New | Step | Old |
|---|---|---|
| 8.0 | Cross-SF Context (epic only) | 8.0 |
| **8.1** | **UX Design Specialist (new)** | — |
| 8.2 | Database Specialist | 8.1 |
| 8.3 | Backend Specialist | 8.2 |
| 8.4 | Frontend Specialist | 8.3 |

Renumbering rather than fractional sub-steps (`8.0.5`) keeps the step list readable, at the cost of a mechanical rename that must be grepped across skills and fragments.

**STEP 8.1 internals:**

```
8.1.0  Gate: run only if Frontend Specialist was selected in STEP 7
       Idempotency: if design.md exists and is not stale, skip with a note
8.1.1  @ux-flow-agent    → design-context.md + design-flow.md
8.1.2  @ux-layout-agent  → design-layout.md
8.1.3  @ux-agent [critique] → design-review.md (adversarial, one pass)
8.1.4  Coordinator consolidates: accept/reject each critique item with
       rationale → writes design.md at SCOPE_DIR + ## Design Review
       No [STOP] — proceed directly to 8.2
8.1.5  Delete temps (design-context/flow/layout/review.md)
```

**Trigger — two conditions, both required.** `IF Frontend Specialist was selected in STEP 7 AND the scope gate below passes → run 8.1`. Reusing STEP 7 avoids a second UI decision, but it is **not deterministic**: STEP 7 is a keyword matrix plus LLM judgement, and its result is currently only informed to the user, so STEP 7 must **persist** the selection for 8.1 to read.

**Scope gate — reuse `add.design` STEP 4's counting, not its branch.** The `/add.design` complexity gate (`:156-170`) counts screens from `about.md` + `discovery.md` and checks complexity keywords (`wizard, onboarding, multi-step, flow, dashboard, settings-panel`) to choose inline vs subagent. The inline branch dies — the two-agent path is now the only path — but **the counting logic is exactly the signal this gate needs** and must be retargeted rather than deleted:

```
SKIP 8.1 when the feature introduces no new or restructured screen
           AND declares no new component
           (changes are confined to existing components on existing screens)
     → note the skip; @frontend-agent plans against the existing design.md
ELSE run 8.1
```

Precedent for a skip of this shape: `add.autopilot.md:274` — *"If feature is very simple (single component, < 5 files, no new database entities): SKIP to STEP 6"* — bypasses an entire planning dispatch on a size test. `add.build.md:219-240` (`1 area → DIRECT`, `2+ areas → SUBAGENTS`) is the same family. Numeric and keyword thresholds are established practice across `add.new`, `add.build`, `add.autopilot`, and `add.wiki`, and neither `building-commands` nor `add-framework-development` restricts them.

This is what keeps a button-label change from triggering full design-system inspection, and it is the mitigation for the cost risk below.

**Staleness rule.** `mtime` comparison is invalid — a fresh clone or `git checkout` writes uniform or arbitrary mtimes, which would either skip 8.1 forever on every cloned repo or re-run it on every checkout. Instead, `design.md` frontmatter carries a **provenance field**: a content hash of the `about.md` it was derived from. Skip when the hash matches; re-run and record the reason when it does not. Deterministic under clone, checkout, and worktree.

**Scope resolution.** `SCOPE_DIR = SF_DIR` when `HAS_EPIC=true`, else `FEATURE_DIR`. This mirrors `add.qa` STEP 2 and closes the path mismatch — but it has three consequences the original proposal missed, all of which are in scope:

- **`status.sh` is blind to an SF-level `design.md`.** It probes `$FEATURE_DIR/design.md` only (`:137`, `:147`, `:375`), so `PHASE` never reaches `designed` and the `DOCS:` line omits it. Since `add.build` STEP 3/5 reads the design *conditionally*, the move would **disconnect the builder from the contract** — the exact opposite of this topic's purpose. `status.sh` must learn SF-level detection. While there, it must also actually **emit `HAS_DESIGN`**, which it never has, despite `add.plan` and `add.build` both branching on it.
- **Doc IDs collide.** `feature-design` hardcodes `id: [NNNN]F` and `add.design` reuses the feature ID. N subfeature `design.md` files would all carry `id: 0001F`, breaking the single-path ID resolution in `add-doc-schemas` (`grep -rE "^id: ..."` → one file). SF-scoped designs need an SF-qualified ID (`[NNNN]F-SFxx`), added to `add-id-convention` and the `feature-design` frontmatter.
- **The "backend needs the design" justification does not hold on the epic path.** STEP 5's Epic row lists no `design.md`. That row must gain `${SF_DIR}/design.md`, otherwise running 8.1 before Database/Backend buys nothing for exactly the scope this topic exists to fix.

**Contract consumption at build time.** `add.build` **already consumes `design.md`** — this is plumbing, not a missing capability:

```
add.build.md:118  - `design.md` (if exists)
add.build.md:130  - **HAS_DESIGN** — use design.md for UI
add.build.md:184  - `design.md` (if HAS_DESIGN=true) — follow mobile-first layouts, component specs, design tokens
add.build.md:190  **Priority:** plan.md > design.md + about.md > about.md + discovery.md
add.build.md:340  For Frontend: skill will auto-load ux-design if design.md exists
```

`add.build.md:64` declares it receives `HAS_DESIGN` from `status.sh`. The script never emits it. So the wiring is complete and the gate is permanently false — the two `status.sh` fixes above are the whole fix, and they are the reason this topic must not ship without them.

One design refinement is still required: **`:190` makes `plan.md` outrank `design.md` unconditionally.** If `plan-frontend.md` paraphrases the layout lossily and that paraphrase is consolidated into `plan.md`, the builder follows the paraphrase and the contract is decorative. Two changes:

- The frontend section of `plan.md` **references** `design.md` for layout, tokens, and states instead of restating them — the framework's own "Reference, Never Repeat" rule. The layout tree (`03`) lives in `design.md` and is not copied.
- Precedence becomes **domain-scoped**, not blanket: `plan.md` wins on technical contracts (endpoints, DTOs, module structure, types); `design.md` wins on layout, hierarchy, tokens, states, and every `## Design Contract` dimension. `about.md` remains the functional authority.

Without the second change, `04`'s conformance rubric grades an implementation that was steered by a paraphrase of the very contract it is graded against.

**Validation gate.** Writing a `feature-design` doc makes `add.plan` a generator of that schema, and `add-doc-schemas:179` requires the gate as the final step operating on the doc. `add.plan` STEP 12 gates `feature-plan` only. 8.1 must end with a `feature-design` gate.

**Provider fallback.** `add.plan` ships to all 5 providers; agents build only for Claude. Each of 8.1.1–8.1.3 needs the soft-degrade clause the framework mandates and `add.qa` STEP 4.2 already carries — *"if `@X` is not available in this engine, dispatch a generic subagent with this same directive + the skill"*. Without it, STEP 8.1 silently no-ops on 4 of 5 providers and reintroduces Break 2.

### The critique pass

`@ux-agent` in critique mode is prompted adversarially — mandated to hunt a specific defect list, not invited to review:

- ambiguous visual hierarchy; more than one primary CTA per screen
- a required state missing (`empty` / `loading` / `error` / `success`)
- an action in the classification matrix with no UI element serving it
- a value outside the project's spacing or typographic scale
- a custom pattern where an existing component already covers the case
- tap target below 44px at the smallest viewport
- contrast below WCAG AA against the declared tokens
- an entry point in the flow that no layout accounts for

An empty critique must be justified, not accepted silently.

**The coordinator applies accepted items**, rather than re-dispatching `@ux-layout-agent`. Accepted items are localized (a value, a state, a hierarchy), and `add.design` STEP 8A step 3 already does exactly this work (*"Fill gaps if validation finds missing items"*). A third dispatch per UI feature does not pay for itself.

**Every item is recorded** in `design.md` `## Design Review`:

| Item | Severity | Decision | Rationale |
|---|---|---|---|
| Primary CTA duplicated in header and card | major | accepted | consolidated into the header |
| Suggests a breadcrumb on the detail screen | minor | rejected | flow is one level deep — breadcrumb adds noise |

This is not bookkeeping. The **same** `@ux-agent` judges the delivery in `add.qa` (`04`); without this record it would re-raise consciously rejected decisions as findings.

### `screens.json` ownership inversion

Move catalog authoring to `add.plan` STEP 10.0 — the **generic subagent that loads `add-qa-spec`**, not a named `@qa-spec` agent (no such agent is registered; the fragment dispatches a bare prompt) — inverting the skill rule `Do NOT write screens.json`.

Three reasons this is the right owner and the UX agents are not:

1. **Write ordering.** Each `screens.json` entry carries a `design` field pointing at the `design.md` path. That file exists only after 8.1.4 consolidation. UX agents run before it and would reference a file that does not yet exist.
2. **Gate locality.** `qa-pipeline` gating lives in injectable fragments. STEP 10.0 is already a `qa-pipeline` fragment. Agents receive *plugin* fragments, not *feature* fragments — so a catalog branch inside a UX agent would be a hardcoded `if` that cannot see the real flag state.
3. **The right owner is already doing the work.** `add-qa-spec` already derives reachability intent per declared screen. It stops one step short of persisting it.

Resulting ownership, one owner per moment:

| Moment | Owner | Produces |
|---|---|---|
| `add.plan` 8.1 | `@ux-flow-agent` → `@ux-layout-agent` → `@ux-agent` critique → coordinator | `design.md` (+ `## Design Review`) |
| `add.plan` 10.0 (gated) | generic subagent loading `add-qa-spec` | `plan-qa-spec.md` **+ `screens.json`** |
| `add.test` (gated) | `@e2e-agent` | `<surface>.qa.spec` + final selectors in the catalog |
| `add.qa` | `@ux-agent` ∥ `@qa-agent` | `qa-validation-NNN.md` |

**Merge semantics are mandatory, not optional.** `add.plan` on an epic is scoped to **one subfeature** (STEP 7: *"Current subfeature only"*), while `screens.json` is feature-level and shared. Without explicit rules, planning SF03 would rewrite the catalog and drop SF01/SF02 entries, and the next `/add.qa` would report coverage blockers on two previously-clean subfeatures. STEP 10.0 must therefore **read-merge-write by `sf` + `id`**: entries whose `sf` is outside the current scope are preserved byte-identically; entries in scope are replaced; new entries are appended. This mirrors `@e2e-agent`'s existing *"append an entry if the surface is absent"* discipline.

`add.qa-setup` STEP 7 is **demoted to bootstrap/legacy** — still available for projects and features that predate this change, with a note pointing at the plan-owned path as canonical. It must keep running by default, because `add.qa-setup` STEP 9 gates its own smoke test on a scaffolded `screens.json`; if STEP 7 stopped producing one, the command's headline guarantee (*"ends with a `/add.qa` smoke test"*) would degrade to permanent deferral on every fresh project.

### `/add.design` refactor

Survives as the standalone entry point for design-first work and deliberate redesign. It becomes a thin dispatcher of the same three agents:

- STEP 3 inspection → removed (now inside `@ux-flow-agent`)
- STEP 4 complexity gate → removed; the two-agent path is now the only path
- STEP 5/6 → dispatch `@ux-flow-agent` then `@ux-layout-agent`
- STEP 7 `[STOP]` → replaced by the `@ux-agent` critique pass
- STEP 8 consolidation → unchanged in substance, gains `## Design Review`
- STEP 10 → presents the result informatively, does not ask for approval

Three things this refactor must not leave behind:

- **Renumber the whole sequence.** Deleting STEP 4 and STEP 7 leaves `STEP 3, 5, 6, 8, 9, 10`. `add-framework--build.md:161-163` prohibits non-contiguous/fractional numbering — *"renumber the sequence"*.
- **Delete the orphaned prohibitions.** The top-of-file block still carries *"COMPLEXITY GATE NOT EVALUATED (STEP 4)"* (`:42`) and *"DESIGN NOT CONFIRMED BY USER"* (`:44`), and Core Rules `:319`/`:321` repeat them. A prohibition whose gate no longer exists deadlocks the command — the agent cannot satisfy it.
- **Teach `add.design` epic awareness.** It currently extracts no `HAS_EPIC`/`SF_DIR` and hardcodes `docs/features/${FEATURE_ID}/design.md` in the coordinator. Without this, `/add.design` writes feature-level while `add.plan` 8.1 writes SF-level — two `design.md` files and divergent `screens.json` `design` refs. Scope resolution must move into the shared path, not stay in one caller.

Both callers then produce comparable output because the logic lives in the agents.

### `--yolo` and the approval gates both go

`add.plan` carries a `--yolo` argument (`:6`, `:20-21` — *"Skip ALL [STOP] points and clarification questions"*) whose only purpose is bypassing gates. With the design confirmation replaced by the agent critique pass, and `add.design`'s STEP 7 `[STOP]` deleted, there is no approval gate left for it to skip. **Remove the flag and the approval `[STOP]`s together** — a flag that skips nothing is dead surface that still has to be parsed, documented, and reasoned about.

Two distinctions this must not blur:

- **Error gates stay.** `add.plan`'s GATES table entries — `docs_loaded` (*"about.md OR discovery.md missing → STOP, inform user, NEVER dispatch subagents"*), `coverage_validated` (*"Coverage < 100% → STOP, resolve gaps"*) — and the Error Handling table are refusals to proceed on broken input, not requests for approval. They are unaffected.
- **STEP 6 clarification stays.** It is already conditional (*"ONLY ask questions if `about.md` and `discovery.md` leave critical decisions undefined"*), so it is a genuine information need rather than ceremony. Without `--yolo` it simply has no bypass — which is correct, since a plan built on undefined critical decisions is worse than a question.

Scope note: this removes `--yolo` specifically. `F[NNNN]` targeting is load-bearing and stays. A broader audit of unused command arguments across the framework is a separate sweep, not bundled here.

### Alternatives considered

| Option | Verdict |
|---|---|
| One single-pass `ux-agent` doing inspection + flow + layout | **Rejected.** Loses the Flow→Layout reducer that produces better design today; a leaf agent cannot dispatch itself twice |
| Keep inspection in the coordinator | **Rejected.** Forces ~60 duplicated lines across `add.plan` and `add.design` and adds 5+ file reads to a 13-step command |
| Keep the human `[STOP]`, moved into `add.plan` | **Rejected by the owner.** The agent is the specialist; a blocking gate is why `/add.design` gets skipped. Replaced by adversarial critique |
| Re-dispatch `@ux-layout-agent` to apply critique | **Rejected.** Localized edits; consolidation already fills gaps; a third dispatch per feature is not worth the cost |
| UX agents write `screens.json` when the pipeline is on | **Rejected** (see the three reasons above), despite being the initial direction |
| Fractional step `8.0.5` instead of renumbering | **Rejected.** Fractional sub-steps under an epic-only step read as conditional on it |

## Type of Artefact

Two new agents, one rewritten agent, two modified commands, four modified skills, one registry change.

## Scope

### Includes

- `@ux-flow-agent` and `@ux-layout-agent` created and registered in `provider-map.json` (Claude only), each with a **provider soft-degrade clause** in its dispatch block
- `@ux-agent` rewritten with **critique** mode (review mode is specified in `04`); `skills:` array extended; **`memory` removed**; `disallowedTools` left empty
- `@ux-flow-agent` keeps `memory: project` (design-system inspection is expensive and stable); `@ux-layout-agent` omits it
- `add.qa` command-level read-only guard extended to name `ux-agent` — the sole enforcement mechanism now
- **`--yolo` removed from `add.plan`**, together with the approval `[STOP]`s in `add.plan` and `add.design`. Error gates and conditional STEP 6 clarification are untouched
- `add.plan`: STEP 8 renumbered, new STEP 8.1 (gate, provenance-hash idempotency, critique pass, consolidation, `feature-design` validation gate, temp cleanup); STEP 7 **persists** its Frontend selection; STEP 5 Epic row gains `${SF_DIR}/design.md`
- `add.plan` STEP 10.0 fragment: the `add-qa-spec` subagent gains `screens.json` authoring **with read-merge-write semantics by `sf` + `id`**
- `design.md` written at `SCOPE_DIR` with a `## Design Review` section and an `about.md` provenance hash
- **`status.sh`**: SF-level `design.md` detection, and actually emit `HAS_DESIGN` (never emitted today) — this alone activates the `add.build` consumption path that is already wired
- **`add.build` precedence**: `:190` changed from blanket `plan.md > design.md` to domain-scoped — `plan.md` for technical contracts, `design.md` for layout/tokens/states
- **`add.plan` STEP 8.4 (`frontend-agent`) output format**: the frontend section of `plan.md` references `design.md` for layout instead of restating it
- **`add-id-convention` + `feature-design` frontmatter**: SF-qualified design ID (`[NNNN]F-SFxx`) so SF-scoped designs do not collide
- `feature-design` schema gains `## Design Review` with a declared ordinal position and required/optional status (the `## Design Contract` section belongs to `03`)
- `add-qa-spec` skill: `Do NOT write screens.json` inverted; catalog schema + merge rules added
- `add.qa-setup` STEP 7 demoted to bootstrap/legacy but **still running by default** so STEP 9's smoke test does not permanently defer
- `/add.design` refactored to a thin dispatcher: renumbered contiguously, orphaned prohibitions deleted, epic awareness added, `[STOP]` removed
- `add-ecosystem` skill: Agents table (incl. the stale `add.ux` dispatch claim), Dependency Index, `## Main Flows`, and the `add.new → add.design` routing row
- Rebuild + `injection-points.json` regeneration after any anchor-adjacent edit
- **Framework version bump at release** with the affected-command list, per `add-doc-schemas` Self-Governance. No schema-version field exists in the framework and nothing migrates user docs on update, so this is a release-notes obligation rather than a gate mechanism

### Does NOT Include

- Layout notation and the measurable contract block — `03`
- `@ux-agent` review mode and the QA rubric — `04`
- Fix routing — `05`
- `qa-pipeline` default and diagnostics — `01`
- Changing `@e2e-agent`, `add.test`, or the `qa-project` skill
- Non-Claude providers for the new agents
- `add.design` Foundations mode

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Trigger UX dispatch off "Frontend Specialist was selected in STEP 7", with STEP 7 persisting that selection | Reuses a decision `add.plan` already makes instead of adding a second one. **Not deterministic** — it inherits STEP 7's keyword-plus-judgement false-positive rate | ✅ |
| `design.md` idempotency keyed on an `about.md` provenance hash, not mtime | mtime is meaningless after clone/checkout/worktree — it would either skip 8.1 forever or re-run it on every checkout | ✅ |
| `status.sh` must gain SF-level detection and emit `HAS_DESIGN` | `add.build` already consumes `design.md` (`:118`, `:130`, `:184`, `:340`) and declares it gets `HAS_DESIGN` from the script (`:64`), which never emits it. The consumption path is complete and permanently gated off | ✅ |
| `design.md` stays a separate document; it is **not** folded into `plan.md` | `plan.md` is regenerated by `add.plan`, so a replan would destroy design decisions incl. `## Design Review`. Folding also kills design-first (`/add.design` runs before `/add.plan`), forces `add.qa` to extract its UX contract from a technical plan, and makes `screens.json`'s `design` ref point at a plan | ✅ |
| `add.build` precedence becomes domain-scoped, not blanket `plan.md > design.md` | Otherwise a lossy paraphrase in `plan.md` outranks the contract, and `04` grades an implementation steered by a paraphrase of the contract it is graded against | ✅ |
| The frontend section of `plan.md` references `design.md` rather than restating layout | The framework's own "Reference, Never Repeat"; keeps the layout tree single-sourced in `design.md` | ✅ |
| SF-scoped designs get an SF-qualified ID | `feature-design` hardcodes `id: [NNNN]F`; N SF files sharing one ID break single-path ID resolution | ✅ |
| 8.1 ends with a `feature-design` validation gate | `add-doc-schemas:179` requires the gate as the final step operating on a generated doc; `add.plan` STEP 12 gates `feature-plan` only | ✅ |
| Every 8.1 dispatch carries a provider soft-degrade clause | `add.plan` ships to 5 providers, agents build for 1. Without it, 8.1 no-ops on 4 and reintroduces Break 2 | ✅ |
| STEP 10.0 read-merge-writes `screens.json` by `sf` + `id` | Epic plans are SF-scoped while the catalog is feature-level; a blind write drops sibling SFs and manufactures coverage blockers | ✅ |
| `add.qa-setup` STEP 7 keeps running by default despite the demotion | STEP 9's smoke test is gated on a scaffolded `screens.json`; stopping STEP 7 makes the command's headline guarantee permanently defer | ✅ |
| Two sequential spec agents, not one | Preserves the Flow→Layout reducer; a leaf agent cannot dispatch itself twice | ✅ |
| `@ux-agent` kept, promoted to critic/reviewer at both ends | No orphaned agent, no third UX agent, and the eye that critiques the proposal judges the delivery | ✅ |
| Inspection descends into `@ux-flow-agent` | Eliminates duplication between the two callers and keeps `add.plan` light | ✅ |
| UX step runs before Database and Backend, not just Frontend | STEP 5 already states `design.md` informs backend contracts | ✅ |
| Renumber STEP 8 sub-steps rather than use `8.0.5` | Readability; a fractional step under the epic-only `8.0` reads as conditional on it | ✅ |
| No human `[STOP]`; adversarial critique, one bounded pass | Owner decision — the agent is the specialist. Preserves daily-flow ergonomics | ✅ |
| Critique prompt carries an explicit defect list; empty critique must be justified | A reviewer without a defect mandate becomes an echo | ✅ |
| Coordinator applies accepted items | Localized edits; consolidation already fills gaps; avoids a third dispatch | ✅ |
| `## Design Review` records accepted **and** rejected items with rationale | Stops the same agent re-raising closed decisions as findings in `add.qa` | ✅ |
| `design.md` at `SCOPE_DIR`; `screens.json` stays feature-level | Mirrors `add.qa` STEP 2 resolution; one catalog per feature with `sf` filtering | ✅ |
| Skip 8.1 when `design.md` exists and is not older than `about.md` | Idempotency plus the drift check the existing guard lacks | ✅ |
| `screens.json` owned by the STEP 10.0 generic subagent loading `add-qa-spec` | Write ordering, gate locality, and the owner already derives the intent | ✅ |
| `add.qa-setup` STEP 7 demoted, not deleted | Legacy projects and pre-existing features still need it | ✅ |
| `/add.design` retained as a thin dispatcher | Design-first and redesign flows stay possible with identical output | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `ux-flow-agent` | New; `skills:` set; **`memory: project` kept**; soft-degrade clause in its dispatch block | Create + register |
| `ux-layout-agent` | New; `skills:` set; **no `memory`**; soft-degrade clause in its dispatch block | Create + register |
| `ux-agent` | Critique mode added; review mode stubbed for `04`; `skills:` extended; **`memory` removed**; `disallowedTools` left empty | Rewrite |
| `add.plan` | STEP 8 renumbered; STEP 8.1 added incl. `feature-design` gate; STEP 7 persists the UI decision; STEP 5 Epic row gains `design.md`; STEP 10.0 fragment extended | Modify |
| `add.design` | Inspection + complexity gate + `[STOP]` removed; **sequence renumbered contiguously**; orphaned prohibitions deleted; epic awareness added | Refactor |
| `scripts/status.sh` | SF-level `design.md` detection; emit `HAS_DESIGN`. Activates the already-wired `add.build` consumption path | **Modify (was missing)** |
| `add.build` | `:190` precedence becomes domain-scoped (`plan.md` = technical contracts, `design.md` = layout/tokens/states). No new consumption logic — it already reads the file | **Modify (was missing)** |
| `add.qa-setup` | STEP 7 demoted but still default-on; STEP 9 interaction verified | Modify |
| `add-qa-spec` skill | Catalog rule inverted; schema + merge semantics added | Modify |
| `add-doc-schemas` skill | `feature-design` gains `## Design Review` appended to the `Sections:` list; `SCOPE_DIR` resolution with feature-level fallback noted (`_qa-report/` precedent); SF-qualified ID; framework version bump at release | Modify |
| `add-id-convention` skill | SF-qualified design ID | **Modify (was missing)** |
| `add-ux-design` skill | Gains the critique defect list | Modify |
| `add-ecosystem` skill | Agents table (fix the stale `add.ux` dispatch claim), Dependency Index rows for the new agents, `## Main Flows`, `add.new → add.design` routing row | Modify |
| `provider-map.json` | Two agents registered | Modify |
| `cli/src/plugins.json` + `plugins/gitnexus/fragments/agents/*.md` | Required if the new agents carry a `gitnexus` marker — a marker alone injects nothing | **Modify (was missing)** |
| `injection-points.json` | Regenerated; `- 8.3: Frontend Specialist` is the anchor for two `step-list` markers and the renumber rewrites it | **Rebuild (was missing)** |
| `add.test`, `e2e-agent` | Contract unchanged; now always find a populated catalog | None |
| `web/public/commands.svg`, `flows.svg` | Command map and flows change | `add-framework--sync` |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Every screen-bearing feature gets a contract, at the path the judge reads | 3 extra sequential dispatches on any UI feature in `add.plan` |
| One owner per artefact per moment | `add.qa-setup` STEP 7 becomes a second, legacy code path to maintain |
| Traceable design decisions | A new `design.md` section to maintain |
| `frontend-agent` always plans against a contract | Design quality now gates plan quality — a weak design propagates |
| Design no longer interrupts the flow | No human sign-off before implementation |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| STEP 8 renumbering breaks references **and an injection anchor** | **High** | `- 8.3: Frontend Specialist` anchors both `feature:qa-pipeline:step-list` and `feature:tdd:step-list`. Known references: `add.plan.md:61-64`, `:225`, `:246`, `:293`, `:361`. Grep across `framwork/.codeadd/`, `.claude/`, `web/`, fragments; then **rebuild** to regenerate `injection-points.json` |
| `add.plan` cost/latency growth on UI features | High | Sequential by existing design; critique is one bounded pass; provenance-hash skip avoids re-running unchanged features. **Add a size threshold** so a one-component change does not trigger full design-system inspection — STEP 7's own example is *"Simple UI change → Frontend Specialist only"* |
| Adversarial critic degrades into an agreeable reviewer | Med | Explicit defect list in the prompt; empty critique must carry a justification. **The critic and the layout author both load `add-ux-design`**, so the author can pre-satisfy the checklist — the critic's list must live in a section the author does not receive |
| Structural critique arrives too late to re-architect | Med | Accepted: structural critique here signals a weak `about.md`, not a weak layout, and surfaces as a gap for the user |
| Non-UI features accidentally trigger 8.1 | **Med** | Gate keys off STEP 7's persisted selection rather than re-detection, but STEP 7 is itself a keyword matrix plus judgement — a backend `about.md` containing "no UI changes" satisfies it. Threshold + a cheap early exit in `@ux-flow-agent` when no frontend exists (`add.design` STEP 3.5 already models this) |
| Backend-only epic subfeatures get no `design.md`, and `add.qa` scoped there still fails | High | Real and out of scope: the non-web-surface gap is a deferred follow-up in the umbrella. `01` makes the `design.md` row `degrade`, not `block`, so the functional axis still runs |
| `@ux-flow-agent` inspection is expensive on large codebases | Low | Three mitigations: it keeps `memory: project` so a stable design system is not re-derived every feature; the scope stays bounded per `add.design` STEP 3 (3–5 reference pages, not a full sweep); and the `gitnexus` marker helps where available. The scope gate also skips 8.1 entirely for changes confined to existing components |
| Two callers drift apart over time | Low | Logic lives in the agents; the commands only dispatch |
| `@ux-agent` is write-capable while acting as a judge, with only a prose guard | Med | Resolved by decision: `disallowedTools` stays empty (consistent with `@qa-agent`), so `add.qa`'s command-level guard is extended to name `ux-agent` and becomes mandatory rather than optional. Static frontmatter could not express the critique/review distinction anyway |
| Removing `memory` degrades an agent that benefited from it | Low | Removed only from judges and per-dispatch authors, which carry nothing stable. For the review role it is a **benefit** — with nothing to recall, the judge must read `design.md` and the evidence. `@ux-flow-agent`, the one agent whose work is expensive and whose result is stable, keeps it |
| Deviating from 13/13 `memory: project` practice invites inconsistency elsewhere | Low | The deviation is role-scoped and stated in the agent files: judges and per-dispatch authors omit `memory`; agents that re-derive stable context keep it. Not proposed as a framework-wide policy change |
| In-flight epics with a feature-level `design.md` break after the move | **Low — resolved by fallback, no migration** | `add.qa-setup.md:180` already assumes both levels coexist (*"Read every `design.md` under the feature (feature-level and each subfeature)"*). So `SCOPE_DIR/design.md` resolution **falls back to `FEATURE_DIR/design.md`** when the SF-level file is absent. This follows the framework's own precedent for a changed path convention — the `_qa-report/` → `_tests/` note (*"legacy projects keep their old reports in place; new runs write under `_tests/`"*): abandon nothing, relocate nothing, record one line in the schema. No migration script, and `add-qa-migration` is not involved (it is a test-tooling dispatch policy, explicitly *"no bespoke migration mechanism"*) |
| Enabling this on 4 non-Claude providers ships a step whose agents do not exist | High | Soft-degrade clause on every dispatch (now in Scope); without it the command is broken, not merely limited |

## Next Steps

Run: `/add-framework--plan implement docs/brainstorming/2026-07-26-02-ux-agent-design-ownership.md`
