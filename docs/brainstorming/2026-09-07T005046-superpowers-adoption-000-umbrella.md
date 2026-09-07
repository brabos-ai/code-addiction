# Brainstorm: Superpowers Adoption — Durable Execution, Plan Contract, Brainstorm Classification

> **Status:** final (topic 001 ready for planning; 002 and 003 need their own brainstorm before planning)
> **Date:** 2026-09-07
> **Type:** architecture

## Discovery

Measured against the live repo at `58e916d` and against `superpowers@6.3.0` as cached at
`~/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/`, not recalled:

- **superpowers is MIT** (Jesse Vincent, `LICENSE`, `plugin.json`). Adapting its material with credit
  is permitted, and **this repo already does it**: `add-investigation/SKILL.md:177` and
  `references/backward-tracing.md:3` both credit `obra/superpowers systematic-debugging`.
- **superpowers is a Claude Code plugin.** The product layer distributes to **5 providers**
  (claude, codex, cursor, antigrav, opencode). Four of them can never resolve a `superpowers:` reference.
- **Size of the material, measured:**

  | superpowers skill | bytes | files |
  |---|---|---|
  | `subagent-driven-development` | 52 451 | 4 |
  | `systematic-debugging` | 33 732 | 9 |
  | `brainstorming` | 30 586 | 3 |
  | `writing-plans` | 8 766 | 2 |
  | `requesting-code-review` | 8 625 | 2 |
  | `executing-plans` | 2 305 | 1 |

  | our skill | bytes |
  |---|---|
  | `add-investigation` | 29 507 |
  | `add-tasks-checklist` | 16 032 |
  | `add-subagent-driven-development` | 15 204 |
  | `add-code-review` | 9 234 |
  | `add-planning` | 4 826 |

- **`add.build` cannot mark a delivery.** `add.build.md:82` carries the invariant
  `GIT CLEAN: Leave files unstaged. Never git add/commit/stage`. Because of it,
  `add.build.md:661-675` documents at length why the `checkpoint/*` tag *cannot* be created there
  ("the tag has always been a lie"), and `add.done.md:400` states `/add.build` never creates one.
  `add.plan-to-ready.md:446` is the only thing that commits and tags.
- **The framework already contradicts itself on this.** `add-planning/SKILL.md` ships a
  `## Batching` section prescribing *"one semantic commit per batch"* — forbidden by `add.build.md:82`.
  The contradiction stayed invisible because **no command loads `add-planning`**: it is registered at
  `provider-map.json:106`, shipped to all 5 providers, and referenced only in prose by
  `add-code-review/SKILL.md:14`, `add-ecosystem/SKILL.md:64` and `add-feature-specification/SKILL.md:22`.
  Its template (`## Spec` JSON blocks, `## Detailed Tasks`, `## Batching`) also diverges from the
  canonical `feature-plan` schema at `add-doc-schemas/references/new-feature.md:115`
  (`TL;DR · Context · Architecture Decisions · Tasks · Risks · Validation`).
- **The coordinator's memory is in-context only.** `add-subagent-driven-development/SKILL.md` keeps a
  `### DECISION LOG` markdown block in the conversation. `decisions.jsonl` records pivots only;
  `iterations.jsonl` records one line per `/add.build` run. None of the three survives a compaction as a
  resume point: nothing says "task N is done, do not dispatch it again".
- **`tasks.md` carries ordering, not contract.** `add-tasks-checklist/SKILL.md` gives each
  `## Execution` task four sub-bullets: `Service`, `Files`, `Deps`, `Verify`. `Deps: T01` states *order*.
  Nothing states the *signature* a later task must call.
- **One dangling superpowers reference already ships to users.**
  `add-skill-creator/testing-skills-with-subagents.md:13` reads
  *"You MUST understand superpowers:test-driven-development"* — a skill no framework installation has.
- **The artefact-graph gate is live.** `scripts/build.js:987` (`checkArtefactGraph`) **fails** the build on a
  declared reference (`{{skill:...}}`) to a missing artefact and **warns** on a prose mention. Any deletion
  in this work is gated by it.
- **Internal plan naming is a shared-number scheme.** 27 plans on disk, 20 tracked. A plan *set* shares its
  number: `0074-PLAN--autonomous-epic-convergence-000-umbrella` through `-004-epic-loop`. The convention
  appears in **76 references across 16 files** (8 canonical `.claude/`, 8 OpenCode adapters) plus `CLAUDE.md`.

