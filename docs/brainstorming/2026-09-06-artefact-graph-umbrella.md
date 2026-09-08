# Brainstorm: Artefact Graph — Typed Relationship Map for Commands, Skills and Agents

> **Status:** final (ready for /add-framework--self-plan + /add-framework--plan)
> **Date:** 2026-09-06
> **Type:** architecture

## Discovery

Measured against the live repo at `88db331`, not recalled:

- **`scripts/build.js`** (1145 lines) — already emits two content-derived sidecars, `injection-points.json` and `contracts.json`. Both use a `{ version: 1, ... }` envelope, deterministic sorting and **no timestamp**, so the file is byte-stable across builds. A third sidecar is the same shape.
- **`extractContract()` / `sliceContractBlock()`** — derives `contracts.json` from a declared `## Materializes` H2. The slicer is already **fence-aware** (an embedded fenced template carrying its own H2s does not truncate the block). Reusable as-is.
- **`extractInjectionPoints()`** — consumes `<!-- feature: -->` / `<!-- plugin: -->` markers from **raw** content before `stripHtmlComments()` runs, so the markers never ship. This is the precedent for a source-only declaration block.
- **`injection-points.json`** — already holds fragment placement: **39 entries, 29 command + 10 agent** (measured from a fresh build). The `INJECTS_INTO` edges come from it for free; no re-extraction.
- **`framwork/provider-map.json`** — the single central registry of commands/skills/agents and their provider distribution.
- **`.github/workflows/ci.yml:34`** — runs `node scripts/build.js` on every PR and push, under a **Node 20 + 22 matrix**.
- **`.github/workflows/release.yml:112-113`** — each sidecar is packaged by an explicit, named line. A third needs a third line.
- **Plan 0074** — the umbrella-with-topics shape this spec follows; also the precedent for a change spanning a script, a schema and several commands.
- **Commit `56bc22d`** — "the registry has three consumers, and the build only checked two". The exact failure mode a third sidecar invites.

## Context & Motivation

The framework distributes 16 commands, 42 skills and 22 agents to 5 providers, and maintains 8 more commands, 3 skills and 6 agents in its internal layer. Those artefacts reference each other constantly — a command loads skills, dispatches agents, hands off to other commands — but **every one of those references is prose inside markdown**, in four inconsistent forms:

| Form | Example | Count |
|---|---|---|
| Resource-path variable | `{{skill:add-doc-schemas/references/new-feature.md}}` | 10 |
| Free text | `load the add-tdd skill` | most |
| Agent mention | `@reviewer-agent` | 46 mentions / 19 agents |
| Fragment injection | `<!-- plugin:gitnexus:SECTION -->` | in sidecar already |

There is no machine-readable answer to "what breaks if I change `add-doc-schemas`?" — and no gate that notices when the answer changes.

## Problem / Opportunity

**Nothing is registered wrong today — and that is exactly the problem.** A correct scan (skill = a directory *containing* `SKILL.md`) finds zero unregistered commands, skills or agents among tracked files. There is no drift to clean up. But there is also **no mechanism that would notice if there were**: nothing in the build, the test suite or CI compares what is on disk against what `provider-map.json` registers. An unregistered artefact is simply never built, for any provider, silently.

This is live right now, in the working tree. Two untracked artefacts appeared during the session that produced this spec:

```
?? framwork/.codeadd/agents/readback-agent.md
?? framwork/.codeadd/skills/add-feature-readback/
```

Work in progress, not drift. But when it lands, forgetting a `provider-map.json` entry produces an artefact that exists, reads correctly, is referenced by prose — and ships to nobody. No test catches that.

**And grep cannot substitute for a real map.** Three separate crude probes written for this spec each produced wrong answers:

| Probe | Result | Why it was wrong |
|---|---|---|
| Orphan skills by name | 13 orphans | 11 were false positives — referenced from `fragments/` and `plugins/` |
| Reference count for `command/add` | 43 | `/add\b` matches inside `/add.plan`; `.` is a word boundary |
| Unregistered skills via `ls skills/` | 2 | Both are **eval workspaces, not skills** — no `SKILL.md`; see Node inventory |

