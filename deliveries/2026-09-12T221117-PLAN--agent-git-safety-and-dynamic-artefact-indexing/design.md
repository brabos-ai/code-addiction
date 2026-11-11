# Brainstorm: Agent Git Safety and Artefact-Graph Blind Spots

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-12
> **Type:** agent + script + skill + command (five scoped changes across both layers)

## Discovery

Delivery index (`node scripts/graph.js history`) reports no prior delivery for
`add-subagent-driven-development`, `add.build` or `add-build-ledger`. This ground has not been
covered and dropped — it is new.

- **`@test-agent` (product/agent)** — the agent that ran the unsafe command, twice. The only
  read-write agent instructed to run a test command and iterate until green.
- **`add-subagent-driven-development` (product/skill)** — owns the Subagent Prompt Template and the
  only in-prompt git prohibition in the product layer (line 327). Does not reach `@test-agent`.
- **`add.build` §10.2 (product/command)** — the Universal Subagent Prompt Template, scoped by its own
  text to area subagents only.
- **`fragments/tdd-pipeline/` (product/fragment)** — where `@test-agent` is actually dispatched, from
  two files, neither using a shared prompt template.
- **`scripts/build.js` (internal)** — emits the artefact graph. Its `DECLARING_KINDS` and
  `SNIFFABLE_KINDS` sets both omit `fragment`.
- **`building-commands` and `add-framework-development` (internal/skill)** — two disagreeing partial
  lists of artefact-graph verbs.

## Context & Motivation

Framework v1.0.1 was exercised on a live personal project. During one build, two independently
dispatched `@test-agent` runs (model `sonnet`) each executed `git stash` against a working tree
shared with sibling agents running in parallel.

Both self-reported. Both had the same legitimate need: to tell *a failure I caused* from *a failure
that was already there*.

- **T17** (`receipt-resolve.spec.ts`) stashed the whole tree — not just its own files — to get a
  clean baseline of two other failing files, then ran `git stash pop` and confirmed the edits
  returned. It closed its own report saying it should not have reached for stash on a dirty branch
  carrying third-party work in progress, and that `git diff` / `git show` on a specific path would
  have been the safe route.
- **T18** (`receipt-extraction.spec.ts`, `receipt-handler.spec.ts`) stashed to confirm a failure
  existed independently of its own spec files — it disappeared when all uncommitted changes were
  stashed and reappeared from other modified sources.

Nothing was lost. Two agents reaching the same dangerous move on their own, without either being
careless, is a framework defect rather than an agent defect.

**The control case is decisive.** T19 was handed the list of five expected failures. It found a red
test, reported it, and touched nothing. It was the only dispatch of the four that did not have to
investigate on its own.

## Problem / Opportunity

Five distinct defects surfaced. The first caused the incident; the rest are why it was hard to see.

### 1. The test-agent prompt creates the need and sanctions no way to meet it

`framwork/.codeadd/agents/test-agent.md`, *How You Work*, step 3:

> RUN `TEST_COMMAND`. IF tests fail → **fix the tests, never the source**. Iterate until they pass.

Against a red test the agent did not cause, that instruction has no terminal state. The agent must
determine whose failure it is. Nothing tells it how. **The word `git` does not appear once in the
file.** No prohibition, no substitute, no exit route.

The trigger is unique to this agent. Grepping `fix-agent`, `backend-agent`, `database-agent`,
`frontend-agent` and `e2e-agent` for `iterate until they pass`, `tests fail` and `test fails` returns
zero hits. The blast radius really is one agent.

Two further facts compound it:

- The frontmatter carries no `tools:`, no `readonly:` and no `disallowedTools:`. The agent inherits
  the full tool set, Bash included. *"Read-write on test files only"* exists solely in the
  `description:` field and in body text. **The capability label and the actual grant are decoupled.**
- Of 22 product agents, only **9 carry enforcement that Claude Code actually reads** — a `tools:`
  allowlist or a `disallowedTools:` denylist. Ten carry no marking at all (test, backend, database,
  e2e, fix, frontend, system-design, ux, ux-flow, ux-layout). The remaining three —
  `architecture-agent`, `discovery-agent`, `reviewer-agent` — are labelled `readonly: true` and
  nothing else, and on this provider the label buys nothing: `AGENT_DIALECTS.claude`
  (`scripts/build.js:1642`) emits only `model`, `tools`, `disallowedTools`, `skills` and `memory`.
  `readonly:` is read by the OpenCode dialect, which turns it into `permission: edit/bash deny`, and
  by Cursor — never by Claude. `readback-agent.md` records this in its own frontmatter comment.
  **On the provider where this incident happened, 13 of 22 agents have no tool-level enforcement**:
  the 10 unmarked plus those 3. Every agent that runs in parallel on a shared tree and executes Bash
  sits in that set — which is the same label/grant decoupling this defect names for `test-agent`,
  one level up.

