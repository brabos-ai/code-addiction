# ADD Build — Layer-Aware Plan Executor

<!-- uses:
- skill: add-build-ledger
- skill: add-plan-authoring
- skill: add-final-report
- skill: add-review-discipline
- agent: plan-readback-agent
- agent: prompt-review-agent
- skill: add-framework-product-layer
- skill: add-framework-internal-layer
- skill: building-commands
- skill: add-framework-development
- command: /add-framework--plan
- command: /add-framework--sync
- mention: /add-framework--done
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
STEP 4: Readback              → cold reader on the plan, before the first F-block; never stops the flow
STEP 5: Implement             → ONLY AFTER 1-4; ledger first, then one F-block at a time
STEP 6: Validate              → per F-block; it is committed once its own checks pass
STEP 7: Review                → ONE adversarial pass over the finished work, after the last F-block
STEP 8: Document              → changelog, plan status, inventory sync
STEP 9: Publish [STOP]        → ask before pushing the branch and opening the PR
STEP 10: Completion           → summary + EVERY ruling made
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

IF THE READBACK REPORT HAS NOT COME BACK (planned mode, STEP 4 incomplete):
  ⛔ DO NOT USE: Write or Edit on any artefact
  ⛔ DO NOT: Start the first F-block
  ✅ DO: Dispatch @plan-readback-agent and WAIT for its restatement

IF THE READBACK DIVERGES FROM THE PLAN:
  ⛔ DO NOT: Treat it as a gate and halt the build
  ⛔ DO NOT: Edit the plan's scope to match what the reader expected
  ✅ DO: Record the divergence as a ruling, say which reading you built, and continue

IF THE LEDGER HAS NOT BEEN READ (planned mode, STEP 5.1 incomplete):
  ⛔ DO NOT USE: Write or Edit anywhere
  ⛔ DO NOT: Re-execute any F-block
  ✅ DO: Read the ledger and apply add-build-ledger's resume rule

IF THE LAST F-BLOCK IS COMMITTED AND THE LEDGER CARRIES NO `REVIEW:` LINE (planned mode):
  ⛔ DO NOT USE: Write on docs/changelog/
  ⛔ DO NOT USE: Bash to run git push
  ✅ DO: Run STEP 7 first — it is what STEP 8 documents, and 7.4 is how a resume can tell

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
  ⛔ DO NOT USE: Write or Edit on CLAUDE.md
  ⛔ DO NOT USE: Write or Edit on framwork/ provider directories — build.js generates them
  ✅ DO: Load add-framework-product-layer and apply its checks

IF THE F-BLOCK'S LAYER TAG IS NEITHER [product] NOR [internal]:
  ⛔ DO NOT USE: Write or Edit anywhere for that block
  ⛔ DO NOT: Assume a default layer — [both] is a reviewer input, never an F-block tag
  ✅ DO: Derive the tag from the block's own paths per STEP 1.1, and record a ruling

IF A PATH IS NOT COVERED BY THE CURRENT F-BLOCK'S TAG:
  ⛔ DO NOT: Write it under the current block's tag
  ✅ DO: Open a NEW F-block carrying that path's own tag, and record a ruling naming both
  ✅ DO: STOP instead if no reading of the plan supports reaching that path at all

IF DIRECT MODE (STEP 1.2 — no plan, therefore no tag):
  ⛔ DO NOT USE: Write or Edit outside the resolved target path and its own layer
  ⛔ DO NOT: Touch the other layer for any reason — direct mode has no ledger to rule in
  ✅ DO: Resolve the target path first, let it choose the layer, load that layer's skill