That third one is the instructive failure: `add-backend-architecture-workspace` and `add-frontend-architecture-workspace` hold `evals/evals.json` plus captured `with_skill/outputs/response.md` runs, committed in `03619c2` alongside the real skills they validate. Any scan keyed on "directory under `skills/`" misreads them as artefacts. A gate built that way would fail the build on its first run, on files that are perfectly fine.

Measured shape of the real graph:

```
97 declaring artefacts   product:  16 commands + 42 skills + 22 agents  (80)
                         internal:  8 commands +  3 skills +  6 agents  (17)

208 nodes total          the 97 above, plus edge targets that never declare:
                         73 skill reference files + 14 scripts + 24 fragments

~300 edges  USES_SKILL, DISPATCHES, HANDS_OFF_TO, RUNS_SCRIPT, INJECTS_INTO

Hubs (largest blast radius):
   27x  skill/add-doc-schemas
   23x  command/add.plan
   15x  skill/add-ux-design
   13x  agent/reviewer-agent
```

## Proposed Solution

A **third build-emitted sidecar**, `framwork/.codeadd/artefact-graph.json`, derived from a **declared, source-only block** in each artefact and validated by a **bidirectional guard**.

Two things stay separate on purpose:

| | Location | Why |
|---|---|---|
| **Declaration** — what each artefact uses | distributed, in the artefact itself | source |
| **Index** — the compiled graph | centralised, one JSON file | derived |

### Alternatives considered

**A — Own extractor + thin MCP (recommended, chosen).** The relationship grammar is domain-specific: only this framework knows that `@reviewer-agent` means DISPATCHES. That extraction is irreducible in every option, and it is small. Everything downstream is commodity.

**B — Adopt a markdown-graph tool (IWE, Foam, Quartz, Obsidian).** Verified against IWE (Apache-2.0): it builds edges from explicit markdown links and has **no typed edges** — it cannot distinguish "loads a skill" from "dispatches an agent" from "injects a fragment", which is precisely the value. It would also require `[[wikilinks]]` inside artefacts that ship to end users. Rejected.

**C — Own extractor feeding a graph store (Graphiti, Kùzu, Neo4j).** The extractor is identical to A, plus a database. At 208 nodes it is dead weight. Rejected on scale, revisit above ~5-10k nodes.

**D — Code-graph tools (GitNexus, Graphify, SCIP).** They parse code via AST. These artefacts are prose — no imports, no calls. Wrong input entirely. Rejected.

## Type of Artefact

architecture (spans `scripts/build.js`, a new sidecar schema, ~97 artefact sources across both layers, a new MCP server, CI and release packaging)

## Scope

### Includes

- `artefact-graph.json` sidecar emitted by `scripts/build.js`
- A source-only `<!-- uses: -->` declaration block in all 97 artefacts, both layers
- A bidirectional build guard (dangling refs, unregistered artefacts, phantom edges, missing declarations)
- An MCP server exposing the graph for live queries
- A Mermaid/D2 emitter feeding `web/public/*.svg` and `web/`
- Consumption by `add-framework--self-plan`, `--plan`, `--sync`, `--shared-review`
- A `release.yml` packaging line and CI enforcement

### Does NOT Include

- Any graph database, embeddings or vector search
- Indexing of **user project** code (that is what the existing `gitnexus` plugin does)
- Temporal/history tracking of the graph — git already holds it over the source files
- Changing how `provider-map.json` works
- Un-ignoring `docs/`

## Key Decisions

