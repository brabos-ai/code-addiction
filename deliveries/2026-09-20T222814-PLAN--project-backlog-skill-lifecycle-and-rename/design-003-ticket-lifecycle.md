# Brainstorm: Project Backlog 003 — the ticket lifecycle

> **Status:** final (ready for /add-framework--plan)
> **Date:** 2026-09-20
> **Type:** command hooks + skill reference (product layer)
> **Umbrella:** `docs/brainstorming/2026-09-20T104517-project-backlog-000-umbrella.md`

## Objective

Today a user of the framework has nowhere to record "what to do next" inside their own project. The
idea dies in the chat, or it becomes a full plan far too early. When this is done, a **skill** writes
that intent into a file in the user's repository — with real paths and a check someone can actually
run — so that it still means something weeks later. The internal equivalent is renamed to
`add-framework--backlog` so both names match.

**Serves the objective by** letting the work come back out, so the board is part of the flow instead
of a notebook beside it. A ticket nobody picks up is a thought that died more slowly.

## Discovery

- **`framwork/.codeadd/skills/add-doc-schemas/references/backlog.md`** (delivered by 001) — the
  `work_id` field already exists and is required: *"the `[NNNN][L]` of the work this ticket became, or
  `null`. Filled when the ticket is picked up."* It also states why the ticket's own id is not reused
  as the work's: the counter is global, `0007B` is spent, and the feature it becomes allocates
  `0012F`. **This subtopic is the thing that fills that field**; nothing else ever will.
- **`framwork/.codeadd/commands/add.new.md` STEP 1.1** — the intent-file resolver. It already reads
  two fields from a brainstorm's intent file (`delivery:` and `## Objective`), already states that an
  intent file is **consumed once** and that `about.md` is the source of truth from that point. The
  ticket reference travels the same road, and that sentence is the reason it can.
- **`framwork/.codeadd/commands/add.new.md` STEP 2** — `branch:` is recorded into `about.md`
  frontmatter by `add.new` and **executed** by `add.build` STEP 2, which states "build executes, never
  decides the name". That is the shipped precedent for one command writing a field and a later command
  acting on it. `ticket:` is the same shape.
- **`framwork/.codeadd/commands/add.build.md` STEP 2** — branch setup, and the first point in the
  build where the branch certainly exists. Everything before it can still fail on a dirty tree.
- **`framwork/.codeadd/commands/add.done.md` STEP 8** — the merge. After it, the working tree is on
  the base branch, which is the one state where 002's write needs no worktree at all.
- **The umbrella's exclusion list** — *"Matching a finished delivery to a ticket by inference.
  `add.done` closes the ticket the work declared, never one it guessed."* This is the constraint the
  whole design is built around, and it rules out the obvious keyword-matching shortcut.
- **`framwork/.codeadd/skills/add-doc-schemas`** — 21 direct dependants, and the shipped example of
  one reference serving many callers without any of them restating it. That is the pattern the
  umbrella named for the five hooks.
- **Delivery index** — `history add-backlog` resolves no node; `history backlog.sh` returns the single
  `live` 001 entry. Nothing resembling a ticket lifecycle has shipped in the product layer, and
  nothing was dropped.

## Context & Motivation

After 002 the board can be written and read, and nothing in the pipeline knows it exists. A user can
capture a ticket and then has to re-type its content into `/add.new` by hand, and has to remember to
close it afterwards. Both halves fail the same way: they depend on the user remembering, which is the
one thing a board exists to replace.

The hooks are also the answer to 002's biggest risk. A skill triggered by description is invisible to
a user who does not know it exists; a command that says "this feature came from ticket `0007B`" puts
the board in front of them inside the flow they are already in.

## Problem / Opportunity

Three things are missing once 002 lands:

1. **Nothing carries the reference.** A ticket picked up at `/add.brainstorm` is forgotten by
   `/add.plan` unless something writes the id down where the next command reads.
2. **Nothing reads the ticket as input.** The ticket already holds `tldr`, `notes[]`, `done_when` and
   `paths[]` — exactly the material `/add.new` and `/add.plan` ask the user for. Asking again is
   asking someone to repeat themselves.
3. **Nothing closes it.** A board where `done` is only ever set by hand fills up with tickets that
   shipped months ago, and a board nobody trusts is a board nobody reads.

## Proposed Solution

**One field, declared once, carried by the documents that already travel the pipeline.**

`ticket: <id>` is written into the brainstorm document and its intent file, copied into `about.md`
frontmatter by `/add.new`, and read from `about.md` by everything after. Each of the five commands
gains one line pointing at `add-backlog/references/lifecycle.md`, which carries the whole procedure.