```

**The last block exists because the three above it are conditional on a tag.** Direct mode has none,
so without it a direct build would run with no layer confinement at all — weaker than the two
single-layer commands this one replaced.

**`CLAUDE.md` is a root file, so no path rule above reaches it — the prohibition is explicit for that
reason.** It belongs to an `[internal]` F-block and only where the plan says so. Its inventory block
is generated by `node scripts/inventory.js`, so there is nothing left for a build to keep in step by
hand; a `[product]` block that edits it is doing another layer's job on its own initiative.

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
| `.claude/skills/building-commands/SKILL.md` | ANY F-block writing a `.md` command, skill or agent |
| `.claude/skills/add-framework-product-layer/SKILL.md` | The first `[product]` F-block |
| `.claude/skills/add-framework-internal-layer/SKILL.md` | The first `[internal]` F-block |
| `.claude/skills/add-framework-development/SKILL.md` | Artefact-type decisions, agent anatomy, `uses:` syntax |

**Load a layer skill when the first F-block of that layer arrives, not before.** A single-layer plan
never loads the other one.

### The Ruler (APPLY to every `.md` artefact)

**`building-commands` owns it.** Load the skill and tick `## The Ruler` — its eight items — against
every `.md` command, skill or agent this block writes. The list is not copied here: a second copy
drifts from the first, and the drift is invisible until they disagree.

STEP 7 dispatches `@prompt-review-agent` to tick the same ruler independently, on the finished
delivery. You tick it as the author; that dispatch is not your own pass repeated.

---

## STEP 4: Readback (BEFORE THE FIRST F-BLOCK)

**Planned mode only.** Direct mode has no plan, so there is nothing to read back — skip to STEP 5.

**LOAD `add-review-discipline`.** It owns how many times each reader runs, why neither writes a file,
and what you owe a report you receive.

**DISPATCH AGENT:** `@plan-readback-agent`
- **Capability:** read-only
- **Input:** `path` — the plan file resolved at STEP 1.1

**WAIT** for the restatement. ⛔ DO NOT start an F-block without it.

### 4.1 Read the Restatement Against What the Plan Decided

You hold the conversation that produced this plan. The reader does not — it saw the document and
nothing else, which is exactly the position the next session will be in.

Compare its restatement, its derived build order, and every gap it marked filled against what the plan
actually decides. **Where the two diverge, the DOCUMENT is what failed.** The reader is the instrument.

### 4.2 This Is Not a Gate

```
IF THE READBACK MARKED A GAP OR READ SOMETHING THE PLAN DID NOT INTEND:
  ⛔ DO NOT: Halt the build and send the user back to /add-framework--plan
  ⛔ DO NOT: Widen or narrow the plan's scope to match the reader's expectation
  ✅ DO: Record a ruling naming the divergence and which reading you built
  ✅ DO: Continue
```

**The stop that matters already happened at STEP 2.** A second one here would make every marked
assumption cost a command round-trip, and a reader that answers its own questions out loud marks
assumptions constantly — that is the format working, not a defect to escalate.

Where a divergence is severe enough that no reading of the plan supports one option over the others,
that is the fourth hard stop and `add-build-ledger` owns it. Nothing else here stops.

---

## STEP 5: Implement

### 5.1 The Ledger, First

Planned mode only. Path, format, identity line and the resume rule are owned by `add-build-ledger`.
Read the ledger BEFORE deciding anything, every entry, not only after a crash.

### 5.2 One F-Block at a Time

The cycle — record `BASE`, implement, show, validate, commit, record `HEAD` — is owned by
`add-build-ledger`. Two things this command adds per block:

1. **Read the block's layer tag first.** It selects the prohibitions above and the layer skill.
2. **Apply the plan's own per-F-block validation** on top of the layer default, when the plan names one.

**There is no per-block approval stall.** Showing what changed informs the user; it does not wait on
them. The STEP 2 `Design [STOP]` gate is the human's decision point and nothing here replaces it.

### 5.3 Rulings and the Four Hard Stops

Owned by `add-build-ledger`. Rule and continue; record `Ruling: <what> — <why> — <cost if wrong>`.
A red build is not a ruling: it reports and STOPS.

### 5.4 Lifecycle Actions

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

## STEP 6: Validate

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
  ✅ DO: Fix it (STEP 5) or STOP — a red build is not a finding
```

Verify every RED-first assertion the plan specified was observed failing BEFORE its implementation
landed. An assertion that was never RED is an untested F-block regardless of its current colour.

---

## STEP 7: Review (ONCE, AFTER THE LAST F-BLOCK)

```
IF ANY F-BLOCK IN THE EXECUTION ORDER LACKS A `complete` LINE:
  ⛔ DO NOT: Dispatch the auditors
  ⛔ DO NOT USE: Write on docs/changelog/
  ✅ DO: Return to STEP 5 — a review of half a delivery reports gaps that are unwritten work