| Decision | Rationale | Validated |
|---|---|---|
| All four uses in scope: gate, live query, visualisation, internal-command consumption | User selected all four | ✅ |
| Declared block + guard, not prose-sniffing alone | Sniffing produced 11 false positives out of 13; a gate that cries wolf gets disabled | ✅ |
| Both layers in one graph, with a `layer` field per node | Cross-layer edges are real (`--sync` dispatches the 4 analyzers); and the internal commands that *consume* the graph must be *in* it | ✅ |
| Declaration distributed, index centralised | Not either/or — source vs compiled | ✅ |
| Declaration lives in the artefact, never in a central registry | Locality: a declaration beside what it describes enters the same diff and the same review as the change it documents, so it cannot rot unnoticed. A central registry can, because editing the artefact and editing the registry are two separate acts. **Note:** an earlier draft claimed `provider-map.json` had already rotted (the `-workspace` skills); that was wrong — they were never registered because they are not artefacts. The registry is correct today. The supporting evidence is weaker and indirect: commit `56bc22d` fixed a real central-registry coordination failure (three consumers, two checked) | ✅ |
| Index format is JSON, not SQLite or a graph DB | CI runs a **Node 20** leg; `node:sqlite` needs Node 22.5+, and `better-sqlite3` is a native module inside an `npx`-distributed CLI. The sidecar also ships in the release ZIP, where a binary is not diffable or inspectable. Both existing sidecars are JSON | ✅ |
| Block is source-only, stripped at build | `## Materializes` ships because it is an *instruction*; `<!-- uses: -->` is *build metadata* the runtime agent never needs. Shipping it costs tokens on every invocation, on 5 providers, forever — and risks being read as an instruction | ✅ |
| Block written as an HTML comment, read from raw content before stripping | Reuses `extractInjectionPoints()`'s exact mechanism; zero new stripping logic | ✅ |
| Guard is bidirectional, with an explicit `(conditional)` escape hatch | A one-way guard catches a forgotten declaration but leaves **phantom edges** when a dispatch is removed from prose. For impact analysis a phantom edge is worse than a missing one, because it is trusted | ✅ |
| Sniff-vs-declared mismatch starts as a warning, becomes a failure after wave 2 | The 97 blocks do not exist yet; failing before they are written blocks every build | ✅ |
| No timestamp in the sidecar | Matches `writeInjectionPoints()` / `writeContracts()`; keeps the file byte-stable | ✅ |

## Design

### Sidecar shape

`framwork/.codeadd/artefact-graph.json`, sorted deterministically, `{ version: 1, nodes: [...], edges: [...] }`.

A node carries `id` (`command/add.review`), `kind`, `layer` (`product` | `internal`), `name`, `path`, `description` and the providers it builds to. An edge carries `from`, `to`, `type`, `detail` and an `origin` (`declared` | `sidecar`).

### Node inventory — what is a node, and what declares

Two roles are distinct, and conflating them was a gap in an earlier draft of this spec. A node is anything an edge may point **at**; only some node kinds also **declare** a block of their own.

| Kind | Count | Is a node | Declares `<!-- uses: -->` |
|---|---|---|---|
| Command (product 16 + internal 8) | 24 | yes | yes |
| Skill (product 42 + internal 3) | 45 | yes | yes |
| Agent (product 22 + internal 6) | 28 | yes | yes |
| Skill reference file (`skills/*/references/*.md`) | 73 | yes | **no** — edge target only |
| Script (`.codeadd/scripts/*`) | 14 | yes | **no** — edge target only |
| Fragment (`fragments/`, `plugins/`) | 24 | yes | **no** — its edges come from `injection-points.json` |

So **97 artefacts declare**, and **208 nodes** exist in the graph. The dangling-reference gate needs the full 208: a `<!-- uses: -->` line naming `add-doc-schemas/references/new-feature.md` or `qa-evidence.sh` can only be validated against a node that exists.

**A skill is a directory that contains `SKILL.md` — never merely a directory under `skills/`.** This is a load-bearing definition, not a detail. Two eval workspaces live under `skills/` today (`add-backend-architecture-workspace`, `add-frontend-architecture-workspace`), holding `evals/evals.json` and captured eval responses for the two real architecture skills. They contain no `SKILL.md`, they are correctly ignored by `provider-map.json`, and the build already skips them. A node scan keyed on directory position rather than `SKILL.md` presence would classify them as unregistered artefacts and fail the build on its first run. The same rule applies to every kind: a node is a file the build knows how to transform, never a path that merely sits in the right folder.

### Edge types

| Type | From → To | Source |
|---|---|---|
| `USES_SKILL` | command / agent / skill → skill | `<!-- uses: -->` |
| `DISPATCHES` | command → agent | `<!-- uses: -->` |
| `HANDS_OFF_TO` | command → command | `<!-- uses: -->` |
| `RUNS_SCRIPT` | command / skill → script | `<!-- uses: -->` |
| `INJECTS_INTO` | fragment → command / agent | **reused from `injection-points.json`** — 39 edges, no extraction needed |

