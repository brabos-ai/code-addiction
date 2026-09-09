---
name: add-plan-authoring
description: "Use when writing or revising a plan document — file naming, F-block layer tags, the Produces/Consumes rule, the review dispatch and its verdicts, the completion summary, and Continue/List mode resolution."
---

# Plan Authoring

<!-- uses:
- agent: plan-review-agent
- skill: add-review-discipline
- skill: add-plan-authoring/references/plan-template.md
- mention: add-build-ledger
- mention: /add-framework--build
-->

Owns the plan DOCUMENT. What the plan decides is the planning command's job; how it is named,
shaped, reviewed and delivered is here.

## When to Use

- Writing a new plan, or revising one.
- Resolving a plan argument (Continue Mode) or listing plans (List Mode).
- Dispatching the plan reviewer and acting on its verdict.

## When NOT to Use

- Executing a plan. That is the build side — load `add-build-ledger`.

---

## File Naming

**Path:** `docs/plans/YYYY-MM-DDTHHMMSS-PLAN--<slug>.md`

Timestamp in **local time**, `T` between date and time, **no separators inside `HHMMSS`** — Windows
forbids `:` in a filename. Lexicographic sort therefore equals chronological sort.

```
⛔ THERE IS NOTHING TO LOOK UP:
  ⛔ DO NOT USE: Read or ls on docs/plans/ to find a next number
  ⛔ DO NOT: Allocate a sequential NNNN
  ✅ DO: Take the timestamp from the clock
```

**A plan SET allocates its timestamp once, at the umbrella, and every topic reuses it verbatim** —
that is what keeps a set grouped in the directory now that a shared number no longer does:

```
docs/plans/2026-09-07T005046-PLAN--<slug>-000-umbrella.md
docs/plans/2026-09-07T005046-PLAN--<slug>-001-<topic>.md
```

**Companions suffix the plan basename:** `--evidence-v01.md`, `--review-v01.md`, `--ledger.md`.

### Legacy forms resolve for reading, never for writing

Three forms are on disk and all three RESOLVE: the current `YYYY-MM-DDTHHMMSS-PLAN--`, the legacy
`NNNN-PLAN--`, and `-SELF-PLAN--` from when planning was split by layer. `CLAUDE.md` and several
documents cite plans by number. **Only `-PLAN--` with a timestamp is written for a NEW plan.**

---

## Layer Tags — One Plan, Both Layers

**Every F-block declares its layer.** That tag is what lets the execution order interleave the layers
instead of committing one half of a working change and waiting.

```
- **F1** [internal] — `.claude/commands/foo.md`: ...
- **F2** [product]  — `framwork/.codeadd/scripts/bar.sh`: ...
```

| Tag | Means | Paths |
|-----|-------|-------|
| `[product]` | Distributed artefacts | `framwork/.codeadd/`, `framwork/provider-map.json`, `cli/` |
| `[internal]` | Development tooling | `.claude/`, `scripts/`, `CLAUDE.md`, repo root |

A plan whose F-blocks are all one tag is a single-layer plan. That is normal, not a defect.

---

## The Interface Rule — Produces / Consumes

**Every F-block that hands something to a later one MUST declare it.** The producer states
`Produces:`, the consumer states `Consumes:` with the **same string** plus the producing F-block id.

⛔ **The interface here is NOT a function signature.** It is the `KEY=STATUS` line a script emits, a
sidecar key, a frontmatter field, an injection anchor name — whatever one F-block writes down and a
later one reads.

```
- **F3** [product] — `framwork/.codeadd/scripts/converge-gates.sh`: adds the fifth delivery gate.
  - **Produces:** `converge-gates.sh` emits `GATE5=pass|fail|skip`
- **F7** [product] — `framwork/.codeadd/commands/add.done.md`: STEP 4 reads the new gate.
  - **Consumes:** `GATE5` (F3)
```

**Every `Consumes` MUST name an EARLIER F-block that `Produces` it, using the SAME string.** A
`Consumes` with no matching `Produces` is an F-block built against a name someone still has to invent.

---

## Authoring Rules (READ BEFORE WRITING)

**A plan states WHAT WE WILL DO, not what will be written to the file.**

```
IF TEMPTED TO PASTE THE CONTENT A FILE WILL RECEIVE:
  ⛔ DO NOT: Write the command body, the skill body, the agent prompt, the fragment text
  ⛔ DO NOT: Turn the plan into something the build copy-pastes
  ✅ DO: Name the file, name the change, and POINT at the design doc carrying the contract
```

| Belongs in the plan | Belongs in the design doc it points at |
|---|---|
| Which files change and what changes about them | The contract, the schema, the worked example |
| Why an F-block exists and what it must not lose | The rejected alternatives and their rationale |
| The order of work and its dependencies | The conversation that produced the decision |
| How each F-block is proven correct | — |

If a design doc exists in `docs/brainstorming/`, the plan **references it and does not restate it**.
With no design doc the plan carries the decision inline — still the decision, never the file content.

**Every F-block MUST be covered by at least one validation level.** An F-block with no proof is a gap
the reviewer cannot see.

**Global Constraints is never omitted.** Every requirement binding the WHOLE plan, one line each, the
**exact value copied verbatim from its source**, with that source cited in parentheses. It is handed
to the reviewer as its attention lens: "keep it consistent" cannot be reviewed. **With no plan-wide
constraints the section reads the single word `None`** — an absent section is a question, `None` is an
assertion.

