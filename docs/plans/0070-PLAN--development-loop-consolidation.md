# Plan: Development Loop Consolidation — collapse add.qa/add.test, agentise, orchestrate

> **Status:** implemented
> **Type:** architecture (commands + agents + fragments + build pipeline + CLI registries)
> **Created:** 2026-08-24
> **Author:** Maicon + Claude (ADD Strategy)

---

## Context

The delivery half of the framework exposes five commands the user sequences by hand — `add.plan`, `add.build`, `add.test`, `add.qa`, `add.review` — plus `add.done`. The sequencing rules already exist, but only as prose: `add.review` STEP 8.3 spells out a four-branch routing ladder including the `/add.qa` ⇄ `/add.build qa` cycle, and `add.done` carries defensive re-validation because it cannot trust the user followed it.

Two of those commands are phases of their neighbours that were given their own file. `add.test` produces test artefacts for code `add.build` just wrote. `add.qa` judges the rendered result of that same code, and the only consumers of its report are `add.build qa` and `add.review`.

**Every decision in this plan was taken and reviewed in the brainstorm set below. This plan does not re-derive them — it points at them.** Read the umbrella first; each F-block names the refinement document that carries its contracts, examples and rejected alternatives.

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-08-24-development-loop-consolidation-000-umbrella.md` | Cross-cutting decisions, decomposition map, dependency order |
| `…-001-tdd-pipeline-rename.md` | Alias mechanism, the seven failure modes, normalisation write path |
| `…-002-named-agents-five-providers.md` | Depth-1 rationale, per-provider frontmatter dialects, `.agents/` collision |
| `…-003-test-into-build.md` | Two-halves split, mode independence, CORRECTION red-green, self-check placement |
| `…-004-qa-into-review.md` | Three-section absorption, two-report model, `judged-tree`, Fix Routing union rule |
| `…-005-plan-to-ready-orchestrator.md` | Loop shape, convergence definition, three outcome states, epic scoping |

All six passed `@plan-review-agent` at `fix-then-ok` with zero blockers after two adversarial rounds.

## Problem

1. **The loop is documented, not executed.** The user is the state machine; every hand-off is a chance to skip a gate.
2. **There is no depth budget for an orchestrator built on commands.** Subagents are leaf-only (depth 1). Dispatching "run `/add.build`" yields an agent that must dispatch `@backend-agent` at depth 2. `add.autopilot` is built this way today and silently degrades to inline execution, losing the parallel fan-out.
3. **Half the heavy work has no dispatchable owner.** `add.test`'s area generators and `add.build`'s fix subagent are anonymous inline dispatches.
4. **`agentDispatch: true` is declared for five providers and delivered for one.** Only `claude` has an `agents` output pattern in `provider-map.json`.
5. **The judge mutates the object it judges.** `add.review`'s AUTO-CORRECTION RULE is what produces `QA_BASELINE_INVALIDATED` — an oscillation source that would consume the loop's whole iteration budget.
6. **A bare `tdd` → `tdd-pipeline` rename is silent data loss.** `applyEnabledFeatures` falls back to `meta.default` on an unknown key, re-enabling TDD for anyone who explicitly disabled it.

## Proposal

Consolidate, then agentise, then orchestrate — in that order, because each stage is what makes the next affordable.

**Consolidate.** `add.qa` and `add.test` stop being distributed. `add.test` splits along its existing seam: unit/integration generation under `tdd-pipeline`, E2E authoring under `qa-pipeline`, both folded into `add.build`. `add.qa` is absorbed into `add.review`'s base body as three cost-separated sections that self-gate on the `add.qa-setup` receipt exactly as `add.qa` does today. This cuts the orchestrator's coordination surface from five commands to three.

**Agentise.** Every heavy unit gets a named leaf agent — `@test-agent` and `@fix-agent` are created, the rest already exist — and `add.build`/`add.review` become thin coordinators over explicit agent lists. Agents ship to all five providers, which requires a per-provider frontmatter transform and a TOML emitter for Codex.

**Orchestrate.** `/add.plan-to-ready` runs at depth 0, dispatches those same agent rosters at depth 1, and loops `build ⇄ review` at most three times against a convergence definition that *is* `add.done`'s gate set evaluated in dry-run. It stops at convergence and returns control; the merge stays human. `add.autopilot` is removed.

The catalogue goes from 18 commands to 16 while gaining capability.

## Scope

### Includes

Feature blocks are grouped by umbrella topic. **Execute in block order** — the dependency chain is real (see *Execution Order*).

#### T1 — `tdd` → `tdd-pipeline` (ref: brainstorm 001)

- **F1** — `cli/src/features.js`: rename the key; add `aliases: ['tdd']`; make alias resolution precede `meta.default` at the three resolution sites (`applyEnabledFeatures`, `getFeatureStates`, the `features` CLI entrypoint); add the **unconditional normalisation pass** described in brainstorm 001 §Proposed Solution (canonical key written, resolved alias dropped, on every run regardless of enabled state — `saveManifest` is otherwise never reached for a disabled feature).
- **F2** — `git mv framwork/.codeadd/fragments/tdd/` → `fragments/tdd-pipeline/`; re-key the **9** `feature:tdd:*` marker pairs (`add.plan` 2, `add.build` 5, `add.review` 2) to `feature:tdd-pipeline:*`. Pairs stay empty (plan 0067's guard enforces it).
- **F3** — `framwork/.codeadd/scripts/qa-preflight.sh:38-39`: extract the duplicated literal manifest-key probe so the string appears once; update `framwork/.codeadd/scripts/tests/qa-preflight.bats:41,48`.
- **F4** — `cli/tests/features.test.js`: guard case asserting every `FEATURES` key has a matching directory under `framwork/.codeadd/fragments/` (a test, not a build gate — `build.js` has no CLI-registry import and adding one is more coupling than the check is worth).
- **F5** — Copy: `cli/src/installer.js:287` display string; `framwork/.codeadd/skills/add-ecosystem/SKILL.md:107-108` feature table; `web/src/pages/docs.astro:582-590` feature card.

#### T2 — Named leaf agents across five providers (ref: brainstorm 002)

- **F6** — `framwork/.codeadd/agents/test-agent.md`: new leaf agent owning unit/integration generation for one area. Absorbs `add.test` STEP 3.1's common prompt + 3.2's area additions. Read-write on test files only (`add.test.md:281`'s existing constraint).
- **F7** — `framwork/.codeadd/agents/fix-agent.md`: new leaf agent owning correction. Consumes one area-scoped slice of `## Fix Routing`. Replaces the three anonymous fix dispatches in `add.build` (L396-405, L482, L503). **The attempt counter is supplied by the caller** — a leaf agent cannot see its own history, and the cap must live where the outer loop can see it.
- **F8** — `framwork/provider-map.json`: register both agents; add an `agents` output pattern for `codex`, `cursor`, `opencode`, `antigrav`. **Resolve the canonical directory against current vendor docs before writing any value** — today `codex.dir` is `framwork/.agents` while Codex docs point at `.codex/agents/`, and `antigrav.dir` is `framwork/.agent` (singular) while Antigravity's native agents live at `.agents/agents/`. See brainstorm 002 §Discovery table and its `.agents/` collision risk row. Do not guess these strings. If the vendor docs are ambiguous or unreachable at build time, **stop and ask** rather than defaulting — a wrong path ships agents nobody loads, and the failure is silent.
- **F9** — `scripts/build.js`: replace the Agents passthrough strategy with a per-provider frontmatter transform (dialects in brainstorm 002 §Discovery), then a TOML emitter for Codex carrying the body in `developer_instructions`. **Land the three MD providers first and Codex last** so a TOML-specific problem cannot block the other four.
- **F10** — `framwork/.codeadd/commands/add.build.md`: restructure into a thin coordinator over an explicit agent list (agent name, capability, inputs, expected report shape). Gates, mode detection, state reads and merge procedures stay in the command — that is coordination. The nine ABSOLUTE INVARIANTS and the existing gate registry are the acceptance checklist for the restructure; none may be lost.
- **F11** — `framwork/.codeadd/commands/add.review.md`: same restructure. Gates 1–7 (L39-156) are its canonical hard-stop registry and are the acceptance checklist.