### The declaration block

Illustrative — one snippet, per the no-code rule:

```markdown
<!-- uses:
- skill: add-doc-schemas/references/new-feature.md
- skill: add-tasks-checklist
- agent: reviewer-agent (depth 1)
- command: /add.review (handoff)
- script: qa-evidence.sh
- skill: add-tdd (conditional)
-->
```

Read from raw content before `stripHtmlComments()`, so it never reaches a provider file. The slicer reuses `sliceContractBlock()`.

### The guard

| Condition | Verdict | False-positive risk |
|---|---|---|
| A declared entry points at an artefact that does not exist | **FAIL** — dangling reference | none — compared against disk |
| An artefact exists on disk but is in no `provider-map.json` | **FAIL** — unregistered | none, **provided** node identity is `SKILL.md` presence and not directory position — see Node inventory |
| Sniffed in prose, not declared | **FAIL** — forgotten declaration | yes → ships as WARN, flips to FAIL after wave 2 |
| Declared, not in prose, unmarked | **FAIL** — phantom edge | yes → same rollout |
| Declared, not in prose, marked `(conditional)` | pass | — |

`(conditional)` is the valve for legitimate non-greppable loads. It is explicit and reviewable in the diff, never a silent exception.

### Freshness

The graph is re-emitted on every build, so it can never be stale relative to source. The only staleness possible is declaration-vs-prose, which the guard owns.

| Layer | Mechanism | Cost |
|---|---|---|
| Regeneration | `build.js` re-emits every build | zero — it is the design |
| Enforcement | CI already runs `build.js` on every PR (`ci.yml:34`) | **zero — already exists** |
| Declaration freshness | the bidirectional guard | wave 2 |
| Workflow | `--build` / `--self-build` regenerate and report; `--shared-review` checks | wave 5 |

In user projects there is **nothing to maintain**: the graph describes the framework's own artefacts, which change only on `codeadd update`.

## Decomposition Map

| Subtopic | Wave | Layer / Command | Purpose |
|---|---|---|---|
| Sidecar + hard gates | 1 | internal (`--self-plan`) | `extractUses()`, `artefact-graph.json`, the two zero-false-positive failures, `release.yml` line, unit tests beside `build-contracts.test.js` |
| Declaration rollout | 2 | **both** (`--self-plan` + `--plan`) | Bootstrap generator, 97 `<!-- uses: -->` blocks, guard flips to FAIL |
| MCP server | 3 | internal (`--self-plan`) | `@modelcontextprotocol/server` (Apache-2.0 for new contributions, MIT for existing code), `StdioServerTransport`, in-memory; tools ≈ `impact`, `neighbors`, `orphans`, `path` |
| Visualisation | 4 | internal (`--self-plan`) | Graph → Mermaid (MIT) or D2 (MPL-2.0) → `web/public/*.svg` + `web/` |
| Internal consumption | 5 | internal (`--self-plan`) | `--self-plan` reads blast radius; `--sync` gains a source of truth for the SVGs; `--shared-review` checks coverage |

## Dependencies & Relationships

Waves are strictly ordered: 2 needs the extractor from 1; 3, 4 and 5 all read the sidecar that 1 emits and that 2 makes trustworthy.

**Wave 1 stands alone**, but it is preventive, not curative: nothing is unregistered today, so it cleans up nothing. What it buys is that the next unregistered artefact fails a PR instead of shipping to nobody — a live candidate is already untracked in the working tree (`readback-agent`, `add-feature-readback`). It also emits the sidecar every later wave reads.

**Wave 2 is the only one that crosses layers.** It edits `framwork/.codeadd/` (owned by `--plan` / `--build`) *and* `.claude/` (owned by `--self-plan` / `--self-build`). Per `CLAUDE.md`, neither command covers both sides, so wave 2 must be split into two topics by layer, in the shape of plan 0074.

## Ecosystem Impact

