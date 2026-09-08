# Brainstorm: Named Leaf Agents, Distributed to All Five Providers

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-08-24
> **Type:** architecture
> **Umbrella:** `2026-08-24-development-loop-consolidation-000-umbrella.md` (topic 02 of 05)

## Discovery

- `framwork/provider-map.json` declares `"agentDispatch": true` for **all five** providers, but only the `claude` block carries an output pattern: `agents: "agents/{name}.md"`. The `codex`, `cursor`, `opencode` and `antigrav` blocks omit the `agents` key entirely, and their template directories contain only `commands/` and `skills/`.
- 15 agents are registered in `provider-map.json`; only Claude receives files. On the other four, `@name-agent` degrades to a generic inline subagent carrying the dispatch prose.
- `agents/e2e-agent.md` closes with **"You are a leaf agent — do NOT dispatch other agents."** The leaf constraint is already written into the agent contracts, not merely implied.
- `add.test.md` STEP 3 dispatches **anonymous** area generators (`[full-access, standard]` plus a skill name) — Backend, Frontend, Workers. No `@name` exists anywhere in the file.
- `add.build.md` dispatches an **anonymous** fix subagent at STEP 9.5 (L396-405), STEP 10.2 (L482) and STEP 11 (L503), with no retry cap.
- `add.review.md` dispatches `@reviewer-agent` twice in parallel (frontend, backend), read-write.
- The repo already ships real OpenCode-native subagents at root `.opencode/agents/` (6 files) for its own tooling, with frontmatter `description`, `mode: subagent`, `permission` (glob allow/deny map).
- `CLAUDE.md` records the current build invariant: *"All providers use markdown (the build is markdown-only)."*
- `scripts/build.js` — the Agents strategy is **passthrough**: original frontmatter kept, no transform.

### Provider subagent support (verified 2026-08-24)

| Provider | Native path | Format | Frontmatter | Nesting | Parallel |
|---|---|---|---|---|---|
| claude | `.claude/agents/<name>.md` | MD + YAML | `name`, `description`, `model`, `tools` | **leaf only** | yes |
| opencode | `.opencode/agents/<name>.md` | MD + YAML | `description`, `mode: subagent`, `permission`, `model` | allowed via `permission.task` | docs claim yes; upstream issue reports serialisation |
| cursor | `.cursor/agents/<name>.md` | MD + YAML | `name`, `description`, `model`, `readonly`, `is_background` | one extra level | yes |
| codex | `.codex/agents/<name>.toml` | **TOML** | `name`, `description`, `developer_instructions`, `model` | bounded, default unverified | yes |
| antigrav | `.agents/agents/<name>.md` | MD + YAML | `name`, `description`, `tools`, `model`, `subagent`, `mainAgent` | up to 10 levels | yes |

Cursor is additionally documented as reading `.claude/agents/` and `.codex/agents/` natively, with `.cursor/` winning on name conflicts - **unverified**, and per Key Decisions it must be proven in the plan before anything depends on it.

## Context & Motivation

Topic 05 builds an orchestrator. Claude Code subagents are leaf-only: main loop at depth 0, subagent at depth 1, nothing below. An orchestrator that dispatches "read `{{cmd:add.build}}` and execute it" produces an agent that must then dispatch `@backend-agent` — depth 2, which the runtime cannot satisfy. `add.autopilot` is built exactly this way today and its dispatched agents silently degrade to inline execution, losing the parallel fan-out the commands were designed around.

The way out is to flatten: every heavy unit of work owns a **named leaf agent**, the host command becomes a thin coordinator over that list, and the orchestrator dispatches the same agents directly at depth 1. Topics 03 and 04 both restructure their host command into an agent list, so those agents must exist before that restructuring, or the same file gets written twice.

Depth 1 is Claude's budget and the tightest of the five. Designing to it means the same structure runs everywhere.

## Problem / Opportunity

**1. Two heavy units have no dispatchable owner.** Unit and integration test generation (three anonymous area generators) and correction (the anonymous fix subagent, invoked from three sites with no cap) cannot be addressed by name. An orchestrator wanting either must re-author the prompt inline — duplicating logic that then drifts from the command.

**2. `agentDispatch: true` is a claim, not a capability.** Four of five providers receive no agent files. Every named dispatch degrades to a generic subagent with an inline directive. That degrade path works — the `@e2e-agent` fragment is deliberately self-sufficient — but it means the orchestrator's context economy is a Claude-only benefit, and the framework advertises parity it does not ship.