| Command | Hook | Where it lands | Touches the board? |
|---|---|---|---|
| `/add.brainstorm` | New sub-step **STEP 1.1** resolves a ticket id from the invocation and reads it as exploration input. STEP 3 writes `ticket:` into the document frontmatter (architectural only); STEP 5.3 writes it into the intent file (`bounded` and `architectural`) | STEP 1.1 (read), STEP 3 and STEP 5.3 (write) | **No** — reads only |
| `/add.new` | STEP 1.1 reads `ticket:` from the intent file; STEP 2 writes it into the skeleton `about.md` frontmatter, on the same line as `branch:` | STEP 1.1 (read), STEP 2 (write) | **No** — writes a doc, not the board |
| `/add.plan` | Reads `ticket:` from `about.md` and carries the ticket's `done_when`, `notes[]` and `paths[]` into planning as input | STEP 4, with the feature documentation | **No** — reads only |
| `/add.build` | **One write:** sets `work_id` to `FEATURE_ID` and `status` to `doing` in the same `update` | STEP 2, immediately after `build-setup.sh` returns | **Yes** |
| `/add.done` | Sets `status` to `done` | STEP 8, after the merge | **Yes** |

**Only two of the five touch the board, and both already do git writes.** That is not a coincidence
— it is the constraint the table was built to satisfy, and `### Key Decisions` records why.

### Alternatives considered

| Alternative | Why not |
|---|---|
| Each command searches the board by keyword and matches a ticket itself | Banned by the umbrella, and for a good reason: a wrong match silently closes someone else's ticket, and nothing downstream can detect it. Declared, never inferred |
| Carry the reference in a new state file | `about.md` frontmatter already travels the whole pipeline and is already how `branch:` moves from `/add.new` to `/add.build`. A second carrier is a second thing to keep in sync |
| Carry it on the git branch name | The branch name is already carrying a type and a feature id, it is not readable by `/add.brainstorm` (no branch exists yet), and it cannot survive a rename |
| Put the procedure in all five commands | Five copies of one procedure is five places to drift. The umbrella named this and pointed at `add-doc-schemas`, which serves 21 callers from one place |
| Skip `doing` — go `open` → `done` | A board where nothing is ever in progress makes the status field decoration, and 001 shipped `doing` as one of the four defaults. It costs one write per build |
| Let `/add.done` close the ticket **before** the merge | The ticket would read `done` for work that has not landed, and a failed merge would leave it lying. After the merge is the honest moment, and it is also the one moment the working tree is already on the base branch |

## Type of Artefact

| Artefact | Layer | New or changed |
|---|---|---|
| `framwork/.codeadd/skills/add-backlog/references/lifecycle.md` | product | new — under the skill 002 creates |
| `framwork/.codeadd/skills/add-backlog/SKILL.md` | product | changed — one row in its reference table |
| `framwork/.codeadd/commands/add.brainstorm.md` | product | changed — one hook |
| `framwork/.codeadd/commands/add.new.md` | product | changed — one hook |
| `framwork/.codeadd/commands/add.plan.md` | product | changed — one hook |
| `framwork/.codeadd/commands/add.build.md` | product | changed — one hook |
| `framwork/.codeadd/commands/add.done.md` | product | changed — one hook |
| `framwork/.codeadd/skills/add-doc-schemas/references/new-feature.md` | product | changed — `ticket:` in the `about.md` frontmatter table |

## Scope

### Includes

- The `ticket:` field: where it is written, where it is read, and the rule that it is declared once.
- The `[0-9]{4}B` resolution sub-step in `/add.brainstorm`, and what each of its three paths persists.
- `work_id`: filled at `/add.build` STEP 2, in the same write as `doing`, and never by anything else.
- The status transitions — `doing` at `/add.build` STEP 2, `done` at `/add.done` STEP 8 — and nothing
  between them.
- The rule that only those two commands write to the board, and why the other three do not.
- `references/lifecycle.md`, carrying the whole procedure, plus the one line each command adds.
- The `ticket:` row in the `about.md` frontmatter schema.
- Every degradation, and the rule that **none of them is a stop**.
- A check that each hook's insertion point does not collide with a fragment's injection marker.

### Does NOT Include

- Creating a ticket. No command ever does. Carried from the umbrella.
- Matching work to a ticket by inference, keyword or similarity. Banned by the umbrella.
- `/add.hotfix`, `/add.review`, `/add.audit`, `/add.diagnose`, `/add.wiki`, `/add.pull-request` or
  `/add.qa-setup`. The umbrella named five commands and these are not among them.