**Document structure:** load `references/plan-template.md`.

---

## Review Dispatch (BEFORE ANY DELIVERY)

**GATE CHECK:** Does the plan file exist? IF NO → write it first. DO NOT proceed.

```
IF THE PLAN HAS NOT BEEN REVIEWED THIS SESSION:
  ⛔ DO NOT: Present the plan path, summary, or next-step commands as delivered
  ✅ DO: Dispatch the reviewer and WAIT for its report
```

**DISPATCH AGENT:** `@plan-review-agent`
- **Capability:** read-only
- **Complexity:** standard
- **Input:** `path` (the plan file), `kind: plan`, `layer` (derived, below)

**Derive `layer` from the F-block tags** — all `[product]` → `product`, all `[internal]` → `internal`,
mixed → `both`. Always sending `both` hands the reviewer a wider lens than the plan needs and loses
the layer-boundary check on a single-layer plan.

### Acting on the Verdict

**`add-review-discipline` owns this.** How many times the reviewer runs, what a caller owes a report
it receives, and the `blocked` path all live there, because three commands need the same answers and
restating them here is what let them drift apart in the first place.

Two things this skill adds on top, both specific to a plan document:

- A `fix-then-ok` whose fixes land in the plan gets a **changelog row** naming what changed.
- The plan is not presented as delivered until the report has come back and been acted on.

⛔ DO NOT invent decisions to clear blockers.
⛔ DO NOT skip review in Continue Mode.

---

## Completion — The Executive Summary

**The user did NOT read the plan.** They decide from this summary. A completion naming the file, the
verdict and the next command says the plan exists, not what is about to happen. If the user has to ask
"but what will actually be done?", this failed.

Emit FIRST, before any metadata. Plain language, user's language. Skip a block only when genuinely
empty; never pad it.

⛔ **BANNED:**

| Banned | Use instead |
|--------|-------------|
| `F7`, `T3`, `L2.9` carrying the meaning | State the change; the id goes in parentheses at most |
| "The plan adds a section on X" | "X is added to `path/file`" |
| "Improves consistency", "more robust" | The concrete change and what it causes |
| Restating the Problem section | What we are going to DO about it |
| Skipping a deletion as "just cleanup" | Name every deleted file, always |
| Naming a category ("the review commands") | Name each file and each step |

**1. What will be done** — one line per unit of work, grouped by stage. Each pairs the concrete change
with the file it lands in.

**2. Files touched** — split by verb, because the risks differ:

| Action | Files |
|--------|-------|
| Created / Modified / Renamed | ... |
| **Deleted** | ... (write "none" when none — never omit the row) |

**3. Where it plugs in** — name the **host and the exact step**. "Changes the review flow" is not an
answer. "`/add-framework--build` STEP 3, before the skill load" is.

**4. What is explicitly NOT included** — the scope boundaries the user must know.

**5. ⚠️ Needs your attention** — only genuinely consequential: anything deleted, anything
irreversible, any `CLAUDE.md` edit (it rewrites what every future session loads), anything changing
how an existing command behaves mid-flow, and the one or two places the plan is most likely to be
built wrong. Omit the block entirely when there is nothing real; never manufacture a warning.

**Then, and only then:** plan path, status, verdict, fixes applied, next-step commands.

### Self-check before sending

```
[ ] A reader who never opened the plan knows what will change
[ ] Every deleted file is named; the Deleted row is present even when empty
[ ] Every integration point names its host AND its step
[ ] No F/T/L id is load-bearing — remove them all and the summary still reads
[ ] It describes the WORK, never the document
[ ] Every F-block appears somewhere in blocks 1-3
```

---

## Argument Resolution

**Resolve BEFORE loading anything.** Match the argument as a **substring** of the basenames of
`docs/plans/*PLAN--*.md`, excluding `--review-v*`, `--evidence-v*` and `--ledger` companions. A
24-character timestamp prefix is not typeable, so a unique slug fragment is the normal argument; the
full basename always works.

- **Exactly one match** → that is the plan.
- **More than one** → ⛔ STOP. Print every candidate basename and ask which. **NEVER guess.**
- **No match** → list `docs/plans/` and STOP.

**Continue Mode** (argument resolves to a plan): load it, summarize what was already decided, ask what
to adjust, update it with a changelog row, then review and complete it the same way a new plan is.
An update is not delivered before review — and it gets the same single pass a new plan gets, not an
extra one for having been revised.

**List Mode** (no argument): list the plans with their status and ask which to work on.

## Common Rationalizations (BLOCKED)

| Excuse | Reality |
|--------|---------|
| "I'll check docs/plans/ for the next number" | Timestamps. Nothing to look up |
| "Pasting the file body makes the build easier" | It makes the plan unreviewable. Name the change |
| "Global Constraints is empty, I'll drop it" | Write `None`. Absent is a question |
| "This F-block obviously doesn't need a test" | No proof, no coverage, reviewer blind |
| "Two matches, the newer one is obviously it" | STOP and ask. NEVER guess |

## Rules

ALWAYS:
- Take the plan timestamp from the clock
- Tag every F-block with its layer
- Derive the reviewer's `layer` from those tags
- Write `None` when a section is genuinely empty

NEVER:
- Deliver a plan the reviewer has not seen this session
- Invent a decision to clear a blocker
- Guess between two argument matches
