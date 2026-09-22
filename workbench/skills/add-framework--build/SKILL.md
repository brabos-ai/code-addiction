---
name: add-framework--build
description: "Use when a plan in docs/plans/ is ready to execute, or for a direct build of one simple internal or product artefact — implements F-blocks one commit at a time under each block's layer tag, keeps the ledger, audits the finished delivery once, and asks before opening the PR. Third stage of brainstorm → plan → build → done."
---

# ADD Build — Layer-Aware Plan Executor

<!-- uses:
- skill: add-build-ledger
- skill: add-artefact-graph
- skill: add-plan-authoring
- skill: add-final-report
- skill: add-review-discipline
- agent: plan-readback-agent
- agent: prompt-review-agent
- skill: add-framework-product-layer
- skill: add-framework-internal-layer
- skill: building-commands
- skill: add-framework-development
- skill: add-framework--plan
- command: /add-framework--sync
- handoff: add-framework--done
- skill: building-commands/references/agent-dispatch.md
-->

> **LANG:** Respond in user's native language (detect from input). Tech terms always in English. Short sentences, one idea each; the common word over the rare one; a technical term explained in one line the first time it appears.

Executes a plan into working artefacts, in **both layers** — the distributed product layer
(`framwork/.codeadd/`, `framwork/provider-map.json`, `cli/`, `mcp/`) and the internal development layer
(`workbench/`, `scripts/`, `AGENTS.md`). Each F-block's layer tag selects which rules apply to it.

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
  ✅ DO: Read {{skill:building-commands/SKILL.md}}

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
  ⛔ DO NOT USE: Write or Edit on workbench/
  ⛔ DO NOT USE: Write or Edit on AGENTS.md
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

**`AGENTS.md` is a root file, so no path rule above reaches it — the prohibition is explicit for that
reason.** It belongs to an `[internal]` F-block and only where the plan says so. Its inventory block
is generated by `node scripts/inventory.js`, so there is nothing left for a build to keep in step by
hand; a `[product]` block that edits it is doing another layer's job on its own initiative.

**`node scripts/build.js` runs on every F-block, in both layers.** It is where the three
artefact-graph gates live, and the graph covers `workbench/` as well as `framwork/.codeadd/`. An
internal-only F-block proves it stayed in its lane with `git status --porcelain framwork/` returning
empty — the only file it may have touched there is the gitignored `artefact-graph.json`.

---

## Operation Mode

```
/add-framework--build [plan]           → Execute a plan (full basename or unique slug substring)
/add-framework--build [type] [name]    → Direct build, no plan, for simple artefacts
```

**Valid types:** `command` | `skill` | `agent` | `script` | `workflow` | `cli` | `map`

`map` is `AGENTS.md` itself. Its direct form takes the file and a description rather than a type and
a name: `/add-framework--build AGENTS.md "update the pipeline section"`. A bare artefact name works
the same way for any existing artefact — the path resolves it, and the path decides the layer.

To optimize an existing artefact, use the direct form — STEP 2 detects it already exists and presents
the analysis against `building-commands` before any edit.

---

## STEP 1: Load Context (MANDATORY)

### 1.1 If a plan is specified

**Resolve `[plan]` BEFORE reading anything, by `add-plan-authoring`.** Load it and apply it as
written: its Argument Resolution owns the substring match, the companions it excludes and the stop on
more than one match or none, and its legacy-forms rule owns which naming forms resolve. Exactly one match is the plan — read
it.

**Extract:** the F-blocks with their layer tags, the execution order, the Global Constraints, the
validated decisions, the per-F-block validation the plan specifies, and the `> **Delivery:**` header
line — `confirm` when absent. `add-plan-authoring` owns what it means, under **The Delivery Mode**.

**Stop kind — deciding.** The two resolution stops Argument Resolution makes present an ambiguity, and nothing approved
which plan an ambiguous argument meant.

**A plan whose F-blocks carry no layer tag is legacy.** Derive the tag from each path — `framwork/`,
`provider-map.json`, `cli/` or `mcp/` is `[product]`, everything else `[internal]` — and record one
ruling saying you did.