- Any change to `backlog.sh`, `backlog-commit.sh` or `references/backlog.md`.
- A `BACKLOG_OPEN:` line in `status.sh`. 001 decided against it explicitly, and no hook here needs one
  — every hook reads a declared id, never a list.
- Re-opening a ticket, or any transition back out of `done`.

## Key Decisions

| Decision | Serves | Rationale | Validated |
|---|---|---|---|
| **One field, `ticket: <id>`**, in the brainstorm document, the intent file, and `about.md` frontmatter | the "work comes back out" half | `branch:` already travels exactly this road, written by `/add.new` and executed by `/add.build`. Reusing a shipped mechanism costs nothing to learn | ✅ |
| **The invocation names a ticket by its id, matched as the literal pattern `[0-9]{4}B` anywhere in the argument string.** No new grammar, no flag, no prefix word | the "work comes back out" half | The id is four digits and a letter — short enough to type, and `add-id-convention` already owns the shape. A prose-matching resolver would be inference by another name, which the umbrella bans | ✅ |
| A `ticket:` id that is **not on the board is reported and the run continues with no ticket.** It is not a stop | the "work comes back out" half | An id is exact, so there is no ambiguity to resolve — unlike `/add.new`'s intent-file match, which stops precisely because a substring can hit two files. Nothing here needs a question | ✅ |
| **`/add.brainstorm` writes `ticket:` where each path already writes something, and writes nothing where a path writes nothing** — architectural: the document and the intent file; bounded: the intent file only; **spike: neither** | the "work comes back out" half | STEP 2's routing table already decides which artefacts each path produces, and STEP 5.3 already states a spike writes no intent file. A hook that wrote one anyway would be the first thing in the command to break its own path table. On a spike the ticket is read for context and named in the final report, which is where a spike's whole output lives | ✅ |
| **`/add.new` writes no board state at all.** It reads `ticket:` and copies it into `about.md`, and that is the whole hook | the "work comes back out" half | `add.new` declares a READ-ONLY GUARANTEE twice — "NO git writes — branch is created later by /add.build" — and a board write travels through `backlog-commit.sh`, which commits and pushes. Rather than carve an exception into a shipped invariant, the board write moves to a step that already does git. `about.md` frontmatter is a doc write the command already makes on the same line | ✅ |
| **`work_id` and `doing` are one write, at `/add.build` STEP 2** | the "work comes back out" half | `FEATURE_ID` is resolved at that step, so both values are in hand. One `update` means one worktree instead of two, and it means the field and the status can never disagree about whether the work started | ✅ |
| **Declared, never inferred.** A command acts on a ticket only because a document names its id | the "work comes back out" half | The umbrella's own exclusion. A wrong inferred match closes someone else's ticket, and nothing downstream can catch it | ✅ |
| The reference is **consumed once**, at `/add.new` STEP 1.1, and `about.md` is the source of truth from then on | the "work comes back out" half | Word for word the rule `add.new` already applies to the intent file. A second read of a consumed file is how two sources disagree | ✅ |
| Only **two status transitions**: `doing` at build, `done` at close-out | the "work comes back out" half | These are the two moments a state actually changed. A transition at `/add.new` or `/add.plan` would mark work "in progress" that nobody has started | ✅ |
| `/add.build` writes at **STEP 2, right after `build-setup.sh` returns** | the "work comes back out" half | Before that the run can still stop on a dirty tree or a bad `branch:`, and a ticket marked `doing` for a build that never started is a lie the board cannot correct itself | ✅ |
| `/add.done` writes `done` at **STEP 8, after the merge** | the "work comes back out" half | It is the moment the work is real, and the one moment the tree is already on the base branch — so 002's direct route applies and no worktree is opened | ✅ |
| **Both board writes read the ticket first and skip when it already holds the target status.** Idempotent by construction, with no Resume guard of its own | the "work comes back out" half | `/add.done` was rebuilt around a four-state `INDEX_ENTRY` cross with a Resume route, and its sub-steps carry explicit `IF routed to Resume: DO NOT run this` guards. A retried close-out would otherwise write `done` twice — a second commit and a bumped `updated_at` for no change. Reading first is cheaper than a sixth guard someone has to remember, and it covers `/add.build`'s own re-run on a resumed build for free | ✅ |
| Hooks write the **shipped default status names**, and a `REFUSED=unknown-status` is reported and passed over | the "work comes back out" half | The definitions file is the user's and they may rename `doing`. Reading `order` and treating it as a semantic would invent a meaning 001 explicitly did not give it — `order` is the sort order `list` groups by, not the status's meaning | ✅ |
| **No degradation is a stop.** Absent board, unknown id, refused status, unreachable base branch — each is reported in the command's final report and the command continues | the "work comes back out" half | The board is a side-record. A build that fails because a ticket could not be moved has inverted the relationship between the work and the note about the work | ✅ |
| The procedure lives in **one reference**; each command carries one line | the "work comes back out" half | `add-doc-schemas` serves 21 callers this way. Five copies is five drifts, and the umbrella graded that Med | ✅ |
| `/add.plan` **reads the ticket and never writes it** | the "work comes back out" half | Planning changes no state on the board. A read-only hook cannot corrupt anything, which is why it is the one hook with no failure mode worth a degradation rule | ✅ |
| `/add.brainstorm` writes `ticket:` into **both** the document and the intent file | the "work comes back out" half | `/add.new` STEP 1.1 reads the intent file, not the document. The document's copy is for the human reading it later, and the two are written in the same run from the same value | ✅ |
| **Each hook's insertion point is checked against the fragments that inject into that command**, as a named build step | the "work comes back out" half | All five commands carry injection markers, and a hook landing inside one changes what `injection-points.json` anchors on. This is the kind of break that passes every test and surfaces at install time | ✅ |
| `about.md`'s frontmatter schema gains `ticket:` as an **optional** field | the "work comes back out" half | Most features will never come from a ticket. A required field would make every hand-written `about.md` fail its validation gate for a board the project may not even use | ✅ |

