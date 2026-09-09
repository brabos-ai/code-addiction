# ADD Build — Layer-Aware Plan Executor

<!-- uses:
- skill: add-build-ledger
- skill: add-framework-product-layer
- skill: add-framework-internal-layer
- skill: building-commands
- skill: add-framework-development
- command: /add-framework--plan
- command: /add-framework--release
- command: /add-framework--sync
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English.

Executes a plan into working artefacts, in **both layers** — the distributed product layer
(`framwork/.codeadd/`, `framwork/provider-map.json`, `cli/`) and the internal development layer
(`.claude/`, `scripts/`, `CLAUDE.md`). Each F-block's layer tag selects which rules apply to it.

---

## ⛔⛔⛔ MANDATORY SEQUENTIAL EXECUTION ⛔⛔⛔

**STEPS IN ORDER:**
```
STEP 1: Load plan / context   → READ FIRST
STEP 2: Design                → [STOP] present and WAIT for approval
STEP 3: Load skills           → building-commands + add-build-ledger + the layer skills in play
STEP 4: Implement             → ONLY AFTER 1-3; ledger first, then one F-block at a time
STEP 5: Validate              → per F-block; it is committed once its own checks pass
STEP 6: Document              → changelog and plan status, after the last F-block
STEP 7: Completion            → summary + EVERY ruling made
```

**⛔ ABSOLUTE PROHIBITIONS:**

```
IF PLAN / CONTEXT NOT LOADED (STEP 1 incomplete):
  ⛔ DO NOT USE: Write or Edit anywhere
  ⛔ DO NOT: Implement any artefact
  ✅ DO: Load the plan, or collect the direct-build spec

IF DESIGN NOT APPROVED (STEP 2 incomplete):
  ⛔ DO NOT USE: Write or Edit to create or change any artefact
  ✅ DO: Present the design and WAIT

IF building-commands NOT LOADED (STEP 3, when the F-block writes a .md artefact):
  ⛔ DO NOT USE: Write on any commands/ or skills/ path
  ✅ DO: Read .claude/skills/building-commands/SKILL.md

IF THE LEDGER HAS NOT BEEN READ (planned mode, STEP 4.1 incomplete):
  ⛔ DO NOT USE: Write or Edit anywhere
  ⛔ DO NOT: Re-execute any F-block
  ✅ DO: Read the ledger and apply add-build-ledger's resume rule

IF AN F-BLOCK'S VALIDATION HAS NOT PASSED:
  ⛔ DO NOT USE: Bash to run git commit for that block
  ⛔ DO NOT: Append its `complete` line, or start the next F-block
  ✅ DO: Fix it, rule on it, or STOP
```

### The Layer Boundary Is Per F-Block, Not Per Command

```
IF THE CURRENT F-BLOCK IS TAGGED [internal]:
  ⛔ DO NOT USE: Write or Edit on framwork/.codeadd/
  ⛔ DO NOT USE: Write or Edit on framwork/ provider directories
  ⛔ DO NOT USE: Edit on framwork/provider-map.json
  ✅ DO: Load add-framework-internal-layer and apply its checks

IF THE CURRENT F-BLOCK IS TAGGED [product]:
  ⛔ DO NOT USE: Write or Edit on .claude/
  ⛔ DO NOT USE: Write or Edit on framwork/ provider directories — build.js generates them
  ✅ DO: Load add-framework-product-layer and apply its checks

IF A PATH IS NOT COVERED BY THE CURRENT F-BLOCK'S TAG:
  ⛔ DO NOT: Widen the block to reach it
  ✅ DO: Rule on it and record the ruling, or STOP if no reading of the plan supports it
```

**One exception, and only this one.** A `[product]` F-block MAY write the parts of `CLAUDE.md` that
its own work made stale — the derived Project Anatomy counts and the rows describing what it just
shipped. That is bookkeeping of product-layer facts, not internal-layer design. Everything else in
`CLAUDE.md` belongs to an `[internal]` F-block.

**`node scripts/build.js` runs on every F-block, in both layers.** It is where the three
artefact-graph gates live, and the graph covers `.claude/` as well as `framwork/.codeadd/`. An
internal-only F-block proves it stayed in its lane with `git status --porcelain framwork/` returning
empty — the only file it may have touched there is the gitignored `artefact-graph.json`.

---

## Operation Mode

```
/add-framework--build [plan]           → Execute a plan (full basename or unique slug substring)
/add-framework--build [type] [name]    → Direct build, no plan, for simple artefacts
```