**3. The correction loop is unbounded.** `add.build` retries build fixes "until it passes" at three separate sites with no cap and no shared owner. Inside a bounded convergence loop that is an uncapped inner loop inside a capped outer one.

## Proposed Solution

**Recommended — create the two missing agents, then extend the build's agent strategy per provider, MD first and Codex last.**

**Two new agents.**

- **`@test-agent`** — owns unit and integration test generation for one area. Absorbs `add.test` STEP 3's common prompt plus the area-specific additions. Read-write on test files only, never application source (the constraint `add.test` already states at line 281). Leaf.
- **`@fix-agent`** — owns correction. Consumes one routed finding set (build errors, review findings, QA findings) scoped to one area and applies the fix. Replaces the three anonymous dispatch sites in `add.build` and becomes the build-side half of the `## Fix Routing` contract that topic 04 defines. Leaf, with an explicit attempt counter passed in by the coordinator so the cap lives in the caller.

**Two commands become thin coordinators.** `add.build` and `add.review` keep their gates, mode detection, state reads and merge procedures — that is coordination and belongs in the command — but every unit of work becomes a row in an agent list: agent name, capability, inputs, expected report shape. The orchestrator reads the same list.

**Distribution, sequenced by cost.** The three MD providers (opencode, cursor, antigrav) are a per-provider frontmatter transform over the same body: map `description`/`model`/`tools` into each dialect, add `mode: subagent` for OpenCode and `subagent: true` for Antigravity, add `readonly: true` for Cursor where the agent is read-only. Codex lands last and requires a TOML emitter with `developer_instructions` carrying the body.

**Alternative A — Claude-only agents, keep the inline degrade elsewhere.** Rejected by the umbrella decision, but worth recording why it is tempting: it already works, and the degrade prose is self-sufficient. It fails the goal because the orchestrator's whole value is context economy, and outside Claude it would get none.

**Alternative B — rely on Cursor reading `.claude/agents/`.** Partially adopted: it is a genuine free win and should be verified, but it is Cursor-specific and does not generalise.

**Alternative C — keep commands fat and have the orchestrator inline them (Shape A).** Rejected: build, review and QA accumulate in one context across three iterations, and compaction mid-loop would silently drop the convergence evidence.

## Type of Artefact

architecture (agents, build pipeline, provider registry)

## Scope

### Includes

- `agents/test-agent.md` — new, leaf, read-write on test files only
- `agents/fix-agent.md` — new, leaf, area-scoped correction with a caller-supplied attempt counter
- `provider-map.json`: register both agents; add an `agents` output pattern for codex, cursor, opencode, antigrav — **resolving the canonical directory per vendor docs first**, because the current `dir` values do not match the researched native paths (`codex.dir` is `framwork/.agents` while Codex docs say `.codex/agents/`; `antigrav.dir` is `framwork/.agent` singular while Antigravity docs say `.agents/agents/`)
- `scripts/build.js`: replace the Agents passthrough with a per-provider frontmatter transform; add a TOML emitter for Codex
- Restructuring `add.build` and `add.review` into thin coordinators over explicit agent lists
- Replacing the three anonymous fix dispatch sites in `add.build` with `@fix-agent` plus an explicit attempt cap
- Verifying the installed-project directory layout for agent output paths, including the `.agents/` collision question
- Keeping every dispatch directive self-sufficient inline, so the soft-degrade path stays valid
- Tests: agent files emitted per provider, frontmatter dialect correctness, Codex TOML validity

### Does NOT Include

- Changing what the 15 existing agents do (only how they are emitted)
- Adding MCP-plugin agent injection to non-Claude providers — `injectAgentFragments` targets providers with an `agentsSubdir`; extending it is a follow-on, not this topic
- Removing the inline soft-degrade prose (it stays as the fallback contract)
- Nesting beyond depth 1 anywhere, even on providers that allow it

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| Design to depth 1 on every provider | Claude's budget is the tightest of the five; a design that needs depth 2 anywhere is a design that runs on four of five | ✅ |
| `@test-agent` and `@fix-agent` are created as named leaf agents | They are the only two heavy units the orchestrator cannot currently address | ✅ |
| Commands keep coordination, agents get the work | Gates, mode detection, state reads and merges are coordination and belong in the command; anything an orchestrator would also need to do belongs in an agent | ✅ |
| The retry cap lives in the caller, not in `@fix-agent` | A leaf agent cannot see its own attempt history; the coordinator passes the counter. This is also what makes the outer loop's cap meaningful | ✅ |
| Agents ship to all five providers, Codex included | The umbrella decision; `agentDispatch: true` is already declared for all five | ✅ |
| MD providers first, Codex last | A TOML-specific problem must not block the other four; it also isolates the reopening of the markdown-only invariant | ✅ |
| Inline dispatch directives stay self-sufficient | The `@e2e-agent` fragment already proves the pattern; it is the fallback when an engine has no agent file | ✅ |
| The build's markdown-only invariant is explicitly amended in `CLAUDE.md` | An undocumented exception is how invariants rot | ✅ |
| Policy: treat Cursor's native `.claude/agents/` read as unverified until proven in the plan | The ✅ marks the *policy*, not the fact. If it holds it is a free win; the claim comes from docs published in January 2026 and must be confirmed before anything depends on it | ✅ |
| The Codex and Antigravity output directories are resolved from vendor docs before `provider-map.json` is edited | The repo's current `dir` values predate both vendors' subagent features and contradict them; letting the plan guess would bake in a wrong path or an `.agents/` collision | ✅ |