⛔ **`mcp/` is at the repository root and is still `[product]`.** It ships inside the npm package,
and shipping is what decides the layer. A path test that stops at the first three sends every
`mcp/` block to the wrong layer skill.

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

**Stop kind — decided by the plan's state:**

| State | Kind | Do |
|---|---|---|
| Planned mode, `Delivery: automatic`, and no Global Constraint overrides a gate in this skill | **confirming** | Print the design and continue to STEP 3 |
| Planned mode, `Delivery: automatic`, and a Global Constraint overrides a gate here | **deciding** | Wait — the exception is a choice the brainstorm's approval never saw |
| `Delivery: confirm`, absent, or direct mode | **deciding** | Wait |

---

## STEP 3: Load Skills (MANDATORY)

| Load | When |
|------|------|
| `{{skill:add-build-ledger/SKILL.md}}` | Planned mode, ALWAYS, before the first F-block |
| `{{skill:building-commands/SKILL.md}}` | ANY F-block writing a `.md` command, skill or agent |
| `{{skill:add-framework-product-layer/SKILL.md}}` | The first `[product]` F-block |
| `{{skill:add-framework-internal-layer/SKILL.md}}` | The first `[internal]` F-block |
| `{{skill:add-framework-development/SKILL.md}}` | Artefact-type decisions, agent anatomy, `uses:` syntax |

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

**Stop kind — the four hard stops are deciding in every state**, here and at STEP 5.3.

---

## STEP 5: Implement

### 5.1 The Ledger, First

Planned mode only. Path, format, identity line and the resume rule are owned by `add-build-ledger`.
Read the ledger BEFORE deciding anything, every entry, not only after a crash.

**Then, before the first F-block, the ticket.** When the plan header carries `> **Ticket:**`, make the
`doing` write — read first, skipped when the ticket already holds it, never a reason to stop.
`add-plan-authoring` owns the write and every degradation, under **The Ticket**. Not before this point:
a ticket marked `doing` for a build that stopped at STEP 2 is a claim the board cannot take back.

### 5.2 One F-Block at a Time

The cycle — record `BASE`, implement, show, validate, commit, record `HEAD` — is owned by
`add-build-ledger`. Two things this skill adds per block:

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

**The count is `3 + 1`.** Three scopes read the delivery as a whole. The fourth is **one batched
dispatch** covering every `.md` command, skill or agent in this build's diff, whatever their count —
and that dispatch is skipped entirely for a build that touched only scripts, tests or `AGENTS.md`,
where there is nothing for it to cover.

**LIST EVERY DISPATCH BEFORE WAITING ON ANY.** The list is what the gate below reads. A hardcoded
number would be wrong on almost every build.

**DISPATCH ALL OF THEM AT ONCE:**
- **Capability:** read-only throughout — Glob, Grep, Read, and Bash for `git log` / `git diff` /
  `git show` only. No Edit, no Write. The coordinator is the only writer in this skill.
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
4. **Quality** — **DISPATCH AGENT:** `@prompt-review-agent`, **once**, in its batched form, carrying
   every `.md` command, skill or agent in the diff as one `nodes` list. **Input:** `nodes` — one line
   per artefact, `<node id> mode=<mode> items=<items|->`, the mode decided per artefact by its own
   F-block:

   | The artefact's F-block | Mode | Also send |
   |---|---|---|
   | cites a ruler item, so a plan-time audit already ticked all eight | `confirm` | `items` — the item numbers that F-block cites |
   | cites none, so nothing has read it | `delivery` | `-` |

   **The plan's F-block is what tells the two apart**, because `/add-framework--plan` names the ruler
   item in the validation of every F-block an audit produced. No item named means no audit ran. Two
   artefacts in the same batch commonly carry different modes — that is normal, not a conflict.

   Everything in the diff that is NOT a `.md` artefact — a script, a test, a JSON registry — is read
   against the conventions visible in neighbouring files, by the same generic mechanism as scopes 1
   to 3.