**Valid types:** `command` | `skill` | `agent` | `script` | `workflow` | `cli` | `map`

`map` is `CLAUDE.md` itself. Its direct form takes the file and a description rather than a type and
a name: `/add-framework--build CLAUDE.md "update the pipeline section"`. A bare artefact name works
the same way for any existing artefact — the path resolves it, and the path decides the layer.

To optimize an existing artefact, use the direct form — STEP 2 detects it already exists and presents
the analysis against `building-commands` before any edit.

---

## STEP 1: Load Context (MANDATORY)

### 1.1 If a plan is specified

**Resolve `[plan]` BEFORE reading anything.** The full basename always works; otherwise match it as a
**substring** of the basenames of `docs/plans/*PLAN--*.md`, excluding `--review-v*`, `--evidence-v*`
and `--ledger` companions.

**All three naming forms resolve:** the current `YYYY-MM-DDTHHMMSS-PLAN--`, the legacy `NNNN-PLAN--`,
and `-SELF-PLAN--` from when planning was split by layer. There is no longer a reason to exclude the
last one — a topic is no longer split into a paired product plan and internal plan sharing a slug.

- **Exactly one match** → that is the plan. Read it.
- **More than one** → ⛔ STOP. Print every candidate basename and ask which. **NEVER guess.**
- **No match** → list `docs/plans/` and STOP.

**Extract:** the F-blocks with their layer tags, the execution order, the Global Constraints, the
validated decisions, and the per-F-block validation the plan specifies.

**A plan whose F-blocks carry no layer tag is legacy.** Derive the tag from each path — `framwork/`,
`provider-map.json` or `cli/` is `[product]`, everything else `[internal]` — and record one ruling
saying you did.

### 1.2 If a direct build (no plan)

**Only for SIMPLE work.** Collect: type, kebab-case name, one-line purpose, scope in and out,
providers (product only), and the target path — which determines the layer. Complex work →
recommend `/add-framework--plan` first.

Direct mode has no F-blocks, so it has no ledger and no per-block cycle.

### 1.3 Worktree for Risky Builds

A build touching multiple artefacts or rewriting existing commands is easier to discard than to roll
back. RECOMMEND a branch and worktree before implementing.

After a build that changed the product artefact set, RECOMMEND `/add-framework--sync` to regenerate
the ecosystem map, the README and the web docs.

---

## STEP 2: Design [STOP]

**⛔ GATE:** Do not implement without approval.

**Planned mode:** summarize the plan, the execution order and each F-block's layer. Name every file
that will be created, modified, renamed or **removed**. Name any Global Constraint that overrides this
command's own defaults, and say so explicitly — a plan that requires an exception to a gate here needs
the user to see it before execution starts.

**Direct mode:** what changes, why, its layer, and the impact on dependents.

**STOP AND WAIT.** Proceed only on explicit approval or requested adjustments.

---

## STEP 3: Load Skills (MANDATORY)

| Load | When |
|------|------|
| `.claude/skills/add-build-ledger/SKILL.md` | Planned mode, ALWAYS, before the first F-block |
| `.claude/skills/building-commands/SKILL.md` | ANY F-block writing a `.md` command or skill |
| `.claude/skills/add-framework-product-layer/SKILL.md` | The first `[product]` F-block |
| `.claude/skills/add-framework-internal-layer/SKILL.md` | The first `[internal]` F-block |
| `.claude/skills/add-framework-development/SKILL.md` | Artefact-type decisions, agent anatomy, `uses:` syntax |

**Load a layer skill when the first F-block of that layer arrives, not before.** A single-layer plan
never loads the other one.

### building-commands Checklist (APPLY to every `.md` artefact)

