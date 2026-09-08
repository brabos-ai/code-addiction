# Brainstorm: Development Loop Consolidation (Umbrella)

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-08-24
> **Type:** architecture

## Discovery

- **`add.qa` (260 lines)** — dual-judge audit (`@ux-agent` review-mode ∥ `@qa-agent`), writes `_tests/run-NNN/qa-validation-NNN.md`. Carries **no** `feature:` marker: it ships unconditionally and hard-gates on the `add.qa-setup` contract (preflight rows 9–10). Hosts the `plugin:playwright:drive` anchor.
- **`add.test` (289 lines)** — no frontmatter. Base body (framework detection, per-area generators, coverage) runs unconditionally; its only injection is `qa-pipeline:e2e-dispatch`, which dispatches `@e2e-agent`. The base generators are **anonymous generic subagents**, not named agents.
- **`add.build` (620 lines)** — hosts 5 `feature:tdd:*` markers plus 1 `feature:qa-pipeline:qa-fix`. Has unbounded internal build-fix retry loops driven by an **anonymous** fix subagent.
- **`add.review` (657 lines)** — hosts 2 `feature:tdd:*` markers. Its `@reviewer-agent` dispatches are **read-write and auto-correct**, which is precisely what produces `QA_BASELINE_INVALIDATED`. STEP 8.3 already carries a 4-branch routing ladder that is the manual version of the loop being built.
- **`add.autopilot` (677 lines)** — an existing linear `plan -> build -> review` coordinator that never reaches `add.done`, and that dispatches agents which are themselves told to execute commands that dispatch agents (a depth-2 request the runtime cannot satisfy).
- **Plan 0056** established the `qa-pipeline` feature and the self-detection pattern. **Plan 0059** established the dual-judge split and coordinator merge rules. **Plan 0067** established the exactly-once injection guarantee and the build-time empty-marker gate. **Plan 0068** made `add.qa-setup` the single opt-in with a `setup-shape` hash identity. **Plan 0069** established the bounded review loop shape (`ok` / `fix-then-ok` / `blocked`, one re-dispatch).

## Context & Motivation

The delivery half of the framework currently exposes five commands the user must sequence by hand — `add.plan`, `add.build`, `add.test`, `add.qa`, `add.review` — plus `add.done`. The sequencing rules exist, but only as prose: `add.review` STEP 8.3 spells out a four-branch ladder including the `/add.qa` to `/add.build qa` loop, and `add.done` re-validates freshness because it cannot trust that the user followed it. Nothing executes that ladder.

Two commands in that chain are not conceptually separate steps at all. `add.test` produces test artefacts for code that `add.build` just wrote. `add.qa` judges the rendered result of that same code, and the only consumers of its report are `add.build qa` and `add.review`. Both are phases of their neighbours that were given their own command file.

Collapsing them is not cosmetic: it reduces from five to three the number of commands an orchestrator must know how to coordinate, which is what makes an agent-driven orchestrator tractable at all.

## Problem / Opportunity

**1. The loop is documented, not executed.** The user is the state machine. Every hand-off is an opportunity to skip a gate, and `add.done` carries defensive re-validation because of it.

**2. There is no depth budget for an orchestrator built on commands.** Claude Code subagents are leaf-only (depth 1). An orchestrator that dispatches "run `/add.build`" as a subagent produces an agent that must itself dispatch `@backend-agent` — depth 2, impossible. `add.autopilot` already has this defect: its dispatched agents degrade to inline execution and lose the parallel fan-out the commands were designed around. Any new orchestrator built the same way inherits the same defect.

**3. Half the heavy work has no dispatchable owner.** `@e2e-agent`, `@ux-agent`, `@qa-agent`, `@reviewer-agent` and the three area agents are named and leaf. But `add.test`'s unit/integration generators and `add.build`'s fix subagent are **anonymous inline dispatches** — an orchestrator cannot address them, so it cannot delegate that work without re-authoring the prompt.

**4. `agentDispatch: true` is declared and not delivered.** `provider-map.json` claims it for all five providers, but only `claude` has an `agents:` output pattern. On the other four, every named agent silently degrades to a generic inline subagent. Research confirms all four now ship native custom-subagent support (Codex `.codex/agents/*.toml`, OpenCode `.opencode/agents/*.md`, Cursor `.cursor/agents/*.md`, Antigravity `.agents/agents/*.md`).