The dispatch itself never says the tree is shared. `fragments/tdd-pipeline/add.build.md:97` reads
"one per area, **parallel**" with a WAIT-ALL, and passes a flat input list.

### 2. The existing git prohibitions enumerate the wrong group

Two sites carry one, and both list only the commands that *create history*:

| Site | List |
|---|---|
| `add-subagent-driven-development/SKILL.md:327` | `git add`, `git commit`, `git tag` |
| `add.plan-to-ready.md:363` | `git add`, `git commit`, `git tag`, `git push` |

The commands that *destroy the tree* — `stash`, `reset`, `checkout`, `clean`, `restore` — appear in
neither. The rule's own stated rationale already covers the case: *"You leave your work in the
tree."* `git stash` removes work from the tree. Only the enumeration falls short.

Neither site reaches `@test-agent` anyway (see defect 3).

### 3. A fragment is invisible to the artefact graph in both directions

`@test-agent` is dispatched from two fragment files — `fragments/tdd-pipeline/add.build.md:97` and
`fragments/tdd-pipeline/add.hotfix.md:9` — and from neither of the shared prompt templates. The
Universal Subagent Prompt Template (`add.build` §10.2) scopes itself in its own first line to area
subagents (database, backend, frontend, workers).

Asking the graph who dispatches `@test-agent` returns `add.build` and `add.plan-to-ready`. **It does
not return `add.hotfix`**, although that fragment names the agent in a `DISPATCH AGENT:` heading. The
`add.build` edge does not come from the fragment either — it comes from the hand-written `uses:`
block at `add.build.md:25`.

The fragment node itself carries exactly one outbound edge, `INJECTS_INTO`, and no `DISPATCHES`.

The cause is two sets in `scripts/build.js`:

```js
const DECLARING_KINDS = new Set(['command', 'skill', 'agent']);   // line 571 — `fragment` absent
```

`SNIFFABLE_KINDS` (line 995) adds `script` and `reference`, and also omits `fragment`. Because
`declares: DECLARING_KINDS.has(kind)` (line 798) is false for a fragment, the gate loop's
`if (!n.declares) continue` (line 1175) skips it before its prose is ever read.

A hard gate for exactly this already exists and already fires on every other kind:

> `artefact-graph: undeclared reference` — *names X in prose but declares no relationship to it.*

It has never reached a fragment. That is why **no fragment in the repository carries a `uses:`
block**: nothing ever required one.

A fragment is therefore invisible as a source *and* as a target — and it is the kind that carries
dispatch instructions into commands.

#### The fragment is not alone

The same question asked of every other directory under `framwork/.codeadd/` gives a worse answer.
`collectNodes` emits exactly six kinds — `command`, `skill`, `reference`, `agent`, `script`,
`fragment` — over 216 nodes. Three shipped, composable directories produce **no node at all**:

| On disk | Files | Nodes today | What is lost |
|---|---|---|---|
| `plugins/*/skills/*/SKILL.md` | 1 (`add-gitnexus`) | **0** | A skill that ships in the release ZIP and is activated by `codeadd plugins enable` is absent from the skill index entirely. `search`, `neighbors`, `orphans` and every gate cannot see it. |
| `templates/*.md` | 4 | **0** | Commands name these by path; nothing verifies the target exists or reports who uses one. |
| `transforms/**` | 1 (`gemini/commands.md`) | **0** | Same. |
| `fragments/**`, `plugins/*/fragments/**` | 24 | 24, declaring nothing | Above. |

The skill count confirms it: 43 product + 9 internal = 52, and the graph holds exactly 52. The one
plugin skill on disk is not among them.

There is also no node for a **feature** or a **plugin** as a unit. `tdd-pipeline` is a directory of
fragments and `gitnexus` is a directory of fragments plus a skill, but neither exists as a thing the
graph can be asked about. "What does enabling `tdd-pipeline` touch?" — the question a user asks
before running `codeadd features enable` — has no answer today, in either interface.