#### T3 — `add.test` into `add.build` (ref: brainstorm 003)

- **F12** — Delete `commands/add.test.md`, its `provider-map.json:77` entry, and `fragments/qa-pipeline/add.test.md`.
- **F13** — `fragments/tdd-pipeline/add.build.md` gains generation sections (framework detection + auto-configure, existing-contract-test awareness, `@test-agent` dispatch per area, coverage reporting). **These fire in all four `add.build` modes.** The existing `tasks-flow` / `gate` / `verify-red` / `awareness` sections remain TASKS-scoped; the new sections anchor at mode-independent points — detection during context setup, dispatch alongside each area's implementation, coverage inside STEP 12's verification section. CORRECTION mode runs red-green (a failing test so the bug cannot recur), never a regeneration sweep. Contracts in brainstorm 003 §Proposed Solution.
- **F14** — `fragments/qa-pipeline/add.build.md` gains `e2e-dispatch` beside the existing `qa-fix`, anchored **after the area validators return** — `@e2e-agent` requires existing components and stable selectors, and the WAIT-ALL it needs is already there.
- **F15** — Self-detection notices for both halves, placed in `add.build`'s **ungated base body**, never inside the fragment they describe. This is why `add.test.md:213`'s existing E2E self-check sits outside its markers: a notice nested in the block it reports on cannot render when that block was not injected.
- **F16** — Reroute `/add.test` references: `add.build.md:575` (its own STEP 15 next-step line), `add.qa.md:156-158` (superseded by T4), `add-ecosystem/SKILL.md`, `web/`. `README.md` carries none.