## Ecosystem Impact

`Called by` comes from `impact <name> --depth 1`. **Every command below was then checked a second
time with `dependencies <fragment>` for each fragment that injects into it**, per the fragment rule in
`add-artefact-graph` — a fragment's edges originate at the fragment, so one query is never the whole
answer for a command.

| Component | Called by | Impact | Action |
|---|---|---|---|
| `add.brainstorm` | `add`, `add.new` (both HANDS_OFF_TO). **No fragment injects into it** — the second query has no subject here | one hook: a `[0-9]{4}B` resolution sub-step at STEP 1, and `ticket:` written where each path already writes | edit |
| `add.new` | 12 dependants: commands `add`, `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`; skills `add-doc-schemas`, `add-feature-specification`, `add-id-convention`, `add-plan-review`, `add-qa-migration`, `add-review-discipline`. **Fragment:** `plugins/gitnexus/fragments/add.new.md`, which dispatches `plan-reviewer-agent`, uses `add-gitnexus` and runs `init.sh` and `status.sh` | one hook: read `ticket:`, copy it into `about.md`. **Its READ-ONLY GUARANTEE is untouched** — no git write is added | edit |
| `add.plan` | 21 dependants incl. agents `consistency`, `test`, `ux`, `ux-flow`; commands `add`, `add.build`, `add.diagnose`, `add.new`, `add.review`. **Fragments:** `qa-pipeline/add.plan.md`, `tdd-pipeline/add.plan.md`, `plugins/gitnexus/fragments/add.plan.md` — all three dispatch the full agent set (`architecture`, `backend`, `consistency`, `database`, `discovery`, `frontend`, `plan-reviewer`, `qa`, `readback`, `ux`, `ux-flow`, `ux-layout`) and run `status.sh` | one hook: read the ticket as planning input | edit |
| `add.build` | 20 dependants incl. `add.done`, `add.plan`, `add.review`, `add.qa-setup`, agents `consistency`, `ux`. **Fragments:** `qa-pipeline/add.build.md`, `tdd-pipeline/add.build.md`, `plugins/gitnexus/fragments/add.build.md` — dispatching `backend`, `database`, `e2e`, `fix`, `frontend`, `test`, `readback`, `reviewer`, `ux`, `consistency`, `qa`, and running `status.sh` and `build-ledger.sh` | one hook: one write setting `work_id` and `doing` | edit |
| `add.done` | 10 dependants: commands `add`, `add.build`, `add.plan`, `add.pull-request`, `add.review`; skills `add-doc-schemas`, `add-qa`; fragment `qa-pipeline/add.review.md` (HANDS_OFF_TO). **Fragments injecting into it:** `docs-pruning/add.done.md`, `plugins/gitnexus/fragments/add.done.md` — both running `converge-gates.sh`, `delivered.sh`, `done.sh`, `hotfix-gates.sh`, `qa-evidence.sh` and using `add-final-report`, `add-ecosystem`, `add-wiki-maintenance` | one hook: set the ticket to `done` | edit |
| `add-backlog` (created by 002) | the five commands above become its first callers | gains one reference and one row in its reference table | edit |
| `add-doc-schemas` | 21 direct dependants: `plan-reviewer-agent`; commands `add.audit`, `add.brainstorm`, `add.build`, `add.diagnose`, `add.done`, `add.hotfix`, `add.new`, `add.plan`, `add.pull-request`, `add.qa-setup`, `add.review`, `add.wiki`; fragment `qa-pipeline/add.review.md`; skills `add-cross-sf-consistency`, `add-feature-specification`, `add-id-convention`, `add-qa`, `add-qa-spec`, `add-setup-contract`, `add-token-efficiency` | additive — one optional field in the `about.md` frontmatter table of `references/new-feature.md` | edit |