IF THE LEDGER ALREADY CARRIES A `REVIEW:` LINE FOR THIS PLAN:
  ⛔ DO NOT: Dispatch the auditors again
  ✅ DO: Go to STEP 8 — the pass happened, and 7.4 recorded it
```

**Planned mode only.** Direct mode has no plan to audit against — skip to STEP 8.

**This runs EXACTLY ONCE.** `add-review-discipline` owns that rule and the reason behind it.

### 7.1 Dispatch the Auditors, in Parallel

**The count is `3 + N`.** Three scopes read the delivery as a whole. The fourth is one dispatch per
`.md` command, skill or agent in this build's diff, so `N` is that file count — and `N` is zero for a
build that touched only scripts, tests or `CLAUDE.md`.

**LIST EVERY DISPATCH BEFORE WAITING ON ANY.** The list is what the gate below reads. A hardcoded
number would be wrong on almost every build.

**DISPATCH ALL OF THEM AT ONCE:**
- **Capability:** read-only throughout — Glob, Grep, Read, and Bash for `git log` / `git diff` /
  `git show` only. No Edit, no Write. The coordinator is the only writer in this command.
- **Complexity:** standard
- **Input:** the plan's content, plus the one scope below

Each finding carries a severity, on the three levels the rest of this repository uses:

| Severity | Use when |
|---|---|
| **high** | A plan decision is unimplemented, a regression was detected, or the implementation contradicts a validated decision |
| **medium** | Partial implementation, a missed edge case, a structural violation that will cost maintenance |
| **low** | Cosmetic, doc nit, naming preference |

1. **Plan conformance** — every decision and scope item in the plan against the tree. Implemented with
   `file:line`, partial, or missing. Flag drift where the implementation contradicts a decision.
2. **Diff completeness** — `git diff` over the branch, file by file. Every changed file accounted for
   by a plan decision, and every plan-scope item carrying a diff.
3. **Side effects** — cross-references now pointing at renamed or removed artefacts, callers of changed
   behaviour, doc references to dead paths, integration points between the layers.
4. **Quality** — **DISPATCH AGENT:** `@prompt-review-agent`, once per `.md` command, skill or agent
   in the diff. **Input:** `node` (that artefact's id), and the mode the F-block decides:

   | The artefact's F-block | Mode | Also send |
   |---|---|---|
   | cites a ruler item, so a plan-time audit already ticked all eight | `confirm` | `items` — the item numbers that F-block cites |
   | cites none, so nothing has read it | `delivery` | nothing |

   **The plan's F-block is what tells the two apart**, because `/add-framework--plan` names the ruler
   item in the validation of every F-block an audit produced. No item named means no audit ran.

   Everything in the diff that is NOT a `.md` artefact — a script, a test, a JSON registry — is read
   against the conventions visible in neighbouring files, by the same generic mechanism as scopes 1
   to 3.

```
IF AN F-BLOCK CITES A RULER ITEM:
  ⛔ DO NOT: Send `mode: delivery` — that re-ticks all eight over work already graded
  ⛔ DO NOT: Send `confirm` without `items` — the agent refuses it, and should
  ✅ DO: Send `mode: confirm` with that F-block's item numbers

IF A `confirm` REPORT COMES BACK fix-then-ok:
  ⛔ DO NOT: Dispatch a third pass to check the second round of fixes
  ✅ DO: Judge it at 7.3, apply what you accept, rule on the rest, and go to STEP 8
```

**A narrow `ok` is not a clean sweep.** `confirm` ticks the cited items plus 1 and 2, and says so on
its artefact line. Reading it as "all eight pass" is reading a claim it did not make.

```
IF ANY DISPATCHED AUDITOR HAS NOT REPORTED:
  ⛔ DO NOT: Proceed to 7.2
  ⛔ DO NOT: Form a verdict on the reports you have
  ✅ DO: WAIT-ALL against the list you wrote before dispatching — a verdict on a subset reviews a
         subset of the delivery