#### T4 — `add.qa` into `add.review` (ref: brainstorm 004)

- **F17** — Delete `commands/add.qa.md` and its `provider-map.json:80` entry.
- **F18** — `add.review.md` base body gains the absorbed content as **three sections split by cost** — *preflight*, *evidence*, *judgement* (boundaries and skip triggers in brainstorm 004 §Absorption shape). **Not a fragment and not feature-gated**: they self-gate on the `add.qa-setup` receipt exactly as `add.qa` does today, so a project that ran `/add.qa-setup` and declined `qa-pipeline` keeps its QA judgement. `qa-pipeline` continues to gate authoring and correction, never judgement.
- **F19** — Read-only conversion: remove the AUTO-CORRECTION RULE; `@reviewer-agent` becomes read-only; **Gate 5** ("review build errors, fix automatically, repeat until passing") is the real conversion and becomes a routed finding; **Gate 6** already refuses to auto-fix — only its output format folds into the same rows.
- **F20** — Unified `## Fix Routing` on `review-NNN.md`: the **union** of each in-scope `SCOPE_DIR`'s existing per-scope `qa-validation-NNN.md` Fix Routing rows (that schema section is unchanged) plus code-review, build and validation-gate findings. No dedup rule — rows are scope-qualified. Ordering: existing severity precedence, then the database→backend→frontend→e2e area order the `qa-fix` fragment already uses. Retire the `/add.build qa` argument mode and its pre-check at `add.build.md:150`.
- **F21** — Versioned output: `review.md` → `review-NNN.md`, **flat at the feature-directory root, one sequence per feature**. `add.build` appends a resolution annex per routed row and marks the document finalized. Remove Gate 7's `review.md.prev` backup rule. **Create** a `review` schema entry in `add-doc-schemas/references/review.md` (none exists — the file defines `audit-report`, `diagnose-report`, `qa-validation` only, and `review.md`'s shape is ad hoc inline in STEP 8). **Extend** the `qa-validation` entry with `judged-tree`, the fingerprint that makes the evidence skip predicate possible across invocations; that entry is otherwise retained, because `qa-evidence.sh validate`/`working-baseline`/`previous` and `add.done.md:195,197` depend on it. **The two reports coexist** — `review-NNN.md` is a feature-level aggregate, not a replacement for the per-scope QA reports.
- **F22** — `add.done.md`: STEP 4.0 reads the highest-numbered `review-NNN.md`; L355 prose retargeted. Nothing else in `add.done` changes.
- **F23** — `cli/src/plugins.json:42-44`: retarget `playwright.injects` from `add.qa` to `add.review`; move the `plugin:playwright:drive` anchor with the *judgement* section.
- **F24** — Retarget `/add.qa` references: `agents/qa-agent.md`, `agents/ux-agent.md`, `agents/e2e-agent.md:31` (boot-failure deferral), `skills/add-qa/SKILL.md`, `skills/add-qa/references/coordinator.md:3` ("loaded by /add.qa and by nothing else"), `scripts/qa-preflight.sh:4`, `scripts/status.sh` `HAS_REVIEW` detection, `commands/add.md:106`, `add-ecosystem/SKILL.md`, `web/`.

#### T5 — `/add.plan-to-ready` (ref: brainstorm 005)

