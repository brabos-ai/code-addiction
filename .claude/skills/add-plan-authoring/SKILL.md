---
name: add-plan-authoring
description: "Use when writing or revising a plan document — file naming, F-block layer tags, the Produces/Consumes rule, the review dispatch and its verdicts, and Continue/List mode resolution."
---

# Plan Authoring

<!-- uses:
- agent: plan-review-agent
- skill: add-review-discipline
- skill: add-final-report
- skill: add-plan-authoring/references/plan-template.md
- mention: add-build-ledger
- mention: add-framework--done
- mention: add-framework--build
- mention: add-framework--brainstorm
- mention: add-framework--plan
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

Three documents are named here — the plan, the changelog and the intent file. The first two share one timestamp rule:

| Document | Path |
|---|---|
| The plan | `docs/plans/YYYY-MM-DDTHHMMSS-PLAN--<slug>.md` |
| The changelog | `docs/changelog/YYYY-MM-DDTHHMMSS-<verb>-<slug>.md` |

Timestamp in **local time**, `T` between date and time, **no separators inside `HHMMSS`** — Windows
forbids `:` in a filename. Lexicographic sort therefore equals chronological sort.

`<verb>` is `add` | `update` | `refactor` | `remove` | `fix`. **It survives the timestamp**: once the
timestamp leads it no longer affects order, and it is information the files already carry. The date
alone did not sort — a day with several deliveries alphabetised by verb, and the directory holds days
that did.

⛔ **Pre-existing changelogs keep the names they were written with**, exactly as pre-existing plans do
below. Nothing reads a changelog by its filename, so a rename rewrites files for no reader.

**Both writers point here and neither declares a pattern of its own** — `/add-framework--build` at
its STEP 8, `/add-framework--done` at its STEP 4. Two stages declaring one format is how they drift.

```
⛔ ONE CHANGELOG PER DELIVERY:
  ⛔ DO NOT: Allocate a timestamp for a delivery that already has a changelog
  ⛔ DO NOT USE: Write on a new path when a file in docs/changelog/ already covers this delivery
  ✅ DO: Find that file, EDIT it in place, and keep the filename it already has
```

**The timestamp is what makes that rule necessary.** Under the date-only name both writers computed
one path, so the second landed on the first file and the directory ended up holding one changelog per
delivery by accident. Two timestamps differ by the seconds between the two commands. Without the rule
above, one delivery reaches `main` as two files that each tell half of its story.

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

**A brainstorm SET follows the same two rules** — one timestamp for the whole set, and an `NNN`
ordinal on every member, `-000-umbrella` then `-001-` onward. `/add-framework--brainstorm` owns its
directory and its slug; only the shape is shared. It is recorded here because a reader comparing the
two set conventions would otherwise find the rule for one and not the other, which is how they drift.

### The Intent File

`/add-framework--brainstorm` writes `docs/brainstorming/YYYY-MM-DDTHHMMSS-<slug>-intent.md` at its
handoff, on the `bounded` and `architectural` paths. **Never on `spike`.**

| Path | What exists afterwards |
|---|---|
| `architectural` | The design document AND the intent file, sharing one timestamp so the pair sorts adjacent |
| `bounded` | The intent file alone, with its own timestamp |
| `spike` | Nothing |

**Shape — capped at one screen. If it reads like a document, it is too long.**

```markdown
---
path: bounded            # spike | bounded | architectural
topic: <slug>
doc: <design document path, or none>
delivery: confirm        # confirm | automatic — the answer to the brainstorm's STEP 7.3 approval
---

## Decided
- <decision> — <one-line rationale>

## Open
None
```

⛔ **`## Open` reads the literal `None` when everything closed, and that is the normal case.** A
section present but empty is read as ABSENT, and absent means not closed — `/add-framework--plan`
then runs its full questionnaire. Falling the other way would build a plan from decisions nobody made.

⛔ **There is no validation gate for this file.** `add-doc-schemas` is a product-layer skill and does
not reach `.claude/`. The reader’s fallback-to-questionnaire rule is what covers a malformed one, so
the shape above is a contract between two commands rather than something a gate enforces.

**Why this exists at all, when the design document pointer already did:** that pointer exists on the
`architectural` path only. `bounded` writes no design document, so on the one path a size branch
serves there was nothing to read and nothing survived the session.

### The Delivery Mode

**Two values, chosen once, at `/add-framework--brainstorm` STEP 7.3, and carried — never re-asked.**

| Carrier | Written by | Read by |
|---|---|---|
| `delivery:` in the intent file | `/add-framework--brainstorm` 7.3 | `/add-framework--plan` STEP 1.2 |
| `> **Delivery:**` in the plan header | `/add-framework--plan` STEP 5, copied from the intent file | `/add-framework--build` STEP 1.1 |