**5. The judge mutates the object it judges.** `add.review`'s AUTO-CORRECTION RULE makes `@reviewer-agent` read-write. In a single manual pass this is a convenience. In a loop it is an oscillation source: the review corrects code after QA captured evidence, which invalidates the baseline, which forces another QA run, which forces another review.

## Proposed Solution

**Recommended — consolidate, then agentise, then orchestrate.** Five sequenced topics. Each is independently shippable and leaves the framework in a working state.

**Alternative A — build the orchestrator first, consolidate later.** Rejected: an orchestrator over five commands with anonymous subagents can only be a Shape A inline coordinator, which accumulates build plus review plus QA into one context across three iterations. The consolidation is what makes Shape B affordable.

**Alternative B — keep `add.qa` and `add.test` and have the orchestrator call them.** Rejected: it preserves the depth-2 problem and leaves the user-facing catalogue at 18 commands with two of them existing only as orchestrator implementation detail.

## Type of Artefact

architecture (spanning commands, agents, fragments, the build pipeline, and the CLI feature/plugin registries)

## Scope

### Includes

- Removing `add.qa`, `add.test` and `add.autopilot` from distribution
- Absorbing their behaviour into `add.review` and `add.build` as feature-gated injected sections
- Renaming the `tdd` feature to `tdd-pipeline` with a deprecation alias
- Promoting every heavy inline dispatch to a named leaf agent
- Extending agent distribution from 1 to 5 providers, including a TOML transformer for Codex
- Introducing `/add.plan-to-ready`, a bounded convergence loop over `plan -> build <-> review`
- Making `add.review` read-only and versioning its output as `review-NNN.md`
- Re-anchoring every CLI test that asserts on moved text anchors
- Regenerating `add-ecosystem/SKILL.md`, `README.md`, the web docs and the SVG diagrams

### Does NOT Include