- **F25** — `framwork/.codeadd/commands/add.plan-to-ready.md`: new. Flow, convergence definition, three outcome states and epic scoping are specified in brainstorm 005 §Proposed Solution. Load-bearing points the build must not soften: it dispatches **agent rosters, never commands** — including for the plan leg, where it takes over `add.plan`'s coordinator role rather than dispatching a subagent told to "read `{{cmd:add.plan}}` and execute it"; the cap is **3 per invocation, not cumulative**; the dry-run convergence check touches `add.done` STEP 4.0–4.2 only (STEP 5's `qa-evidence.sh promote` has side effects); the coordinator itself writes the resolution annex into the previous round's `review-NNN.md`.
- **F26** — Delete `commands/add.autopilot.md` and its `provider-map.json` entry; register `add.plan-to-ready` for all five providers.
- **F27** — Reroute `/add.autopilot` references: `commands/add.md` suggestion table, `add-ecosystem/SKILL.md`, `web/`, SVGs.

#### T6 — Cross-cutting closure

- **F28** — The **Red-Green Validation Matrix** below. Written FIRST, RED before any of F1–F27 lands. Includes one explicit sub-task: **rewrite `cli/tests/qa-reachability.smoke.test.js`** (~26 references asserting exact STEP numbers and table content across `add.qa`, `add.qa-setup` and `add.test`). Two of those three commands cease to exist, so this is a rewrite against the new hosts, not a re-anchoring pass — size it as its own task.
- **F29** — `node scripts/build.js`: regenerate all provider outputs, `injection-points.json` and `contracts.json`. Verify the new injection map (see matrix L3) and that anchor-uniqueness validation passes on the newly crowded `add.build` and `add.review`.
- **F30** — Regenerate `add-ecosystem/SKILL.md` (command/skill/agent/plugin tables + the whole next-command routing graph), then `/add-framework--sync` for `README.md`, `web/src/pages/docs.astro` and the three SVGs.

### Does NOT Include (important!)

- **Anything under `CLAUDE.md` or `.claude/`** — `/add-framework--build` does not reach them. Four companion `/add-framework--self-plan` runs are named in *Next Steps*.
- Renaming `add.qa-setup` — its name is load-bearing for the `contracts.json` shape and the `docs/qa/qa-setup.md` receipt path.
- Changing the `qa-pipeline` default (stays `false`) or the `tdd-pipeline` default (stays `true`).
- Changing the dual-judge rubric, axis ownership, severity taxonomy or merge rules (Plan 0059 stands).
- Changing the `add.qa-setup` `## Materializes` contract or the `setup-shape` mechanism (Plan 0068 stands).
- Changing `qa-evidence.sh` promotion semantics, the `_tests/final/` rules, or the per-scope `qa-validation` report shape beyond adding `judged-tree`.
- Changing `add.done`'s merge behaviour or its gate semantics beyond F22.
- Deleting orphaned `fragments/tdd/` from already-installed projects — `applyFromZip` never deletes by design, and the sidecar names no point there, so they are inert.
- Adding `plugin:gitnexus:graph` markers to `@test-agent` / `@fix-agent`. Exclusion is enforced by absence of a marker; these two are deliberately excluded so the injection map stays at gitnexus 20.
- Renaming the `add-tdd` skill or its `provider-map.json` entry — skill names and feature keys are separate namespaces.
- Absorbing `add.new` or `add.brainstorm` into the orchestrator — discovery stays human.
- Epic-wide orchestration: `/add.plan-to-ready` v1 targets one feature or one subfeature per invocation.
- A configurable iteration cap in v1.

## Validated Decisions

Full rationale and rejected alternatives live in the brainstorms. These are the decisions the build must not re-open.

