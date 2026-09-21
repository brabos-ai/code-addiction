---
name: add-framework-internal-layer
description: "Use when an F-block touches the internal layer — workbench/, scripts/, AGENTS.md or the repo root, mcp/ excepted. Coherence and dependency checks, the rename/remove sweep, and why the graph gates still apply."
---

# Internal Layer Mechanics

<!-- uses:
- skill: building-commands
- skill: add-framework-development
- skill: add-artefact-graph
- mention: add-build-ledger
- mention: add-framework--done
-->

Loaded on the first `[internal]` F-block of a build. These artefacts are the development tooling that
builds and maintains the framework. **They are built to more than one provider, and they reach no user.** WHAT gets recorded about
execution is `add-build-ledger`'s job; the product layer has its own skill.

## When to Use

- An F-block naming `workbench/`, `scripts/`, `AGENTS.md`, `.gitignore`, or a repo-root file.

## When NOT to Use

- An F-block naming `framwork/.codeadd/`, `framwork/provider-map.json`, `cli/` or **`mcp/`** —
  the last sits at the repository root and is product anyway, because `scripts/build.js` copies
  it into the npm package. Shipping decides the layer, not depth in the tree.

---

## What the Internal Layer Is

| Type | Path |
|------|------|
| Commands | `workbench/commands/*.md`, namespace `add-framework--*` |
| Pipeline stages | `workbench/skills/add-framework--<stage>/SKILL.md` — brainstorm, plan, build and done are skills in the same namespace, so each can load the next |
| Skills | `workbench/skills/<name>/SKILL.md`, subdocs in `references/` |
| Agents | `workbench/agents/*.md` |
| Support scripts | `scripts/*.js` |
| Structural map | `AGENTS.md` |

```
⛔ A WORKBENCH ARTEFACT IS REGISTERED IN ITS OWN REGISTRY, NEVER THE PRODUCT'S:
  ⛔ DO NOT: Add a workbench command, skill or agent to framwork/provider-map.json
  ⛔ DO NOT: Copy a workbench artefact into framwork/.codeadd/
  ✅ DO: Create it at its workbench/ path AND register it in workbench/provider-map.json
  ✅ DO: Run `node scripts/build-workbench.js` — `scripts/build.js` never sees it
```

**The internal layer HAS a provider mirror, and still ships to nobody. Both halves are true and
neither survives alone.**

| Half | What it means | What breaks if it is dropped |
|---|---|---|
| It has a provider mirror | `workbench/{commands,skills,agents}/` is source; `scripts/build-workbench.js` compiles it into the repository-root `.claude/` and `.opencode/`, which are gitignored output | Someone edits the generated copy, and the next build overwrites it |
| It reaches no user | Nothing here is in `framwork/provider-map.json`, nothing is packaged by `release.yml`, and `cli/src/installer.js` never writes it | The cross-layer gate in `scripts/build.js` looks wrong, and a product artefact starts naming a workbench command a user does not have |

⛔ **Edit the SOURCE, never the built copy.** A change made under `.claude/commands/`,
`.claude/skills/`, `.claude/agents/` or the `.opencode/` equivalents is gitignored and is erased by
the next `node scripts/build-workbench.js`.

`add-framework-development` carries the artefact anatomies, the agent frontmatter fields and the
`<!-- uses: -->` syntax. Read it when creating a new internal artefact.

**A remove or a rename is not done when the file is gone.** It is done when nothing names the old
target. The lifecycle actions themselves are layer-neutral and live in the executing command; what
follows is what proves an internal one landed.

---

## Validation

### Every internal F-block

```bash
ADD_GRAPH_WARNINGS=1 node scripts/build.js
```

Exit 0, and no warning absent from the baseline measured before the first F-block. **`build.js`
summarises warnings as a count unless `ADD_GRAPH_WARNINGS=1` is set**, so the bare form cannot
support a "no new warning" claim. **This applies to the internal layer even though the internal layer
is not built.** `build.js` is where the three artefact-graph gates run, and the graph covers `workbench/` as
well as `framwork/.codeadd/`. **`add-framework-development` § 9 owns which conditions fail and which
warn** — read its gate table. Its unregistered-artefact row is the one that does not apply here:
internal artefacts are never in `provider-map.json`.

An internal-only change writes nothing under `framwork/` except the gitignored
`artefact-graph.json`. Prove it:

```bash
git status --porcelain framwork/    # must be empty
```

### AGENTS.md is not bookkeeping

An `[internal]` F-block may write `AGENTS.md`, but **only where the plan told it to**. There is no
standing duty to bring it in step with whatever the build happened to change.

Its inventory block is generated — `node scripts/inventory.js` writes it and `/add-framework--done`
keeps it current. Never hand-edit between the markers; the next close-out overwrites it.

Everything else in the file changes because a plan decided it should. A build that reaches for
`AGENTS.md` on its own initiative is doing what grew it to 4212 words before commit 47321fd cut it
back.

### Coherence, per modified artefact

- [ ] Well-formed markdown, correct structure for its type
- [ ] Command, skill or agent: passes `## The Ruler` of `building-commands`, all eight items
- [ ] `<!-- uses: -->` matches what the prose actually names

### Dependency, per removed or renamed artefact

- [ ] No command, skill or agent declares the old target in `uses:`
- [ ] No prose names it
- [ ] Nothing lost its only consumer — the graph answers this; `add-artefact-graph` names the verb

**A newly created artefact is an orphan until the F-block that wires it lands.** That is expected.
What is not expected is an orphan still present at the end of the build.

### The sweep — grep is not redundant with the gate

```bash
grep -rn "<old-name>" workbench/ AGENTS.md
```

Run it after every remove and every rename. **The prose gate does not catch everything a human reads
as a broken pointer**, and `AGENTS.md` is not a graph node at all, so nothing in `build.js` inspects
it. The grep is the real proof.

---

## Before a Removal or a Rename — Ask the Graph

**Two questions, and `add-artefact-graph` resolves each to its verb:**

1. Who declares this artefact today, and is that answer complete?
2. What does it declare?

⛔ **DO NOT name a verb from memory.** Load the skill. It owns which verb answers which question,
when one query is not enough, and the standing list of what no query reaches — and a verb named here
is a verb that gets run once while a second caller goes unseen.

Every artefact question 1 returns must be edited in the SAME F-block as the removal or rename, or the
block's `build.js` run fails on a dangling declaration.

Risk grading at planning time is a different question and belongs to the planning command, not here.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "The internal layer isn't built, so build.js is irrelevant" | It is where the graph gates run |
| "I deleted the file, the rename is done" | Sweep first. A dangling declaration fails the build |
| "The gate passed, so no reference is stale" | `AGENTS.md` is not a node. Grep it |
| "This artefact belongs in provider-map too, for symmetry" | It ships to nobody. Registering it is wrong |
| "The new skill shows as an orphan, something broke" | Expected until its consumer lands. Not at the end |

## Rules

ALWAYS:
- Run `build.js` on an internal F-block and prove `framwork/` stayed clean
- Sweep with grep after every remove and every rename
- Ask the graph who declares an artefact before removing or renaming it, and edit every caller it
  returns in that same F-block

NEVER:
- Register an internal artefact in `provider-map.json`
- Leave an artefact orphaned at the end of a build
