---
name: add-framework-internal-layer
description: "Use when an F-block touches the internal layer — .claude/, scripts/, CLAUDE.md or the repo root. Lifecycle actions, coherence and dependency checks, and why the graph gates still apply."
---

# Internal Layer Mechanics

<!-- uses:
- skill: building-commands
- skill: add-framework-development
- mention: add-build-ledger
-->

Loaded on the first `[internal]` F-block of a build. These artefacts are the development tooling that
builds and maintains the framework. **They are NOT distributed to users.** WHAT gets recorded about
execution is `add-build-ledger`'s job; the product layer has its own skill.

## When to Use

- An F-block naming `.claude/`, `scripts/`, `CLAUDE.md`, `.gitignore`, or a repo-root file.

## When NOT to Use

- An F-block naming `framwork/.codeadd/`, `framwork/provider-map.json` or `cli/`.

---

## What the Internal Layer Is

| Type | Path |
|------|------|
| Commands | `.claude/commands/*.md`, namespace `add-framework--*` |
| Skills | `.claude/skills/<name>/SKILL.md`, subdocs in `references/` |
| Agents | `.claude/agents/*.md` |
| Support scripts | `scripts/*.js` |
| Structural map | `CLAUDE.md` |

```
⛔ INTERNAL ARTEFACTS ARE NOT REGISTERED:
  ⛔ DO NOT: Add an internal command, skill or agent to framwork/provider-map.json
  ⛔ DO NOT: Copy an internal artefact into framwork/.codeadd/
  ✅ DO: Create it directly at its .claude/ path — build.js never distributes it
```

**The internal layer has no provider mirror.** One file per artefact, no adapter to keep in step.

## Lifecycle Actions

| Action | How |
|--------|-----|
| **Create** | Write at the correct path, following the artefact's conventions |
| **Modify** | Edit in place, preserving structure and business logic |
| **Deprecate** | Deprecation notice at the top; update dependents to name the replacement |
| **Remove** | Delete, then update **every** dependent that referenced it |
| **Rename** | `git mv`, then the same full sweep as Remove — a rename is a remove plus a create |

**A remove or a rename is not done when the file is gone.** It is done when nothing names the old
target. See the sweep below.

---

## Validation

### Every internal F-block

```bash
node scripts/build.js
```

Exit 0, no new warning. **This applies to the internal layer even though the internal layer is not
built.** `build.js` is where the three artefact-graph gates run, and the graph covers `.claude/` as
well as `framwork/.codeadd/`:

| Condition | Result |
|---|---|
| A `uses:` declaration names an artefact that does not exist | **fails** |
| A name appears in prose with no declared relationship to it | **fails** |
| Declared but never named in prose | warns |

An internal-only change writes nothing under `framwork/` except the gitignored
`artefact-graph.json`. Prove it:

```bash
git status --porcelain framwork/    # must be empty
```

### Coherence, per modified artefact

- [ ] Well-formed markdown, correct structure for its type
- [ ] Command or skill: passes the `building-commands` checklist
- [ ] `<!-- uses: -->` matches what the prose actually names
- [ ] `CLAUDE.md` reflects the current artefact list, if that list changed

### Dependency, per removed or renamed artefact

- [ ] No command, skill or agent declares the old target in `uses:`
- [ ] No prose names it
- [ ] `node scripts/graph.js orphans` shows no artefact that lost its only consumer

**A newly created artefact is an orphan until the F-block that wires it lands.** That is expected.
What is not expected is an orphan still present at the end of the build.

### The sweep — grep is not redundant with the gate

```bash
grep -rn "<old-name>" .claude/ CLAUDE.md
```

Run it after every remove and every rename. **The prose gate does not catch everything a human reads
as a broken pointer**, and `CLAUDE.md` is not a graph node at all, so nothing in `build.js` inspects
it. The grep is the real proof.

---

## Cross-Artefact Impact — Ask the Graph, Do Not Grep For It

```bash
node scripts/graph.js impact <name> --depth 1   # grade risk on THIS number
node scripts/graph.js impact <name>             # context, not a grade
node scripts/graph.js dependencies <name>       # what it needs
node scripts/graph.js path <a> <b>              # how two artefacts connect
node scripts/graph.js history <name>            # when it arrived, what it replaced
```

**Grade on depth 1.** The command layer cross-references itself densely, so the transitive closure
saturates and a hub becomes indistinguishable from a leaf. `MENTIONS` edges are already excluded, and
names are matched exactly — `add-qa` does not match inside `add-qa-migration`.

If the graph is missing or stale, run `node scripts/build.js`; it is emitted on every build.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "The internal layer isn't built, so build.js is irrelevant" | It is where the graph gates run |
| "I deleted the file, the rename is done" | Sweep first. A dangling declaration fails the build |
| "The gate passed, so no reference is stale" | `CLAUDE.md` is not a node. Grep it |
| "This artefact belongs in provider-map too, for symmetry" | It ships to nobody. Registering it is wrong |
| "The new skill shows as an orphan, something broke" | Expected until its consumer lands. Not at the end |

## Rules

ALWAYS:
- Run `build.js` on an internal F-block and prove `framwork/` stayed clean
- Sweep with grep after every remove and every rename
- Grade impact on the depth-1 number

NEVER:
- Register an internal artefact in `provider-map.json`
- Leave an artefact orphaned at the end of a build