**Everything composable is dynamic, and everything dynamic must be indexed.** A graph that indexes
only what ships unconditionally describes one configuration of the framework, not the framework.

### 4. Graph guidance is two disagreeing partial lists

| Site | Verbs | Interface named |
|---|---|---|
| `add-framework-development` § *Querying it* | `impact`, `dependencies`, `path`, `orphans`, `history` (5) | `graph.js` |
| `building-commands:434` | `neighbors`, `dependencies`, `impact` (3) | MCP |

The MCP exposes eleven: `dependencies`, `get`, `history`, `impact`, `neighbors`, `orphans`, `path`,
`reindex`, `search`, `stats`, `touched_by`. **`neighbors` — the relationship verb — is missing from
the nominal owner's table** and appears only in the other skill.

Downstream, every `add-framework--*` command enumerates its own subset inline and none names the
MCP: `brainstorm:111` (`history` only), `plan:202-205`, `build:451-452`, `sync:147-148`. The
brainstorm command's single graph instruction is a delivery-index lookup, so a relationship question
asked while running it has no sanctioned route and falls back to `grep`.

Two artefacts already carry private inline copies of the rule — `plan-review-agent:40` and
`prompt-review-agent:94` — because neither can afford to load the large general skill just to query
the graph.

### 5. The coordinator withholds what it already knows

`task-brief.sh` is 135 lines and has no field for known failures. Neither fragment dispatch passes
one. The coordinator knows which tests are already red and whose they are; nothing carries that into
the brief. T19 proves the value of closing this and T17/T18 prove the cost of leaving it open.

### The shape underneath

Defects 1, 2 and 4 are the same failure: **an enumerated partial list written inline instead of a
pointer to an owner.** `git add, commit, tag` omits `stash`. `graph.js history` omits `neighbors`.
Two verb tables omit six verbs each and disagree with one another. Three instances is a pattern, not
three accidents.

## Proposed Solution

### For defect 1 — where the prohibition lives

| Option | Assessment |
|---|---|
| **A. Tool-level enforcement** — strip Bash, or deny a command pattern | **Rejected.** `disallowedTools` is all-or-nothing per tool; denying Bash removes the agent's ability to run `TEST_COMMAND` and destroys its function. A read-only agent frequently still needs Bash for read commands — `git-history-agent` is `readonly: true` *and* `tools: Bash, Read` precisely because its job is `git log`. Pattern-level denial (`Bash(git stash:*)`) is harness permission config, and the CLI ships no permissions artefact today. |
| **B. Fix the enumerated list in the shared templates** | **Rejected.** Neither template reaches `@test-agent`. This change would have left the incident untouched. |
| **C. The agent definition file** (recommended) | `agents/test-agent.md` is the only surface both dispatch sites share. It survives fragment injection, needs no hand-declared edge, removes no tool, and is a single file. |

The fix carries **three parts, not two**. A prohibition without a substitute pushes the next agent to
invent something equally bad (`git checkout -- .`, a worktree, worse); a prohibition *with* a
substitute still leaves "iterate until they pass" unsatisfiable against a foreign failure.

1. **Prohibit** — no `git stash`, `git checkout`, `git reset`, `git clean`, `git restore`. State the
   reason: the tree may carry uncommitted work from sibling agents running in parallel.
2. **Substitute** — `git diff -- <path>` and `git show HEAD:<path>` for a path-scoped baseline.
3. **Exit route** — if the failure is not yours, report it under `CONCERNS` and stop. Do not fix it.
   This is what T19 did.

### For defect 3 — how fragments enter the graph

| Option | Assessment |
|---|---|
| **A. A fragment-specific prose parser** | **Rejected.** A second mechanism for a rule the build already has. |
| **B. Add `fragment` to `DECLARING_KINDS`** (recommended) | One Set entry. The existing "undeclared reference" hard gate then reaches every fragment, fails the build on each one naming an artefact it does not declare, and enumerates the work for free. Authors add `<!-- uses: -->` blocks; the edges appear automatically through the path every other kind already uses. |
| **C. Also add `fragment` to `SNIFFABLE_KINDS`** | **Deferred.** That set governs being *named by* others. Fragments are not loaded by name, so nothing should be flagged for mentioning one. |

Migration cost is bounded and mechanical: run the build, read the failures, add one `uses:` block per
fragment named in the output. No fragment has one today, so the gate output is the complete worklist.