| Question | Decision | Ref |
|----------|----------|-----|
| What happens to `add.qa` / `add.test` | Stop being distributed as commands; logic moves into the host | umbrella |
| How the logic moves | Feature-gated injected sections for the `add.build` halves; **ungated base body** for the absorbed QA | 003, 004 |
| Orchestrator shape | Shape B complete — named leaf agents, commands become thin coordinators, depth 1 everywhere | 002 |
| Provider reach | All five, Codex TOML included; MD providers first | 002 |
| Rename safety | `aliases: ['tdd']` resolved before `meta.default`, plus an unconditional normalisation pass | 001 |
| TDD off | No unit/integration generation at all — the feature means the pipeline, not just the ordering | umbrella |
| Generation modes | All four `add.build` modes; CORRECTION runs red-green, not regeneration | 003 |
| Review mutability | Read-only on code; the build corrects | 004 |
| Correction contract | One `## Fix Routing` table, union across scopes, replacing both current paths | 004 |
| Review output | `review-NNN.md` flat at the feature-directory root, per feature; the build annotates and finalizes | 004 |
| QA gating | Not feature-gated — self-gates on the `add.qa-setup` receipt, preserving today's behaviour | 004 |
| Skip predicate | `judged-tree` on the `qa-validation` schema; no new file, no new state kind | 004 |
| Command name / boundary | `/add.plan-to-ready`; converges and returns control, merge stays human | 005 |
| Convergence | The `add.done` gates in dry-run — one definition of "ready" | 005 |
| Give-up | 3 iterations per invocation, plus early exit on two identical rounds | 005 |
| `add.autopilot` | Deleted, not refactored | umbrella |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| 18 commands → 16, with more capability | `/add.qa` and `/add.test` muscle memory |
| One executable definition of "ready", shared by the loop and `add.done` | Running a cheap standalone QA pass without entering `add.review` |
| A convergent loop instead of an oscillating one | `add.review`'s auto-correction convenience for manual single-pass use |
| Real `agentDispatch` parity across five providers | The build's markdown-only invariant, reopened for the agents strategy |
| Two large commands restructured into inspectable agent lists | A large coordinated change landing in one build run |
| An auditable per-iteration record of findings **and** their resolutions | The single well-known `review.md` filename |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Silent TDD re-enablement for users who explicitly disabled it | High if F1 is done naively | Matrix L2 is a hard red-green gate on exactly this scenario |
| CI breaks in cascade as text anchors move | High | Every T-block carries its own re-anchoring item; matrix L5 catches dangling references |
| `qa-reachability.smoke.test.js` rewrite underestimated (~26 refs asserting exact STEP numbers and table content) | High | Treat as its own build task under F28, not a cleanup step |
| `.agents/` directory collision between Codex and Antigravity | Medium | F8 forbids guessing — resolve against vendor docs first |
| Codex TOML emitter stalls T2 | Medium | F9 sequences MD providers first; Codex lands last |
| Anchor-uniqueness validation fails on the newly crowded `add.build` | Medium | F29 runs the build early, not at the end; the guard already fails loud |
| `review-NNN.md` rename breaks an unenumerated consumer | Medium | Known set: `add.done` STEP 4.0, `status.sh` `HAS_REVIEW`, `add.md:106` and its suggestion table, Gate 7's `.prev` rule, `done.bats`, `add-ecosystem`. Grep for `review.md` as an explicit task |
| Generation sections attach only at TASKS-MODE points, silently dropping 3 of 4 modes | Medium | Matrix L6.3 asserts generation in DEVELOPMENT and FEATURE mode |
| The loop reports CAP_REACHED in a way that reads as success | Medium | Matrix L7 asserts the three states are distinct and never softened |
| `add-ecosystem/SKILL.md` drifts and `/add` suggests removed commands | High | F30 treats it as a first-class derived artefact; matrix L5 asserts zero dangling references |

## Ecosystem Impact

| Component | Necessary action |
|-----------|------------------|
| `commands/add.qa.md`, `add.test.md`, `add.autopilot.md` | Delete (F12, F17, F26) |
| `commands/add.plan-to-ready.md` | Create (F25) |
| `commands/add.build.md` | Thin coordinator + 2 new injection sites + self-checks (F10, F13–F15) |
| `commands/add.review.md` | Thin coordinator + read-only + 3 base-body sections + `review-NNN.md` (F11, F18–F21) |
| `commands/add.done.md` | Read the highest `review-NNN.md`; L355 prose (F22) |
| `commands/add.plan.md`, `add.md` | Marker re-key (F2); reference reroutes (F24, F27) |
| `agents/test-agent.md`, `fix-agent.md` | Create (F6, F7) |
| `agents/reviewer-agent.md` | Read-only (F19) |
| `agents/qa-agent.md`, `ux-agent.md`, `e2e-agent.md` | Dispatcher/deferral retarget (F24) |
| `fragments/tdd/` → `fragments/tdd-pipeline/` | Rename + new sections (F2, F13) |
| `fragments/qa-pipeline/add.test.md` | Delete; content moves to `add.build` (F12, F14) |
| `framwork/provider-map.json` | 3 entries removed, 1 command + 2 agents added, 4 `agents` patterns added (F8, F12, F17, F26) |
| `scripts/build.js` | Agents strategy: per-provider transform + TOML emitter (F9) |
| `scripts/qa-preflight.sh`, `status.sh` | Key probe extraction (F3); `HAS_REVIEW` (F24) |
| `cli/src/features.js` | Rename + alias + normalisation (F1) |
| `cli/src/installer.js` | Display string at L287 (F5) |
| `cli/src/plugins.json` | `playwright.injects` retarget (F23) |
| `skills/add-qa/**` | Dispatcher retarget — SKILL.md and `references/coordinator.md:3` (F24) |
| `skills/add-doc-schemas/references/review.md` | Create the `review` entry; extend `qa-validation` with `judged-tree` (F21) |
| `skills/add-ecosystem/SKILL.md` | Regenerate — command, feature, agent, plugin tables + routing graph (F30) |
| `cli/tests/**` | Red-green matrix + re-anchoring (F28) |
| `README.md`, `web/`, SVGs | `/add-framework--sync` (F30) |
| `CLAUDE.md`, `.claude/**` | **Out of scope** — four companion self-plans (see Next Steps) |