- Changing `add.done`'s merge behaviour or its gate semantics (it gains a "read the highest `review-NNN.md`" rule and nothing else)
- Renaming `add.qa-setup` (its name is load-bearing: the `contracts.json` shape and the `docs/qa/qa-setup.md` receipt are keyed on it)
- Changing the `qa-pipeline` default (stays `false`) or the `tdd-pipeline` default (stays `true`)
- Changing the dual-judge rubric, severity taxonomy or merge rules from Plan 0059
- Changing the `add.qa-setup` `## Materializes` contract or the `setup-shape` mechanism from Plan 0068
- Backfilling projects installed before this change beyond what the feature alias covers
- Absorbing `add.new` or `add.brainstorm` into the orchestrator — discovery stays human

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| `add.qa` and `add.test` stop being distributed as commands | They are phases of their neighbours, not steps. Removing them cuts the orchestrator's coordination surface from 5 commands to 3 | ✅ |
| Their logic becomes feature-gated injected sections in the host command | Reuses the existing injection machinery (anchor sidecar, exactly-once guarantee, byte-identical round-trip) rather than inventing a second mechanism | ✅ |
| Every heavy unit of work gets a named leaf agent (Shape B, complete) | Claude's depth-1 budget is the binding constraint across all five providers; only named leaf agents let the orchestrator delegate at depth 1 without re-authoring prompts | ✅ |
| `add.build` and `add.review` become thin coordinators over agent lists | Avoids the coordination logic existing twice — once in the command, once in the orchestrator | ✅ |
| Agents are distributed to all 5 providers, Codex TOML included | `agentDispatch: true` is already declared for all five; delivering it is what makes the orchestrator's context economy portable | ✅ |
| `tdd` becomes `tdd-pipeline`, with `tdd` kept as a deprecation alias | A bare rename silently re-enables TDD for anyone who explicitly disabled it, because `applyEnabledFeatures` falls back to `meta.default` on an unknown key | ✅ |
| With `tdd-pipeline` disabled there is no unit/integration test generation | Makes the feature mean "test generation and its discipline", not just "the discipline". Accepted product change | ✅ |
| `add.review` becomes read-only and emits versioned `review-NNN.md` | A judge that mutates the object it judges cannot converge. Versioning gives the loop an auditable per-iteration history instead of an overwritten verdict | ✅ |
| `review-NNN.md` lives flat at the feature-directory root, one sequence per feature | Unlike QA evidence there is only ever the one document per round, so it needs no `_tests/run-NNN/` subtree and `add.done`'s gate stays a single-path read | ✅ |
| `add.build` writes back into `review-NNN.md` and marks it finalized | Closes each round in the artefact that opened it: the review states the findings, the build states what it corrected, and the document becomes the complete record of that iteration | ✅ |
| The absorbed QA judgement is **not** `qa-pipeline`-gated | `add.qa` ships unconditionally today and self-gates on the `add.qa-setup` receipt. Gating it would silently remove QA from every project on the default (disabled) flag, including those that ran `/add.qa-setup` and declined the feature | ✅ |
| With `tdd-pipeline` on, test generation fires in all four `add.build` modes | Matches today, where `/add.test` runs independently of mode. In CORRECTION mode red-green additionally asks whether a new test is needed so the fixed bug cannot recur | ✅ |
| `## Fix Routing` becomes the universal review-to-build correction contract | Collapses the two current correction paths (in-review auto-fix, `/add.build qa`) into one, giving the loop a single exchange format | ✅ |
| `/add.plan-to-ready` covers `plan -> build <-> review` and stops at convergence | The merge decision stays human. The name states the boundary honestly | ✅ |
| `add.plan` always runs, under the mutator cache rule | Guarantees the plan reflects current state before each cycle; the cache rule (read, preserve, complement, bump `updated:`) prevents destructive replanning | ✅ |
| Convergence equals the `add.done` gates evaluated in dry-run | One single definition of "ready" in the framework. It becomes impossible to converge on something the next step would reject | ✅ |
| Give up after 3 iterations, with early exit on no-progress | 3 rounds covers criticals, majors and most mids/lows. The no-progress check (same findings twice) stops the loop burning tokens on a correction that is not landing | ✅ |
| `add.autopilot` is removed, not refactored | Its contract (linear, never reaches done, depth-2 dispatch) is incompatible with the new one; keeping the name would carry the defect forward | ✅ |
| `add.qa-setup`, `add.plan`, `add.build`, `add.review`, `add.done` all remain as manual commands | The orchestrator composes them; it does not replace them | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `commands/add.qa.md` | Removed | Behaviour absorbed into `add.review` (topic 04) |
| `commands/add.test.md` | Removed | Split across `add.build` under two features (topic 03) |
| `commands/add.autopilot.md` | Removed | Superseded by `/add.plan-to-ready` (topic 05) |
| `commands/add.plan-to-ready.md` | New | Topic 05 |
| `commands/add.build.md` | Restructured into a thin agent coordinator; gains two injected sections | Topics 02, 03 |
| `commands/add.review.md` | Restructured; becomes read-only; gains the absorbed QA section; emits `review-NNN.md` | Topics 02, 04 |
| `commands/add.done.md` | Reads the highest-numbered `review-NNN.md` instead of `review.md` | Topic 04 |
| `commands/add.plan.md` | Unchanged behaviour; its two injected sections are re-keyed to `tdd-pipeline` | Topic 01 |
| `commands/add.md` | Suggestion table names `/add.autopilot`; L106's document-availability list names `review.md` | Topics 04 and 05 |
| `agents/e2e-agent.md` | Host command changes, **and** L31's boot-failure deferral target (`/add.qa`) must be retargeted to `/add.review` | Topics 03 and 04, coordinated |
| `agents/test-agent.md` | New — owns unit/integration generation | Topic 02 |
| `agents/fix-agent.md` | New — owns the correction leg of the loop | Topic 02 |
| `agents/qa-agent.md`, `agents/ux-agent.md` | Dispatch site moves from `add.qa` to `add.review` | Topic 04 |
| `agents/reviewer-agent.md` | Becomes read-only | Topic 04 |
| `fragments/tdd/*` | Directory renamed to `fragments/tdd-pipeline/`; the `add.build.md` fragment gains the unit/integration sections | Topics 01, 03 |
| `fragments/qa-pipeline/add.test.md` | Folded into `fragments/qa-pipeline/add.build.md` | Topic 03 |
| `commands/add.review.md` base body | Gains the absorbed `add.qa` content as three ungated sections that self-gate on the `add.qa-setup` receipt — **not** a fragment, mirroring how `add.qa` ships today | Topic 04 |
| `cli/src/features.js` | `tdd` becomes `tdd-pipeline`, plus an `aliases` field and alias-aware resolution | Topic 01 |
| `cli/src/plugins.json` | `playwright.injects` retargeted from `add.qa` to `add.review` | Topic 04 |
| `framwork/provider-map.json` | `agents:` output pattern added for codex, cursor, opencode, antigrav; `add.qa`/`add.test`/`add.autopilot` entries removed; `add.plan-to-ready` plus 2 agents added | Topics 02, 03, 04, 05 |
| `scripts/build.js` | Agent strategy gains a per-provider frontmatter transform plus a TOML transformer for Codex | Topic 02 |
| `scripts/qa-preflight.sh` | Second hardcode of the literal `qa-pipeline` manifest key — audit alongside the rename | Topic 01 |
| `skills/add-qa/*` and `skills/add-qa/references/coordinator.md` | Loaded by `add.review` instead of `add.qa`; the "loaded by /add.qa and by nothing else" line is corrected | Topic 04 |
| `skills/add-doc-schemas/references/review.md` | The `review` schema gains per-scope `NNN` versioning and its location rule | Topic 04 |
| `skills/add-ecosystem/SKILL.md` | Command table, feature table, agent table and the entire next-command routing graph are stale | All topics; treat as a derived artefact |
| `cli/tests/*` | `features.test.js` (101 occurrences), `qa-reachability.smoke.test.js` (~26), `qa-pipeline-umbrella.test.js`, `build-contracts.test.js`, `injection-*.test.js` assert on exact text anchors that all move | Every topic carries its own re-anchoring item |
| `README.md`, `web/src/pages/docs.astro`, `web/public/*.svg` | Command cards, feature cards and the Cytoscape dependency graph name the removed commands | Run `/add-framework--sync` after topic 05 |
| `CLAUDE.md` | Feature table (lines 134–135), command counts (18 to 16), agent counts (15 to 17), and the "build is markdown-only" invariant in Build Transform Details | Internal layer — carried by companion `/add-framework--self-plan` steps, since `/add-framework--build` does not reach `CLAUDE.md` |
| `.claude/commands/add-framework--sync.md:160` | Main-flow command list names both `add.test` and `add.autopilot` | Internal layer — companion self-plan (topics 03 and 05) |
| `.claude/skills/add-framework-development/SKILL.md:206` | Documents `--yolo` as "supported ONLY by `add.review` and `add.autopilot` (which forwards it)" | Internal layer — companion self-plan (topics 04 and 05). `/add.plan-to-ready` does not inherit `--yolo`, and a read-only `add.review` no longer has an auto-correct half for it to control |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| A catalogue that shrinks from 18 to 16 commands while gaining capability | Two commands users may have muscle memory for (`/add.qa`, `/add.test`) |
| One executable definition of "ready", shared by the loop and by `add.done` | The ability to run a cheap standalone QA pass without entering the review command |
| A convergent loop instead of an oscillating one | The `add.review` auto-correction contract that exists today |
| Genuine `agentDispatch` parity across five providers | The build's markdown-only invariant, reopened for the Codex agent strategy |
| Two large commands restructured into inspectable agent lists | A large, coordinated change touching commands, agents, fragments, build and CLI at once |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Silent TDD re-enablement for users who explicitly disabled it | High if renamed naively | Deprecation alias resolved before `meta.default` (topic 01) |
| CI breaks in cascade as text anchors move | High | Every topic carries an explicit test re-anchoring item; no topic is done while its tests are red |
| `add-ecosystem/SKILL.md` drifts and `/add` starts suggesting removed commands | High | Treated as a first-class derived artefact with its own item, not a documentation afterthought |
| The orchestrator's context still overflows across 3 iterations | Medium | Shape B keeps the coordinator receiving reports, not transcripts; convergence is evaluated from files (`tasks.md`, `review-NNN.md`, `qa-evidence.sh`), not from memory |
| The Codex TOML transformer reopens a settled build decision and stalls topic 02 | Medium | Topic 02 sequences the three MD providers first and lands Codex last, so a Codex-specific problem cannot block the other four |
| `.agents/` directory collision — this repo maps Codex skills to `framwork/.agents/`, while Antigravity's native agents live at `.agents/agents/` | Medium | Topic 02 must verify the installed-project layout before choosing output paths; current Codex docs point at `.codex/agents/` |
| Removing `add.qa` breaks the `playwright` plugin's `injects` target | Certain if unhandled | Topic 04 retargets `plugins.json` in the same change |
| A pre-sidecar install cannot strip old marker-wrapped blocks | Known, pre-existing | Unchanged behaviour: `codeadd update` re-ships marker-free files plus the sidecar |