**The same fix generalises, and the change is the set of things `collectNodes` walks.** Five parts,
one per gap found:

| Part | Change |
|---|---|
| 3a | `fragment` joins `DECLARING_KINDS`; the undeclared-reference gate reaches fragments; `uses:` blocks added where it fires |
| 3b | `plugins/*/skills/*/SKILL.md` is walked as a `skill` node, with its `references/` subdocs, exactly like `skills/` |
| 3c | `templates/*.md` becomes a node kind, declaring and sniffable — a command naming a template gets a real edge |
| 3d | `transforms/**` becomes a node, same treatment |
| 3e | A `feature` node per `fragments/{name}/` and a `plugin` node per `plugins/{name}/`, owning their members |

**3e derives its containers from the directory layout, not from a registry.** `fragments/{feature}/`
names the feature and `plugins/{plugin}/` names the plugin. Reading `cli/src/features.js` or
`cli/src/plugins.json` from `scripts/build.js` would couple the graph builder to CLI source for
information the paths already carry. With containers in place, `dependencies` on a feature node
answers what enabling it touches — the question a user asks before `codeadd features enable`.

**3b is the most urgent of the four additions.** `add-gitnexus` is a skill that ships, installs and
loads, and no gate, no search and no orphan check has ever seen it.

### For the tests — RED before GREEN

Every part of change 3 alters what the graph contains, and three consumers read it: `scripts/graph.js`,
the MCP server under `mcp/`, and the build gates themselves. Each part gets a **failing test written
and confirmed failing before the implementation**, across the suites that already exist:

| Suite | What must go RED first |
|---|---|
| `cli/tests/build-artefact-graph.test.js` | Each new node kind is emitted with the right id, layer and path; a fragment declaring `- agent: X` produces a `DISPATCHES` edge; the undeclared-reference gate fails a fixture fragment that names an artefact without declaring it |
| `cli/tests/graph-query.test.js` | `neighbors`, `dependencies`, `impact`, `search` and `orphans` return the new nodes and edges; a feature node's `dependencies` lists its fragments |
| `cli/tests/graph-mcp.test.js`, `cli/tests/mcp-engine.test.js` | The MCP answers identically to the CLI for every new kind — the parity assertion that already exists, extended to cover them |
| `cli/tests/mcp-corpora.test.js` | `--corpus=artefacts` still resolves from the repository root with no dependency added |

A test authored after the fix proves nothing. Each assertion is written, run, and **confirmed failing
for the right reason** — not for a missing import or a typo'd fixture — before any line of
`collectNodes` changes.

### For defect 4 — one owner for the graph

A small internal skill — **`add-artefact-graph`** — owns artefact-graph querying: all eleven verbs,
both interfaces, which question each answers, and — permanently — **a section naming what the graph
cannot see**. Today that is fragments; after change 3 it will be something else. Without that section
the next reader trusts an incomplete answer, which is the error this brainstorm nearly made.

One thing that section must carry from day one, because change 3 does not remove it: a fragment's
new `DISPATCHES` edge originates at the **fragment** node, not at the command the fragment injects
into. A 1-hop `neighbors` on `product/command/add.hotfix` still will not show `@test-agent`. Only a
multi-hop walk — `impact` / dependants, which already traverses `INJECTS_INTO` — surfaces it. The
rule the skill must state: **when asking what a command dispatches, check the fragments injected into
it, not only the command's own neighbours.**

`add-framework-development` is not the right owner despite already holding the table: it is a large
general skill, and the two review agents inline their own copies rather than load it. A small
loadable owner retires both copies and the stale table at once.

**Not every agent loads it.** Two separate exclusions apply, and they must not be conflated:

- **Product-layer agents are out by audience.** This graph is the framework's own; they never query
  it, whatever their tool grant.
- **MCP-blocked internal agents are out by capability.** `framework-discovery-agent` and
  `plan-readback-agent` are `tools: Glob, Read` — no Bash, no MCP — so they cannot act on the skill
  at all. `add-framework-development:282` already states the rule: *"an agent with a tool allowlist
  that blocks MCP (e.g. `tools: Glob, Read`) ... simply carries no marker. Never add an injection
  marker to an MCP-blocked agent."*

The consumer set is therefore the internal `add-framework--*` commands plus the internal agents that
still hold Bash or MCP — `plan-review-agent` and `prompt-review-agent`, the two that carry private
inline copies today.