IF `@prompt-review-agent` CANNOT BE ADDRESSED BY NAME:
  ⛔ DO NOT: Skip scope 4
  ⛔ DO NOT: Tick the ruler yourself and call it the audit — you wrote the artefact
  ✅ DO: Dispatch a generic read-only subagent carrying that agent's body as its prompt, and record
         a ruling naming which mechanism ran
```

**The name may be unavailable in the very build that creates the agent.** An agent file is not
addressable until the registry has it, which for a fresh file can be after the merge. That is a
dispatch-mechanism problem, never a reason for the delivery to go unaudited.

### Agent Dispatch Rules

1. Read the required **Capability** and honour it — read-only, for every dispatch.
2. Read the **Complexity** hint — `standard`, for every dispatch.
3. Choose the mechanism in your engine that satisfies the capability, and dispatch them all at once.
4. Pass the plan's content as part of each prompt. Scope 4 also takes its artefact's node id.
5. Verify every report on your dispatch list is received before acting on any of them.

You are the coordinator. Map the intent — capability plus complexity — to the best mechanism your
engine offers.

### 7.2 Ask the Graph What the Subagents Cannot See

The auditors read the plan and the diff. Neither shows what depends on a file nobody opened.

```bash
node scripts/graph.js impact <artefact-name> --depth 1
node scripts/graph.js history <artefact-name> --layer product|internal
```

**Depth 1, not the unbounded run.** The command layer cross-references itself densely, so the
transitive closure saturates and a hub becomes indistinguishable from a leaf.

A direct dependant that was neither changed nor named in the plan is a finding. So is a `superseded`
entry naming a delivery the plan never mentions. An unavailable index is reported, never a finding.

### 7.3 Judge Every Finding, Then Apply

**Findings are applied in this run, and each one is decided before it is applied.**
`add-review-discipline` owns that rule: the auditors read the document and the diff, not the
constraints you are holding, and telling a real finding from a confident wrong one is yours alone.

Each accepted finding is a normal edit under its own F-block layer tag, validated and committed like
any other. Each rejected one gets a ruling saying why.

```
IF A FINDING REQUIRES A DECISION THE PLAN NEVER MADE:
  ⛔ DO NOT: Invent the decision to clear it
  ✅ DO: Present that finding alone and WAIT
```

⛔ **Nothing here writes a review file.** No companion document, no versioned artefact, no verdict for
a later command to find. What survives goes in the ledger, as rulings.

**When two auditors disagree about the same item**, keep both and say so. A conformance auditor that
checked execution evidence outranks a quality auditor's reading, and a regression the side-effect
auditor flags stays high even where conformance considers it in scope.

### 7.4 Record the Pass in the Ledger

Append one line, and it is the only trace this STEP leaves anywhere:

```
REVIEW: complete (<n> findings, <m> applied, <k> rejected)
```

**This is what makes "exactly once" auditable.** STEP 5.1 resumes from the ledger's `complete` lines.
Without this line a review that found nothing leaves no trace at all, so a fresh session sees the last
F-block committed, no evidence the pass ran, and the prohibition at the top of this file tells it to
run one — the second pass this command exists to prevent. Every rejected finding gets its own
`Ruling:` line, per 7.3.

---

## STEP 8: Document

After STEP 7's review pass, and not before (planned mode — direct mode has no STEP 7 to wait on). A
changelog written ahead of that pass describes a delivery nobody audited, and any finding STEP 7
applies would land after its own record.

- **Changelog** for new or major work, written under `docs/changelog/`. **The filename is owned by
  `add-plan-authoring`** — read **File Naming** rather than declaring a pattern here. It carried one
  until this plan, and so did `/add-framework--done`; fixing either alone left the two divergent.
- **Plan status** `draft` → `implemented`, with a changelog row naming the commits it landed in.
- **The inventory block** — run `node scripts/inventory.js` and commit `CLAUDE.md` if it changed.
  Stage that path alone, never `-A`.

**This runs ALWAYS, whether or not a PR follows.** The block is derived from `framwork/.codeadd/`, so
its correctness is a fact about the tree, not about anyone's publishing decision. Tying it to STEP 9's
answer would leave the branch carrying a `CLAUDE.md` that contradicts its own artefacts every time
someone declines.

Nothing else in `CLAUDE.md` is written here. The rest of the file changes only where a plan said so.

---

## STEP 9: Publish [STOP]

**⛔ GATE:** A push to a shared remote is one of the four hard stops. ASK.

```
IF THE CURRENT BRANCH IS main:
  ⛔ DO NOT USE: Bash to run git push
  ⛔ DO NOT: Offer the question at all
  ✅ DO: Report that the work is committed on main and needs a branch before it can be published

