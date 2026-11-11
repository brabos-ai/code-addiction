# Plan: Agent Git Safety and Dynamic Artefact Indexing — stop destructive git in a shared tree, and index everything the graph cannot currently see

> **Status:** implemented
> **Layers:** both
> **Type:** cross-cutting
> **Created:** 2026-09-12

---

## Context

Framework v1.0.1 was exercised on a live personal project. Two independently dispatched `@test-agent`
runs executed `git stash` against a working tree shared with sibling agents running in parallel.
Nothing was lost. Neither agent was careless — both needed to tell *a failure I caused* from *a
failure that was already there*, and the framework sanctions no way to do that.

Investigating why the framework never surfaced this exposed a second, larger problem: the artefact
graph is blind to every composable part of the product layer, so the dispatch that caused the
incident is invisible to the tool built to answer "who dispatches this".

**Every decision here was taken and reviewed in the design set below. This plan does not re-derive
them — it points at them.**

| Document | Carries |
|---|---|
| `docs/brainstorming/2026-09-12T210854-agent-git-safety-and-graph-blind-spots.md` | The incident evidence, the five defects, the rejected alternatives for each, the label/grant analysis across all 22 product agents, and the ordering argument |

Three decisions in this plan **depart from that design**, each on evidence gathered during planning.
They are recorded in Validated Decisions and marked there.

## Global Constraints

- `node scripts/build.js` exits 0 and emits no new warning (CLAUDE.md, Pipeline)
- Never write a raw `.codeadd/` path — use `{{cmd:NAME}}` / `{{skill:NAME/FILE}}`; scripts are the exception, always `.codeadd/scripts/` (CLAUDE.md, Pipeline)
- HTML comments (`<!-- -->`) are stripped at build (CLAUDE.md, Pipeline)
- `mcp/` takes **no dependency at all**, `yaml` included, and its files are `.mjs` (CLAUDE.md, Product Layer — `mcp/`)
- `mcp/` is at the repository root and is PRODUCT (add-plan-authoring, Layer Tags)
- `cli/tests/mcp-engine.test.js` asserts the two surfaces answer identically (CLAUDE.md, Build-emitted sidecars)
- No new sidecar is introduced — `SIDECARS` in `scripts/build.js` is the single list every consumer is checked against (CLAUDE.md, Build-emitted sidecars)
- Never add an injection marker to an MCP-blocked agent (`add-framework-development:282`)

## Problem

1. **`@test-agent` is told to iterate until green and given no way to attribute a failure** — step 3 of
   *How You Work* reads "IF tests fail → fix the tests, never the source. Iterate until they pass."
   Against a red test it did not cause, that has no terminal state. The word `git` appears zero times
   in the file: no prohibition, no substitute, no exit route. It is the only read-write agent carrying
   that instruction — `fix`, `backend`, `database`, `frontend` and `e2e` return zero hits for it.