**Wording matters.** The rule is *"for a relationship question, ask the graph"* — not *"use the MCP
instead of grep"*. `graph.js` and the MCP answer identically by design: `prompt-review-agent:102` says
*"When the MCP is unavailable, the CLI behind it is not a fallback — it answers the same"*, and
`cli/tests/mcp-engine.test.js` asserts it. Grep remains correct for finding text; it is the wrong tool
for reconstructing relationships.

### Ordering is load-bearing

Change 4 must not ship before change 3. Instructing agents to prefer the graph while the graph is
blind to fragments would institutionalise the blind spot and retire the only method that currently
sees past it. Change 3 first; then the skill describes a graph that is actually complete.

## Type of Artefact

`agent` (1), `skill` + `command` (2), `script` + `fragment` + **two new node kinds** (3), **new `skill`
`add-artefact-graph`** (4), `script` + `fragment` + `command` (5).

Change 4 is the only item introducing a new authored artefact. Change 3 introduces new *node* kinds —
`template`, `transform`, and the `feature` / `plugin` containers — over files that already exist on
disk. Everything else modifies an artefact that exists.

## Scope

### Includes

| # | Change | Layer | Target | Depends on |
|---|---|---|---|---|
| 1 | Prohibition + substitute + exit route | **product** | `framwork/.codeadd/agents/test-agent.md` | — |
| 2 | Complete the destructive-command list at both existing sites | **product** | `add-subagent-driven-development/SKILL.md:327`, `add.plan-to-ready.md:363` | — |
| 3 | **Index everything dynamic.** 3a fragments declare; 3b plugin skills become nodes; 3c templates; 3d transforms; 3e feature and plugin container nodes. Each part RED-first across the four graph suites | **internal** + **product** | `scripts/build.js` (`collectNodes`, `DECLARING_KINDS:571`, `SNIFFABLE_KINDS:995`); `cli/tests/build-artefact-graph.test.js`, `graph-query.test.js`, `graph-mcp.test.js`, `mcp-engine.test.js`, `mcp-corpora.test.js`; every fragment the gate names | — |
| 4 | New skill `add-artefact-graph` owning graph querying; retire the two partial tables and the two inline copies | **internal** | new `.claude/skills/add-artefact-graph/SKILL.md`; `add-framework-development`, `building-commands`, `plan-review-agent`, `prompt-review-agent`, the four `add-framework--*` commands | 3 |
| 5 | `KNOWN_FAILURES` reaches the dispatched agent | **product** | `framwork/.codeadd/scripts/task-brief.sh`, both `fragments/tdd-pipeline/` dispatches, the coordinator step in `add.build` | — |

Change 1 is the only one that stops an agent stashing a shared tree today. Changes 3→4 are a
sequence. Changes 2 and 5 are independent.

### Does NOT Include

- **Shipping a permissions artefact** (harness-level `deny` on command patterns). It is the only real
  enforcement available, and it is a new distributed artefact with installer implications. Recorded,
  not scoped.
- **Tool restrictions on the other nine unrestricted read-write agents.** None carries the
  iterate-until-green instruction that triggered this. Restricting them without evidence risks
  removing capability they legitimately use.
- **`add-framework-product-layer/SKILL.md:172`**, which instructs the framework's own builder to
  baseline flaky tests with `git stash`. Same defect class, internal layer, one line. Deliberately
  left out to keep change 1's scope honest — a one-line follow-up, recorded here so it is not lost.
- **Adding `fragment` to `SNIFFABLE_KINDS`** (see Proposed Solution, option C). This is not in tension
  with 3c and 3d putting templates and transforms *into* that set: a command names a template by path
  and should get a verified edge, whereas nothing loads a fragment by name — the injection marker does
  that. The set governs "named by others", and the two answers differ because the two artefacts are
  reached differently.
- **Deduplicating the eight `INJECTS_INTO` edges** from the build fragment. `build.js:941` documents
  one edge per injection point as intentional. Noted so no one "fixes" it.

## Key Decisions