**What the graph cannot see here, and was checked by hand:**

- **Injection markers.** `injection-points.json` anchors on content in the command source, and every
  one of the five commands carries markers. A hook inserted inside an anchor breaks feature injection
  at install time and no graph query and no build gate reports it. The plan carries this as a check
  per command, not as a note.
- **`cli/tests/` are not nodes.** The product-parity test asserting zero `add-framework--` strings in
  product artefacts binds every file written here, and the injection tests under `cli/tests/` are what
  will actually catch a broken anchor.
- **`add.new`'s READ-ONLY GUARANTEE is text in the command, not a gate.** Nothing would have failed if
  a board write had been added there; it would simply have contradicted the command's own stated
  contract, at lines 92–95 and again at line 133. It was found by reading the file, and it is the
  reason the `work_id` write lives in `/add.build` instead.
- **`/add.brainstorm`'s path routing is text too.** STEP 2's table decides which artefacts each path
  produces, and no build gate enforces it. A hook that wrote an intent file on a spike would pass
  every test and break the command's own rule.
- **The `about.md` frontmatter validation gate** lives in `add-doc-schemas` and is run by commands, not
  by the build. Adding an optional field is safe; adding a required one would fail existing documents,
  which is why the field is optional.

## Trade-offs & Risks

| We Gain | We Give Up |
|---|---|
| A ticket that becomes work, and work that closes its ticket, without the user remembering either | One more frontmatter field to carry, and one more thing that can be stale |
| The board becomes visible from inside the flow, which is 002's biggest risk half-answered | Five commands now name a skill that may never be installed as anything the user uses |
| `work_id` links intent to delivery, so a finished ticket points at what it became | Nothing links backwards from the delivery to the ticket except that field |
| Every failure path is a report line, never a blocked build | A ticket can silently stay `open` after the work shipped, and the report is the only place that shows |

| Risk | Probability | Mitigation |
|---|---|---|
| A hook lands inside a fragment's injection anchor and breaks feature injection at install time | Med | Named as a per-command check in the plan, and the injection tests under `cli/tests/` are the gate. This is listed under what the graph cannot see for the same reason |
| The five hooks drift apart over later edits | Med | The procedure is in one reference and each command carries one line. The same pattern `add-doc-schemas` sustains across 21 callers |
| A user renames `doing` or `done` in their definitions file, and every hook's write is refused | Med | The refusal is reported and passed over. The alternative — reading `order` as a semantic — would invent a meaning 001 deliberately withheld from that field |
| `/add.done` sets `done` but the push to the base branch is refused, so the board never shows it | Med | 002 already degrades a refused push to a local commit and reports the sha. The close-out's report names it. The work is merged either way |
| A resumed `/add.done`, or a re-run `/add.build`, writes the same status twice | Med | Both hooks read the ticket first and skip when it already holds the target status. No commit, no `updated_at` bump, no second worktree |
| A stale `ticket:` in `about.md` points at a ticket that was removed from the board | Low | `REFUSED=unknown-id` is reported and the command continues. Removing a ticket whose work is in flight is a user action, and the report is where they find out |
| `/add.build` opens a worktree on every build start, to write `work_id` and `doing` | Med | It is **one** write per build — the two fields go in the same `update`, which is half the reason they were merged — on a path that already opened a branch and possibly a worktree of its own. Accepted rather than mitigated; the alternative is dropping `doing`, weighed and rejected above |
| A ticket is picked up on a `spike`, so nothing persists the reference and the link is lost | Low | Correct by design: a spike writes no document and no intent file, and its recommendation is not permission to build. The final report names the ticket, and the follow-up request declares it again. Recorded so a later reader does not read it as a gap |
| A user copies an `about.md` between features and carries `ticket:` with it | Low | `work_id` on the ticket would then disagree with the second feature's id. Not gated — the field is optional and hand-edited documents are the user's. Called out here so it is a known limit rather than a surprise |

## Next Steps

Run: `/add-framework--plan project-backlog-003-ticket-lifecycle`