⛔ **Absent means `confirm`.** No intent file, no field, no header line, a plan written before this
existed, a direct build — every one of them runs with a human confirming each stage. The fall is
toward waiting, never away from it.

#### The stopping rule

Every `[STOP]` in the four stages is one of two kinds:

| Kind | It presents | On `confirm` | On `automatic` |
|---|---|---|---|
| **deciding** | A choice the brainstorm's approval did not cover — an open question, a blocker, an ambiguity, a push | Waits | **Waits** |
| **confirming** | Something the approval already covered — a design, a summary, a report of work already agreed | Waits | Does not wait |

⛔ **Classify by STATE, not by marker.** One marker can be both kinds: `/add-framework--build` STEP 9
decides on the first push of a branch with no PR, and only confirms once a PR exists. Each stage
classifies its own stops where they sit, with the state that decides the kind.

```
IF A STOP'S KIND IS NOT OBVIOUS FROM ITS STATE:
  ⛔ DO NOT: Treat it as confirming to keep the automatic path moving
  ✅ DO: Treat it as deciding, and wait
```

**Three stops are deciding in every state, and nothing reclassifies them:**

- **`/add-framework--build` STEP 9 on a branch with no PR** — the terminus of the automatic path.
- **The four hard stops** `add-build-ledger` owns.
- **Every stop in `/add-framework--done`.** The close-out is never reached unattended, so it never
  runs in the automatic state at all.

### Legacy forms resolve for reading, never for writing

Three forms are on disk and all three RESOLVE: the current `YYYY-MM-DDTHHMMSS-PLAN--`, the legacy
`NNNN-PLAN--`, and `-SELF-PLAN--` from when planning was split by layer. `CLAUDE.md` and several
documents cite plans by number. **Only `-PLAN--` with a timestamp is written for a NEW plan.**

---

## The Plan Preview

**What the plan will say, shown before it is written.** `/add-framework--plan` prints it at the end of
its STEP 4, inside the stop that step already makes — on the automatic path it is the one moment the
operator sees what is being decided without them.

**Shape — five labelled items, in this order:**

```markdown
**Objective:** <one line — the objective the plan will carry>
**Phases:** <one line per phase — its name and what it includes>
**Order:** <the phase order, and WHY it is that order, in one or two lines>
**Risk:** <one line per artefact the plan changes — its name and its risk grade from STEP 3.2>
**Excluded:** <what the plan will NOT do, one line per item>
```

```
IF COMPOSING THE PREVIEW:
  ⛔ DO NOT: List files, validation levels, F-block ids or F-block detail — then someone reads the
             preview instead of the plan
  ⛔ DO NOT: Run a new query, audit or dispatch for it — it is composed from what STEP 3 produced
  ⛔ DO NOT: Add a stop for it — STEP 4 already stops
  ✅ DO: Compose the five items from the analysis in hand, and print them
```

**It is not the plan in miniature.** A reader who needs a file or a check opens the plan; the preview
exists so that nobody has to, to know whether the plan is heading the right way.

## The Short-Plan Shape

**A `bounded` design produces a plan carrying the template’s mandatory sections only.** The five the
template already marks *(optional)* — Current State, Accepted Trade-offs, Risks and Mitigations, the
Combination matrix, and References — are omitted.

⛔ **Nothing else shrinks.** Global Constraints still reads `None` rather than vanishing, every
F-block still carries its layer tag and its validation, and the Produces/Consumes rule binds exactly
as it does on a full plan. **A short plan is a plan with fewer sections, never a plan with weaker
ones** — the sections that prove correctness are not the optional ones.

---

## The Delivered Home

**A plan in flight lives in `docs/plans/`, gitignored and local. A plan that has been closed out lives
in `docs/deliveries/<plan-basename>/`, tracked.** `/add-framework--done` assembles that directory in
its STEP 6 and commits it with the delivery-index entry, so the documents reach `main` before anything
removes the worktree that held them.

**The directory name is the plan's basename without `.md`, verbatim** — the same string
`docs/delivered.jsonl` carries as the entry's `id`. Index line and documents join on one string, with
no lookup table between them.

| Member | Sourced from | Present when |
|---|---|---|
| `plan.md` | `docs/plans/<basename>.md` | always |
| `ledger.md` | `docs/plans/<basename>--ledger.md` | always |
| `design.md` | the `docs/brainstorming/` file the plan's **Context** document table names | the plan cites one |
| `intent.md` | the `docs/brainstorming/` **intent file** the plan's **Context** document table names, resolved the same way | the plan cites one |
| `review.md` | the highest-numbered `docs/plans/<basename>--review-v*.md` | a legacy companion is on disk |
| `evidences/` | `docs/evidence/` files for this plan, original names kept | such files are on disk |