| Decision | Rationale | Validated |
|----------|-----------|-----------|
| The prohibition lives in `agents/test-agent.md`, not in a shared template | The only surface both dispatch sites share; neither template reaches this agent | ✅ |
| No tool is removed from any agent | `disallowedTools` is all-or-nothing; a read-only agent often still needs Bash and git read commands. `git-history-agent` is `readonly: true` *and* `tools: Bash, Read` | ✅ |
| The fix is three parts — prohibit, substitute, exit route | Prohibition alone leaves "iterate until they pass" unsatisfiable; the agent invents another unsafe move | ✅ |
| Scope stays at `@test-agent`; the other nine read-write agents are untouched | Only this agent is told to iterate until green — verified by grep across five sibling agents | ✅ |
| `fragment` joins `DECLARING_KINDS` | Reuses the hard gate that already exists instead of adding a mechanism | ✅ |
| Change 3 covers every dynamic directory, not fragments alone | Plugin skills, templates and transforms ship and compose and produce zero nodes today; a graph that indexes only the unconditional part describes one configuration, not the framework | ✅ |
| Feature and plugin containers are derived from directory layout, not from `cli/src/features.js` or `plugins.json` | `fragments/{name}/` and `plugins/{name}/` already carry the name; reading CLI source from `scripts/build.js` would couple the graph builder to it for nothing | ✅ |
| Every part of change 3 is RED-first | It changes what three consumers read — `graph.js`, `mcp/` and the build gates. A test written after the fix proves nothing, and the MCP/CLI parity assertion is the one that catches a divergence between them | ✅ |
| Change 3 ships before change 4 | Preferring the graph while it is blind to fragments carves the blind spot into procedure | ✅ |
| The new skill is named `add-artefact-graph` | Names the artefact it owns, matching `add-build-ledger`; flat internal namespace, no collision with the nine existing internal skills | ✅ |
| The new skill is loaded by a named consumer set, not by all agents | Two distinct exclusions: product agents by audience, MCP-blocked internal agents by capability. `add-framework-development:282` forbids the second | ✅ |
| `readonly: true` is not counted as enforcement on Claude Code | `AGENT_DIALECTS.claude` (`build.js:1642`) emits only `model`/`tools`/`disallowedTools`/`skills`/`memory`; only OpenCode and Cursor read `readonly:`. Recorded so the agent-enforcement figures are not restated wrongly later | ✅ |
| The rule reads "ask the graph", not "use the MCP" | `graph.js` and the MCP answer identically, asserted by `cli/tests/mcp-engine.test.js` | ✅ |
| `KNOWN_FAILURES` is its own change, not part of change 1 | It alters the coordinator's flow in two commands and requires computing the list — not a briefing edit | ✅ |
| One design document, not an umbrella set | Each item is a single-artefact change with a stated order; no item has design space left to explore | ✅ |

## Ecosystem Impact

| Component | Layer | Impact | Action |
|-----------|-------|--------|--------|
| `agents/test-agent.md` | product | Gains a git section; frontmatter untouched | Change 1 |
| `add-subagent-driven-development/SKILL.md` | product | Line 327 list completed | Change 2 |
| `add.plan-to-ready.md` | product | Line 363 list completed | Change 2 |
| `scripts/build.js` | internal | `collectNodes` walks three more directories and emits container nodes; `DECLARING_KINDS` gains `fragment`; the undeclared-reference gate starts firing on fragments | Change 3 |
| `framwork/.codeadd/fragments/**`, `plugins/*/fragments/**` | product | Each fragment naming an artefact gains a `uses:` block; new graph edges appear | Change 3a |
| `framwork/.codeadd/plugins/gitnexus/skills/add-gitnexus/` | product | Becomes a `skill` node for the first time — today it is a shipped skill no gate, search or orphan check can see | Change 3b |
| `framwork/.codeadd/templates/*.md`, `transforms/**` | product | Become nodes; commands naming them get real edges instead of unverified paths | Changes 3c, 3d |
| `artefact-graph.json` | internal (emitted) | Fragment/plugin-skill/template/transform nodes and container nodes appear; node count rises from 216 | Change 3, automatic |
| `mcp/` | product | No source change — it reads the same sidecar. Its answers widen automatically, and the parity assertion must be extended to prove it | Change 3 |
| `cli/tests/graph-query.test.js`, `graph-mcp.test.js`, `mcp-engine.test.js`, `mcp-corpora.test.js` | product | RED-first assertions for every new kind, edge and parity case | Change 3 |
| `.claude/skills/add-artefact-graph/SKILL.md` | internal | **New.** Owns the eleven verbs, both interfaces, and the "what the graph cannot see" section | Change 4 |
| `add-framework-development` § *Querying it* | internal | Table retired in favour of a pointer to `add-artefact-graph` | Change 4 |
| `building-commands:427-435` | internal | Inline rule retired in favour of a pointer | Change 4 |
| `plan-review-agent`, `prompt-review-agent` | internal | Private inline copies retired | Change 4 |
| `add-framework--brainstorm/plan/build/sync` | internal | Inline verb enumerations replaced by a pointer to the skill | Change 4 |
| `framwork/.codeadd/scripts/task-brief.sh` | product | Gains a known-failures field | Change 5 |
| `fragments/tdd-pipeline/add.build.md`, `add.hotfix.md` | product | Dispatch input lists gain `KNOWN_FAILURES` | Change 5 |
| `cli/tests/build-artefact-graph.test.js`, `cli/tests/build.test.js` | product | Change 3 alters build-gate behaviour and needs coverage. There is no `scripts/tests/` at the internal root — the suites that exercise `build.js` graph emission live under `cli/tests/` | Change 3 |
| `framework-discovery-agent`, `plan-readback-agent` | internal | None — `tools: Glob, Read`, structurally unable to query the graph | No action; recorded |