```
[ ] Top-of-file blocking section — prohibitions BEFORE instructions
[ ] STEP (imperative), never Phase (documentary)
[ ] Sequential INTEGER numbering — NEVER 2.5 or 6.5; renumber when inserting
[ ] Imperative language: EXECUTE, DO NOT, CONFIRM
[ ] Gates carry TOOL-SPECIFIC prohibitions, not "STOP"
[ ] Condition blocks: IF [condition]: ⛔ DO NOT USE [tool]
[ ] LANG header present
[ ] No `## Spec` section (prohibited)
[ ] Bash blocks only where non-obvious or learned from an error
[ ] No fixed display or error message templates
[ ] Rules as ALWAYS/NEVER markdown, nothing restating STEP order
```

---

## STEP 4: Implement

### 4.1 The Ledger, First

Planned mode only. Path, format, identity line and the resume rule are owned by `add-build-ledger`.
Read the ledger BEFORE deciding anything, every entry, not only after a crash.

### 4.2 One F-Block at a Time

The cycle — record `BASE`, implement, show, validate, commit, record `HEAD` — is owned by
`add-build-ledger`. Two things this command adds per block:

1. **Read the block's layer tag first.** It selects the prohibitions above and the layer skill.
2. **Apply the plan's own per-F-block validation** on top of the layer default, when the plan names one.

**There is no per-block approval stall.** Showing what changed informs the user; it does not wait on
them. The STEP 2 `Design [STOP]` gate is the human's decision point and nothing here replaces it.

### 4.3 Rulings and the Four Hard Stops

Owned by `add-build-ledger`. Rule and continue; record `Ruling: <what> — <why> — <cost if wrong>`.
A red build is not a ruling: it reports and STOPS.

### 4.4 Lifecycle Actions

| Action | How |
|--------|-----|
| **Create** | Write at the correct source path for the layer |
| **Modify** | Edit in place, preserving structure and business logic |
| **Deprecate** | Notice at the top; update dependents to name the replacement |
| **Remove** | Delete, then update every dependent **in the same F-block** |
| **Rename** | `git mv`, then the same sweep — a rename is a remove plus a create |

⛔ **A removal or rename that leaves a `uses:` declaration pointing at the old target fails
`build.js`.** Fix every dependent inside the block that removes or renames, never in a later one.

---

## STEP 5: Validate

**Per F-block, before its commit — never once at the end.** The checks belong to the block's layer
skill. Both layers share one non-negotiable:

```bash
ADD_GRAPH_WARNINGS=1 node scripts/build.js   # exit 0, no new warning — the three graph gates run here
```

⛔ **`ADD_GRAPH_WARNINGS=1` is not optional.** Without it `build.js` prints `N graph warning(s)` and
nothing else, so a block that greps the output for a warning finds none and reports clean against
warnings it never saw. That is not hypothetical: it shipped four warnings through thirteen blocks of
one delivery.

**Measure the baseline ONCE, before the first F-block**, by running the same command on the branch
point. "No **new** warning" means no warning absent from that list — a pre-existing warning is not
this block's to fix, and a count alone cannot tell the two apart.

```
IF VALIDATION DID NOT PASS:
  ⛔ DO NOT USE: Bash to run git commit
  ⛔ DO NOT: Append a `complete` line
  ✅ DO: Fix it (STEP 4) or STOP — a red build is not a finding
```

Verify every RED-first assertion the plan specified was observed failing BEFORE its implementation
landed. An assertion that was never RED is an untested F-block regardless of its current colour.

---

## STEP 6: Document

After the last F-block:

- **Changelog** for new or major work: `docs/changelog/YYYY-MM-DD-<action>-<what>.md`, action being
  `add` | `update` | `refactor` | `remove`.
- **Plan status** `draft` → `implemented`, with a changelog row naming the commits it landed in.
- **`CLAUDE.md`** — only what this build made stale, per the layer skill that owns the section.

---

## STEP 7: Completion

Report, always:

- Artefacts created, modified, renamed and **removed**, with paths and their layer.
- The ledger path and the `BASE..HEAD` range of every committed F-block.
- **Rulings I made** — every `Ruling:` line from the ledger, exhaustive, each with its cost clause.
  If none was made, say so; silence is indistinguishable from not having looked.
- Which validations ran per layer, and their result.
- The Project Anatomy counts as computed, and whether any changed.
- Every `CLAUDE.md` section touched and why. If none, say so.

---

## Rules

ALWAYS:
- Read the F-block's layer tag before touching anything for that block
- Load a layer skill on that layer's first F-block, not before
- Run `node scripts/build.js` on every F-block, in either layer
- Prove an internal F-block stayed in its lane with an empty `git status --porcelain framwork/`
- Fix every dependent of a removed or renamed artefact inside the same F-block
- Derive a missing layer tag from the path and record a ruling saying you did

NEVER:
- Split a plan by layer into two builds — the tags carry it
- Create provider files manually
- Register a `cli/` artefact in `provider-map.json`
- Bump `cli/package.json` — that belongs to `/add-framework--release`
- Report a `cli/` F-block complete on a mental test alone
- Add a `## Spec` section to a command or skill
- Skip the STEP 2 `Design [STOP]` gate — rulings replace the per-block stall, never that approval