---

## Red-Green Validation Matrix (spec for the build phase)

**Discipline: RED first.** Write every level below BEFORE any of F1–F27 lands, and verify each fails against the current tree — that is the proof the tests bite. Then drive them GREEN. No F-block lands without its failing test already on record. This is the same discipline plan 0067 established; extend its suites rather than starting new ones.

### Expected injection map after the change (38 points, was 35)

| Namespace | Resource | Sections | Count |
|-----------|----------|----------|-------|
| feature `tdd-pipeline` | add.plan | `step-list`, `step9` | 2 |
| | add.build | `tasks-flow`, `gate`, `verify-red`, `awareness`, `verification` + the 3 new generation sections | 8 |
| | add.review | `step-list`, `spec-audit` | 2 |
| feature `qa-pipeline` | add.plan | `step-list`, `qa-spec` | 2 |
| | add.build | `qa-fix`, `e2e-dispatch` | 2 |
| plugin `gitnexus` | unchanged (5 commands + add.wiki 6 + 9 agents) | — | 20 |
| plugin `playwright` | add.review `drive`, qa-agent `drive` | — | 2 |

`add.test` and `add.qa` contribute zero. `@test-agent` and `@fix-agent` carry no markers by design. **The build must assert this map, not assume it** — a count mismatch is a failure, not a rounding difference.

### L1 — Build-side unit (RED → GREEN)

1. Plan 0067's empty-marker guard still fires on the re-keyed `tdd-pipeline` pairs (regression: the rename must not smuggle content back in).
2. Anchor-uniqueness and variable-adjacency validation pass on `add.build` (now 10 points) and `add.review` (now 3). RED expectation: at least one new anchor collides or lands adjacent to a `{{cmd:}}`/`{{skill:}}` line on first authoring.
3. Agent files are emitted for all five providers with the correct frontmatter dialect per provider. A missing agent file must **fail loud**, never degrade silently.
4. Codex agent output parses as valid TOML and carries the body in `developer_instructions`.
5. `injection-points.json` and `contracts.json` regenerate; `contracts.json` is unaffected by this change (only `add.qa-setup` declares a contract).
6. **F3 coverage** — the literal `qa-pipeline` manifest-key string appears exactly once in `qa-preflight.sh` (the extracted probe), and `framwork/.codeadd/scripts/tests/qa-preflight.bats` passes against it. *RED today: the literal appears at L38 and L39, duplicating `cli/src/features.js` outside the registry.*
7. **F5 coverage** — every copy location reads `tdd-pipeline`, not `tdd`. `add-ecosystem/SKILL.md`'s feature table is asserted against the **provider-transformed copies** (it is a `.codeadd/` skill and goes through `scripts/build.js`), so a stale build is caught too. `cli/src/installer.js:287` and `web/src/pages/docs.astro:582-590` are asserted **directly against source** — neither has a separate build step in this pipeline, so source and output are the same file.

### L2 — Rename migration red-green (T1's whole reason to exist)