## Context & Motivation

The four superpowers skills the owner singled out — `brainstorming`, `writing-plans`,
`subagent-driven-development`, `systematic-debugging` — overlap our own artefacts unevenly. A skill-by-skill
comparison, not an impression:

| superpowers | our equivalent | verdict |
|---|---|---|
| `systematic-debugging` | `add-investigation` | **Already adopted, and ours is stronger.** Ours adds Phase 0 symptom disambiguation, differential diagnosis and an agent-dispatched mode. Nothing to take. |
| `brainstorming` | `add.brainstorm`, `add-framework--shared-brainstorm` | Ours adds a schema gate, `@plan-reviewer-agent` and a readback. Theirs adds one thing ours lacks: **path classification** (spike / bounded / architectural) announced before the first question. |
| `writing-plans` | `add.plan` + `feature-plan` schema + `add-tasks-checklist` | Ours is comparable and better integrated. Theirs adds two mechanics ours lacks: **`Interfaces: Consumes / Produces`** per task and a **`Global Constraints`** block copied verbatim from the spec. |
| `subagent-driven-development` | `add-subagent-driven-development` + `add.build` | **The real gap.** Seven distinct mechanics missing. |

## Problem / Opportunity

The gap is concentrated in execution, and it has a single shape: **nothing durable survives the session.**

1. **No ledger on disk.** The Decision Log lives in context. After a compaction the coordinator cannot tell
   which tasks completed — the failure superpowers names as the most expensive one it observed.
2. **No commit, therefore no hash, therefore no delivery marker.** `add.build.md:82` forbids committing.
   Without `BASE`, there is no `BASE..HEAD` range, so there is no scoped diff to hand a reviewer and no
   honest `checkpoint/*` tag. The framework already wrote 15 lines explaining that the tag "has always been
   a lie" — that is this problem, documented and accepted rather than fixed.
3. **Everything travels through context.** Briefs are pasted, reports come back inline. Both stay resident
   for the rest of the session and are re-read on every later turn.
4. **A fix is never re-reviewed.** `@fix-agent` has `MAX_ATTEMPTS = 3`, but the only thing checked after a
   fix is the build. A fix that compiles and misses the finding passes.
5. **Hitting the cap stops the session.** There is no adjudication path: no way to rule on a finding, record
   why, and continue. Every unresolved finding becomes a question for the human.
6. **No model selection per role.** Every dispatch inherits the session model.
7. **No pre-flight conflict scan** of the plan before Task 1.

## The decision that shapes everything: vendor, do not depend

**We port the mechanics into our own skills. We do not load superpowers at runtime, in either layer.**

Three reasons, in order of weight:

1. **Duplicate vocabulary is worse than duplicate tokens.** Loading their skill beside ours gives the agent
   two names for one job — *ledger* vs *Decision Log*, *workspace* vs `docs/features/`, *plan file* vs
   `TASK_DOCUMENTS`, `finishing-a-development-branch` vs `/add.done`. When two instructions compete, the
   agent picks one and we do not control which.
2. **The product layer cannot depend on it at all.** Four of five providers have no `superpowers:` namespace.
   A dependency there is a dangling reference by construction — we already ship one
   (`add-skill-creator/testing-skills-with-subagents.md:13`) and it is a defect, not a precedent.
3. **Token cost, third.** `subagent-driven-development` is 52 KB against our 15 KB, and it carries its own
   bash scripts, its own `.superpowers/sdd/` workspace and its own `docs/superpowers/plans/` paths — none of
   which we would use.

The precedent is `add-investigation`: a credited MIT port that ended up **better than the original**.

## What we take, and what we leave

**Take (10 mechanics):**

| # | mechanic | from | lands in |
|---|---|---|---|
| 1 | Ledger file that survives compaction | SDD | `add-subagent-driven-development` |
| 2 | `BASE`/`HEAD` hash per task + diff handed as a file | SDD | same + `add.build` |
| 3 | Handoff by path: brief in, report out | SDD | same |
| 4 | Scoped re-review of the fix diff | SDD | same + `@fix-agent` |
| 5 | Round-cap breaker + recorded `Ruling:` | SDD | same |
| 6 | Model selection per role | SDD | same |
| 7 | Pre-flight plan conflict scan | SDD | same |
| 8 | `Interfaces: Consumes / Produces` per task | writing-plans | `add-tasks-checklist` |
| 9 | `Global Constraints` copied verbatim | writing-plans | `feature-plan` schema |
| 10 | spike / bounded / architectural classification | brainstorming | `add.brainstorm`, `--shared-brainstorm` |