| Component | Impact | Action |
|---|---|---|
| `scripts/build.js` | New `extractUses()` + `writeArtefactGraph()` + guard | Wave 1 |
| `framwork/provider-map.json` | Becomes gated — an unregistered artefact now fails the build | No cleanup needed; nothing is unregistered today |
| `framwork/.gitignore` | Names each sidecar explicitly (lines 2-3); a third needs a third line | Wave 1 |
| `.github/workflows/release.yml` | Third sidecar needs an explicit packaging line beside 112-113 | Wave 1 |
| `.github/workflows/ci.yml` | None — already runs `build.js` | none |
| 97 artefact sources | Each gains a `<!-- uses: -->` block | Wave 2 |
| `cli/tests/` | New suite mirroring `build-contracts.test.js` | Wave 1 |
| `add-framework--sync` | SVG regeneration gains a source of truth | Wave 4 |
| `add-framework--self-plan`, `--plan` | Gain blast-radius input | Wave 5 |
| `add-framework--shared-review` | Gains a coverage check | Wave 5 |
| `CLAUDE.md` | Document the third sidecar and the `<!-- uses: -->` convention | Wave 1 |
| `add-resource-path-convention` skill | Sibling convention; may need a cross-reference | Wave 2 |

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| Machine-readable blast radius across 97 artefacts | A declaration block to maintain in 97 files |
| A build gate that catches dead artefacts on the PR that creates them | A stricter build — unregistered artefacts now fail |
| A source of truth for the SVGs, replacing manual agent analysis | An emitter to keep working |
| Zero new build dependencies, offline, deterministic | A hand-written BFS instead of `WITH RECURSIVE` |

| Risk | Probability | Mitigation |
|---|---|---|
| Sniffer false positives make the guard noisy and it gets disabled | **High** — already measured at 11/13 | Sniff never causes a hard failure on its own; the two zero-risk failures ship first; `(conditional)` is an explicit valve |
| The 97-block rollout stalls half-done, leaving the graph partly true | Medium | Wave 1 is useful standalone; the sniff guard stays a warning until the rollout completes, so a half-done state never blocks a build |
| A consumer of the new sidecar is forgotten — the `56bc22d` failure | Medium | A new sidecar has **four** consumers: the build that emits it, `framwork/.gitignore`, `release.yml`, and `CLAUDE.md`. Wave 1 adds a test that **derives** the consumer check from what the build emits, rather than listing sidecar names — a hardcoded list is the bug `56bc22d` fixed, rewritten |
| Wave 2 gets run by one command and silently skips a layer | Medium | Split wave 2 into two layer-scoped topics, per plan 0074 |
| `(conditional)` gets used to silence real drift | Low | It is visible in the diff and reviewable; consider capping how many an artefact may carry |
| Node identity keyed on directory position instead of `SKILL.md` presence — the unregistered gate then fails the build on eval workspaces | **High if unspecified** — it happened three times while writing this spec | Node inventory makes the rule explicit and load-bearing; wave 1 needs a unit test asserting a `SKILL.md`-less directory under `skills/` produces no node and no failure |
| Graph outgrows JSON | Low | Explicit revisit trigger at ~5-10k nodes; today 208 |

## Open Question for the Owner

**Where should eval workspaces live?** `add-backend-architecture-workspace` and `add-frontend-architecture-workspace` are eval evidence, not artefacts, but they sit inside `skills/` — which is why three separate scans written for this spec misread them. Wave 1 works either way, because node identity keys on `SKILL.md` presence. But the placement will keep costing a special case in every future tool that walks `skills/`.

Three options, none decided here:

1. **Leave them.** Zero work; every walker keeps needing the `SKILL.md` rule (which it needs anyway).
2. **Move them** to a sibling path such as `framwork/.codeadd/evals/{skill}/`. Cleaner walk, and `add-skill-creator` would need to emit there.
3. **Untrack them.** They are captured model output; `docs/evidence/` is where this repo already keeps that kind of artefact.

Related: `add-skill-creator` has no documented convention for where an eval workspace goes. Whatever is chosen should be written down there, or the next skill built with evals lands in `skills/` again.

## Next Steps

Wave 1 is internal-layer work:

```
/add-framework--self-plan artefact-graph sidecar + hard gates -> ref: 2026-09-06-artefact-graph-umbrella.md
```

Wave 2 crosses layers and must be split into two layer-scoped topics before planning.