```
IF AN F-BLOCK CITES A RULER ITEM:
  ⛔ DO NOT: Send that artefact's `nodes` entry as `mode=delivery` — that re-ticks all eight over
             work already graded
  ⛔ DO NOT: Send `mode=confirm` with `items=-` — the agent refuses that entry, and should
  ✅ DO: Send that entry as `mode=confirm items=<that F-block's item numbers>`

IF A BATCHED REPORT COMES BACK fix-then-ok:
  ⛔ DO NOT: Dispatch a second batched call to check the fixes — not even for the artefacts whose
             entry was `confirm`
  ✅ DO: Judge every artefact's findings at 7.3, apply what you accept, rule on the rest, and go to
         STEP 8
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

### Dispatching the Agents Above

**`building-commands/references/agent-dispatch.md` owns them** — read its **Agent Dispatch Rules** and
apply them to every `DISPATCH AGENT` block in this skill. The capability, the complexity, the input and the wait-all gate for this step are all stated in 7.1 above.

### 7.2 Ask the Graph What the Subagents Cannot See

The auditors read the plan and the diff. Neither shows what depends on a file nobody in this delivery
opened.

**The question, for every artefact this delivery touched:** what depends on it that this delivery
neither changed nor named — and has it shipped before and been dropped?

**LOAD `add-artefact-graph` and resolve both halves to their verbs there.** ⛔ DO NOT name a verb from
memory. The skill owns which verb answers which question, when one query is not enough, and the
standing list of what no query reaches.

**Grade on direct dependants at depth 1, not on the unbounded run.** The command layer
cross-references itself densely, so the transitive closure saturates and a hub becomes
indistinguishable from a leaf.

A direct dependant that was neither changed nor named in the plan is a finding. So is a `superseded`
entry naming a delivery the plan never mentions. An unavailable index is reported, never a finding.

**Write the answer into the ledger before STEP 8**, as `GRAPH:` lines in the shape `add-build-ledger`
owns — one line per artefact this delivery touched, or a single `GRAPH: NOT VERIFIED — <why>` where no
route existed.

```
IF THE LEDGER CARRIES NO `GRAPH:` LINE FOR THIS DELIVERY:
  ⛔ DO NOT: Proceed to STEP 8
  ✅ DO: Ask the graph and write the lines

IF YOU HAVE NO ROUTE TO THE GRAPH:
  ⛔ DO NOT: Report the question as answered, and DO NOT reconstruct the answer with grep
  ✅ DO: Write `GRAPH: NOT VERIFIED` with the reason, and continue
```

⛔ **The ledger is the anchor because 7.3 writes nothing.** This step used to block on "the audit
report", but 7.3 states plainly that nothing here reaches disk and 7.4's line is the only trace the
whole STEP leaves — so a gate on that report pointed at something that never existed. The ledger is
where what survives a review already goes, and `/add-framework--done` archives it, so a `GRAPH:` line
outlives the session the way a ruling does.

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

**Stop kind — deciding, in every state.** The decision was not in the plan, so no approval covered it.

⛔ **Nothing here writes a review file.** No companion document, no versioned artefact, no verdict for
a later command to find. What survives goes in the ledger, as rulings.

**When two auditors disagree about the same item**, keep both and say so. A conformance auditor that
checked execution evidence outranks a quality auditor's reading, and a regression the side-effect
auditor flags stays high even where conformance considers it in scope.

### 7.4 Record the Pass in the Ledger

Append one line:

```
REVIEW: complete (<n> findings, <m> applied, <k> rejected)
```

Together with 7.2's `GRAPH:` lines and the `Ruling:` lines from 7.3, this is the whole trace STEP 7
leaves anywhere. Nothing else reaches disk.

**This is what makes "exactly once" auditable.** STEP 5.1 resumes from the ledger's `complete` lines.
Without this line a review that found nothing leaves no trace at all, so a fresh session sees the last
F-block committed, no evidence the pass ran, and the prohibition at the top of this file tells it to
run one — the second pass this skill exists to prevent. Every rejected finding gets its own
`Ruling:` line, per 7.3.

---

## STEP 8: Document

After STEP 7's review pass, and not before (planned mode — direct mode has no STEP 7 to wait on). A
changelog written ahead of that pass describes a delivery nobody audited, and any finding STEP 7
applies would land after its own record.