IF THE USER HAS NOT ANSWERED:
  ⛔ DO NOT USE: Bash to run git push
  ⛔ DO NOT USE: Bash to run gh pr create
  ✅ DO: Ask, and WAIT
```

**The `main` case is not theoretical.** This command never creates a branch — STEP 1.3 only
recommends one — so a direct build can be sitting on `main`, and offering to push there would put
work past every gate `/add-framework--done` exists to enforce.

Ask whether to push the branch and open the PR. Then:

| Answer | Do |
|---|---|
| Yes | `git push -u origin <branch>`, then `gh pr create`. Report the PR URL |
| No | Say the work is committed locally and that `/add-framework--done` pushes and opens the PR when it runs |

**Skip the question when a PR already exists for this branch** — `gh pr view` resolves one. Asking
again on the second build of the same branch is noise. Push, and say the existing PR was updated.

**STEP 8 ran first, and that order is not cosmetic.** The PR must carry the synced `CLAUDE.md`, or the
diff a human reviews is not the diff that merges.

⛔ **This step never merges.** It opens a PR and stops. The merge belongs to `/add-framework--done`,
behind its own gates.

---

## STEP 10: Completion

**LOAD `add-final-report`.** It owns the seven blocks, the banned phrasings and the self-check. Emit
the report FIRST — the ledger path, the commit ranges and the rulings come after it, never in front
of it and never instead of it.

Fill the blocks from this build:

- **`What was delivered`** — artefacts created, modified, renamed and **removed**, with paths and the
  layer each sits in.
- **`Files touched`** — the same set as a table, split by verb. The Deleted row is written even when
  it reads "none".
- **`How it works`** — what the delivered artefacts do once they are in place, for a reader who did
  not watch the build.
- **`⚠️ Needs your attention`** — anything removed, any `CLAUDE.md` edit, and any change to how an
  existing command behaves mid-flow.

Then, after the seven blocks and before the metadata, report always:

- **Rulings I made** — per `add-build-ledger`, which owns the exhaustiveness rule and the cost clause.
  **`docs/plans/` is gitignored, so this report is the only way a ruling reaches a human while the
  work is still changeable.** Zero rulings is stated, never omitted.
- Which validations ran per layer, and their result.
- **Whether the inventory block changed**, and the commit that carried it. Say "already current" when
  it did not — silence is indistinguishable from not having run it.
- **Whether a PR was opened**, with its URL — or that the user declined and the branch is local.

Metadata last: the ledger path, and the `BASE..HEAD` range of every committed F-block.

---

## Rules

ALWAYS:
- Read the F-block's layer tag before touching anything for that block
- Treat each F-block's tag as independent — a block never inherits the previous block's layer
- Load a layer skill on that layer's first F-block, not before
- Run `node scripts/build.js` on every F-block, in either layer
- Compare a block's warnings against the baseline, never against zero — a pre-existing warning is not
  this block's to fix, and a count alone cannot tell the two apart
- Prove an internal F-block stayed in its lane with an empty `git status --porcelain framwork/`
- Fix every dependent of a removed or renamed artefact inside the same F-block
- Derive a missing layer tag from the path and record a ruling saying you did
- Sync the inventory block at STEP 8, whatever the answer at STEP 9 turns out to be

NEVER:
- Split a plan by layer into two builds — the tags carry it
- Report an F-block complete on a mental test alone, in either layer
- Skip the STEP 2 `Design [STOP]` gate — rulings replace the per-block stall, never that approval
- Push or open a PR without asking, or push `main` at all
- Merge — STEP 9 opens a PR and stops there