1. Manifest `{"features": {"tdd": false}}` → run `applyEnabledFeatures` → the feature resolves **disabled**. *RED today: resolves to `meta.default` (`true`) and silently re-enables.*
2. Same manifest → after the normalisation pass, `features` contains `tdd-pipeline: false` and **no** `tdd` key.
3. Manifest `{"features": {"tdd": true}}` → resolves enabled, normalises to `tdd-pipeline: true`.
4. `codeadd features disable tdd` → succeeds, acts on the canonical key, prints a deprecation notice. *RED today: `Unknown feature "tdd"`.*
5. `codeadd features list` → annotates any row whose manifest still carries a legacy alias key.
6. Every `FEATURES` key has a matching `framwork/.codeadd/fragments/<key>/` directory (F4's guard). *RED between F1 and F2.*

### L3 — Per-feature exactly-once on the new map

For each of `tdd-pipeline` and `qa-pipeline`, on a fresh install fixture, per provider:

1. Capture baseline bytes **B**.
2. `enable` → every section's signature text appears **exactly once**; `modified > 0`.
3. `disable` → bytes **equal B**, byte-identical.
4. Re-`enable` → bytes equal the first-enabled bytes **E1** (idempotent).
5. **Stale-variant assertions:** no `feature:tdd:` marker or `fragments/tdd/`-era signature appears in either state.

### L4 — Combination matrix (the consistency guarantee across replaces)

This is the level that certifies the *end state* of the replaces, not merely that a replace happened. `add.build` is the stress point — it now carries 10 injection points across two features, several sharing anchors.

1. **All four feature states** — (`tdd-pipeline`, `qa-pipeline`) ∈ {off/off, on/off, off/on, on/on}. For each: every expected section appears exactly once, every unexpected section is absent, and `add.build` parses as a coherent command in all four (no orphaned heading, no dangling "see the section below" pointing at nothing).
2. **Shared-anchor non-collision** — with both features on, sections sharing one anchor on `add.build` all land after it, in a deterministic order, with none clobbering another.
3. **Partial disable** — disable one feature while the other stays on → only its sections are removed; the sibling's bytes are untouched.
4. **Order independence** — enable in reversed order (`qa-pipeline` before `tdd-pipeline`) → final bytes identical to the normal order.
5. **Features × plugins** — both features on, `gitnexus` + `playwright` on → all 38 points exactly once. `add.review` is the second stress point: two feature sections, one plugin section, and three ungated base-body sections coexisting.
6. **Plugin round-trip after the retarget** — `playwright` enable/disable against `add.review` (not `add.qa`) is byte-identical; the agent-side `qa-agent` injection is unaffected.
7. **Full round-trip** — enable everything, disable everything, bytes equal the pristine baseline.

### L5 — Removal integrity

1. Zero occurrences of `add.qa`, `add.test` or `add.autopilot` as a *routing target* across built provider outputs for all five providers. (`add.qa-setup` is retained and must not be caught by an over-broad pattern.)
2. `provider-map.json` has no entry for the three removed commands and has `add.plan-to-ready` for all five.
3. `cli/src/plugins.json` names no removed command in `injects`, `installHint` or `postEnableHint`.
4. `add-ecosystem/SKILL.md`'s routing graph resolves — every command it names exists in `provider-map.json`.
5. No file references `review.md` as a path where `review-NNN.md` is now written.

### L6 — Behavioural acceptance (per-topic)

1. **T3 / CORRECTION mode** — a fix path dispatches `@test-agent` for a *new failing test covering the bug*, and does not rewrite passing tests in the touched areas.
2. **T3 / self-check placement** — with `tdd-pipeline` disabled, `add.build`'s built output still contains the "test generation is disabled" notice (proving it lives in the ungated base body).
3. **T3 / mode independence** — generation sections are reachable in DEVELOPMENT and FEATURE mode, not only TASKS.
4. **T4 / read-only** — a review run produces zero modifications to files under `git diff --name-only`; `REVIEW_TREE_AFTER == REVIEW_TREE_BEFORE`; `QA_BASELINE_INVALIDATED` is unreachable.
5. **T4 / two reports** — a run writes both the per-scope `qa-validation-NNN.md` (satisfying `qa-evidence.sh validate` unchanged) and the feature-level `review-NNN.md`.
6. **T4 / Fix Routing union** — on a two-subfeature fixture, `review-NNN.md`'s table contains the rows from both scopes' QA reports plus the code-review findings, each scope-qualified.
7. **T4 / annex round-trip** — the build's resolution annex is append-only and the finalized marker is set exactly once; a second annex write does not duplicate rows.

### L7 — Loop acceptance (T5)

1. **No-progress detector** fires on two consecutive identical `(area, file, symptom)` sets and does **not** fire on one.
2. **CAP_REACHED** is reported as its own state, distinct from CONVERGED and BLOCKED, and never worded as success.
3. **Dry-run purity** — the convergence check produces zero filesystem writes; `qa-evidence.sh promote` is never invoked.
4. **Plan mutator immutability** — after the plan leg, `plan.md`'s `id:`, `created:` and `type:` are unchanged and `updated:` is bumped.
5. **Epic scoping** — a subfeature-scoped invocation can reach CONVERGED with sibling subfeatures still pending, and its report names them.
6. **Depth discipline** — no dispatched agent is instructed to dispatch another agent, and no agent is told to "read a command and execute it".

**RED expectations against the current tree:** L2.1, L2.4 and L2.6 fail outright. L1.3–L1.4 fail (no agent output for four providers). L3 fails for `tdd-pipeline` (key does not exist). L4 fails on the new map. L5.1 fails (three commands still shipped). L6 and L7 fail (behaviour does not exist). **GREEN = all seven levels pass after F1–F30.**

---

## Execution Order

`T1 → T2 → T3 → T4 → T5 → T6`, with F28 written before any of it.

- **T1 first** — mechanical and independent, and T3 must write the final feature key once rather than write `tdd` and rename it later.
- **T2 second** — T3 and T4 both restructure their host into an agent list; doing that against agents that do not exist means writing the same file twice.
- **T3 before T4** — `add.build` is the simpler absorption (two independent injections, one host) and validates the pattern T4 applies to the harder case.
- **T4 before T5** — the loop's correction contract and its judge are both defined in T4.
- **T5 last** — the only topic that consumes all four others and cannot ship partially.
- **T6 throughout** — F29 (rebuild) runs early and often, not once at the end; anchor validation failures are cheapest when found immediately.

Each of T1–T4 leaves the framework fully working on its own. If the build must stop mid-plan, stop on a T boundary.

## Reviewer Handoff

`/add-framework--shared-review` must be able to audit this without re-reading the brainstorms. For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which matrix levels cover it**, and their pass state at the time of writing.
- **Any decision deferred or altered**, with the brainstorm section it departs from and why.

Specific gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. An F-block marked done whose matrix level was never RED (a test written after the fix proves nothing).
2. The injection map count silently differing from 38.
3. A gate lost during the F10/F11 thin-coordinator restructure — cross-check against `add.review` Gates 1–7 and `add.build`'s nine ABSOLUTE INVARIANTS.
4. A `/add.qa`, `/add.test` or `/add.autopilot` reference surviving in a built provider output.
5. `add-ecosystem/SKILL.md` regenerated but internally inconsistent with `provider-map.json`.
6. Codex agent output that was skipped and reported as "deferred" without an explicit note.

## References

- Brainstorm set: `docs/brainstorming/2026-08-24-development-loop-consolidation-{000-umbrella,001-tdd-pipeline-rename,002-named-agents-five-providers,003-test-into-build,004-qa-into-review,005-plan-to-ready-orchestrator}.md`
- Prior art this plan builds on: **0056** (`qa-pipeline` feature + self-detection), **0059** (dual-judge split + coordinator merge), **0067** (exactly-once injection guarantee + empty-marker build guard + red-green matrix discipline), **0068** (`add.qa-setup` single opt-in + `setup-shape`), **0069** (bounded review loop shape)
- Injection engine: `cli/src/injection-core.js`, `cli/src/features.js`, `cli/src/plugins.js`, `scripts/build.js`
- Evidence contract: `framwork/.codeadd/scripts/qa-evidence.sh`, `skills/add-doc-schemas/references/review.md`
- Docs policy: CLAUDE.md `docs/` tracking section — plans untracked by default; force-add only with a stated reason

---

## Next Steps

/add-framework--build 0070-PLAN--development-loop-consolidation

Then, for the internal layer (`/add-framework--build` reaches neither `CLAUDE.md` nor `.claude/`):

- `/add-framework--self-plan update the CLAUDE.md feature table for the tdd-pipeline rename`
- `/add-framework--self-plan amend CLAUDE.md for the agents-strategy TOML exception and the 15 to 17 agent count`
- `/add-framework--self-plan drop add.test and add.autopilot from the main feature flow list in add-framework--sync`
- `/add-framework--self-plan update the --yolo note in add-framework-development and the CLAUDE.md command count (18 to 16)`

---

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-08-24 | **Implemented** — F1–F30 built on `feat/0070-development-loop-consolidation`. Evidence: `docs/evidence/0070-development-loop-consolidation.md`. Two scope changes: Antigravity agents deferred by user decision (4 providers, not 5) and Codex agents resolved via a new `agentsDir` override. F30's `/add-framework--sync` half is outstanding |
| 2026-08-24 | Re-review fix: L1.7 scopes the built-output assertion to add-ecosystem only; installer.js and docs.astro assert against source |
| 2026-08-24 | Review fixes: matrix coverage for F3/F5, qa-reachability rewrite named in F28, installer.js impact row, bats path corrected, F8 escalation fallback |
| 2026-08-24 | Initial creation — all decisions carried from the 6-document brainstorm set, each reviewed to `fix-then-ok` with zero blockers |