## Decomposition Map

| # | Subtopic | Design Path | Purpose |
|---|----------|-------------|---------|
| 01 | `tdd-pipeline` rename | `2026-08-24-development-loop-consolidation-001-tdd-pipeline-rename.md` | Rename the feature with a deprecation alias; audit both duplicated key hardcodes and the three hand-maintained feature tables |
| 02 | Named agents across 5 providers | `2026-08-24-development-loop-consolidation-002-named-agents-five-providers.md` | Promote anonymous dispatches to named leaf agents; deliver the already-declared `agentDispatch` on all five providers |
| 03 | `add.test` into `add.build` | `2026-08-24-development-loop-consolidation-003-test-into-build.md` | Split the command along its two feature owners and fold each half into `add.build` |
| 04 | `add.qa` into `add.review` | `2026-08-24-development-loop-consolidation-004-qa-into-review.md` | Absorb the audit, make the review read-only, version its output, retarget the plugin |
| 05 | `/add.plan-to-ready` | `2026-08-24-development-loop-consolidation-005-plan-to-ready-orchestrator.md` | The bounded convergence loop; remove `add.autopilot` |

## Dependencies & Relationships

```
01 tdd-pipeline rename ──────────────┐
   independent; supplies 03's key    │
                                     │
02 named agents + 5 providers ───────┼──> 05 /add.plan-to-ready
   creates @test-agent, @fix-agent   │
                                     │
03 add.test -> add.build ────────────┤
   needs 01's key, 02's @test-agent  │
                                     │
04 add.qa -> add.review ─────────────┘
   needs 02's @fix-agent + agent lists
```