## Trade-offs & Risks

| We Gain | We Give Up |
|---------|-----------|
| Agents stop reaching for destructive git on a shared tree, and get a sanctioned substitute | A slightly longer `test-agent` prompt on every dispatch |
| A red test that is not the agent's own has a defined terminal state | Some failures now surface as `CONCERNS` instead of being silently chased |
| Fragment dispatches become visible to the graph, impact analysis and every gate built on it | A one-off migration adding `uses:` blocks, and a build that fails until it is done |
| Every dynamic artefact is indexed — a shipped plugin skill, templates and transforms stop being invisible, and "what does enabling this feature touch" becomes answerable | A larger change than fragments alone, touching `collectNodes`, two kind sets and four test suites |
| Each part proven RED-first, with MCP/CLI parity asserted per kind | The slowest way to write it; the matrix has to be authored before any of it works |
| One owner for graph querying; four scattered partial lists retired | One more internal skill, and a load cost on its named consumers |
| Every future graph reader is told what the graph cannot see | That section needs maintaining as the parser grows |

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Change 3 fails the build on more fragments than expected and blocks unrelated work | Medium | The gate output *is* the worklist. Run it first and size the migration before committing to the change. |
| New node kinds break a consumer that assumed six — `graph.js` output shape, a `mermaid` render, an `orphans` sweep that suddenly reports four new unreferenced files | **High** | This is what the RED-first matrix is for. `orphans` in particular will surface templates and transforms that nothing declares; decide per file whether that is a real finding or a missing `uses:` block before the change lands. |
| The MCP and `graph.js` diverge on a new kind, silently | Medium | `cli/tests/mcp-engine.test.js` already asserts the two answer identically. Extending that assertion to each new kind is non-optional, not a nicety. |
| Container nodes (3e) invent a relationship shape nothing else uses | Low | Scope them to ownership of their own directory members. If the edge type does not fall out of the existing set, drop 3e and ship 3a-3d — the four gaps stand on their own. |
| A prohibition list in `test-agent.md` drifts, exactly like the three it replaces | Medium | State the rule by its reason ("do not remove work from the tree — siblings run in parallel"), with the command list as examples rather than as the rule itself. |
| An agent obeys the exit route and reports a failure that really was its own | Low | The substitute (`git diff -- <path>`) is how it tells the difference; the exit route applies only after it has checked. |
| Change 4 ships before change 3 and hardens the blind spot | Low | Recorded as an explicit ordering decision; the planner reads it as a dependency. |
| The new skill becomes a fifth partial list | Low | It owns the verb set; every other site becomes a pointer, not a copy. |
| `KNOWN_FAILURES` obliges the coordinator to compute something it cannot always know | Medium | Optional field. Absent means "not supplied", and the agent falls back to the safe substitute from change 1. |

## Next Steps

Run: `/add-framework--plan` on change 1 first — it is the only item that stops the observed behaviour,
and it is one file.

Change 3 is now the largest item and should be planned on its own: five parts (3a-3e) over
`collectNodes`, two kind sets and four test suites, every part RED-first. 3b — the shipped plugin
skill no index has ever seen — is the part to sequence first inside it. Change 4 follows change 3.
Changes 2 and 5 are independent and can be scheduled whenever.