## Ecosystem Impact

| Component | Impact | Action |
|-----------|--------|--------|
| `agents/test-agent.md` | New | Absorbs `add.test` STEP 3.1 common prompt plus 3.2 area additions |
| `agents/fix-agent.md` | New | Absorbs the three anonymous fix sites plus the QA-Fix routing directive |
| `agents/reviewer-agent.md` | Becomes read-only in topic 04 | Note the dependency; do not change it here |
| `framwork/provider-map.json` | 2 new agent entries; 4 new `agents` output patterns | Registry change |
| `scripts/build.js` | Agents strategy: passthrough becomes per-provider transform, plus a TOML emitter | Core pipeline change |
| `CLAUDE.md` | Two rows go stale: "the build is markdown-only" (Build Transform Details) and the Product Layer agent count (15 becomes 17) | Internal layer — requires a companion `/add-framework--self-plan`; `/add-framework--build` does not reach `CLAUDE.md` |
| `commands/add.build.md` | Restructured into a coordinator over an agent list | Prepares topic 03 |
| `commands/add.review.md` | Restructured into a coordinator over an agent list | Prepares topic 04 |
| `framwork/.claude/agents/`, `.opencode/`, `.cursor/`, `.agents/`, `.agent/` | Build output gains agent directories for 4 more providers | Gitignored build output; regenerates |
| `cli/src/injection-core.js` | `injectAgentFragments` keys off `agentsSubdir`; more providers gaining agents changes its reach | Verify plugin agent injection stays correct or is explicitly deferred |
| `cli/tests/build.test.js` | Agent emission per provider | New cases |
| `web/src/pages/docs.astro` | Provider capability copy | Update after the change lands |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| An orchestrator that can delegate at depth 1 on all five providers | The markdown-only build invariant |
| Two heavy units that are now addressable, testable and swappable | A larger `build.js` with a per-provider dialect table |
| Commands whose work is an inspectable list instead of prose | The simplicity of the current passthrough agent strategy |
| Real `agentDispatch` parity instead of a declared one | — |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| `.agents/` collision: this repo maps **Codex skills and commands** to `framwork/.agents/` (both use the same `skills/{name}/SKILL.md` pattern under that root), while Antigravity's native agents live at `.agents/agents/` | Medium | Resolve before choosing output paths. Current Codex docs point at `.codex/agents/`, which suggests the existing Codex mapping predates them and should be re-checked |
| Codex TOML emitter stalls the topic | Medium | Sequenced last; the other four ship independently |
| A frontmatter dialect is wrong and an agent silently never loads | Medium | Per-provider emission tests; a missing agent must fail loud, not degrade quietly |
| OpenCode serialises parallel dispatch (upstream issue `anomalyco/opencode#14195`) | Medium | Correctness is unaffected, only wall-clock; do not build the loop's cap around assumed parallelism |
| Restructuring `add.build`/`add.review` regresses a gate | Medium | Both files carry explicit gate registries (`add.review` Gates 1–7, `add.build` invariants); treat them as the acceptance checklist for the restructure |
| Plugin agent injection breaks when 4 more providers gain `agentsSubdir` | Medium | Either extend `injectAgentFragments` deliberately or pin it to Claude with a recorded reason |

## Next Steps

Run: `/add-framework--plan create the test-agent and fix-agent, and distribute named agents to all five providers`

Then, as a companion for the internal layer (`/add-framework--build` does not reach `CLAUDE.md`):

Run: `/add-framework--self-plan amend CLAUDE.md for the agents-strategy TOML exception and the 15 to 17 agent count`