- **Changelog** for new or major work, written under `docs/changelog/`. **The filename and the
  one-per-delivery rule are owned by `add-plan-authoring`** — read **File Naming** rather than
  declaring a pattern here. This skill normally creates the file; `/add-framework--done` STEP 4
  finds it and edits it rather than allocating a second timestamp.
- **Plan status** `draft` → `implemented`, with a changelog row naming the commits it landed in.
- **The inventory block** — run `node scripts/inventory.js` and commit `AGENTS.md` if it changed.
  Stage that path alone, never `-A`.

**This runs ALWAYS, whether or not a PR follows.** The block is derived from `framwork/.codeadd/`, so
its correctness is a fact about the tree, not about anyone's publishing decision. Tying it to STEP 9's
answer would leave the branch carrying an `AGENTS.md` that contradicts its own artefacts every time
someone declines.

Nothing else in `AGENTS.md` is written here. The rest of the file changes only where a plan said so.

---

## STEP 9: Publish [STOP]

**⛔ GATE — two behaviours, chosen by whether the branch already has a PR** (`gh pr view` resolves one):

- **No PR — the first push.** A push to a shared remote is one of the four hard stops. ASK, and WAIT.
- **A PR exists.** The push was decided when that PR was opened. Push without asking, and say the
  existing PR was updated.

```
IF THE CURRENT BRANCH IS main:
  ⛔ DO NOT USE: Bash to run git push
  ⛔ DO NOT: Offer the question at all
  ✅ DO: Report that the work is committed on main and needs a branch before it can be published

IF THE BRANCH HAS NO PR AND THE USER HAS NOT ANSWERED:
  ⛔ DO NOT USE: Bash to run git push
  ⛔ DO NOT USE: Bash to run gh pr create
  ✅ DO: Ask, and WAIT
```

**The `main` case is not theoretical.** This skill never creates a branch — STEP 1.3 only
recommends one — so a direct build can be sitting on `main`, and offering to push there would put
work past every gate `/add-framework--done` exists to enforce.

On the first push, ask whether to push the branch and open the PR. Then:

| Answer | Do |
|---|---|
| Yes | `git push -u origin <branch>`, then `gh pr create`. Report the PR URL |
| No | Say the work is committed locally and that `/add-framework--done` pushes and opens the PR when it runs |

**Why the second behaviour exists:** asking again on the second build of the same branch is noise —
the hard stop was taken, and answered, when the PR was opened.

**STEP 8 ran first, and that order is not cosmetic.** The PR must carry the synced `AGENTS.md`, or the
diff a human reviews is not the diff that merges.

⛔ **This step never merges.** It opens a PR and stops. The merge belongs to `/add-framework--done`,
behind its own gates.

**Stop kind — decided by whether a PR exists, not by the marker:**

| State | Kind | Do, on either delivery mode |
|---|---|---|
| The branch has no PR — the first push | **deciding** | Ask and WAIT. On `Delivery: automatic` this question is the **terminus**: the automatic path ends here |
| A PR already exists for the branch | **confirming** | Push and report the existing PR updated — the push was decided when that PR was opened |

⛔ **Neither state hands off to `/add-framework--done`.** Whatever the answer, the build ends at STEP 10.
The close-out runs only when the operator invokes it.

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
- **`⚠️ Needs your attention`** — anything removed, any `AGENTS.md` edit, and any change to how an
  existing command behaves mid-flow.

Then, after the seven blocks and before the metadata, report always:

- **Rulings I made** — per `add-build-ledger`, which owns the exhaustiveness rule and the cost clause.
  **`docs/plans/` is gitignored, so this report is the only way a ruling reaches a human while the
  work is still changeable.** Zero rulings is stated, never omitted.
- Which validations ran per layer, and their result.
- **Whether the inventory block changed**, and the commit that carried it. Say "already current" when
  it did not — silence is indistinguishable from not having run it.
- **Whether a PR was opened**, with its URL — or that the user declined and the branch is local.
- **The ticket, when the plan carried one** — the id, and the `doing` write's `SHA`, that it was already
  there, or what did not happen.

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