2. **The one in-prompt git prohibition enumerates only the commands that create history** —
   `git add`, `git commit`, `git tag` — while its own stated reason ("You leave your work in the
   tree") already covers `git stash`, which removes work from the tree.
3. **The dispatch never says the tree is shared** — `fragments/tdd-pipeline/add.build.md:97` reads
   "one per area, **parallel**" with a WAIT-ALL and passes a flat input list.
4. **The graph cannot see the dispatch that caused this.** `fragment` is absent from both
   `DECLARING_KINDS` (`build.js:571`) and `SNIFFABLE_KINDS` (`995`), so `declares` is false and the
   gate loop skips every fragment before reading its text. Asking who dispatches `@test-agent`
   returns `add.build` and `add.plan-to-ready` and omits `add.hotfix`.
5. **Three shipped classes are not nodes at all, and `build.js:1149` already says so in a comment** —
   `templates/`, `transforms/` and a plugin's own `skills/`. `add-gitnexus` is a skill that installs,
   loads and runs, and no gate, search or orphan check has ever seen it. Proof: 43 product + 9
   internal = 52 skills on disk, and the graph holds exactly 52.
6. **Graph guidance is two disagreeing partial lists.** `add-framework-development § Querying it`
   names five verbs as `graph.js`; `building-commands:434` names three as MCP. The MCP exposes
   eleven, and `neighbors` — the relationship verb — is missing from the nominal owner.
7. **The coordinator withholds what it knows.** `task-brief.sh` is 135 lines with no field for known
   failures. In the incident, the one dispatch handed the expected-failure list was the only one that
   did not investigate on its own.

## Proposal

Three topic groups, executed in order. **T1 alone closes the incident and is a safe stopping
boundary.** T2 is the largest and rebuilds what the graph indexes. T3 depends on T2 landing first —
telling agents to prefer the graph while it is blind to fragments would carve the blind spot into
procedure and retire the only method that currently sees past it.

## Current State

| Artefact | Layer | `impact --depth 1` | Risk |
|---|---|---|---|
| `product/agent/test-agent` | product | 2 | MEDIUM |
| `product/skill/add-subagent-driven-development` | product | 4 | HIGH |
| `product/script/task-brief.sh` | product | 2 | MEDIUM |
| `internal/skill/add-framework-development` | internal | 3 | HIGH |
| `internal/skill/building-commands` | internal | 5 | HIGH |
| `internal/agent/plan-review-agent` | internal | 4 | HIGH |
| `internal/agent/prompt-review-agent` | internal | 3 | HIGH |
| `scripts/build.js` | internal | **not a node** | HIGHEST — it emits the graph every consumer reads |
| `mcp/engine.mjs` | **product** | **not a node** | HIGH — one of two hardcoded copies of `ENTRY_POINT_KINDS` |

`node scripts/graph.js history --layer product|internal` reports **no delivery recorded** for any of
them. Nothing here was tried, shipped and dropped.

Graph today: 216 nodes, 6 kinds (`command` 23, `skill` 52, `agent` 30, `reference` 70, `fragment` 24,
`script` 17), 782 edges, 6 edge types.

## Scope

### Includes

#### T1 — Agent git safety (ref: design § "For defect 1")

- **F1** [product] — `framwork/.codeadd/agents/test-agent.md`: add a git section carrying three parts
  — the prohibition (`stash`, `checkout`, `reset`, `clean`, `restore`) stated **by its reason** ("do
  not remove work from the tree — sibling agents run in parallel against it"), the substitute
  (`git diff -- <path>`, `git show HEAD:<path>`), and the exit route (a failure that is not yours goes
  to `CONCERNS` and stops there — do not fix it). **Must NOT lose:** the frontmatter is untouched; no
  `tools:` or `disallowedTools:` key is added, because the agent needs Bash to run `TEST_COMMAND`.
  Ref: design § "For defect 1 — where the prohibition lives", options A/B/C.
  - **Produces:** `test-agent.md` carries a `## Git` section naming the exit route as `CONCERNS`
- **F2** [product] — `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md:327`: extend
  the Subagent Prompt Template's git line to the commands that remove work from the tree, phrased by
  the same reason as F1. **Must NOT lose:** the existing commit-ordering rationale ("the coordinator
  commits it after the validator returns") — that is a different rule in the same line and both must
  survive.
- **F3** [product] — `framwork/.codeadd/scripts/task-brief.sh`,
  `framwork/.codeadd/fragments/tdd-pipeline/add.build.md`, `add.hotfix.md`, and the coordinator step
  in `framwork/.codeadd/commands/add.build.md`: an optional `KNOWN_FAILURES` field carrying which
  tests are already red and whose they are into the dispatched agent's brief.

  ⛔ **The source is failures the coordinator has ALREADY observed in this build, and nothing else.**
  No pre-dispatch baseline test run is introduced — that would add a full suite run to every build to
  serve a field that is empty on the first dispatch anyway. The two places the coordinator already
  holds this information:
  1. The fix-iteration re-dispatch — `fragments/tdd-pipeline/add.build.md` already branches on
     `TESTS_PASSING = false` and names the area and its errors before re-dispatching.
  2. `CORRECTION` mode, which already carries `RED_TEST`.

  **Must NOT lose:** on a first dispatch with nothing observed, the field is written as
  `KNOWN_FAILURES: none observed` — never omitted. "None observed" and "not supplied" must be
  distinguishable, or the agent cannot tell an empty baseline from a missing one and investigates
  anyway. Where the field is empty, F1's substitute is what carries the agent.
  - **Produces:** `task-brief.sh` writes a `## KNOWN_FAILURES` section into every brief, reading `none observed` when the coordinator has seen no failure yet
  - **Consumes:** `test-agent.md` carries a `## Git` section naming the exit route as `CONCERNS` (F1) — the field is what lets the agent skip the investigation entirely

#### T2 — Index every dynamic artefact (ref: design § "The fragment is not alone")

- **F4** [internal] — `scripts/build.js:571`: add `fragment` to `DECLARING_KINDS`. **Must NOT lose:**
  `SNIFFABLE_KINDS` is not touched — nothing loads a fragment by name, the injection marker does that.
  ⛔ **The build fails between F4 and F5.** They land together or the repo is broken.
  - **Produces:** fragment nodes carry `declares: true`, so the undeclared-reference gate reads their text
- **F5** [product] — every fragment the gate names: add the `<!-- uses: -->` block it demands.
  **23 of 24 fragments name at least one artefact in prose**, so this is the migration, and the gate
  output is the complete worklist. **Must NOT lose:** a fragment whose prose points AWAY from an
  artefact takes `- mention:`, not a dependency edge.
  - **Consumes:** fragment nodes carry `declares: true` (F4)
- **F6** [internal] — `scripts/build.js` `collectNodes`: walk `plugins/*/skills/*/SKILL.md` as `skill`
  nodes, with their `references/` subdocs, exactly as `skills/` is walked. Today this misses
  `add-gitnexus`, a skill that ships in the release ZIP.
  - **Produces:** the graph holds 53 skill nodes, `product/skill/add-gitnexus` among them
- **F7** [internal] — `scripts/build.js` `collectNodes`: new `template` node kind over
  `framwork/.codeadd/templates/*.md`. Non-declaring and non-sniffable: they ship verbatim like
  scripts, and **nothing in `.codeadd/` names any of them**, so no edge kind is invented for a caller
  that does not exist.
  - **Produces:** the graph holds 4 `template` nodes
- **F8** [internal] — `scripts/graph.js:53`: `ENTRY_POINT_KINDS` gains `feature` and `plugin` and
  **deliberately does not gain `template`**. **Must NOT lose:** the four templates land in `orphans`,
  and that is the asserted end state — it is the first true thing the index says about them.
  - **Produces:** `ENTRY_POINT_KINDS = command, fragment, feature, plugin` — the exact set
- **F9** [product] — `mcp/engine.mjs:49`: the same set, in `ENTRY_POINT_KINDS.artefacts`. Two
  hardcoded copies exist and neither reads the other; they are kept equal by assertion, not by code.
  ⛔ `mcp/` is at the repository root and is **product**.
  - **Consumes:** `ENTRY_POINT_KINDS = command, fragment, feature, plugin` (F8)
- **F10** [internal] — `scripts/build.js` `collectNodes`: `feature` nodes from `fragments/{name}/` and
  `plugin` nodes from `plugins/{name}/`, each owning its directory members through a new `CONTAINS`
  edge. **Derived from the directory layout, never from `cli/src/features.js` or `plugins.json`** —
  reading CLI source from the graph builder would couple them for information the paths already carry.
  **This F-block is droppable**: if the edge shape does not fall out of the existing set, F10-F12 are
  cut and F1-F9 stand on their own.
  - **Produces:** `CONTAINS` edge type, container → member
- **F11** [internal] — `scripts/graph.js:42,145`: `DEPENDENCY_TYPES` gains `CONTAINS`, so
  `dependencies` on a feature node answers what enabling it touches — **and `orphans()` gets its own
  set that excludes it.**

  ⛔ **`CONTAINS` must never reach the orphans calculation.** `orphans()` builds its `depended` set
  from `DEPENDENCY_TYPES` membership on inbound edges. A container owning every file in its directory
  would give each one a permanent inbound dependency, so **nothing inside `fragments/` or `plugins/`
  could ever be reported as an orphan again** — dead weight would become invisible by directory
  placement alone, which is the exact failure `orphans` exists to prevent. Introduce
  `ORPHAN_DEPENDENCY_TYPES` (= `DEPENDENCY_TYPES` minus `CONTAINS`) and have `orphans()` read that.
  - **Consumes:** `CONTAINS` edge type, container → member (F10)
  - **Produces:** `orphans()` reads `ORPHAN_DEPENDENCY_TYPES`, which excludes `CONTAINS`
- **F12** [product] — `mcp/engine.mjs:42,407`: the same addition to `DEPENDENCY_TYPES.artefacts`, and
  the same `orphans()` exclusion. The second copy of both sets lives here and neither reads the other.
  - **Consumes:** `CONTAINS` edge type, container → member (F10)
  - **Consumes:** `orphans()` reads `ORPHAN_DEPENDENCY_TYPES`, which excludes `CONTAINS` (F11)
- **F13** [internal] — `scripts/build.js:1149`: the comment calls `templates/`, `transforms/` and
  plugin `skills/` "three shipped classes". After F6 and F7 two of them are nodes, and `transforms/`
  is **not shipped** — `release.yml:109` packages `.codeadd/scripts`, `fragments`, `templates` and
  `plugins` only. Rewrite the comment to what is then true.
  - **Consumes:** the graph holds 53 skill nodes, `product/skill/add-gitnexus` among them (F6)
  - **Consumes:** the graph holds 4 `template` nodes (F7)

#### T3 — One owner for the graph (ref: design § "For defect 4")

- **F14** [internal] — new `.claude/skills/add-artefact-graph/SKILL.md`: owns graph querying. All
  eleven verbs (`dependencies`, `get`, `history`, `impact`, `neighbors`, `orphans`, `path`, `reindex`,
  `search`, `stats`, `touched_by`), both interfaces, the question each answers, and a permanent
  **"what the graph cannot see"** section. That section must state from day one that a fragment's
  `DISPATCHES` edge originates at the **fragment** node, so a 1-hop `neighbors` on a command does not
  show it — check the fragments injected into a command, not only its own neighbours. **Must NOT
  lose:** the rule reads "for a relationship question, ask the graph", never "use the MCP instead of
  grep" — the two answer identically and grep stays correct for finding text.
  - **Produces:** `{{skill:add-artefact-graph}}` exists as the single owner of graph-query guidance
- **F15** [internal] — `.claude/skills/add-framework-development/SKILL.md` § *Querying it*: the
  five-verb table becomes a pointer. Its *Artefact Types* table (lines 66-75) also gains the kinds F6,
  F7 and F10 introduce.
  - **Consumes:** `{{skill:add-artefact-graph}}` exists as the single owner of graph-query guidance (F14)
- **F16** [internal] — `.claude/skills/building-commands/SKILL.md:427-435`: the inline
  three-verb MCP rule becomes a pointer.
  - **Consumes:** `{{skill:add-artefact-graph}}` exists as the single owner of graph-query guidance (F14)
- **F17** [internal] — `.claude/agents/plan-review-agent.md:40` and
  `.claude/agents/prompt-review-agent.md:94`: the two private inline copies become pointers.
  **Must NOT lose:** `prompt-review-agent.md:102` — "When the MCP is unavailable, the CLI behind it is
  not a fallback — it answers the same" — moves into F14 rather than being deleted.
  - **Consumes:** `{{skill:add-artefact-graph}}` exists as the single owner of graph-query guidance (F14)
- **F18** [internal] — `.claude/commands/add-framework--plan.md:202-205,233`,
  `add-framework--build.md:451-452`, `add-framework--sync.md:147-148`, `add-framework--brainstorm.md:111`:
  each command's inline verb enumeration becomes a load of the skill. **Must NOT lose:** brainstorm's
  STEP 1.2 delivery-index lookup is a different question and stays as it is.
  - **Consumes:** `{{skill:add-artefact-graph}}` exists as the single owner of graph-query guidance (F14)
- **F19** [internal] — `CLAUDE.md` § *Where the details live*: a row for `add-artefact-graph`, and the
  `artefact-graph.json` row updated to say the graph covers the composable layer too.
  - **Consumes:** `{{skill:add-artefact-graph}}` exists as the single owner of graph-query guidance (F14)
- **F20** [internal] — `.claude/skills/add-framework-product-layer/SKILL.md:172`: the line instructing
  the framework's own builder to baseline flaky tests with `git stash`. Same defect as F1, one layer
  up. Replace with the same substitute F1 gives.

### Does NOT Include (important!)

- **`add.plan-to-ready.md:363`.** The design listed it as a second prohibition site. It is not:
  that block is a release pre-check — "IF AN UNRESOLVED blocker ROW STANDS → DO NOT USE Bash for
  git add, git commit, git tag or git push". Those four are exactly the commands that would advance a
  release, and `stash` does not belong among them. Removed from scope on this evidence.
- **`transforms/` as a node kind.** The design carried it as 3d. `release.yml:109` does not package
  `.codeadd/transforms`; it is build-time input like `provider-map.json`, not a distributed artefact.
- **Deleting the four unreferenced templates.** F7 makes it visible that nothing in `.codeadd/` names
  `feature-about-template`, `feature-discovery-template`, `hotfix` or `hotfix-template`. Surfacing it
  is this plan's job; deciding their fate is not.
- **A harness permissions artefact** (`deny` on command patterns). The only real enforcement available,
  and a new distributed artefact with installer implications.
- **Tool restrictions on the other read-write agents.** On Claude Code, 13 of 22 agents have no
  tool-level enforcement — the 10 unmarked plus `architecture-agent`, `discovery-agent` and
  `reviewer-agent`, whose `readonly: true` the Claude dialect never emits. None carries the
  iterate-until-green instruction that caused this. Recorded, not scoped.
- **Adding `fragment` to `SNIFFABLE_KINDS`.** Nothing loads a fragment by name.
- **A new sidecar.** No consumer list, `release.yml` or `framwork/.gitignore` changes.

## Validated Decisions

| Question | Decision | Rationale / Ref |
|----------|----------|-----------------|
| Where does the prohibition live? | `agents/test-agent.md` | The only surface both dispatch sites share. The Universal Subagent Prompt Template scopes itself to area subagents and never reaches it. Design § defect 1, option C |
| Remove Bash from `@test-agent`? | No — no tool is removed from any agent | `disallowedTools` is all-or-nothing per tool; the agent needs Bash for `TEST_COMMAND`. `git-history-agent` is `readonly: true` **and** `tools: Bash, Read` for the same reason |
| Prohibition alone, or with a substitute? | Three parts — prohibit, substitute, exit route | Prohibition alone leaves "iterate until they pass" unsatisfiable and the next agent invents `git checkout -- .` |
| Is `add.plan-to-ready:363` a second site? | **No — departs from the design.** Removed | It is a release pre-check, not a briefing. Read during planning; see Does NOT Include |
| Does `transforms/` become a node? | **No — departs from the design.** Dropped | `release.yml:109` does not package it. Not distributed, so not dynamic in the sense that matters |
| How do templates behave in `orphans`? | They appear as orphans, and that is asserted as correct | Nothing names them. Hiding that would suppress the first true finding the index produces |
| Where do feature/plugin containers come from? | The directory layout | `fragments/{name}/` and `plugins/{name}/` already carry the name; reading `cli/src/features.js` would couple the graph builder to CLI source |
| Are containers droppable? | Yes — F10-F12, sequenced last | The only part inventing an edge type. F1-F9 stand alone if it is cut |
| Two copies of `ENTRY_POINT_KINDS`? | Kept in both, held equal by assertion | `scripts/graph.js:53` is internal, `mcp/engine.mjs:49` is product. Neither reads the other; only a test can hold them together |
| Does `mcp/` need source changes? | Yes, three — `ENTRY_POINT_KINDS`, `DEPENDENCY_TYPES` and the `orphans()` set | `stats()` counts kinds by iterating actual nodes and needs nothing. Those are the only hardcoded lists |
| Does `CONTAINS` go into the set `orphans()` reads? | **No — a separate `ORPHAN_DEPENDENCY_TYPES`** | Otherwise a container exempts every file in its directory and `orphans` stops surfacing dead weight. Found in review; F11/F12 carry it and L2.6 proves it |
| Audit the subject with `@prompt-review-agent`? | **No dispatch** | The new skill does not exist yet, and the internal skills T3 touches are edited mechanically — a table becomes a pointer. The command's own rule excludes both cases |
| One plan or several? | One, three topic groups | Layer tags carry the product/internal split; a topic is never divided into two plans |

## Accepted Trade-offs

| We gain | We give up |
|---------|------------|
| Agents stop reaching for destructive git on a shared tree, and are given a sanctioned substitute | A longer `test-agent` prompt on every dispatch |
| A red test that is not the agent's own has a defined terminal state | Some failures surface as `CONCERNS` instead of being chased |
| Fragment dispatches, the shipped plugin skill and the templates all become visible to every gate and query | A migration across 23 fragments, and a build that fails between F4 and F5 |
| One owner for graph querying; four scattered partial lists retired | One more internal skill and a load cost on its named consumers |
| Every future graph reader is told what the graph cannot see | That section needs maintaining as the parser grows |

## Risks and Mitigations

| Risk | Probability | Mitigation |
|------|-------------|------------|
| F4 lands without F5 and leaves the build red | **High** | They are one boundary in Execution Order, never split across a stop. L1.2 asserts the gate output is empty after F5 |
| New kinds break a consumer that assumed six | Medium | L1.5 and L2.2 enumerate the exact expected `byKind` map and the exact `orphans` set. `cli/tests/mcp-engine.test.js:145` already asserts `byKind` equality between the two surfaces and goes RED on its own |
| `scripts/graph.js` and `mcp/engine.mjs` diverge on the new sets, silently | **High** | L2.3 asserts the two `ENTRY_POINT_KINDS` and `DEPENDENCY_TYPES` sets are equal, read from both sources — the only thing holding two hardcoded copies together |
| The prohibition list in F1 drifts, like the three it replaces | Medium | F1 states the rule **by its reason**, with the command list as examples rather than as the rule |
| Container edge shape (F10) does not fall out of the existing set | Medium | F10-F12 are droppable as a unit, sequenced last, after every other level is green |
| **`CONTAINS` leaks into the orphans calculation and makes every file under `fragments/` and `plugins/` permanently un-orphanable** | **High** | `orphans()` builds `depended` from `DEPENDENCY_TYPES` membership, so a container owning its directory silently exempts every member — dead weight becomes invisible by directory placement, the exact thing `orphans` exists to catch. It would pass every other level today, because the one existing member (`add-gitnexus`) is already exempt through the real `USES_SKILL` edge F5 creates. F11 introduces `ORPHAN_DEPENDENCY_TYPES`; **L2.6 is the only level that proves it** |
| The 23-fragment migration introduces a wrong edge (a real dependency written as `mention:`) | Medium | L2.1 asserts `add.hotfix`'s fragment produces a `DISPATCHES` edge to `test-agent` — the exact edge whose absence started this |
| Templates flood `orphans` and someone "fixes" it by inventing edges | Medium | L2.2 asserts the orphans set contains exactly those four templates, by name |

## Impact

| Artefact | Layer | Action | Reason |
|----------|-------|--------|--------|
| `framwork/.codeadd/agents/test-agent.md` | product | modify | F1 |
| `framwork/.codeadd/skills/add-subagent-driven-development/SKILL.md` | product | modify | F2 |
| `framwork/.codeadd/scripts/task-brief.sh` | product | modify | F3 |
| `framwork/.codeadd/fragments/tdd-pipeline/add.build.md` | product | modify | F3, F5 |
| `framwork/.codeadd/fragments/tdd-pipeline/add.hotfix.md` | product | modify | F3, F5 |
| `framwork/.codeadd/commands/add.build.md` | product | modify | F3 |
| `scripts/build.js` | internal | modify | F4, F6, F7, F10, F13 |
| 23 files under `framwork/.codeadd/fragments/**` and `plugins/*/fragments/**` | product | modify | F5 |
| `scripts/graph.js` | internal | modify | F8, F11 |
| `mcp/engine.mjs` | **product** | modify | F9, F12 |
| `.claude/skills/add-artefact-graph/SKILL.md` | internal | **create** | F14 |
| `.claude/skills/add-framework-development/SKILL.md` | internal | modify | F15 |
| `.claude/skills/building-commands/SKILL.md` | internal | modify | F16 |
| `.claude/agents/plan-review-agent.md` | internal | modify | F17 |
| `.claude/agents/prompt-review-agent.md` | internal | modify | F17 |
| `.claude/commands/add-framework--plan.md` | internal | modify | F18 |
| `.claude/commands/add-framework--build.md` | internal | modify | F18 |
| `.claude/commands/add-framework--sync.md` | internal | modify | F18 |
| `.claude/commands/add-framework--brainstorm.md` | internal | modify | F18 |
| `CLAUDE.md` | internal | modify | F19 |
| `.claude/skills/add-framework-product-layer/SKILL.md` | internal | modify | F20 |
| `cli/tests/build-artefact-graph.test.js` | product | modify | L1 |
| `cli/tests/graph-query.test.js` | product | modify | L2 |
| `cli/tests/mcp-engine.test.js` | product | modify | L2, L3 |
| `cli/tests/graph-mcp.test.js` | product | modify | L3 |
| `cli/tests/graph-mermaid.test.js` | product | modify | L2.4 — verify it holds no kind enumeration; extend if it does |

---

## Validation Matrix (spec for the build phase)

**Discipline: RED first.** Every level is written and **confirmed failing against the current tree**
before any F-block lands — and confirmed failing *for the right reason*, not for a missing import or
a typo'd fixture. Then driven GREEN.

**EXPECTED END-STATE MAP** — the graph after F1-F13, asserted as exact values, not as "more than
before":

| Dimension | Before | After F1-F9 | After F10-F12 |
|---|---|---|---|
| Node kinds | 6 | 7 (`+template`) | 9 (`+feature`, `+plugin`) |
| `skill` nodes | 52 | 53 (`+add-gitnexus`) | 53 |
| `template` nodes | 0 | 4 | 4 |
| Edge types | 6 | 6 | 7 (`+CONTAINS`) |
| `ENTRY_POINT_KINDS` | `command, fragment` | `command, fragment, feature, plugin` | unchanged |
| Fragments declaring | 0 of 24 | 23 of 24 | 23 of 24 |

### L1 — Build-side emission (RED → GREEN) — `cli/tests/build-artefact-graph.test.js`

1. A fixture fragment declaring `- agent: X` emits a `DISPATCHES` edge from the fragment node.
   *RED today: `declares` is false for `fragment`, so `extractUses` never runs over it.*
2. The undeclared-reference gate **fails the build** on a fixture fragment naming an artefact with no
   `uses:` block, and the message names the fragment path. *RED today: the gate loop skips the node.*
3. After F5, `node scripts/build.js` emits **zero** undeclared-reference failures over the real tree.
   *RED today: 23 fragments name artefacts and declare nothing.*
4. `product/skill/add-gitnexus` is a node, with its file path under `plugins/gitnexus/skills/`.
   *RED today: absent; the skill walk covers `skills/` only.*
5. `byKind` equals the exact map in the end-state table above — every kind and every count named.
   *RED today: 6 kinds, 52 skills, 0 templates.*
6. The four `template` nodes are `declares: false` and absent from `SNIFFABLE_KINDS`. *RED today: no
   template node exists.*

### L2 — Query surface (RED → GREEN) — `cli/tests/graph-query.test.js`

1. `neighbors product/agent/test-agent` returns an inbound `DISPATCHES` **from the tdd-pipeline
   hotfix fragment node**. *RED today: the edge does not exist — this is the exact blindness that
   started this plan.*
2. `orphans` **filtered to `kind: template`** returns exactly the four templates, by name. The
   unfiltered list holds **24 pre-existing orphans today** that this plan neither causes nor fixes, so
   an assertion over the whole set can never hold; filtering by kind also satisfies "not
   `add-gitnexus`, not any container" for free. *RED today: no template node exists to be an orphan.*
3. `search add-gitnexus` returns the skill node. *RED today: returns nothing.*
4. `graph-mermaid` renders the new kinds without a hardcoded kind list rejecting them.
   *Pre-existing guard, not a RED: `toMermaid`'s kind filter (`scripts/graph.js:391`) takes its set
   from `opts.kinds` and rejects no unknown kind string, so this plausibly passes today. It is written
   to keep passing, and if it does go red the filter has a hardcoded list the plan has not found.*
5. After F10-F12, `dependencies` on `product/feature/tdd-pipeline` lists its three fragments.
   *RED today: the node does not exist.*
6. After F10-F12, a container member that genuinely nothing else references **still appears in
   `orphans`**. *RED today: the node does not exist — and this is the level that proves `CONTAINS`
   did not leak into the orphans calculation. Without it, F11/F12 can silently make every file under
   `fragments/` and `plugins/` un-orphanable and every other level still passes.*

### L3 — CLI / MCP parity (RED → GREEN) — `cli/tests/mcp-engine.test.js`, `graph-mcp.test.js`

1. `byKind` from `mcp/engine.mjs` equals `byKind` from `scripts/graph.js`, for every new kind.
   *This assertion already exists at `mcp-engine.test.js:145` and goes RED on its own the moment the
   two diverge — it is the free RED this plan is built around.*
2. `ENTRY_POINT_KINDS` read from `scripts/graph.js` equals the set read from `mcp/engine.mjs`.
   *RED today: no test compares them; two hardcoded copies are held together by nothing.*
3. `DEPENDENCY_TYPES` read from both sources are equal, `CONTAINS` included after F10-F12 — **and the
   `ORPHAN_DEPENDENCY_TYPES` read from both sources are equal and exclude `CONTAINS`.**
4. `orphans`, `neighbors`, `dependencies` and `search` return identical results from both surfaces for
   every new kind. *Mixed: passes today for the six existing kinds, RED for each new kind as it is
   emitted. Record which half was red.*
5. `--corpus=artefacts` still resolves from the repository root with **no dependency added** to
   `mcp/`. *Pre-existing guard, not a RED — it passes today and must keep passing. It is the only
   thing standing between `mcp/` and an import that breaks it silently.*

### L4 — Behavioural acceptance

1. `@test-agent`'s definition, read cold, tells a reader what to do when a test fails that is not
   theirs — without naming `git stash` as an option anywhere in the file.
2. `grep -c "git stash" framwork/.codeadd/agents/test-agent.md` returns 0 for the sanctioned form and
   the file contains the prohibition and both substitute commands.
3. `.claude/skills/add-artefact-graph/SKILL.md` names all eleven verbs, and no
   `add-framework--*` command still enumerates a verb subset inline.
4. `add-framework-product-layer/SKILL.md` no longer instructs a `git stash` baseline.

**RED expectations against the current tree — every level is classified, none left unstated:**

| Levels | Status today |
|---|---|
| L1.1-L1.6, L2.1-L2.3, L2.5, L2.6, L3.2, L3.3, L4.1-L4.4 | **RED** — each fails, and the build confirms each fails *for the stated reason* before its F-block lands |
| L3.1, L3.5, L2.4 | **Pre-existing guard** — passes today, must keep passing. Never claimed as a new RED |
| L3.4 | **Mixed** — passes for the six existing kinds, RED for each new kind as it is emitted |

**GREEN = every level passes after F1-F20.**

---

## Execution Order

```
T1:  F1 → F2 → F20 → F3
T2:  (F4 + F5 together) → F6 → F7 → F8 → F9 → F13 → [F10 → F11 → F12]
T3:  F14 → F15 → F16 → F17 → F18 → F19
```

- **F1 first** — it is the only F-block that stops the observed behaviour, and it is one file.
- **F20 sits in T1**, not T3, because it is the same fix one layer up and shares F1's wording.
- **F4 and F5 are one boundary.** The undeclared-reference gate fails the build between them. They
  are never split across a stop, and no other F-block lands between them.
- **F8 before F9**, so the exact set is fixed in one place before the second copy is made to match.
- **F10-F12 last in T2, and droppable as a unit.** If the `CONTAINS` shape does not fall out cleanly,
  cut all three; F1-F9 and F13 stand on their own and every level except L2.5 and L3.3 still passes.
- **T3 after T2 in full.** Pointing agents at the graph before it sees fragments would carve the blind
  spot into procedure.

**Safe stopping boundaries** — the repo is working and coherent after any of these:

| After | State |
|---|---|
| **F3** (end of T1) | The incident is closed. Nothing about the graph has changed. **The best place to stop if the plan must be cut short.** |
| **F5** | The gate is complete and green. Never stop between F4 and F5. |
| **F9** | Templates and the plugin skill are indexed; both surfaces agree. |
| **F13** | T2 complete without containers. |
| **F19** | Whole plan complete. |

**Per-F-block validation beyond the layer default:**
- F4, F5: `node scripts/build.js` must exit 0 and emit no new warning — this is the F-block pair most
  likely to leave the build red.
- F9, F12: touching `mcp/` requires the no-dependency constraint re-checked (L3.5), because adding an
  import there is invisible until `--corpus=artefacts` is run from the repository root.
- F14: `node scripts/build.js` must not report the new skill as an orphan — an internal skill nothing
  loads is a real finding, and F15-F18 are what prevent it.

## Reviewer Handoff

For each F-block the build must leave, in the evidence file:

- **What changed** — files touched, with the F-block id.
- **Which validation levels cover it**, and their pass state.
- **Any decision deferred or altered**, with the design section it departs from and why.

Gaps a reviewer must actively hunt, because they are the ones this plan is most likely to leak:

1. **An F-block marked done whose validation level was never RED.** A test written after the fix
   proves nothing. L3.1 is the exception and must be recorded as a pre-existing guard, not claimed as
   a new RED.
2. **F5 done by adding `mention:` where a real dependency exists.** `mention:` silences the gate, so a
   wrong choice there is invisible afterwards and permanently removes the edge this plan exists to
   create. Spot-check the three tdd-pipeline fragments against L2.1.
3. **F9 or F12 done by copying a value rather than the whole set.** The two copies must be
   character-equal in content, not merely overlapping. L3.2 and L3.3 are the only proof.
4. **F1 written as a command blacklist instead of a reason.** The risk table names this; a reviewer
   should read F1's text and confirm the rule survives a command the list does not mention.
5. **F10-F12 dropped silently.** If they are cut, the ledger must carry the ruling and L2.5, L2.6 and
   L3.3 must be recorded as deliberately unmet, not as passing.
6. **F11/F12 done by adding `CONTAINS` to `DEPENDENCY_TYPES` and stopping there.** It is the natural
   one-line edit and it passes every level except L2.6. Read the diff and confirm `orphans()` reads
   `ORPHAN_DEPENDENCY_TYPES`, in both `scripts/graph.js` and `mcp/engine.mjs`.
7. **L2.2 asserted over the unfiltered orphans list.** 24 pre-existing orphans stand today and remain
   afterward; the assertion must filter to `kind: template` or it can never hold.

## References

- Design set: `docs/brainstorming/2026-09-12T210854-agent-git-safety-and-graph-blind-spots.md`
- Prior art: none. `node scripts/graph.js history --layer product|internal` reports no delivery
  recorded for any artefact this plan touches.

---

## Next Steps

/add-framework--build agent-git-safety-and-dynamic-artefact-indexing

## Plan Changelog

| Date | Change |
|------|--------|
| 2026-09-12 | Initial creation |
| 2026-09-12 | Review `fix-then-ok` applied: F3 names the source of `KNOWN_FAILURES` (observed failures only — no baseline test run introduced); F11/F12 add `ORPHAN_DEPENDENCY_TYPES` so `CONTAINS` cannot make directory members un-orphanable, with L2.6 to prove it; L2.2 filtered to `kind: template` against 24 pre-existing orphans; every validation level classified RED / guard / mixed; F13 declares its two `Consumes` |
| 2026-09-13 | Implemented across 20 commits on feat/agent-git-safety-and-dynamic-indexing. STEP 7 review: 34 findings, 18 applied, 16 rejected with rulings. Changelog: docs/changelog/2026-09-13T003402-add-agent-git-safety-and-dynamic-artefact-indexing.md |