**Leave:**

- `systematic-debugging` — `add-investigation` already covers it and goes further.
- Their worktree handling — `build-setup.sh --worktree` already exists.
- `finishing-a-development-branch` — `/add.done` and `/add.pull-request` own that.
- `test-driven-development` — `add-tdd` plus the `tdd-pipeline` feature own it.
- Their file paths, scripts and workspace layout — our doc tree is the map here.

## Decomposition

Three topics, each shipping working software on its own. Execution order is **001 → 002 → 003**.

| topic | content | why this order |
|---|---|---|
| **001 — Plan contract** | mechanics 8, 9 + timestamped filenames for plans and brainstorms in both layers + `add-planning` deletion | The executor consumes it. Mechanic 7 (pre-flight scan) has nothing to scan until tasks declare producer/consumer pairs. |
| **002 — Durable executor** | mechanics 1–7 | The heart of the work and where every gain sits. Depends on 001. |
| **003 — Brainstorm classification** | mechanic 10 | Independent of both. Small. Last because it is the cheapest to defer. |

Topic 001 is specified in full at
`docs/brainstorming/2026-09-07T005046-superpowers-adoption-001-plan-contract.md`.
Topics 002 and 003 get their own brainstorm before planning — this umbrella records their scope, not their design.

## Validated Decisions

| Decision | Rationale | Alternative rejected |
|---|---|---|
| Vendor the mechanics; never load superpowers at runtime | One vocabulary; works on all 5 providers; `add-investigation` proved the pattern | Optional `superpowers` plugin through our plugin system — the catalog only accepts `type: mcp`, and it would bind to Claude only |
| `/add.build` commits per task; `GIT CLEAN` is retired | Without a commit there is no `BASE..HEAD`, so no scoped diff, no honest checkpoint tag, no delivery marker | `git stash create` / `write-tree` hashes — real hashes, but invisible in `git log` and unusable for navigation |
| `/add.plan-to-ready` stays the only owner of the `checkpoint/*` tag | One tag owner; the tag now lands on top of real commits instead of on pre-work state | Moving tag creation into `/add.build` — two owners for one tag |
| Split into three topics, executed 001 → 002 → 003 | Each ships alone; the contract must precede the executor that reads it | One spec covering everything — a plan our own `@plan-reviewer-agent` would block on scope |
| Delete `add-planning` | Orphaned, loaded by nothing, and contradicts both the canonical schema and `add.build.md:82` | Rewriting and wiring it in — a second voice to keep in sync with `add-doc-schemas` |
| Every planning artefact moves to a `YYYY-MM-DDTHHMMSS` prefix — plans and brainstorms, both layers | Removes the next-number lookup and the cross-branch collision for plans, and makes same-day brainstorms sort correctly | Bare date on brainstorms — two written the same day sort arbitrarily, which the product schema already claims they do not |
| Plans keep `PLAN` / `SELF-PLAN`; brainstorms carry no kind marker | The two builders need to identify their plans inside one directory; brainstorms are already separated by directory and repository | Bare `<ts>-<slug>.md` for plans too, or a marker on brainstorms for symmetry |
| Existing files keep their names | They are historical records; `CLAUDE.md` cites several plans by number in prose | `git mv` everything — invalidates that prose and old commit references for no gain |

## Non-goals

- Changing `add-investigation` or anything on the debugging path.
- Adding superpowers as a runtime dependency in either layer.
- Renaming existing files — the 27 plans and the 15 internal brainstorms keep their names.
- Changing `## Red-Green Validation Matrix` or `## Execution Order` in the internal plan format — both are
  already stronger than the superpowers equivalent.

## Next Steps

1. `/add-framework--self-plan` for topic 001's internal half (`.claude/`, `CLAUDE.md`, internal plan format).
2. `/add-framework--plan` for topic 001's product half (`add-doc-schemas`, `add-tasks-checklist`,
   `add-planning` deletion, `provider-map.json`).
3. Brainstorm topic 002 before planning it.