**The first two are load-bearing; their absence is a defect, not a variation.** The plan carries the
reasoning and the ledger carries the rulings, and neither has a second copy anywhere.

⛔ **Every member is a byte-for-byte copy of its source. The filename changes; the contents never do.**
An archive is worth keeping only because it IS the document — a reader years from now cannot tell a
faithful copy from a confident rewrite, and will trust either. Summarising, trimming, reformatting or
reconstructing a document on the way in produces something that reads as the record and is not, which
is worse than an empty directory. The command that assembles it copies the bytes and proves each copy
matches before staging.

⛔ **On a `bounded` delivery the intent file is the ONLY record of what was decided and why**, because
no design document exists. `docs/brainstorming/` is gitignored exactly as `docs/plans/` is, so without
this member that delivery reaches `main` carrying a plan whose reasoning points at a file nobody else
will ever have.

**The last four are conditional, and a directory holding none of them is the normal case.** No
command writes a `--review-v*` companion or anything under `docs/evidence/` any more, so both members
exist to carry what is already on disk from before. `design.md` is absent whenever the plan carried
its decisions inline, which most do.

⛔ **`evidences/` sources from the `docs/evidence/` DIRECTORY, not from the `--evidence-v01.md`
companion named under File Naming above.** The two names read alike and are different things.

⛔ **`docs/evidence/` holds files from several plans at once, matched by an id prefix** — a file is
this plan's when its name begins with the plan's id. **A file that cannot be attributed to a plan is
left where it is and reported.** Never sweep the whole directory into one delivery: the wrong plan's
evidence filed under this one is worse than evidence left behind, because it reads as this delivery's
own record.

**What does NOT move:** `docs/changelog/` and `docs/delivered.jsonl` are already tracked and stay
where they are. A plan that was never closed out is never archived — it stays in `docs/plans/` and is
removed by hand if abandoned.

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
| `[product]` | Distributed artefacts | `framwork/.codeadd/`, `framwork/provider-map.json`, `cli/`, `mcp/` |
| `[internal]` | Development tooling | `.claude/`, `scripts/`, `CLAUDE.md`, the repo root **except `mcp/`** |

⛔ **`mcp/` is at the repository root and is PRODUCT.** It holds the knowledge-graph MCP
server, which `scripts/build.js` copies into the npm package — shipping is what decides the
layer, not depth in the tree. It is the only root directory on the product side, and
`CLAUDE.md` carries the same note where it maps the anatomy.

A plan whose F-blocks are all one tag is a single-layer plan. That is normal, not a defect.

---

## The Interface Rule — Produces / Consumes

**Every F-block that hands something to a later one MUST declare it.** The producer states
`Produces:`, the consumer states `Consumes:` with the **same string** plus the producing F-block id.

⛔ **The interface here is NOT a function signature.** It is the `KEY=STATUS` line a script emits, a
sidecar key, a frontmatter field, an injection anchor name — whatever one F-block writes down and a
later one reads.

```
- **F3** [product] — `framwork/.codeadd/scripts/converge-gates.sh`: adds a sixth delivery gate.
  - **Produces:** `converge-gates.sh` emits `GATE6=pass|fail|skip`
- **F7** [product] — `framwork/.codeadd/commands/add.done.md`: STEP 4 reads the new gate.
  - **Consumes:** `GATE6` (F3)
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

**`## Objective` is the one section that is COPIED rather than referenced.**

```
IF WRITING OR REVISING A PLAN:
  ⛔ DO NOT: Re-derive the objective from the design — you will write a better sentence, and a better
             sentence is a different objective
  ⛔ DO NOT: Point at the design for it, the way every other section does — the reviewer, the build
             and the close-out all read the plan, and `docs/brainstorming/` is gitignored
  ⛔ DO NOT: Widen it to cover scope the design did not have
  ✅ DO: Copy the design's `## Objective` byte for byte, then add what is true once the build is done
```

**It is copied because it is the one thing everything downstream is checked against.** Every other
section can point at the design; this one is read by the reviewer's `Objective fit` dimension, and a
pointer into a gitignored directory is not something a reviewer can read.

⛔ **A plan with NO design document still states an objective**, drawn from the conversation and marked
as such — `[from conversation, no design document]`. Otherwise the `bounded` path, which writes no
design at all, is the one path whose work arrives with nothing to check it against. That is the
opposite of what a short path needs.

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

## Completion — The Closing Report

**`add-final-report` owns the shape.** The seven blocks, the banned phrasings, the rule that the
report is emitted before any metadata, and the self-check all live there. Load it at the planning
command's last step.

The metadata that follows the report is the plan path, its status, the review verdict, the fixes
applied, and the next-step commands.

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