**Recommended order: 01, 02, 03, 04, 05.**

- **01 first** because it is mechanical, independent, and 03 must already write the new feature key rather than write `tdd` and rename it a week later.
- **02 second** because 03 and 04 both restructure their host command into an agent list, and doing that against agents that do not exist yet means writing the same file twice.
- **03 before 04** because `add.build` is the simpler absorption (two independent injections into one host) and it validates the pattern that 04 then applies to the harder case.
- **04 before 05** because the loop's correction contract (`## Fix Routing`) and its judge (a read-only review emitting `review-NNN.md`) are both defined in 04.
- **05 last** — it is the only topic that consumes all four others and the only one that cannot ship partially.

Each of 01 through 04 leaves the framework fully working on its own. Only 05 depends on the whole chain.

## Next Steps

Refine each subtopic, then formalize:

```
/add-framework--plan [subtopic]
```

Topics 01–05 are all product-layer changes reaching into `framwork/.codeadd/`, `scripts/build.js`, `framwork/provider-map.json` and `cli/src/` — the same reach as plans 0056, 0067 and 0068.

**Four of the five carry a companion `/add-framework--self-plan`** for their internal-layer rows, because `/add-framework--build` reaches neither `CLAUDE.md` nor `.claude/`:

| Topic | Internal-layer companion covers |
|---|---|
| 01 | `CLAUDE.md` feature table (lines 134–135) |
| 02 | `CLAUDE.md` Build Transform Details (markdown-only invariant) and the agent count, 15 to 17 |
| 03 | `.claude/commands/add-framework--sync.md:160` — drop `add.test` from the main feature flow |
| 05 | `.claude/commands/add-framework--sync.md:160` — drop `add.autopilot`; `.claude/skills/add-framework-development/SKILL.md:206` — the `--yolo` note; `CLAUDE.md` command count, 18 to 16 |

Run each topic's product-layer plan first, then its companion — the companion documents what the product change made stale.
